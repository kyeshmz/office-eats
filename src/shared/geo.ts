import type { LngLat } from "./types";

const EARTH_RADIUS_METERS = 6371008.8;
const DEGREES_TO_RADIANS = Math.PI / 180;

export function distanceMeters(a: LngLat, b: LngLat): number {
  const latitudeDifference = (b.lat - a.lat) * DEGREES_TO_RADIANS;
  const longitudeDifference = (b.lng - a.lng) * DEGREES_TO_RADIANS;
  const latitudeA = a.lat * DEGREES_TO_RADIANS;
  const latitudeB = b.lat * DEGREES_TO_RADIANS;
  const haversine = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDifference / 2) ** 2;

  return Math.round(2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine)));
}
