import type { ApiError, NewPlaceInput, NewReviewInput, Place, PlaceWithReviews, Review } from "../../shared/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
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

export function createPlace(input: NewPlaceInput): Promise<Place> {
  return request<Place>("/api/places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function createReview(placeId: string, input: NewReviewInput): Promise<Review> {
  return request<Review>(`/api/places/${encodeURIComponent(placeId)}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
