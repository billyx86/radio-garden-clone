// Stub localStorage BEFORE the store module loads: zustand/persist reads
// the storage backend synchronously at store creation time, which happens
// at module import. A static import would run before this stub exists.
const memory: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (k in memory ? memory[k] : null),
  setItem: (k: string, v: string) => {
    memory[k] = String(v);
  },
  removeItem: (k: string) => {
    delete memory[k];
  },
  clear: () => {
    for (const k of Object.keys(memory)) delete memory[k];
  },
  key: (i: number) => Object.keys(memory)[i] ?? null,
  get length() {
    return Object.keys(memory).length;
  },
};
// zustand's default storage reads `window.localStorage` (not
// globalThis.localStorage), and Node has no `window` — expose it.
(globalThis as Record<string, unknown>).window = globalThis;

const { useRadioStore } = await import("./radio");
import { describe, expect, it, beforeEach } from "vitest";
import type { Station } from "../data/stations";

type FakeAudio = { volume: number; pause: () => void };

function fakeAudio(): FakeAudio {
  return { volume: 0, pause: () => {} };
}

function resetStore() {
  useRadioStore.setState({
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
  });
}

const station: Station = {
  id: "test-station",
  name: "Test FM",
  city: "Testville",
  country: "Testland",
  lat: 10,
  lng: 20,
  streamUrl: "https://example.com/stream.mp3",
};

describe("useRadioStore", () => {
  beforeEach(resetStore);

  it("starts in an idle state with the default volume", () => {
    const s = useRadioStore.getState();
    expect(s.status).toBe("idle");
    expect(s.current).toBeNull();
    expect(s.volume).toBeCloseTo(0.85);
    expect(s.muted).toBe(false);
  });

  describe("setVolume", () => {
    it("clamps values above 1 down to 1", () => {
      useRadioStore.getState().setVolume(1.5);
      expect(useRadioStore.getState().volume).toBe(1);
    });

    it("clamps negative values to 0 and auto-mutes", () => {
      useRadioStore.getState().setVolume(-0.5);
      const s = useRadioStore.getState();
      expect(s.volume).toBe(0);
      expect(s.muted).toBe(true);
    });

    it("unmutes when a positive volume is set while muted", () => {
      useRadioStore.getState().setVolume(0);
      useRadioStore.getState().setVolume(0.3);
      const s = useRadioStore.getState();
      expect(s.volume).toBeCloseTo(0.3);
      expect(s.muted).toBe(false);
    });

    it("applies the volume to the bound audio element", () => {
      const el = fakeAudio();
      useRadioStore.getState().setAudioEl(el as unknown as HTMLAudioElement);
      useRadioStore.getState().setVolume(0.42);
      expect(el.volume).toBeCloseTo(0.42);
    });
  });

  describe("toggleMute", () => {
    it("mutes, then unmutes back to the previous volume", () => {
      const st = useRadioStore.getState();
      st.toggleMute();
      expect(useRadioStore.getState().muted).toBe(true);
      st.toggleMute();
      const s = useRadioStore.getState();
      expect(s.muted).toBe(false);
      expect(s.volume).toBeCloseTo(0.85);
    });

    it("restores a usable 0.5 volume when unmuting at volume 0 (regression: permanent silence)", () => {
      const st = useRadioStore.getState();
      st.setVolume(0); // auto-mutes
      expect(useRadioStore.getState().muted).toBe(true);

      st.toggleMute();
      const s = useRadioStore.getState();
      expect(s.muted).toBe(false);
      expect(s.volume).toBeCloseTo(0.5); // was: 0 → stuck in silence
    });

    it("drives the bound audio element's volume", () => {
      const el = fakeAudio();
      el.volume = 0.85;
      useRadioStore.getState().setAudioEl(el as unknown as HTMLAudioElement);
      const st = useRadioStore.getState();
      st.toggleMute();
      expect(el.volume).toBe(0);
      st.toggleMute();
      expect(el.volume).toBeCloseTo(0.85);
    });
  });

  describe("favorites", () => {
    it("toggles a favorite on and off", () => {
      const st = useRadioStore.getState();
      expect(st.isFavorite("a")).toBe(false);
      st.toggleFavorite("a");
      expect(useRadioStore.getState().isFavorite("a")).toBe(true);
      st.toggleFavorite("a");
      expect(useRadioStore.getState().isFavorite("a")).toBe(false);
    });

    it("keeps favorites in insertion order", () => {
      const st = useRadioStore.getState();
      st.toggleFavorite("x");
      st.toggleFavorite("y");
      st.toggleFavorite("x");
      st.toggleFavorite("z");
      expect(useRadioStore.getState().favorites).toEqual(["y", "z"]);
    });
  });

  describe("selectStation", () => {
    it("sets the current station, loading status and fly-to target", () => {
      useRadioStore.getState().selectStation(station);
      const s = useRadioStore.getState();
      expect(s.current?.id).toBe("test-station");
      expect(s.status).toBe("loading");
      expect(s.flyToId).toBe("test-station");
      expect(s.searchOpen).toBe(false);
    });

    it("clears any previous error message", () => {
      useRadioStore.getState().setStatus("error", "boom");
      useRadioStore.getState().selectStation(station);
      expect(useRadioStore.getState().errorMessage).toBeNull();
    });
  });

  describe("play/pause state machine", () => {
    it("togglePlay does nothing with no station selected", () => {
      useRadioStore.getState().togglePlay();
      expect(useRadioStore.getState().status).toBe("idle");
    });

    it("play → loading, pause → paused, togglePlay flips between them", () => {
      const st = useRadioStore.getState();
      st.selectStation(station);
      st.togglePlay(); // status was loading → pause
      expect(useRadioStore.getState().status).toBe("paused");
      useRadioStore.getState().togglePlay(); // paused → play() → loading
      expect(useRadioStore.getState().status).toBe("loading");
    });

    it("pause() pauses the bound audio element", () => {
      let paused = false;
      const el: FakeAudio = { volume: 0.5, pause: () => (paused = true) };
      useRadioStore.getState().setAudioEl(el as unknown as HTMLAudioElement);
      useRadioStore.getState().selectStation(station);
      useRadioStore.getState().pause();
      expect(paused).toBe(true);
      expect(useRadioStore.getState().status).toBe("paused");
    });
  });
});
