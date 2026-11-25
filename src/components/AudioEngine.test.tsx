// @vitest-environment jsdom
//
// Mock-Hls acceptance tests for issue #16: the bounded stream-error
// recovery wired into AudioEngine. Covers the two acceptance paths — a
// transient (recoverable) network error returns to `playing` without user
// action, and a persistent error (or a non-network fatal) lands on the
// error banner only after the bounded retries are exhausted.
//
// hls.js is mocked so the suite is deterministic and offline: we drive the
// exact event sequence hls.js would emit (MANIFEST_PARSED, fatal ERROR with
// ErrorTypes.NETWORK_ERROR / other) and assert on the engine's recovery.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import type { Station } from "../data/stations";

// --- Hoisted fake hls.js ---------------------------------------------------
const { FakeHls, hlsState } = vi.hoisted(() => {
  type Cb = (event: string, data: unknown) => void;
  class FakeHls {
    static isSupported = () => true;
    static Events = {
      MANIFEST_PARSED: "hlsManifestParsed",
      ERROR: "hlsError",
    } as const;
    static ErrorTypes = {
      NETWORK_ERROR: 1,
      MANIFEST_ERROR: 2,
      MEDIA_ERROR: 3,
      LEVEL_ERROR: 4,
    } as const;

    handlers: Record<string, Cb[]> = {};
    startLoadCount = 0;
    loadSourceCalled = false;
    attached: unknown = null;

    constructor(_cfg?: unknown) {
      hlsState.last = this;
    }
    loadSource() {
      this.loadSourceCalled = true;
    }
    attachMedia(el: unknown) {
      this.attached = el;
    }
    on(evt: string, cb: Cb) {
      (this.handlers[evt] ??= []).push(cb);
    }
    startLoad() {
      this.startLoadCount += 1;
    }
    destroy() {}
    fire(evt: string, data: unknown) {
      for (const cb of this.handlers[evt] ?? []) cb(evt, data);
    }
  }
  const hlsState: { last: FakeHls | null } = { last: null };
  return { FakeHls, hlsState };
});

vi.mock("hls.js", () => ({ default: FakeHls }));

import { AudioEngine } from "./AudioEngine";
import { useRadioStore } from "../store/radio";

const hlsStation: Station = {
  id: "fake-hls",
  name: "Fake HLS",
  city: "Streamcity",
  country: "Networkland",
  lat: 1,
  lng: 2,
  streamUrl: "https://example.com/live/index.m3u8",
};

beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  hlsState.last = null;
  vi.useFakeTimers();
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
});

afterEach(() => {
  vi.useRealTimers();
});

/** Stub the <audio> element the engine binds, then select the HLS station. */
function mountAndTune() {
  const { container } = render(<AudioEngine />);
  const el = container.querySelector("audio") as HTMLAudioElement;
  el.play = (() => Promise.resolve()) as unknown as HTMLAudioElement["play"];
  el.load = (() => {}) as unknown as HTMLAudioElement["load"];
  el.canPlayType = (() => "") as unknown as HTMLAudioElement["canPlayType"];
  // jsdom exposes `error`/`paused` as getters on HTMLMediaElement — stub
  // them via defineProperty so the engine reads the values we want.
  Object.defineProperty(el, "error", { value: null, configurable: true });
  Object.defineProperty(el, "paused", { value: true, configurable: true });
  act(() => {
    useRadioStore.setState({ current: hlsStation, status: "loading" });
  });
  return { el };
}

