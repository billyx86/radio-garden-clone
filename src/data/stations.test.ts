import { describe, expect, it } from "vitest";
import { searchStations, stations } from "./stations";

describe("stations dataset integrity", () => {
  it("has a healthy number of stations", () => {
    expect(stations.length).toBeGreaterThan(60);
  });

  it("has unique station ids", () => {
    const ids = stations.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate stream URLs", () => {
    const urls = stations.map((s) => s.streamUrl);
    const counts = new Map<string, number>();
    for (const u of urls) counts.set(u, (counts.get(u) ?? 0) + 1);
    const dupes = [...counts.entries()].filter(([, n]) => n > 1);
    expect(dupes, `duplicate stream URLs: ${JSON.stringify(dupes)}`).toEqual([]);
  });

  it("has valid coordinates for every station", () => {
    for (const s of stations) {
      expect(s.lat, `${s.id} lat`).toBeGreaterThanOrEqual(-90);
      expect(s.lat, `${s.id} lat`).toBeLessThanOrEqual(90);
      expect(s.lng, `${s.id} lng`).toBeGreaterThanOrEqual(-180);
      expect(s.lng, `${s.id} lng`).toBeLessThanOrEqual(180);
    }
  });

  it("has non-empty name, city and country for every station", () => {
    for (const s of stations) {
      expect(s.name.trim(), `${s.id} name`).not.toHaveLength(0);
      expect(s.city.trim(), `${s.id} city`).not.toHaveLength(0);
      expect(s.country.trim(), `${s.id} country`).not.toHaveLength(0);
    }
  });

  it("only uses https stream URLs", () => {
    for (const s of stations) {
      expect(s.streamUrl, `${s.id} streamUrl`).toMatch(/^https:\/\//);
    }
  });

  it("does not list the same station name twice in different cities", () => {
    const byName = new Map<string, Set<string>>();
    for (const s of stations) {
      const key = s.name.trim().toLowerCase();
      if (!byName.has(key)) byName.set(key, new Set());
      byName.get(key)!.add(s.city);
    }
    const conflicts = [...byName.entries()].filter(([, cities]) => cities.size > 1);
    expect(conflicts, JSON.stringify(conflicts)).toEqual([]);
  });
});

describe("searchStations", () => {
  it("returns all stations for an empty or whitespace query", () => {
    expect(searchStations("")).toHaveLength(stations.length);
    expect(searchStations("   ")).toHaveLength(stations.length);
  });

  it("matches by city (case-insensitive)", () => {
    const results = searchStations("paris");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((s) => s.city.toLowerCase().includes("paris"))).toBe(true);
  });

  it("matches by country", () => {
    const results = searchStations("germany");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((s) => s.country.toLowerCase().includes("germany"))).toBe(true);
  });

  it("matches by tag", () => {
    const results = searchStations("jazz");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((s) => s.tags?.some((t) => t.toLowerCase().includes("jazz"))),
    ).toBe(true);
  });

  it("returns no results for a nonsense query", () => {
    expect(searchStations("zzzzqqqqxx")).toEqual([]);
  });
});
