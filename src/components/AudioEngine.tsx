import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { useRadioStore } from "../store/radio";

function isHlsUrl(url: string) {
  return /\.m3u8(\?|$)/i.test(url);
}

/** Hidden audio element wired into the zustand store. Supports mp3/aac + HLS. */
export function AudioEngine() {
  const ref = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
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
    const onWaiting = () => setStatus("loading");
    const onPause = () => {
      if (!el.ended) setStatus("paused");
    };
    const onError = () =>
      setStatus("error", "Stream failed to load. Try another station.");
    const onStalled = () => setStatus("loading");

    el.addEventListener("playing", onPlaying);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onError);
    el.addEventListener("stalled", onStalled);

    return () => {
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onError);
      el.removeEventListener("stalled", onStalled);
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

  useEffect(() => {
    const el = ref.current;
    if (!el || !current) return;
    if (status !== "loading") return;

    const url = current.streamUrl;
    hlsRef.current?.destroy();
    hlsRef.current = null;

    const tryPlay = () => {
      el.play()
        .then(() => setStatus("playing"))
        .catch((err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "Could not play stream";
          const lower = msg.toLowerCase();
          if (
            lower.includes("user didn't interact") ||
            lower.includes("not allowed") ||
            lower.includes("play()")
          ) {
            setStatus("paused");
          } else {
            setStatus("error", msg);
          }
        });
    };

    if (isHlsUrl(url)) {
      if (el.canPlayType("application/vnd.apple.mpegurl")) {
        el.src = url;
        el.load();
        tryPlay();
      } else if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(el);
        hls.on(Hls.Events.MANIFEST_PARSED, () => tryPlay());
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            setStatus(
              "error",
              "Stream failed to load. Try another station."
            );
          }
        });
      } else {
        setStatus("error", "HLS not supported in this browser.");
      }
    } else {
      el.src = url;
      el.load();
      tryPlay();
    }
  }, [current, status, setStatus]);

  return <audio ref={ref} preload="none" playsInline className="hidden" />;
}
