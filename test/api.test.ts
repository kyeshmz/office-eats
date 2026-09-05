import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import app from "../src/worker/index";

const placeInput = {
  name: "Test Place",
  category: "coffee",
  address: "1 Test Street",
  lng: -122.3975,
  lat: 37.7622,
  description: "A test place",
};

async function json(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("places API", () => {
  it("lists an empty database", async () => {
    const response = await app.request("/api/places", {}, env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("creates and lists a place", async () => {
    const response = await app.request("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(placeInput) }, env);
    expect(response.status).toBe(201);
    const place = await json(response);
    expect(place.id).toEqual(expect.any(String));
    expect(place.reviewCount).toBe(0);
    expect(place.avgRating).toBeNull();
    expect(Number.isFinite(place.distanceMeters)).toBe(true);
    expect(Number.isInteger(place.distanceMeters)).toBe(true);

    const list = await app.request("/api/places", {}, env);
    expect((await list.json() as Array<Record<string, unknown>>)).toHaveLength(1);
  });

  it("validates input and malformed JSON", async () => {
    const invalid = await app.request("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...placeInput, lat: 95 }) }, env);
    expect(invalid.status).toBe(400);
    expect(typeof (await json(invalid)).error).toBe("string");

    const malformed = await app.request("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }, env);
    expect(malformed.status).toBe(400);
    expect(await json(malformed)).toEqual({ error: "Invalid JSON body" });
  });

  it("gets places and adds reviews", async () => {
    const created = await app.request("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(placeInput) }, env);
    const place = await json(created);
    const id = place.id as string;
    expect((await app.request("/api/places/does-not-exist", {}, env)).status).toBe(404);

    const review = await app.request(`/api/places/${id}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ author: "A Reviewer", rating: 5, body: "Excellent." }) }, env);
    expect(review.status).toBe(201);
    const detail = await json(await app.request(`/api/places/${id}`, {}, env));
    expect(detail.reviewCount).toBe(1);
    expect(detail.avgRating).toBe(5);
    expect((detail.reviews as Array<Record<string, unknown>>)[0].body).toBe("Excellent.");

    const invalidReview = await app.request(`/api/places/${id}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ author: "A Reviewer", rating: 6, body: "Bad." }) }, env);
    expect(invalidReview.status).toBe(400);
    const missingReview = await app.request("/api/places/does-not-exist/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ author: "A Reviewer", rating: 5, body: "Bad." }) }, env);
    expect(missingReview.status).toBe(404);
  });

  it("orders places by distance and handles unknown API paths", async () => {
    for (const input of [
      { ...placeInput, name: "Rainbow Grocery", lng: -122.4155, lat: 37.769 },
      { ...placeInput, name: "Farley's", lng: -122.3975, lat: 37.7622 },
    ]) {
      await app.request("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }, env);
    }
    const places = await (await app.request("/api/places", {}, env)).json() as Array<{ name: string }>;
    expect(places[0].name).toBe("Farley's");
    const response = await app.request("/api/nope", {}, env);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });
});
