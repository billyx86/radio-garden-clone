// Persist/restore coverage for issue #18: the last selected station
// survives a page reload.
//
// Stub localStorage BEFORE the store module loads (same pattern as
// radio.test.ts): zustand/persist reads storage synchronously at store
// creation, which happens at module import. We seed a *persisted* payload
// so the very first hydration — the one that runs on a real page reload —
// is the behavior under test. Later tests mutate the seeded storage and
// call persist.rehydrate() to simulate subsequent reloads.
const memory: Record<string, string> = {};
// Simulated prior session: the user last tuned KEXP, favourited SomaFM
// Groove Salad, and set the volume to 0.5.
memory["radio-garden-v1"] = JSON.stringify({
  state: {
    favorites: ["somafm-gs"],
    volume: 0.5,
    muted: false,
    currentId: "kexp",
  },
  version: 0,
});
const storageStub = {
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
(globalThis as Record<string, unknown>).localStorage = storageStub;
// zustand's default storage reads `window.localStorage` (not
// globalThis.localStorage), and Node has no `window` — expose it.
(globalThis as Record<string, unknown>).window = globalThis;

const { useRadioStore } = await import("./radio");
import { stations } from "../data/stations";
import { describe, expect, it } from "vitest";

const KEY = "radio-garden-v1";

function readPersisted(): Record<string, unknown> {
  const raw = storageStub.getItem(KEY);
  if (!raw) return {};
  return (JSON.parse(raw) as { state: Record<string, unknown> }).state;
}

function seedPersisted(partial: Record<string, unknown>) {
  storageStub.setItem(KEY, JSON.stringify({ state: partial, version: 0 }));
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

describe("last-station persistence (issue #18)", () => {
  it("restores the persisted selection on a fresh load, resolved against the dataset", () => {
    const s = useRadioStore.getState();
    expect(s.current).not.toBeNull();
    expect(s.current?.id).toBe("kexp");
    // Restored as the real Station object from the in-repo dataset —
    // not just a raw id — so the player bar can show its name.
    expect(s.current?.name).toBe("KEXP 90.3");
    // Globe flies to it: the existing flyToId mechanism is reused.
    expect(s.flyToId).toBe("kexp");
    expect(s.errorMessage).toBeNull();
  });

  it("restores the selection WITHOUT autoplaying (idle, not loading/playing)", () => {
    const s = useRadioStore.getState();
    expect(s.status).toBe("idle");
    expect(s.status).not.toBe("loading");
    expect(s.status).not.toBe("playing");
    // No stream is open until the user explicitly plays.
    expect(s.audioEl).toBeNull();
  });

  it("still restores favorites and volume alongside the station", () => {
    const s = useRadioStore.getState();
    expect(s.favorites).toEqual(["somafm-gs"]);
    expect(s.volume).toBeCloseTo(0.5);
    expect(s.muted).toBe(false);
  });

  it("selectStation persists the station id to storage", () => {
    resetStore();
    const wfmu = stations.find((st) => st.id === "wfmu")!;
    useRadioStore.getState().selectStation(wfmu);
    expect(readPersisted().currentId).toBe("wfmu");
  });

  it("rehydrating after retuning restores the new station as idle", async () => {
    resetStore();
    const wfmu = stations.find((st) => st.id === "wfmu")!;
    useRadioStore.getState().selectStation(wfmu);
    // Simulate the user having listened (status advanced past loading).
    useRadioStore.setState({ status: "playing" });

    // Simulate a page reload: persist re-reads storage and merges.
    await useRadioStore.persist.rehydrate();

    const s = useRadioStore.getState();
    expect(s.current?.id).toBe("wfmu");
    expect(s.status).toBe("idle");
    expect(s.flyToId).toBe("wfmu");
  });

  it("a stale persisted id (station no longer in the dataset) falls back to no selection", async () => {
    resetStore();
    seedPersisted({ currentId: "no-such-station", favorites: [] });
    await useRadioStore.persist.rehydrate();
    const s = useRadioStore.getState();
    expect(s.current).toBeNull();
    expect(s.status).toBe("idle");
    expect(s.flyToId).toBeNull();
    expect(s.errorMessage).toBeNull();
  });

  it("no persisted data at all starts with the default idle state", async () => {
    resetStore();
    storageStub.removeItem(KEY);
    await useRadioStore.persist.rehydrate();
    const s = useRadioStore.getState();
    expect(s.current).toBeNull();
    expect(s.status).toBe("idle");
    expect(s.favorites).toEqual([]);
    expect(s.volume).toBeCloseTo(0.85);
  });

  it("a persisted payload without currentId (pre-feature) does not restore a station", async () => {
    resetStore();
    seedPersisted({ favorites: ["kexp"], volume: 0.3, muted: true });
    await useRadioStore.persist.rehydrate();
    const s = useRadioStore.getState();
    expect(s.current).toBeNull();
    expect(s.favorites).toEqual(["kexp"]);
    expect(s.volume).toBeCloseTo(0.3);
    expect(s.muted).toBe(true);
  });
});
