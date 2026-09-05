/**
 * Shared data contracts between the Worker API (src/worker) and the browser client (src/client).
 * Everything here crosses the wire as JSON.
 */

export const PLACE_CATEGORIES = ["food", "coffee", "bar", "shop", "park", "art", "other"] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  lng: number;
  lat: number;
  description: string | null;
  /** ISO-8601 UTC timestamp */
  createdAt: string;
  /** Straight-line distance from IMPULSE_SF in meters, computed by the API. */
  distanceMeters: number;
  reviewCount: number;
  /** Mean of review ratings, null when reviewCount is 0. */
  avgRating: number | null;
}

export interface Review {
  id: string;
  placeId: string;
  author: string;
  rating: Rating;
  body: string;
  /** ISO-8601 UTC timestamp */
  createdAt: string;
}

export interface PlaceWithReviews extends Place {
  /** Newest first. */
  reviews: Review[];
}

export interface NewPlaceInput {
  name: string;
  category: PlaceCategory;
  address: string;
  lng: number;
  lat: number;
  description?: string;
}

export interface NewReviewInput {
  author: string;
  rating: Rating;
  body: string;
}

export interface ApiError {
  error: string;
}

export interface LngLat {
  lng: number;
  lat: number;
}
