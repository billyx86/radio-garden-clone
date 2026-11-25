import { describe, expect, it } from "vitest";
import {
  BASE_DELAY_MS,
  MAX_RETRIES,
  decideStreamRetry,
  ERROR_MESSAGE,
} from "./streamRetry";

describe("decideStreamRetry", () => {
  describe("hls-network (hls.js)", () => {
    it("retries a transient network error, with linearly increasing backoff", () => {
      const first = decideStreamRetry({
        kind: "hls-network",
        isNetworkError: true,
        retriesUsed: 0,
      });
      expect(first).toEqual({ action: "retry", delayMs: BASE_DELAY_MS, attempt: 1 });

      const second = decideStreamRetry({
        kind: "hls-network",
        isNetworkError: true,
        retriesUsed: 1,
      });
      expect(second).toEqual({
        action: "retry",
        delayMs: BASE_DELAY_MS * 2,
        attempt: 2,
      });
    });

    it("gives up after the retry budget is exhausted, surfacing the banner", () => {
      const d = decideStreamRetry({
        kind: "hls-network",
        isNetworkError: true,
        retriesUsed: MAX_RETRIES["hls-network"],
      });
      expect(d).toEqual({ action: "error", message: ERROR_MESSAGE });
    });

    it("never retries a non-network fatal error (bad URL / manifest parse), even with budget left", () => {
      const d = decideStreamRetry({
        kind: "hls-network",
        isNetworkError: false,
        retriesUsed: 0,
      });
      expect(d.action).toBe("error");
    });
  });

  describe("audio-network (native <audio>)", () => {
    it("retries a transient network error once, then gives up", () => {
      const first = decideStreamRetry({
        kind: "audio-network",
        isNetworkError: true,
        retriesUsed: 0,
      });
      expect(first).toEqual({ action: "retry", delayMs: BASE_DELAY_MS, attempt: 1 });

      const second = decideStreamRetry({
        kind: "audio-network",
        isNetworkError: true,
        retriesUsed: MAX_RETRIES["audio-network"],
      });
      expect(second).toEqual({ action: "error", message: ERROR_MESSAGE });
    });

    it("never retries a non-network audio error", () => {
      const d = decideStreamRetry({
        kind: "audio-network",
        isNetworkError: false,
        retriesUsed: 0,
      });
      expect(d.action).toBe("error");
    });
  });

  it("hls gets a larger budget than plain audio (startLoad is cheap, reload is not)", () => {
    expect(MAX_RETRIES["hls-network"]).toBeGreaterThan(MAX_RETRIES["audio-network"]);
  });
});
