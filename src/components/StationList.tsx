import { Heart, MapPin, Radio } from "lucide-react";
import type { Station } from "../data/stations";
import { useRadioStore } from "../store/radio";

type Props = {
  items: Station[];
  emptyLabel?: string;
};

export function StationList({ items, emptyLabel = "No stations found" }: Props) {
  const selectStation = useRadioStore((s) => s.selectStation);
  const current = useRadioStore((s) => s.current);
  const toggleFavorite = useRadioStore((s) => s.toggleFavorite);
  const favorites = useRadioStore((s) => s.favorites);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center text-muted">
        <Radio className="h-8 w-8 opacity-40" />
        <p className="text-sm">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/5">
      {items.map((station) => {
        const active = current?.id === station.id;
        const fav = favorites.includes(station.id);
        return (
          <li key={station.id}>
            <div
              className={`flex items-center gap-2 px-2 py-1 ${
                active ? "bg-radio/10" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => selectStation(station)}
                className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/5 active:bg-white/10"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    active
                      ? "bg-radio text-space-deep shadow-[0_0_12px_var(--color-radio-glow)]"
                      : "bg-white/5 text-radio"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full bg-current ${
                      active ? "radio-dot-live" : ""
                    }`}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-mist">
                    {station.name}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                    <MapPin className="h-3 w-3 shrink-0 opacity-70" />
                    {station.city}, {station.country}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(station.id)}
                aria-label={fav ? "Unfavorite" : "Favorite"}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-white/5"
              >
                <Heart
                  className={`h-4 w-4 ${fav ? "fill-radio text-radio" : ""}`}
                />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
