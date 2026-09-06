/**
 * Shared data contracts between the Worker API (src/worker) and the browser client (src/client).
 * Everything here crosses the wire as JSON.
 */

export const PLACE_CATEGORIES = ["food", "coffee", "bar", "shop", "park", "art", "other"] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

/** The only people who may leave a review. The client offers these as a dropdown. */
export const REVIEW_AUTHORS = ["Allen", "Jonny", "Kye"] as const;
export type ReviewAuthor = (typeof REVIEW_AUTHORS)[number];

/**
 * Narrows a stored author name to one the form can offer. Rows written before
 * REVIEW_AUTHORS existed may hold any name, so those fall back to the first
 * author rather than putting a value in the dropdown that it cannot show.
 */
export function toReviewAuthor(author: string): ReviewAuthor {
  return (REVIEW_AUTHORS as readonly string[]).includes(author) ? author as ReviewAuthor : REVIEW_AUTHORS[0];
}

/**
 * Header carrying the shared posting password. Every write endpoint checks it
 * against the Worker's POST_PASSWORD binding; the client never holds the
 * expected value, it only forwards whatever the user typed.
 */
export const POST_PASSWORD_HEADER = "x-post-password";

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  lng: number;
  lat: number;
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
  /** Free text, because rows predating REVIEW_AUTHORS may hold any name. */
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
  /**
   * The first review, written while adding the place. Places are added and
   * reviewed in one step, so every place starts with exactly one review.
   */
  review: NewReviewInput;
}

export interface NewReviewInput {
  author: ReviewAuthor;
  rating: Rating;
  body: string;
}

/** One place suggestion from the geocoder, ready to fill the add-place form. */
export interface GeocodeResult {
  /** Stable within a single response; used as a React key, never stored. */
  id: string;
  name: string;
  address: string;
  lng: number;
  lat: number;
  /** Straight-line distance from IMPULSE_SF in meters, so nearer suggestions sort first. */
  distanceMeters: number;
  /**
   * Best-guess category inferred from the geocoder's OSM tags. Absent when the
   * tags say nothing useful, so the form keeps whatever it already had.
   */
  category?: PlaceCategory;
}

export interface ApiError {
  error: string;
}

export interface LngLat {
  lng: number;
  lat: number;
}
