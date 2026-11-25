import { create } from "zustand";
import { persist } from "zustand/middleware";
import { stations, type Station } from "../data/stations";

export type PlayStatus = "idle" | "loading" | "playing" | "paused" | "error";

type RadioState = {
  current: Station | null;
  status: PlayStatus;
  volume: number;
  muted: boolean;
  errorMessage: string | null;
  favorites: string[];
  searchOpen: boolean;
  searchQuery: string;
  flyToId: string | null;
  userInteracting: boolean;
  audioEl: HTMLAudioElement | null;

  setAudioEl: (el: HTMLAudioElement | null) => void;
  selectStation: (station: Station) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setStatus: (s: PlayStatus, err?: string | null) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (q: string) => void;
  clearFlyTo: () => void;
  setUserInteracting: (v: boolean) => void;
};

let idleTimer: ReturnType<typeof setTimeout> | null = null;

export const useRadioStore = create<RadioState>()(
  persist(
    (set, get) => ({
      current: null,
      status: "idle",
      volume: 0.85,
      muted: false,
      errorMessage: null,
      favorites: [],
      searchOpen: false,
      searchQuery: "",
      flyToId: null,
      userInteracting: false,
      audioEl: null,

      setAudioEl: (el) => set({ audioEl: el }),

      selectStation: (station) => {
        set({
          current: station,
          status: "loading",
          errorMessage: null,
          flyToId: station.id,
          searchOpen: false,
        });
      },

      play: () => {
        if (!get().current) return;
        set({ status: "loading", errorMessage: null });
      },

      pause: () => {
        get().audioEl?.pause();
        set({ status: "paused" });
      },

      togglePlay: () => {
        const { status, play, pause } = get();
        if (status === "playing" || status === "loading") pause();
        else play();
      },

      setVolume: (v) => {
        const vol = Math.min(1, Math.max(0, v));
        const { audioEl } = get();
        if (vol > 0) {
          if (audioEl) audioEl.volume = vol;
          set({ volume: vol, muted: false });
        } else {
          if (audioEl) audioEl.volume = 0;
          set({ volume: vol, muted: true });
        }
      },

      toggleMute: () => {
        const { audioEl, muted, volume } = get();
        const next = !muted;
        // If the volume slider was dragged to 0 (which auto-mutes),
        // "restoring" 0 would leave the user in permanent silence.
        const restoreVol = volume > 0 ? volume : 0.5;
        if (audioEl) audioEl.volume = next ? 0 : restoreVol;
        set(next ? { muted: true } : { muted: false, volume: restoreVol });
      },

      setStatus: (s, err = null) => set({ status: s, errorMessage: err }),

      toggleFavorite: (id) => {
        const favs = get().favorites;
        set({
          favorites: favs.includes(id)
            ? favs.filter((f) => f !== id)
            : [...favs, id],
        });
      },

      isFavorite: (id) => get().favorites.includes(id),

      setSearchOpen: (open) => set({ searchOpen: open }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      clearFlyTo: () => set({ flyToId: null }),

      setUserInteracting: (v) => {
        set({ userInteracting: v });
        if (idleTimer) clearTimeout(idleTimer);
        if (v) {
          idleTimer = setTimeout(() => set({ userInteracting: false }), 4000);
        }
      },
    }),
    {
      name: "radio-garden-v1",
      partialize: (s) => ({
        favorites: s.favorites,
        volume: s.volume,
        muted: s.muted,
        // Last selected station (issue #18): persisting the id is enough to
        // re-resolve against the in-repo static dataset on rehydrate.
        currentId: s.current?.id ?? null,
      }),
      merge: (persistedState, currentState) => {
        const p = (persistedState ?? {}) as {
          favorites?: string[];
          volume?: number;
          muted?: boolean;
          currentId?: string | null;
        };
        // The persisted `currentId` isn't part of the live state shape —
        // resolve it against the in-repo dataset. A stale id (station
        // removed) or no id at all means no selection is restored.
        const restored = p.currentId
          ? (stations.find((s) => s.id === p.currentId) ?? null)
          : null;
        return {
          ...currentState,
          // Favorites and volume survive even when the station does not —
          // the fallback is on the *selection*, not on the whole state.
          favorites: p.favorites ?? currentState.favorites,
          volume: p.volume ?? currentState.volume,
          muted: p.muted ?? currentState.muted,
          current: restored,
          // Restore the selection WITHOUT autoplaying: status stays
          // "idle" so the AudioEngine treats it as selected-not-playing,
          // and flyToId lights up Globe's existing fly-to so the globe
          // re-centers on the station (issue #18).
          status: "idle",
          errorMessage: null,
          flyToId: restored ? restored.id : currentState.flyToId,
        };
      },
    }
  )
);
