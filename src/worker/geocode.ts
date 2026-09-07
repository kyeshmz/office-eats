import { z } from "zod";
import { GEOCODE_LIMIT, IMPULSE_SF, SEARCH_BBOX } from "../shared/config";
import { distanceMeters } from "../shared/geo";
import type { GeocodeResult, PlaceCategory } from "../shared/types";

const PHOTON_ENDPOINT = "https://photon.komoot.io/api/";

/**
 * Photon answers with GeoJSON. Only the fields we actually read are described
 * here, and every one of them is optional: this is a third-party response, so
 * anything unexpected should drop a single suggestion rather than fail the
 * request.
 */
const photonResponseSchema = z.object({
  features: z.array(z.object({
    properties: z.object({
      name: z.string().optional(),
      housenumber: z.string().optional(),
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postcode: z.string().optional(),
      osm_id: z.number().optional(),
      osm_type: z.string().optional(),
      osm_key: z.string().optional(),
      osm_value: z.string().optional(),
    }).loose(),
    geometry: z.object({
      coordinates: z.tuple([z.number(), z.number()]),
    }),
  }).loose()).default([]),
}).loose();

/** Joins the address parts Photon actually returned, skipping the missing ones. */
function formatAddress(properties: { housenumber?: string; street?: string; city?: string; state?: string; postcode?: string }): string {
  const street = [properties.housenumber, properties.street].filter(Boolean).join(" ");
  return [street, properties.city, [properties.state, properties.postcode].filter(Boolean).join(" ")]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

/**
 * Best-guess place category from a feature's OSM tags. Returns null when the
 * tags say nothing useful, so callers keep whatever category they already had
 * instead of overwriting it with a shrug.
 */
export function inferPlaceCategory(osmKey?: string, osmValue?: string): PlaceCategory | null {
  const key = osmKey?.trim().toLowerCase();
  const value = osmValue?.trim().toLowerCase();
  if (!key || !value) return null;

  if (key === "shop") return "shop";
  if (key === "craft" && value === "brewery") return "bar";

  switch (key) {
    case "amenity":
      if (value === "restaurant" || value === "fast_food" || value === "food_court" || value === "ice_cream") return "food";
      if (value === "cafe") return "coffee";
      if (value === "bar" || value === "pub" || value === "biergarten" || value === "nightclub") return "bar";
      if (value === "theatre" || value === "arts_centre" || value === "cinema") return "art";
      return null;
    case "leisure":
      if (value === "park" || value === "playground" || value === "garden" || value === "nature_reserve" || value === "common") return "park";
      return null;
    case "tourism":
      if (value === "museum" || value === "gallery" || value === "artwork" || value === "attraction" || value === "viewpoint") return "art";
      return null;
    case "natural":
      if (value === "beach" || value === "wood" || value === "grassland") return "park";
      return null;
    default:
      return null;
  }
}

/**
 * Looks up place suggestions for a partial name, confined to SEARCH_BBOX and
 * ordered by how close each one is to Impulse SF.
 *
 * Suggestions without a name are dropped: they are usually bare street
 * segments, and the form needs a name to put in its Name field.
 */
export async function geocodePlaces(query: string): Promise<GeocodeResult[]> {
  const url = new URL(PHOTON_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(GEOCODE_LIMIT * 2));
  url.searchParams.set("bbox", SEARCH_BBOX.join(","));

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    // Identical searches are common while typing, so let Cloudflare answer
    // repeats instead of hitting the public geocoder every keystroke.
    cf: { cacheTtl: 3600, cacheEverything: true },
  });
  if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);

  const parsed = photonResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Geocoder returned an unexpected response");

  // One real-world place can come back more than once, because Photon emits a
  // feature per matching tag: a brewpub arrives as both amenity=pub and
  // craft=brewery, same OSM id, same point. Keep the first of each.
  const seen = new Set<string>();
  const results: GeocodeResult[] = [];

  for (const feature of parsed.data.features) {
    const name = feature.properties.name?.trim();
    if (!name) continue;

    const [lng, lat] = feature.geometry.coordinates;
    const rawOsmType = feature.properties.osm_type;
    const osmType: "N" | "W" | "R" | undefined =
      rawOsmType === "N" || rawOsmType === "W" || rawOsmType === "R" ? rawOsmType : undefined;
    const osmId = feature.properties.osm_id;
    const identity = osmId
      ? `${osmType ?? "N"}${osmId}`
      : `${name}@${lng.toFixed(6)},${lat.toFixed(6)}`;
    if (seen.has(identity)) continue;
    seen.add(identity);

    const category = inferPlaceCategory(feature.properties.osm_key, feature.properties.osm_value);
    results.push({
      id: identity,
      name,
      address: formatAddress(feature.properties),
      lng,
      lat,
      distanceMeters: distanceMeters(IMPULSE_SF, { lng, lat }),
      // The OSM link travels with the suggestion so the form can store it and
      // look up details later. The category is only attached when the tags
      // actually say something, so the form keeps its current one otherwise.
      ...(osmType && osmId ? { osmType, osmId } : {}),
      ...(category ? { category } : {}),
    });
  }

  return results
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, GEOCODE_LIMIT);
}
