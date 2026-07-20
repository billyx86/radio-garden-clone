import { useMemo, useState, type ReactNode } from "react";
import { Heart, Search as SearchIcon, X } from "lucide-react";
import { stations, searchStations } from "../data/stations";
import { useRadioStore } from "../store/radio";
import { StationList } from "./StationList";

export function Search() {
  const open = useRadioStore((s) => s.searchOpen);
  const setSearchOpen = useRadioStore((s) => s.setSearchOpen);
  const query = useRadioStore((s) => s.searchQuery);
  const setSearchQuery = useRadioStore((s) => s.setSearchQuery);
  const favorites = useRadioStore((s) => s.favorites);
  const [tab, setTab] = useState<"all" | "favorites">("all");

  const results = useMemo(() => {
    if (tab === "favorites") {
      const favSet = new Set(favorites);
      const favStations = stations.filter((s) => favSet.has(s.id));
      if (!query.trim()) return favStations;
      return searchStations(query).filter((s) => favSet.has(s.id));
    }
    return searchStations(query);
  }, [query, tab, favorites]);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 safe-top px-3 pt-3">
        <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="glass flex min-h-[44px] flex-1 items-center gap-2.5 rounded-2xl px-4 py-2.5 text-left shadow-lg transition active:scale-[0.99]"
          >
            <SearchIcon className="h-4 w-4 shrink-0 text-radio" />
            <span className="truncate text-sm text-muted">
              Search cities & stations
            </span>
          </button>
          <div className="glass flex h-11 items-center rounded-2xl px-3 text-xs font-medium tracking-wide text-radio">
            <span className="radio-dot-live mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-radio" />
            {stations.length}
          </div>
        </div>
      </div>

      {open && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setSearchOpen(false)}
          />
          <div className="glass animate-fade-up relative flex max-h-[78dvh] flex-col rounded-t-3xl shadow-2xl">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" />

            <div className="flex items-center gap-2 px-4 pb-2 pt-3">
              <div className="flex min-h-[44px] flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 ring-1 ring-white/10 focus-within:ring-radio/40">
                <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="City, station, country…"
                  className="h-11 w-full bg-transparent text-sm text-mist outline-none placeholder:text-muted"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-1 px-4 pb-2">
              <TabButton
                active={tab === "all"}
                onClick={() => setTab("all")}
                label="All stations"
              />
              <TabButton
                active={tab === "favorites"}
                onClick={() => setTab("favorites")}
                label="Favorites"
                icon={<Heart className="h-3.5 w-3.5" />}
              />
            </div>

            <div className="sheet-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <StationList
                items={results}
                emptyLabel={
                  tab === "favorites"
                    ? "No favorites yet — tap ♥ on a station"
                    : "No stations match your search"
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition ${
        active
          ? "bg-radio/20 text-radio"
          : "bg-white/5 text-muted hover:bg-white/10"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
