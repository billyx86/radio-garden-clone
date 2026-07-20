import {
  Heart,
  Loader2,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Radio,
  AlertCircle,
} from "lucide-react";
import { useRadioStore } from "../store/radio";

export function Player() {
  const current = useRadioStore((s) => s.current);
  const status = useRadioStore((s) => s.status);
  const volume = useRadioStore((s) => s.volume);
  const muted = useRadioStore((s) => s.muted);
  const errorMessage = useRadioStore((s) => s.errorMessage);
  const togglePlay = useRadioStore((s) => s.togglePlay);
  const setVolume = useRadioStore((s) => s.setVolume);
  const toggleMute = useRadioStore((s) => s.toggleMute);
  const toggleFavorite = useRadioStore((s) => s.toggleFavorite);
  const isFavorite = useRadioStore((s) => s.isFavorite);

  if (!current) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 safe-bottom px-3 pb-3">
        <div className="glass pointer-events-auto mx-auto flex max-w-lg items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-radio/15 text-radio">
            <Radio className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-mist">
              Explore the globe
            </p>
            <p className="truncate text-xs text-muted">
              Tap a green light to tune in
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fav = isFavorite(current.id);
  const isLoading = status === "loading";
  const isPlaying = status === "playing";
  const isError = status === "error";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 safe-bottom px-3 pb-3">
      <div className="glass animate-fade-up pointer-events-auto mx-auto max-w-lg rounded-2xl px-3 py-3 shadow-2xl">
        {isError && (
          <div className="mb-2 flex items-start gap-2 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="leading-snug">
              {errorMessage || "Stream unavailable. Try another station."}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-radio text-space-deep shadow-[0_0_20px_var(--color-radio-glow)] transition active:scale-95 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 spin-slow" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full bg-radio ${
                  isPlaying ? "radio-dot-live" : ""
                }`}
              />
              <p className="truncate text-sm font-semibold tracking-tight text-mist">
                {current.name}
              </p>
            </div>
            <p className="truncate text-xs text-muted">
              {current.city}, {current.country}
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleFavorite(current.id)}
            aria-label={fav ? "Remove favorite" : "Add favorite"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-white/5 active:scale-95"
          >
            <Heart
              className={`h-5 w-5 ${
                fav ? "fill-radio text-radio" : ""
              }`}
            />
          </button>
        </div>

        <div className="mt-2.5 flex items-center gap-2 px-1">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/5"
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10"
          />
        </div>
      </div>
    </div>
  );
}
