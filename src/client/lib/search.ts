import type { Place } from "../../shared/types";

export function filterPlaces(places: Place[], query: string): Place[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return places;

  return places.filter((place) => {
    const haystack = [place.name, place.address, place.category, place.description ?? ""]
      .join(" ")
      .toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}
