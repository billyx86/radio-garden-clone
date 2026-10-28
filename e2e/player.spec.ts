import { test, expect, type Page } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stations } from "../src/data/stations";

/**
 * E2E coverage for the audio player (#8).
 *
 * Streams are stubbed at the network layer: every request to a known station
 * streamUrl is fulfilled from local fixtures (a 120 s 440 Hz mp3 for
 * plain-audio stations, a 60 s VOD HLS playlist for the HLS station). The
 * page therefore runs fully offline — no real radio traffic, no flaky
 * third-party servers — while still exercising the real <audio> element,
 * hls.js and the whole zustand play/pause/mute state machine in a browser.
 */

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(here, "fixtures");
const MP3 = readFileSync(join(FIXTURES, "sine.mp3"));
const M3U8 = readFileSync(join(FIXTURES, "hls", "master.m3u8"));

const SEGMENTS = new Map<string, Buffer>();
for (const f of readdirSync(join(FIXTURES, "hls"))) {
  if (/^seg-\d{3}\.ts$/.test(f)) {
    SEGMENTS.set(f, readFileSync(join(FIXTURES, "hls", f)));
  }
}

const isHls = (url: string) => /\.m3u8(\?|$)/i.test(url);
const MP3_STREAMS = stations.filter((s) => !isHls(s.streamUrl));
const HLS_STREAMS = stations.filter((s) => isHls(s.streamUrl));

/** Every segment URL hls.js will request for the stubbed master playlists. */
const SEGMENT_URLS = new Map<string, Buffer>();
for (const s of HLS_STREAMS) {
  const base = s.streamUrl.slice(0, s.streamUrl.lastIndexOf("/") + 1);
  for (const [name, body] of SEGMENTS) SEGMENT_URLS.set(base + name, body);
}

const player = (page: Page) => page.locator('[data-testid="player"]');

async function bootApp(page: Page, opts: { abort?: string[] } = {}) {
  const abort = new Set(opts.abort ?? []);
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.startsWith("http://localhost")) return route.continue();
    if (abort.has(url)) return route.abort();
    if (HLS_STREAMS.some((s) => s.streamUrl === url)) {
      return route.fulfill({
        status: 200,
        contentType: "application/vnd.apple.mpegurl",
        body: M3U8,
      });
    }
    const seg = SEGMENT_URLS.get(url);
    if (seg) {
      return route.fulfill({ status: 200, contentType: "video/mp2t", body: seg });
    }
    if (MP3_STREAMS.some((s) => s.streamUrl === url)) {
      return route.fulfill({ status: 200, contentType: "audio/mpeg", body: MP3 });
    }
    // Anything else external (fonts, analytics, …) stays blocked: the suite
    // must never depend on the real network.
    return route.abort();
  });
  await page.goto("/");
  await page.locator('[data-testid="player-empty"]').waitFor();
}

/** Open search, filter by a query known to yield exactly one row, click it. */
async function selectStation(page: Page, id: string, query: string) {
  await page.locator('[data-testid="search-trigger"]').click();
  await page.locator('[data-testid="search-input"]').fill(query);
  await expect(page.locator('[data-testid="station-row"]')).toHaveCount(1);
  await page
    .locator(`[data-testid="station-row"][data-station-id="${id}"]`)
    .click();
}

/** Drive the volume slider the way Playwright does for controlled inputs. */
async function setVolume(page: Page, value: string) {
  await page.locator('[data-testid="player-volume"]').fill(value);
}

