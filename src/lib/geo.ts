import * as THREE from "three";

/** Convert geographic lat/lng (degrees) to a point on a sphere of given radius. */
export function latLngToVector3(
  lat: number,
  lng: number,
  radius = 1,
  target = new THREE.Vector3()
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return target.set(x, y, z);
}

/** Camera position looking at a station from slightly above the surface. */
export function cameraPosForStation(
  lat: number,
  lng: number,
  globeRadius = 1,
  distance = 2.4
): THREE.Vector3 {
  return latLngToVector3(lat, lng, distance);
}

export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
