import type { ApiError, GeocodeResult, NewPlaceInput, NewReviewInput, Place, PlaceWithReviews, Review } from "../../shared/types";
import { POST_PASSWORD_HEADER } from "../../shared/types";

/**
 * Headers for a write. The password is forwarded verbatim for the Worker to
 * judge; nothing here can tell whether it is correct.
 */
function writeHeaders(password: string): HeadersInit {
  return { "Content-Type": "application/json", [POST_PASSWORD_HEADER]: password };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    // A caller that cancelled its own request needs to tell that apart from a
    // real failure, so let the abort through instead of relabelling it.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error("Network error");
  }

  if (!response.ok) {
    let body: Partial<ApiError> = {};
    try {
      body = (await response.json()) as Partial<ApiError>;
    } catch {
      // Use the status fallback when the server did not return JSON.
    }
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export function fetchPlaces(): Promise<Place[]> {
  return request<Place[]>("/api/places");
}

export function fetchPlace(id: string): Promise<PlaceWithReviews> {
  return request<PlaceWithReviews>(`/api/places/${encodeURIComponent(id)}`);
}

/**
 * Place suggestions for a partial name. Pass the AbortSignal of a superseded
 * keystroke so a slow answer cannot overwrite a newer one.
 */
export function geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  return request<GeocodeResult[]>(`/api/geocode?q=${encodeURIComponent(query)}`, { signal });
}

export function createPlace(input: NewPlaceInput, password: string): Promise<Place> {
  return request<Place>("/api/places", {
    method: "POST",
    headers: writeHeaders(password),
    body: JSON.stringify(input),
  });
}

/**
 * Posts a review. If the chosen author already reviewed this place, the server
 * appends to their existing review and replaces the rating, instead of adding a
 * second review under the same name.
 */
export function createReview(placeId: string, input: NewReviewInput, password: string): Promise<Review> {
  return request<Review>(`/api/places/${encodeURIComponent(placeId)}/reviews`, {
    method: "POST",
    headers: writeHeaders(password),
    body: JSON.stringify(input),
  });
}

/** Rewrites an existing review. Needs the posting password, same as writing one. */
export function updateReview(placeId: string, reviewId: string, input: NewReviewInput, password: string): Promise<Review> {
  return request<Review>(`/api/places/${encodeURIComponent(placeId)}/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PATCH",
    headers: writeHeaders(password),
    body: JSON.stringify(input),
  });
}
