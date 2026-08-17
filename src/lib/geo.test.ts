import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { cameraPosForStation, latLngToVector3 } from "./geo";

const approx = (v: number, expected: number, eps = 1e-9) =>
  expect(Math.abs(v - expected), `expected ${v} ≈ ${expected}`).toBeLessThan(eps);

describe("latLngToVector3", () => {
  it("maps lat 0 / lng 0 to (1, 0, 0) on the unit sphere", () => {
    const v = latLngToVector3(0, 0, 1, new THREE.Vector3());
    approx(v.x, 1);
    approx(v.y, 0);
    approx(v.z, 0);
  });

  it("maps the north pole to (0, 1, 0)", () => {
    const v = latLngToVector3(90, 0, 1, new THREE.Vector3());
    approx(v.x, 0);
    approx(v.y, 1);
    approx(v.z, 0);
  });

  it("maps the south pole to (0, -1, 0)", () => {
    const v = latLngToVector3(-90, 0, 1, new THREE.Vector3());
    approx(v.x, 0);
    approx(v.y, -1);
    approx(v.z, 0);
  });

  it("preserves the requested radius for arbitrary coordinates", () => {
    for (const [lat, lng] of [
      [38.9, -77.0],
      [-33.87, 151.21],
      [55.75, 37.61],
      [51.5074, -0.1278],
    ] as const) {
      const v = latLngToVector3(lat, lng, 2.5, new THREE.Vector3());
      approx(v.length(), 2.5, 1e-9);
    }
  });

  it("writes into and returns the provided target vector", () => {
    const target = new THREE.Vector3(99, 99, 99);
    const out = latLngToVector3(10, 20, 1, target);
    expect(out).toBe(target);
  });

  it("maps opposite longitudes to opposite points on the equator", () => {
    const a = latLngToVector3(0, 0, 1, new THREE.Vector3());
    const b = latLngToVector3(0, 180, 1, new THREE.Vector3());
    expect(a.dot(b)).toBeCloseTo(-1, 9);
  });
});

describe("cameraPosForStation", () => {
  it("returns a camera position at the requested distance from the globe center", () => {
    const v = cameraPosForStation(51.5074, -0.1278, 1, 2.35);
    approx(v.length(), 2.35, 1e-9);
  });
});
