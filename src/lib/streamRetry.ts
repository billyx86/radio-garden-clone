// Bounded stream-error recovery (issue #16).
//
// hls.js and the native <audio> element both surface *transient* network
// failures — a DNS hiccup, a one-second blip, a brief 404 while a live-ICE
// stream rotates its playlist. Before this, any such blip stranded the user
// on the error banner until they manually picked another station. The fix is
// a *bounded* recovery: a small number of retries with increasing backoff,
// then give up and surface the error.
//
// This module is the pure *decision* — given the error kind and how many
// retries we have already spent, do we retry (and how long to wait) or do we
// give up? AudioEngine owns the timers and the actual `hls.startLoad()` /
// `el.load()` + `play()` calls; it applies the decision this returns.

export type RetryKind = "hls-network" | "audio-network";

/** Max recovery attempts per kind before we surface the error banner. */
export const MAX_RETRIES: Record<RetryKind, number> = {
  // hls.startLoad() retries at 1s then 2s.
  "hls-network": 2,
  // plain-audio el.load()+play() retry at 1s.
  "audio-network": 1,
};

/** Base backoff; the delay scales linearly with the attempt number. */
export const BASE_DELAY_MS = 1000;

/** The banner copy used when a stream ultimately cannot be recovered. */
export const ERROR_MESSAGE = "Stream failed to load. Try another station.";

export type RetryDecision =
  | { action: "retry"; delayMs: number; attempt: number }
  | { action: "error"; message: string };

/**
 * Decide whether to retry a stream error and, if so, the backoff delay.
 *
 * @param opts.kind  which recovery path — `hls-network` (hls.js) or
 *   `audio-network` (native <audio>).
 * @param opts.isNetworkError  true when the error is a transient network
 *   failure (hls.js `ErrorTypes.NETWORK_ERROR` / `MediaError.MEDIA_ERR_NETWORK`).
 *   Non-network fatal errors (bad URL, codec, manifest parse) cannot be
 *   fixed by retrying, so we give up immediately regardless of budget.
 * @param opts.retriesUsed  how many retries of this kind have already been
 *   spent for the current load.
 */
export function decideStreamRetry(opts: {
  kind: RetryKind;
  isNetworkError: boolean;
  retriesUsed: number;
}): RetryDecision {
  const max = MAX_RETRIES[opts.kind];
  if (opts.isNetworkError && opts.retriesUsed < max) {
    const attempt = opts.retriesUsed + 1;
    return { action: "retry", delayMs: BASE_DELAY_MS * attempt, attempt };
  }
  return { action: "error", message: ERROR_MESSAGE };
}
