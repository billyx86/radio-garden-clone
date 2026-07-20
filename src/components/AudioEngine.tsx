import { useEffect, useRef } from "react";
import { useRadioStore } from "../store/radio";

/** Hidden audio element wired into the zustand store. */
export function AudioEngine() {
  const ref = useRef<HTMLAudioElement>(null);
  const setAudioEl = useRadioStore((s) => s.setAudioEl);
  const setStatus = useRadioStore((s) => s.setStatus);
  const volume = useRadioStore((s) => s.volume);
  const muted = useRadioStore((s) => s.muted);

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
      setAudioEl(null);
    };
  }, [setAudioEl, setStatus]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.volume = muted ? 0 : volume;
  }, [volume, muted]);

  return (
    <audio
      ref={ref}
      preload="none"
      crossOrigin="anonymous"
      playsInline
      className="hidden"
    />
  );
}
