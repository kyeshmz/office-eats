import { z } from "zod";
import type { OsmDetails } from "../shared/types";

export interface OsmRef {
  osmType: "N" | "W" | "R";
  osmId: number;
}

const OSM_API = "https://api.openstreetmap.org/api/0.6";
const WIKIPEDIA_API = ".wikipedia.org/w/api.php";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

/** Details barely change, so cache them for a week like the geocoder results. */
const CACHE = { cacheTtl: 7 * 24 * 3600, cacheEverything: true } as const;

const elementPath = { N: "node", W: "way", R: "relation" } as const;

const osmObjectSchema = z.object({
  elements: z.array(z.object({
    tags: z.record(z.string(), z.string()).optional(),
  }).loose()).default([]),
}).loose();

const wikiPagesSchema = z.object({
  query: z.object({
    pages: z.record(z.string(), z.object({
      thumbnail: z.object({ source: z.string() }).loose().optional(),
    }).loose()),
  }).loose(),
}).loose();

const commonsPagesSchema = z.object({
  query: z.object({
    pages: z.record(z.string(), z.object({
      imageinfo: z.array(z.object({
        thumburl: z.string().optional(),
        url: z.string(),
      }).loose()).optional(),
    }).loose()),
  }).loose(),
}).loose();

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { Accept: "application/json" }, cf: CACHE });
  if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
  return response.json();
}

function ensureHttp(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Best thumbnail for a Wikipedia "lang:Title" tag, or null when it has none. */
async function wikipediaPhoto(wikipedia: string): Promise<string | null> {
  const separator = wikipedia.indexOf(":");
  if (separator <= 0) return null;
  const lang = wikipedia.slice(0, separator);
  const title = wikipedia.slice(separator + 1).trim();
  if (!title) return null;

  const url = `https://${lang}${WIKIPEDIA_API}?action=query&format=json&prop=pageimages&pithumbsize=800&titles=${encodeURIComponent(title)}`;
  const parsed = wikiPagesSchema.safeParse(await fetchJson(url));
  if (!parsed.success) return null;
  for (const page of Object.values(parsed.data.query.pages)) {
    if (page.thumbnail?.source) return page.thumbnail.source;
  }
  return null;
}

/** Best thumbnail for a Commons "File:…" tag. Anything else (Category:…) is skipped. */
async function commonsPhoto(commons: string): Promise<string | null> {
  if (!/^file:/i.test(commons.trim())) return null;
  const url = `${COMMONS_API}?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=800&titles=${encodeURIComponent(commons.trim())}`;
  const parsed = commonsPagesSchema.safeParse(await fetchJson(url));
  if (!parsed.success) return null;
  for (const page of Object.values(parsed.data.query.pages)) {
    const info = page.imageinfo?.[0];
    if (info) return info.thumburl ?? info.url;
  }
  return null;
}

/**
 * Looks up a place's details from its OSM tags, plus a photo from the wiki
 * when the object links one. Only whitelisted tags are returned, and a missing
 * photo never fails the whole lookup: details without a picture are still
 * worth showing.
 */
export async function fetchOsmDetails(ref: OsmRef): Promise<OsmDetails> {
  const object = osmObjectSchema.parse(
    await fetchJson(`${OSM_API}/${elementPath[ref.osmType]}/${ref.osmId}.json`),
  );
  const tags = object.elements[0]?.tags ?? {};
  const details: OsmDetails = {};

  if (tags.opening_hours) details.hours = tags.opening_hours;
  if (tags.website ?? tags["contact:website"]) details.website = ensureHttp(tags.website ?? tags["contact:website"]!);
  if (tags.phone ?? tags["contact:phone"]) details.phone = tags.phone ?? tags["contact:phone"]!;
  if (tags.cuisine) details.cuisine = tags.cuisine.split(";").map((part) => part.trim()).filter(Boolean).join(", ");

  // Each photo source is tried on its own: a dead wiki link must not take the
  // OSM details down with it.
  try {
    const photo = tags["wikimedia_commons"]
      ? await commonsPhoto(tags["wikimedia_commons"])
      : tags.wikipedia
        ? await wikipediaPhoto(tags.wikipedia)
        : null;
    if (photo) details.photoUrl = photo;
  } catch {
    // No photo, details still stand.
  }

  return details;
}
