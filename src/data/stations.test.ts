import { describe, expect, it } from "vitest";
import { applyFilters, searchStations, stationFacets, stations } from "./stations";

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

describe("applyFilters", () => {
  it("matches a bare query the same way searchStations does", () => {
    expect(applyFilters(stations, "paris", null, null)).toEqual(searchStations("paris"));
    expect(applyFilters(stations, "", null, null)).toHaveLength(stations.length);
  });

  it("filters by exact genre (tag) match", () => {
    const jazz = applyFilters(stations, "", "jazz", null);
    expect(jazz.length).toBeGreaterThan(0);
    expect(jazz.length).toBeLessThan(stations.length);
    expect(jazz.every((s) => (s.tags ?? []).includes("jazz"))).toBe(true);
  });

  it("does not partial-match genres (\"amb\" does not hit \"ambient\")", () => {
    expect(applyFilters(stations, "", "amb", null)).toEqual([]);
  });

  it("filters by exact region (country) match", () => {
    const germany = applyFilters(stations, "", null, "Germany");
    expect(germany.length).toBeGreaterThan(0);
    expect(germany.every((s) => s.country === "Germany")).toBe(true);
  });

  it("ANDs query, genre and region together", () => {
    const both = applyFilters(stations, "", "pop", "Germany");
    expect(both.length).toBeGreaterThan(0);
    expect(both.every((s) => s.country === "Germany" && (s.tags ?? []).includes("pop"))).toBe(
      true,
    );
    // strictly a subset of each single filter
    const popOnly = applyFilters(stations, "", "pop", null);
    const germanyOnly = applyFilters(stations, "", null, "Germany");
    expect(both.length).toBeLessThanOrEqual(popOnly.length);
    expect(both.length).toBeLessThanOrEqual(germanyOnly.length);
  });

  it("query narrows the genre+region result set", () => {
    const base = applyFilters(stations, "", null, "UK");
    const narrowed = applyFilters(stations, "london", null, "UK");
    expect(narrowed.length).toBeGreaterThan(0);
    expect(narrowed.length).toBeLessThanOrEqual(base.length);
    expect(narrowed.every((s) => s.city.toLowerCase().includes("london"))).toBe(true);
  });

  it("returns [] when filters are mutually exclusive", () => {
    // No jazz station in the dataset is also in Germany + London.
    expect(applyFilters(stations, "zzzzqqqqxx", "jazz", "Germany")).toEqual([]);
  });

  it("treats null and empty-string genre/region as no filter", () => {
    expect(applyFilters(stations, "paris", null, null)).toEqual(
      applyFilters(stations, "paris", "", ""),
    );
  });
});

describe("stationFacets", () => {
  it("lists the most common genres first, capped at the max", () => {
    const { genres } = stationFacets(stations, 5, 16);
    expect(genres).toHaveLength(5);
    // "pop" is the single most common tag in the dataset
    expect(genres[0]).toBe("pop");
  });

  it("lists the most common regions first, capped at the max", () => {
    const { regions } = stationFacets(stations, 12, 3);
    expect(regions).toHaveLength(3);
    expect(regions[0]).toBe("USA");
  });

  it("only offers values that exist in the dataset", () => {
    const { genres, regions } = stationFacets(stations);
    const allTags = new Set(stations.flatMap((s) => s.tags ?? []));
    const allCountries = new Set(stations.map((s) => s.country));
    expect(genres.every((g) => allTags.has(g))).toBe(true);
    expect(regions.every((r) => allCountries.has(r))).toBe(true);
  });

  it("respects a smaller item set (subset of stations)", () => {
    const subset = stations.filter((s) => s.country === "Germany");
    const { regions } = stationFacets(subset);
    expect(regions).toEqual(["Germany"]);
  });
});