test.describe("audio player (e2e, stubbed streams)", () => {
  test("boots with the empty player and a hidden <audio> element", async ({
    page,
  }) => {
    await bootApp(page);
    await expect(page.locator('[data-testid="player-empty"]')).toBeVisible();
    const audio = page.locator("audio");
    await expect(audio).toHaveCount(1);
    await expect(audio).toBeHidden();
  });

  test("selecting a station plays the stubbed stream", async ({ page }) => {
    await bootApp(page);
    await selectStation(page, "kexp", "KEXP");
    await expect(player(page)).toHaveAttribute("data-status", "playing");
    await expect(page.locator('[data-testid="player-station-name"]')).toHaveText(
      "KEXP 90.3",
    );
    const paused = await page
      .locator("audio")
      .evaluate((el) => (el as HTMLAudioElement).paused);
    expect(paused).toBe(false);
  });

  test("switching stations retunes to the new stream", async ({ page }) => {
    await bootApp(page);
    await selectStation(page, "kexp", "KEXP");
    await expect(player(page)).toHaveAttribute("data-status", "playing");

    await selectStation(page, "wfmu", "WFMU");
    await expect(player(page)).toHaveAttribute("data-status", "playing");
    await expect(page.locator('[data-testid="player-station-name"]')).toHaveText(
      "WFMU",
    );
  });

  test("pause stops the stream, play resumes", async ({ page }) => {
    await bootApp(page);
    await selectStation(page, "kexp", "KEXP");
    await expect(player(page)).toHaveAttribute("data-status", "playing");

    await page.locator('[data-testid="player-play"]').click();
    await expect(player(page)).toHaveAttribute("data-status", "paused");

    await page.locator('[data-testid="player-play"]').click();
    await expect(player(page)).toHaveAttribute("data-status", "playing");
  });

  test("dragging volume to zero mutes; unmuting restores a usable volume", async ({
    page,
  }) => {
    await bootApp(page);
    await selectStation(page, "kexp", "KEXP");
    await expect(player(page)).toHaveAttribute("data-status", "playing");
    await expect(player(page)).toHaveAttribute("data-muted", "false");

    // Slider to 0 → auto-mute (the original bug this guards against).
    await setVolume(page, "0");
    await expect(player(page)).toHaveAttribute("data-muted", "true");
    await expect(page.locator('[data-testid="player-volume"]')).toHaveValue("0");

    // Unmuting must NOT "restore" 0 — the user would be stuck silent.
    await page.locator('[data-testid="player-mute"]').click();
    await expect(player(page)).toHaveAttribute("data-muted", "false");
    await expect(page.locator('[data-testid="player-volume"]')).toHaveValue(
      "0.5",
    );
  });

  test("HLS streams play through hls.js", async ({ page }) => {
    await bootApp(page);
    // The only .m3u8 station in the dataset.
    await selectStation(page, "cbbc", "CBC Music");
    await expect(player(page)).toHaveAttribute("data-status", "playing");
    await expect(page.locator('[data-testid="player-station-name"]')).toHaveText(
      "CBC Music",
    );
  });

  test("a failing stream surfaces the error banner; switching recovers", async ({
    page,
  }) => {
    const npr = stations.find((s) => s.id === "npr")!;
    await bootApp(page, { abort: [npr.streamUrl] });

    await selectStation(page, "npr", "NPR");
    await expect(player(page)).toHaveAttribute("data-status", "error");
    await expect(page.locator('[data-testid="player-error"]')).toBeVisible();

    // Recovery: a healthy station plays again.
    await selectStation(page, "kexp", "KEXP");
    await expect(player(page)).toHaveAttribute("data-status", "playing");
    await expect(page.locator('[data-testid="player-error"]')).toBeHidden();
  });

  test("favoriting a station lists it under the favorites tab", async ({
    page,
  }) => {
    await bootApp(page);
    await selectStation(page, "kexp", "KEXP");
    await expect(player(page)).toHaveAttribute("data-status", "playing");

    await page.locator('[data-testid="player-favorite"]').click();
    await expect(page.locator('[data-testid="player-favorite"]')).toHaveAttribute(
      "data-favorite",
      "true",
    );

    await page.locator('[data-testid="search-trigger"]').click();
    await page.locator('[data-testid="search-tab-favorites"]').click();
    await expect(page.locator('[data-testid="search-results-count"]')).toHaveText(
      "1 station",
    );
    await expect(
      page.locator('[data-testid="station-row"][data-station-id="kexp"]'),
    ).toBeVisible();
  });
});
