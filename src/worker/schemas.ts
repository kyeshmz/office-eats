import { z } from "zod";
import { PLACE_CATEGORIES, REVIEW_AUTHORS, type NewPlaceInput, type NewReviewInput, type Rating } from "../shared/types";

const ratingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]) satisfies z.ZodType<Rating>;

export const newReviewSchema = z.object({
  author: z.enum(REVIEW_AUTHORS),
  rating: ratingSchema,
  body: z.string().trim().min(1).max(2000),
}) satisfies z.ZodType<NewReviewInput>;

export const newPlaceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.enum(PLACE_CATEGORIES),
  address: z.string().trim().min(1).max(200),
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  // A place is added and reviewed in one step, so the review is required.
  review: newReviewSchema,
}) satisfies z.ZodType<NewPlaceInput>;
