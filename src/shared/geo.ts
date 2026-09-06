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

/**
 * Link to this place on Google Maps, using the documented Maps URL scheme.
 *
 * The query is the name and address rather than the raw coordinates, so the
 * link resolves to the real business listing with hours and directions instead
 * of dropping an unlabelled pin. The coordinates ride along in `center` to keep
 * the map on the right neighbourhood when the text is ambiguous.
 */
export function googleMapsUrl(place: { name: string; address: string; lng: number; lat: number }): string {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", `${place.name}, ${place.address}`);
  url.searchParams.set("center", `${place.lat},${place.lng}`);
  return url.toString();
}