describe("AudioEngine bounded stream retry (issue #16)", () => {
  it("recovers a transient network error back to playing without user action", async () => {
    mountAndTune();
    const hls = hlsState.last!;
    expect(hls.loadSourceCalled).toBe(true);

    // Initial manifest parses → engine tries to play.
    await act(async () => {
      hls.fire(FakeHls.Events.MANIFEST_PARSED, {});
    });
    expect(useRadioStore.getState().status).toBe("playing");

    // A transient fatal network error blip arrives.
    hls.fire(FakeHls.Events.ERROR, {
      fatal: true,
      type: FakeHls.ErrorTypes.NETWORK_ERROR,
    });
    // Not yet given up: no error state, no banner message — the engine is
    // silently waiting out the 1s backoff before hls.startLoad().
    // (Status is deliberately untouched while a retry is pending: flipping
    // it to "loading" would re-run the load effect and restart the whole
    // Hls instance instead of recovering in place.)
    const mid = useRadioStore.getState();
    expect(mid.status).not.toBe("error");
    expect(mid.errorMessage).toBeNull();

    // Bounded backoff (1s) elapses → hls.startLoad() recovery runs.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(hls.startLoadCount).toBe(1);

    // The reloaded manifest parses → back to playing, no user interaction.
    await act(async () => {
      hls.fire(FakeHls.Events.MANIFEST_PARSED, {});
    });
    expect(useRadioStore.getState().status).toBe("playing");
  });

  it("surfaces the error banner only after the bounded retries are exhausted", () => {
    mountAndTune();
    const hls = hlsState.last!;

    // error #1 → schedule retry #1 (1s)
    hls.fire(FakeHls.Events.ERROR, {
      fatal: true,
      type: FakeHls.ErrorTypes.NETWORK_ERROR,
    });
    act(() => vi.advanceTimersByTime(1000));
    expect(hls.startLoadCount).toBe(1);

    // error #2 → schedule retry #2 (2s)
    hls.fire(FakeHls.Events.ERROR, {
      fatal: true,
      type: FakeHls.ErrorTypes.NETWORK_ERROR,
    });
    act(() => vi.advanceTimersByTime(2000));
    expect(hls.startLoadCount).toBe(2);

    // error #3 → budget (2) exhausted → give up, banner shown.
    hls.fire(FakeHls.Events.ERROR, {
      fatal: true,
      type: FakeHls.ErrorTypes.NETWORK_ERROR,
    });
    const s = useRadioStore.getState();
    expect(s.status).toBe("error");
    expect(s.errorMessage).toBe(
      "Stream failed to load. Try another station.",
    );
    expect(hls.startLoadCount).toBe(2); // no further retries
  });

  it("does not retry a non-network fatal error (bad manifest) — errors immediately", () => {
    mountAndTune();
    const hls = hlsState.last!;

    hls.fire(FakeHls.Events.ERROR, {
      fatal: true,
      type: FakeHls.ErrorTypes.MANIFEST_ERROR,
    });

    const s = useRadioStore.getState();
    expect(s.status).toBe("error");
    expect(s.errorMessage).toBe(
      "Stream failed to load. Try another station.",
    );
    expect(hls.startLoadCount).toBe(0);
  });

  it("keeps the selection as loaded on give-up so it does not reload-loop", () => {
    mountAndTune();
    const hls = hlsState.last!;

    hls.fire(FakeHls.Events.ERROR, {
      fatal: true,
      type: FakeHls.ErrorTypes.NETWORK_ERROR,
    });
    act(() => vi.advanceTimersByTime(1000));
    hls.fire(FakeHls.Events.ERROR, {
      fatal: true,
      type: FakeHls.ErrorTypes.NETWORK_ERROR,
    });
    act(() => vi.advanceTimersByTime(2000));
    hls.fire(FakeHls.Events.ERROR, {
      fatal: true,
      type: FakeHls.ErrorTypes.NETWORK_ERROR,
    });
    expect(useRadioStore.getState().status).toBe("error");

    // Re-render in the error state must NOT re-trigger a fresh load of the
    // same broken station (that would be unbounded retries in disguise).
    const startLoadsBefore = hls.startLoadCount;
    const loadSourcesBefore = hls.loadSourceCalled;
    act(() => {
      useRadioStore.setState({ status: "error" });
    });
    expect(hls.startLoadCount).toBe(startLoadsBefore);
    // A brand-new load would re-run loadSource; the mock is fresh per mount,
    // so guard against a second engine Hls instance being constructed.
    expect(hlsState.last).toBe(hls);
    expect(loadSourcesBefore).toBe(true);
  });
});
