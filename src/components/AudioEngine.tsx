import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { useRadioStore } from "../store/radio";
import {
  decideStreamRetry,
  ERROR_MESSAGE,
  type RetryKind,
} from "../lib/streamRetry";

function isHlsUrl(url: string) {
  return /\.m3u8(\?|$)/i.test(url);
}

// MediaError.MEDIA_ERR_NETWORK, inlined so the engine has no dependency on
// the global in non-browser test environments.
const MEDIA_ERR_NETWORK = 2;

/**
 * Hidden audio element wired into the zustand store. Supports mp3/aac +
 * HLS, with bounded recovery for transient stream errors (issue #16):
 * a one-second blip on a live-ICE stream used to strand the user on the
 * error banner until they manually retuned; now hls.startLoad() (hls.js)
 * or el.load()+play() (native) is retried a bounded number of times per
 * `decideStreamRetry` before the error is surfaced.
 *
 * A station restored from persistence (issue #18) arrives with
 * `status: "idle"`: the load effect treats idle as "selected but not
 * playing", so the globe flies to it and the player bar shows it, but no
 * stream is opened (no autoplay).
 */
export function AudioEngine() {
  const ref = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const loadedId = useRef<string | null>(null);
  const retriesRef = useRef<Record<RetryKind, number>>({
    "hls-network": 0,
    "audio-network": 0,
  });
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The element-level "error" event listener (mounted once) dispatches to
  // whichever load is active; each load installs its retry handler here.
  const audioErrorRef = useRef<((isNetworkError: boolean) => void) | null>(
    null
  );
  const setAudioEl = useRadioStore((s) => s.setAudioEl);
  const setStatus = useRadioStore((s) => s.setStatus);
  const volume = useRadioStore((s) => s.volume);
  const muted = useRadioStore((s) => s.muted);
  const current = useRadioStore((s) => s.current);
  const status = useRadioStore((s) => s.status);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setAudioEl(el);

    const onPlaying = () => setStatus("playing");
    const onWaiting = () => {
      // Buffering mid-stream — don't flip to loading (that would re-fetch)
      if (loadedId.current) return;
      setStatus("loading");
    };
    const onPause = () => {
      if (!el.ended) {
        // A native media error also fires a trailing "pause" event; don't
        // let it mask the error state (the banner would vanish). Likewise
        // don't clobber the loading state while a bounded retry is pending.
        const st = useRadioStore.getState().status;
        if (st !== "error" && !retryTimerRef.current) setStatus("paused");
      }
    };
    const onSourceError = () => {
      const code = (el.error as { code?: number } | null)?.code;
      audioErrorRef.current?.(code === MEDIA_ERR_NETWORK);
    };

    el.addEventListener("playing", onPlaying);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onSourceError);

    return () => {
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onSourceError);
      audioErrorRef.current = null;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      setAudioEl(null);
    };
  }, [setAudioEl, setStatus]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // Load a new station when selection changes
  useEffect(() => {
    const el = ref.current;
    if (!el || !current) return;
    if (loadedId.current === current.id && status !== "loading") return;
    // Only (re)load when station changes OR explicit play after pause/error
    const needLoad =
      loadedId.current !== current.id ||
      (status === "loading" && (el.paused || el.error));
    if (!needLoad) return;

    // A station restored from persistence on rehydrate is a *selection*,
    // not a play request (issue #18): the user may have closed on purpose
    // and autoplay policy would block it anyway. Remember it as loaded
    // (so an explicit play triggers a fresh load below) but open no
    // stream.
    if (status === "idle") {
      loadedId.current = current.id;
      return;
    }

    const url = current.streamUrl;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
    retriesRef.current = { "hls-network": 0, "audio-network": 0 };
    hlsRef.current?.destroy();
    hlsRef.current = null;
    loadedId.current = current.id;

    // Per-load dedupe: a load failure surfaces as BOTH the element's
    // "error" event and a rejected el.play() promise; whichever arrives
    // first schedules the retry, the other is ignored.
    let retryInFlight = false;

    // Keep loadedId on give-up deliberately: nulling it would make the
    // needLoad check above true on the error-state re-render, reloading
    // the same broken station forever (unbounded retries in disguise).
    // Explicit play still reloads: play() sets status "loading" and the
    // `el.paused || el.error` clause above passes.
    const giveUp = () => {
      loadedId.current = current.id;
      setStatus("error", ERROR_MESSAGE);
    };

    const scheduleRetry = (
      kind: RetryKind,
      isNetworkError: boolean,
      onRetry: () => void
    ) => {
      if (retryInFlight) return;
      const d = decideStreamRetry({
        kind,
        isNetworkError,
        retriesUsed: retriesRef.current[kind],
      });
      if (d.action !== "retry") {
        giveUp();
        return;
      }
      retryInFlight = true;
      retriesRef.current[kind] = d.attempt;
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        retryInFlight = false;
        onRetry();
      }, d.delayMs);
    };

    // The action a retry performs depends on which path loaded the
    // stream; each branch assigns it before any failure can occur.
    let retryAction = () => {};

    const tryPlay = () => {
      el.play()
        .then(() => setStatus("playing"))
        .catch((err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "Could not play stream";
          const lower = msg.toLowerCase();
          if (
            lower.includes("not allowed") ||
            lower.includes("user didn't interact") ||
            lower.includes("play()")
          ) {
            // Autoplay policy — the station is selected, just not playing.
            setStatus("paused");
          } else {
            // Transient failure (aborted load, network blip): let the
            // bounded retry decide. The element's "error" event is the
            // same failure arriving as a second signal — scheduleRetry
            // dedupes them.
            const code = (el.error as { code?: number } | null)?.code;
            scheduleRetry(
              "audio-network",
              code === MEDIA_ERR_NETWORK,
              retryAction
            );
          }
        });
    };

    setStatus("loading");

    if (isHlsUrl(url)) {
      if (el.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS (e.g. Safari): the element owns loading, so recovery
        // is the same el.load()+play() cycle as plain audio.
        const startNative = () => {
          el.src = url;
          el.load();
          tryPlay();
        };
        retryAction = startNative;
        audioErrorRef.current = (isNetwork) =>
          scheduleRetry("audio-network", isNetwork, retryAction);
        startNative();
      } else if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(el);
        hls.on(Hls.Events.MANIFEST_PARSED, () => tryPlay());
        // hls.js owns element errors once attached; don't let the element
        // listener double-handle them.
        audioErrorRef.current = null;
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return;
          // NETWORK_ERROR is the documented-transient class (blips, DNS
          // hiccups, brief 404s during playlist rotation); the documented
          // recovery is startLoad(). Other fatal types (manifest parse,
          // media, level) cannot be fixed by retrying.
          const network = data.type === Hls.ErrorTypes.NETWORK_ERROR;
          retryAction = () => hls.startLoad();
          scheduleRetry("hls-network", network, retryAction);
        });
      } else {
        setStatus("error", "HLS not supported in this browser.");
      }
    } else {
      const startPlain = () => {
        el.src = url;
        el.load();
        tryPlay();
      };
      retryAction = startPlain;
      audioErrorRef.current = (isNetwork) =>
        scheduleRetry("audio-network", isNetwork, retryAction);
      startPlain();
    }
  }, [current?.id, status, setStatus, current]);

  // Resume from paused without reloading
  useEffect(() => {
    const el = ref.current;
    if (!el || !current) return;
    if (status !== "loading") return;
    if (loadedId.current !== current.id) return;
    if (!el.src && !hlsRef.current) return;
    if (!el.paused) return;

    el.play()
      .then(() => setStatus("playing"))
      .catch(() => setStatus("paused"));
  }, [status, current, setStatus]);

  return <audio ref={ref} preload="none" playsInline className="hidden" />;
}
