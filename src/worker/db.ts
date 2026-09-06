import { IMPULSE_SF } from "../shared/config";
import { distanceMeters } from "../shared/geo";
import type { NewPlaceInput, NewReviewInput, Place, PlaceCategory, PlaceWithReviews, Rating, Review } from "../shared/types";

interface PlaceRow {
  id: string;
  name: string;
  category: string;
  address: string;
  lng: number;
  lat: number;
  created_at: string;
  review_count: number;
  avg_rating: number | null;
}

interface ReviewRow {
  id: string;
  place_id: string;
  author: string;
  rating: number;
  body: string;
  created_at: string;
}

function placeFromRow(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    category: row.category as PlaceCategory,
    address: row.address,
    lng: row.lng,
    lat: row.lat,
    createdAt: row.created_at,
    distanceMeters: distanceMeters(IMPULSE_SF, { lng: row.lng, lat: row.lat }),
    reviewCount: row.review_count,
    avgRating: row.avg_rating === null ? null : Math.round(row.avg_rating * 10) / 10,
  };
}

function reviewFromRow(row: ReviewRow): Review {
  return {
    id: row.id,
    placeId: row.place_id,
    author: row.author,
    rating: row.rating as Rating,
    body: row.body,
    createdAt: row.created_at,
  };
}

const reviewColumns = "id, place_id, author, rating, body, created_at";

const placeSelect = `
  SELECT p.id, p.name, p.category, p.address, p.lng, p.lat, p.created_at,
    COUNT(r.id) AS review_count, AVG(r.rating) AS avg_rating
  FROM places p LEFT JOIN reviews r ON r.place_id = p.id
`;

export async function listPlaces(db: D1Database): Promise<Place[]> {
  const result = await db.prepare(`${placeSelect} GROUP BY p.id`).all<PlaceRow>();
  return result.results.map(placeFromRow).sort((a, b) => a.distanceMeters - b.distanceMeters || a.name.localeCompare(b.name));
}

export async function getPlace(db: D1Database, id: string): Promise<PlaceWithReviews | null> {
  const row = await db.prepare(`${placeSelect} WHERE p.id = ? GROUP BY p.id`).bind(id).first<PlaceRow>();
  if (!row) return null;

  const reviews = await db.prepare(
    `SELECT ${reviewColumns} FROM reviews WHERE place_id = ? ORDER BY created_at DESC`,
  ).bind(id).all<ReviewRow>();
  return { ...placeFromRow(row), reviews: reviews.results.map(reviewFromRow) };
}

/**
 * Adds a place together with its first review. The two writes go in one batch so
 * a place can never be left behind without the review it was added with.
 */
export async function insertPlace(db: D1Database, input: NewPlaceInput): Promise<Place> {
  const { review, ...place } = input;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await db.batch([
    db.prepare(
      "INSERT INTO places (id, name, category, address, lng, lat, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).bind(id, place.name, place.category, place.address, place.lng, place.lat, createdAt),
    db.prepare(
      "INSERT INTO reviews (id, place_id, author, rating, body, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(crypto.randomUUID(), id, review.author, review.rating, review.body, createdAt),
  ]);

  return {
    id,
    ...place,
    createdAt,
    distanceMeters: distanceMeters(IMPULSE_SF, place),
    reviewCount: 1,
    avgRating: review.rating,
  };
}

/**
 * Records a review, one per author per place.
 *
 * When that author has already reviewed the place, the new text is appended to
 * their existing review and the rating is replaced with the newly given one,
 * rather than a second review appearing under the same name. `created_at` stays
 * as it was, so an author's review keeps its position in the list.
 *
 * `created` says which of the two happened, so the caller can answer 201 or 200.
 */
export async function saveReview(db: D1Database, placeId: string, input: NewReviewInput): Promise<{ review: Review; created: boolean }> {
  const existing = await db.prepare(
    `SELECT ${reviewColumns} FROM reviews WHERE place_id = ? AND author = ?`,
  ).bind(placeId, input.author).first<ReviewRow>();

  if (existing) {
    const appended = `${existing.body}\n\n${input.body}`;
    const row = await db.prepare(
      `UPDATE reviews SET rating = ?, body = ? WHERE id = ? RETURNING ${reviewColumns}`,
    ).bind(input.rating, appended, existing.id).first<ReviewRow>();
    return { review: reviewFromRow(row!), created: false };
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.prepare(
    "INSERT INTO reviews (id, place_id, author, rating, body, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(id, placeId, input.author, input.rating, input.body, createdAt).run();
  return { review: { id, placeId, ...input, createdAt }, created: true };
}

/**
 * Rewrites an existing review in place. `created_at` is deliberately left
 * alone so an edit does not reorder the list, and the place id is part of the
 * WHERE clause so a review can only be edited through the place it belongs to.
 *
 * Returns null when no such review exists under that place.
 */
export async function updateReview(db: D1Database, placeId: string, reviewId: string, input: NewReviewInput): Promise<Review | null> {
  const row = await db.prepare(
    `UPDATE reviews SET author = ?, rating = ?, body = ?
     WHERE id = ? AND place_id = ?
     RETURNING ${reviewColumns}`,
  ).bind(input.author, input.rating, input.body, reviewId, placeId).first<ReviewRow>();
  return row ? reviewFromRow(row) : null;
}
