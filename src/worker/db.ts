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
  description: string | null;
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
    description: row.description,
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

const placeSelect = `
  SELECT p.id, p.name, p.category, p.address, p.lng, p.lat, p.description, p.created_at,
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
    "SELECT id, place_id, author, rating, body, created_at FROM reviews WHERE place_id = ? ORDER BY created_at DESC",
  ).bind(id).all<ReviewRow>();
  return { ...placeFromRow(row), reviews: reviews.results.map(reviewFromRow) };
}

export async function insertPlace(db: D1Database, input: NewPlaceInput): Promise<Place> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.prepare(
    "INSERT INTO places (id, name, category, address, lng, lat, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(id, input.name, input.category, input.address, input.lng, input.lat, input.description ?? null, createdAt).run();
  return {
    id,
    ...input,
    description: input.description ?? null,
    createdAt,
    distanceMeters: distanceMeters(IMPULSE_SF, input),
    reviewCount: 0,
    avgRating: null,
  };
}

export async function insertReview(db: D1Database, placeId: string, input: NewReviewInput): Promise<Review> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.prepare(
    "INSERT INTO reviews (id, place_id, author, rating, body, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(id, placeId, input.author, input.rating, input.body, createdAt).run();
  return { id, placeId, ...input, createdAt };
}
