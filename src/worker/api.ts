import { zValidator } from "@hono/zod-validator";
import { Hono, type MiddlewareHandler } from "hono";
import { getPlace, insertPlace, isTrustedDevice, listPlaces, saveReview, touchTrustedDevice, trustDevice, updateReview } from "./db";
import { geocodePlaces } from "./geocode";
import { fetchOsmDetails } from "./osm";
import { newPlaceSchema, newReviewSchema } from "./schemas";
import { DEVICE_TOKEN_HEADER, POST_PASSWORD_HEADER } from "../shared/types";

export const api = new Hono<{ Bindings: Env }>();

/**
 * Compares two strings without leaking their common prefix length through
 * timing. Length is not secret, so an early return on mismatched length is fine.
 */
function secureEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Gate on every write route. The expected password lives only in the Worker's
 * POST_PASSWORD binding and is never sent to the browser, so the client cannot
 * decide for itself whether a password is right.
 *
 * A browser cannot reveal its MAC address, so the client sends a random
 * per-browser device id instead. The first time a device presents the correct
 * password its id is remembered; afterwards that id alone authorises writes,
 * so a known device is never asked for the password again.
 */
const requirePassword: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const expected = c.env.POST_PASSWORD;
  if (!expected) return c.json({ error: "Posting is disabled: no password is configured" }, 503);
  const supplied = c.req.header(POST_PASSWORD_HEADER) ?? "";
  if (secureEquals(supplied, expected)) {
    const deviceId = (c.req.header(DEVICE_TOKEN_HEADER) ?? "").trim();
    if (deviceId) await trustDevice(c.env.DB, deviceId);
    await next();
    return;
  }
  const deviceId = (c.req.header(DEVICE_TOKEN_HEADER) ?? "").trim();
  if (deviceId && (await isTrustedDevice(c.env.DB, deviceId))) {
    await touchTrustedDevice(c.env.DB, deviceId);
    await next();
    return;
  }
  return c.json({ error: "Incorrect password" }, 401);
};

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

/**
 * Place-name suggestions for the add-place form. Read-only and unauthenticated
 * like the other GETs, but it proxies a public geocoder, so the query is capped
 * in length and an empty one is answered here rather than forwarded.
 */
api.get("/geocode", async (c) => {
  const query = (c.req.query("q") ?? "").trim();
  if (query.length === 0) return c.json([]);
  if (query.length > 120) return c.json({ error: "Search is too long" }, 400);

  try {
    return c.json(await geocodePlaces(query));
  } catch {
    return c.json({ error: "Place search is unavailable right now" }, 502);
  }
});

/**
 * Details and a wiki photo for one OSM object, looked up live. Read-only and
 * unauthenticated like the other GETs; OSM ids are public either way. Used
 * both by the place detail view (from the stored OSM link) and by the
 * add-place form (from the picked suggestion, before anything is stored).
 */
api.get("/osm-details", async (c) => {
  const osmType = c.req.query("osm_type");
  const osmId = Number(c.req.query("osm_id"));
  if ((osmType !== "N" && osmType !== "W" && osmType !== "R") || !Number.isInteger(osmId) || osmId <= 0) {
    return c.json({ error: "Bad osm_type or osm_id" }, 400);
  }

  try {
    return c.json(await fetchOsmDetails({ osmType, osmId }));
  } catch {
    return c.json({ error: "Place details are unavailable right now" }, 502);
  }
});

api.post("/places", requirePassword, zValidator("json", newPlaceSchema, (result, c) => {
  if (!result.success) return validationError(result, c);
}), async (c) => c.json(await insertPlace(c.env.DB, c.req.valid("json")), 201));

api.get("/places/:id", async (c) => {
  const place = await getPlace(c.env.DB, c.req.param("id"));
  return place ? c.json(place) : c.json({ error: "Place not found" }, 404);
});

api.post("/places/:id/reviews", requirePassword, zValidator("json", newReviewSchema, (result, c) => {
  if (!result.success) return validationError(result, c);
}), async (c) => {
  const placeId = c.req.param("id");
  if (!(await getPlace(c.env.DB, placeId))) return c.json({ error: "Place not found" }, 404);
  // An author only ever has one review per place, so a repeat post is appended
  // to theirs. 201 says a review was created, 200 that an existing one grew.
  const { review, created } = await saveReview(c.env.DB, placeId, c.req.valid("json"));
  return c.json(review, created ? 201 : 200);
});

api.patch("/places/:id/reviews/:reviewId", requirePassword, zValidator("json", newReviewSchema, (result, c) => {
  if (!result.success) return validationError(result, c);
}), async (c) => {
  const updated = await updateReview(c.env.DB, c.req.param("id"), c.req.param("reviewId"), c.req.valid("json"));
  return updated ? c.json(updated) : c.json({ error: "Review not found" }, 404);
});

api.all("*", (c) => c.json({ error: "Not found" }, 404));
