import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getPlace, insertPlace, insertReview, listPlaces } from "./db";
import { newPlaceSchema, newReviewSchema } from "./schemas";

export const api = new Hono<{ Bindings: Env }>();

function validationError(result: { error: { issues: Array<{ path: PropertyKey[]; message: string }> } }, c: { json: (body: { error: string }, status: 400) => Response }): Response {
  const issue = result.error.issues[0];
  const path = issue.path.join(".");
  return c.json({ error: path ? `${path}: ${issue.message}` : issue.message }, 400);
}

api.onError((error, c) => {
  if (error.message === "Malformed JSON in request body") return c.json({ error: "Invalid JSON body" }, 400);
  return c.json({ error: "Internal Server Error" }, 500);
});

api.get("/places", async (c) => c.json(await listPlaces(c.env.DB)));

api.post("/places", zValidator("json", newPlaceSchema, (result, c) => {
  if (!result.success) return validationError(result, c);
}), async (c) => c.json(await insertPlace(c.env.DB, c.req.valid("json")), 201));

api.get("/places/:id", async (c) => {
  const place = await getPlace(c.env.DB, c.req.param("id"));
  return place ? c.json(place) : c.json({ error: "Place not found" }, 404);
});

api.post("/places/:id/reviews", zValidator("json", newReviewSchema, (result, c) => {
  if (!result.success) return validationError(result, c);
}), async (c) => {
  const placeId = c.req.param("id");
  if (!(await getPlace(c.env.DB, placeId))) return c.json({ error: "Place not found" }, 404);
  return c.json(await insertReview(c.env.DB, placeId, c.req.valid("json")), 201);
});

api.all("*", (c) => c.json({ error: "Not found" }, 404));
