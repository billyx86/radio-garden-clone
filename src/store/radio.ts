import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Station } from "../data/stations";

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
        const { audioEl, volume, muted } = get();
        set({
          current: station,
          status: "loading",
          errorMessage: null,
          flyToId: station.id,
          searchOpen: false,
        });
        if (!audioEl) return;
        audioEl.pause();
        audioEl.src = station.streamUrl;
        audioEl.volume = muted ? 0 : volume;
        audioEl.load();
        const playPromise = audioEl.play();
        if (playPromise) {
          playPromise
            .then(() => set({ status: "playing" }))
            .catch((err: unknown) => {
              const msg =
                err instanceof Error ? err.message : "Could not play stream";
              set({ status: "error", errorMessage: msg });
            });
        }
      },

      play: () => {
        const { audioEl, current } = get();
        if (!audioEl || !current) return;
        set({ status: "loading", errorMessage: null });
        audioEl
          .play()
          .then(() => set({ status: "playing" }))
          .catch((err: unknown) => {
            const msg =
              err instanceof Error ? err.message : "Playback failed";
            set({ status: "error", errorMessage: msg });
          });
      },

      pause: () => {
        const { audioEl } = get();
        audioEl?.pause();
        set({ status: "paused" });
      },

      togglePlay: () => {
        const { status, play, pause } = get();
        if (status === "playing" || status === "loading") pause();
        else play();
      },

      setVolume: (v) => {
        const vol = Math.min(1, Math.max(0, v));
        const { audioEl, muted } = get();
        if (audioEl && !muted) audioEl.volume = vol;
        set({ volume: vol, muted: vol === 0 ? true : muted && vol === 0 });
        if (vol > 0 && get().muted) {
          set({ muted: false });
          if (audioEl) audioEl.volume = vol;
        }
      },

      toggleMute: () => {
        const { audioEl, muted, volume } = get();
        const next = !muted;
        if (audioEl) audioEl.volume = next ? 0 : volume;
        set({ muted: next });
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
          idleTimer = setTimeout(() => {
            set({ userInteracting: false });
          }, 4000);
        }
      },
    }),
    {
      name: "radio-garden-v1",
      partialize: (s) => ({
        favorites: s.favorites,
        volume: s.volume,
        muted: s.muted,
      }),
    }
  )
);
