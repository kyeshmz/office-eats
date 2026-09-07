import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../src/worker/index";
import { POST_PASSWORD_HEADER } from "../src/shared/types";

/** Headers for an authorised write. env.POST_PASSWORD comes from wrangler.jsonc. */
const authHeaders = { "Content-Type": "application/json", [POST_PASSWORD_HEADER]: env.POST_PASSWORD };

const placeInput = {
  name: "Test Place",
  category: "coffee",
  address: "1 Test Street",
  lng: -122.3975,
  lat: 37.7622,
  // A place is always added together with its first review.
  review: { author: "Kye", rating: 4, body: "Added with the place." },
};

async function json(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("places API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists an empty database", async () => {
    const response = await app.request("/api/places", {}, env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("creates and lists a place", async () => {
    const response = await app.request("/api/places", { method: "POST", headers: authHeaders, body: JSON.stringify(placeInput) }, env);
    expect(response.status).toBe(201);
    const place = await json(response);
    expect(place.id).toEqual(expect.any(String));
    expect(place.reviewCount).toBe(1);
    expect(place.avgRating).toBe(4);
    expect(Number.isFinite(place.distanceMeters)).toBe(true);
    expect(Number.isInteger(place.distanceMeters)).toBe(true);

    const list = await app.request("/api/places", {}, env);
    expect((await list.json() as Array<Record<string, unknown>>)).toHaveLength(1);
  });

  it("validates input and malformed JSON", async () => {
    const invalid = await app.request("/api/places", { method: "POST", headers: authHeaders, body: JSON.stringify({ ...placeInput, lat: 95 }) }, env);
    expect(invalid.status).toBe(400);
    expect(typeof (await json(invalid)).error).toBe("string");

    const malformed = await app.request("/api/places", { method: "POST", headers: authHeaders, body: "{" }, env);
    expect(malformed.status).toBe(400);
    expect(await json(malformed)).toEqual({ error: "Invalid JSON body" });
  });

  it("gets places and adds reviews", async () => {
    const created = await app.request("/api/places", { method: "POST", headers: authHeaders, body: JSON.stringify(placeInput) }, env);
    const place = await json(created);
    const id = place.id as string;
    expect((await app.request("/api/places/does-not-exist", {}, env)).status).toBe(404);

    // The place already carries its creation review by Kye, so a second author
    // is what adds a genuinely new one here.
    const review = await app.request(`/api/places/${id}/reviews`, { method: "POST", headers: authHeaders, body: JSON.stringify({ author: "Allen", rating: 5, body: "Excellent." }) }, env);
    expect(review.status).toBe(201);
    const detail = await json(await app.request(`/api/places/${id}`, {}, env));
    expect(detail.reviewCount).toBe(2);
    expect(detail.avgRating).toBe(4.5);
    expect((detail.reviews as Array<Record<string, unknown>>).some((r) => r.body === "Excellent.")).toBe(true);

    const invalidReview = await app.request(`/api/places/${id}/reviews`, { method: "POST", headers: authHeaders, body: JSON.stringify({ author: "Kye", rating: 6, body: "Bad." }) }, env);
    expect(invalidReview.status).toBe(400);
    const missingReview = await app.request("/api/places/does-not-exist/reviews", { method: "POST", headers: authHeaders, body: JSON.stringify({ author: "Kye", rating: 5, body: "Bad." }) }, env);
    expect(missingReview.status).toBe(404);
  });

  it("appends to an author's existing review instead of adding a second one", async () => {
    const created = await app.request("/api/places", { method: "POST", headers: authHeaders, body: JSON.stringify(placeInput) }, env);
    const id = (await json(created)).id as string;

    // The review written alongside the place is Kye's first one.
    const detailBefore = await json(await app.request(`/api/places/${id}`, {}, env));
    const firstReviewId = (detailBefore.reviews as Array<Record<string, unknown>>)[0].id as string;

    // 200, not 201: nothing new was created.
    const again = await app.request(`/api/places/${id}/reviews`, { method: "POST", headers: authHeaders, body: JSON.stringify({ author: "Kye", rating: 3, body: "Second visit was worse." }) }, env);
    expect(again.status).toBe(200);
    const appended = await json(again);
    expect(appended.id).toBe(firstReviewId);
    expect(appended.body).toBe("Added with the place.\n\nSecond visit was worse.");
    expect(appended.rating).toBe(3);

    const detail = await json(await app.request(`/api/places/${id}`, {}, env));
    expect(detail.reviewCount).toBe(1);

    // A different author still gets their own review.
    expect((await app.request(`/api/places/${id}/reviews`, { method: "POST", headers: authHeaders, body: JSON.stringify({ author: "Allen", rating: 4, body: "Mine." }) }, env)).status).toBe(201);
    expect((await json(await app.request(`/api/places/${id}`, {}, env))).reviewCount).toBe(2);
  });

  it("edits a review only with the password, and only under its own place", async () => {
    const created = await app.request("/api/places", { method: "POST", headers: authHeaders, body: JSON.stringify(placeInput) }, env);
    const placeId = (await json(created)).id as string;
    const posted = await app.request(`/api/places/${placeId}/reviews`, { method: "POST", headers: authHeaders, body: JSON.stringify({ author: "Jonny", rating: 2, body: "Original text." }) }, env);
    const review = await json(posted);
    const reviewId = review.id as string;

    const edit = { author: "Jonny", rating: 5, body: "Rewritten text." };

    const noPassword = await app.request(`/api/places/${placeId}/reviews/${reviewId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) }, env);
    expect(noPassword.status).toBe(401);

    const wrongPassword = await app.request(`/api/places/${placeId}/reviews/${reviewId}`, { method: "PATCH", headers: { "Content-Type": "application/json", [POST_PASSWORD_HEADER]: "nope" }, body: JSON.stringify(edit) }, env);
    expect(wrongPassword.status).toBe(401);

    // Still untouched after both refusals.
    expect(((await json(await app.request(`/api/places/${placeId}`, {}, env))).reviews as Array<{ body: string }>)[0].body).toBe("Original text.");

    const ok = await app.request(`/api/places/${placeId}/reviews/${reviewId}`, { method: "PATCH", headers: authHeaders, body: JSON.stringify(edit) }, env);
    expect(ok.status).toBe(200);
    const updated = await json(ok);
    expect(updated.body).toBe("Rewritten text.");
    expect(updated.rating).toBe(5);
    // Editing must not reorder the list, so the original timestamp survives.
    expect(updated.createdAt).toBe(review.createdAt);

    const unknown = await app.request(`/api/places/${placeId}/reviews/does-not-exist`, { method: "PATCH", headers: authHeaders, body: JSON.stringify(edit) }, env);
    expect(unknown.status).toBe(404);

    // A review cannot be edited through a place it does not belong to.
    const otherPlace = await app.request("/api/places", { method: "POST", headers: authHeaders, body: JSON.stringify({ ...placeInput, name: "Somewhere Else" }) }, env);
    const otherId = (await json(otherPlace)).id as string;
    const crossPlace = await app.request(`/api/places/${otherId}/reviews/${reviewId}`, { method: "PATCH", headers: authHeaders, body: JSON.stringify(edit) }, env);
    expect(crossPlace.status).toBe(404);
  });

  it("rejects writes without the right password", async () => {
    const countPlaces = async () => ((await (await app.request("/api/places", {}, env)).json()) as unknown[]).length;
    const before = await countPlaces();

    const noPassword = await app.request("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(placeInput) }, env);
    expect(noPassword.status).toBe(401);
    expect(await json(noPassword)).toEqual({ error: "Incorrect password" });

    const wrongPassword = await app.request("/api/places", { method: "POST", headers: { "Content-Type": "application/json", [POST_PASSWORD_HEADER]: "not-the-password" }, body: JSON.stringify(placeInput) }, env);
    expect(wrongPassword.status).toBe(401);

    // A near miss of the same length must fail too, not just any wrong length.
    const flipped = env.POST_PASSWORD.slice(0, -1) + (env.POST_PASSWORD.at(-1) === "x" ? "y" : "x");
    const nearMiss = await app.request("/api/places", { method: "POST", headers: { "Content-Type": "application/json", [POST_PASSWORD_HEADER]: flipped }, body: JSON.stringify(placeInput) }, env);
    expect(nearMiss.status).toBe(401);

    // Nothing was written by any of the rejected attempts.
    expect(await countPlaces()).toBe(before);
  });

  it("rejects reviews from an unknown author and unauthenticated reviews", async () => {
    const created = await app.request("/api/places", { method: "POST", headers: authHeaders, body: JSON.stringify(placeInput) }, env);
    const id = (await json(created)).id as string;

    const strangerReview = await app.request(`/api/places/${id}/reviews`, { method: "POST", headers: authHeaders, body: JSON.stringify({ author: "Someone Else", rating: 5, body: "Nice." }) }, env);
    expect(strangerReview.status).toBe(400);

    const noPassword = await app.request(`/api/places/${id}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ author: "Kye", rating: 5, body: "Nice." }) }, env);
    expect(noPassword.status).toBe(401);

    // Allen and Jonny are new here; Kye already reviewed when the place was
    // added, so that post appends to the existing review instead.
    for (const [author, expected] of [["Allen", 201], ["Jonny", 201], ["Kye", 200]] as const) {
      const ok = await app.request(`/api/places/${id}/reviews`, { method: "POST", headers: authHeaders, body: JSON.stringify({ author, rating: 4, body: `Review by ${author}.` }) }, env);
      expect(ok.status).toBe(expected);
    }
    expect((await json(await app.request(`/api/places/${id}`, {}, env))).reviewCount).toBe(3);
  });

  it("suggests places for a search and keeps the nearest first", async () => {
    // Two features deliberately out of distance order, plus one with no name
    // (a bare street segment) that has nothing to put in the Name field.
    const photon = {
      features: [
        { properties: { name: "Far Cafe", housenumber: "1", street: "Market Street", city: "San Francisco", state: "CA", osm_id: 2, osm_type: "N" }, geometry: { coordinates: [-122.4194, 37.7749] } },
        { properties: { name: "Near Bar", housenumber: "1600", street: "17th Street", city: "San Francisco", state: "CA", osm_id: 1, osm_type: "N" }, geometry: { coordinates: [-122.4011, 37.765] } },
        { properties: { street: "Nameless Way", city: "San Francisco" }, geometry: { coordinates: [-122.402, 37.767] } },
      ],
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(photon));

    const response = await app.request("/api/geocode?q=cafe", {}, env);
    expect(response.status).toBe(200);
    const results = await response.json() as Array<{ name: string; address: string; distanceMeters: number }>;

    expect(results.map((r) => r.name)).toEqual(["Near Bar", "Far Cafe"]);
    expect(results[0].address).toBe("1600 17th Street, San Francisco, CA");
    expect(results[0].distanceMeters).toBeLessThan(results[1].distanceMeters);

    // The search is confined to the bay, not the whole planet.
    const requested = new URL(fetchSpy.mock.calls[0][0] as URL);
    expect(requested.searchParams.get("bbox")).toBe("-122.65,37.57,-122.15,37.97");
    expect(requested.searchParams.get("q")).toBe("cafe");
  });

  it("infers a place category from the geocoder tags", async () => {
    const photon = {
      features: [
        { properties: { name: "Noodle Joint", osm_key: "amenity", osm_value: "restaurant", osm_id: 11, osm_type: "N" }, geometry: { coordinates: [-122.4011, 37.765] } },
        { properties: { name: "Bean Room", osm_key: "amenity", osm_value: "cafe", osm_id: 12, osm_type: "N" }, geometry: { coordinates: [-122.402, 37.766] } },
        { properties: { name: "Mystery Spot", osm_id: 13, osm_type: "N" }, geometry: { coordinates: [-122.403, 37.767] } },
      ],
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(photon));

    const results = await (await app.request("/api/geocode?q=food", {}, env)).json() as Array<{ name: string; category?: string }>;
    const byName = new Map(results.map((r) => [r.name, r]));
    expect(byName.get("Noodle Joint")?.category).toBe("food");
    expect(byName.get("Bean Room")?.category).toBe("coffee");
    expect(byName.get("Mystery Spot")).not.toHaveProperty("category");
  });

  it("looks up OSM tags and a wiki photo for a place", async () => {
    const osm = { elements: [{ type: "node", id: 11, tags: { name: "Noodle Joint", opening_hours: "Mo-Su 11:00-22:00", website: "https://noodle.example", cuisine: "noodle;ramen", wikipedia: "en:Noodle Joint" } }] };
    const wiki = { query: { pages: { "123": { pageid: 123, title: "Noodle Joint", thumbnail: { source: "https://upload.wikimedia.org/noodle.jpg", width: 800, height: 600 } } } } };
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(osm))
      .mockResolvedValueOnce(Response.json(wiki));

    const response = await app.request("/api/osm-details?osm_type=N&osm_id=11", {}, env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      hours: "Mo-Su 11:00-22:00",
      website: "https://noodle.example",
      cuisine: "noodle, ramen",
      photoUrl: "https://upload.wikimedia.org/noodle.jpg",
    });
    expect(new URL(fetchSpy.mock.calls[0][0] as string).pathname).toContain("/node/11.json");
  });

  it("rejects bad OSM refs and degrades when OSM is down", async () => {
    expect((await app.request("/api/osm-details?osm_type=X&osm_id=11", {}, env)).status).toBe(400);
    expect((await app.request("/api/osm-details?osm_type=N&osm_id=0", {}, env)).status).toBe(400);

    // Tags without a wiki link still return details, just no photo.
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ elements: [{ tags: { phone: "+1 415-555-0100" } }] }));
    expect(await (await app.request("/api/osm-details?osm_type=W&osm_id=22", {}, env)).json()).toEqual({ phone: "+1 415-555-0100" });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("down", { status: 503 }));
    const failed = await app.request("/api/osm-details?osm_type=N&osm_id=11", {}, env);
    expect(failed.status).toBe(502);
    expect(await json(failed)).toEqual({ error: "Place details are unavailable right now" });
  });

  it("collapses one place returned under several tags into a single suggestion", async () => {
    // Photon emits a feature per matching tag, so a brewpub arrives twice with
    // the same OSM id and point. The form must offer it once.
    const sameNodeTwice = {
      features: [
        { properties: { name: "Southern Pacific Brewing", housenumber: "620", street: "Treat Avenue", city: "San Francisco", state: "CA", osm_id: 1805750179, osm_type: "N" }, geometry: { coordinates: [-122.4139896, 37.7601311] } },
        { properties: { name: "Southern Pacific Brewing", housenumber: "620", street: "Treat Avenue", city: "San Francisco", state: "CA", osm_id: 1805750179, osm_type: "N" }, geometry: { coordinates: [-122.4139896, 37.7601311] } },
      ],
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(sameNodeTwice));

    const results = await (await app.request("/api/geocode?q=southern+pacific", {}, env)).json() as Array<{ id: string }>;
    expect(results).toHaveLength(1);
    expect(new Set(results.map((r) => r.id)).size).toBe(results.length);
  });

  it("handles an empty search and a failing geocoder", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // Nothing typed yet, so there is nothing to forward.
    const empty = await app.request("/api/geocode?q=%20", {}, env);
    expect(empty.status).toBe(200);
    expect(await empty.json()).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();

    // A single character is a real search and does reach the geocoder.
    fetchSpy.mockResolvedValue(Response.json({ features: [] }));
    expect((await app.request("/api/geocode?q=p", {}, env)).status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(new URL(fetchSpy.mock.calls[0][0] as URL).searchParams.get("q")).toBe("p");

    fetchSpy.mockResolvedValue(new Response("upstream is down", { status: 503 }));
    const failed = await app.request("/api/geocode?q=cafe", {}, env);
    expect(failed.status).toBe(502);
    expect(await json(failed)).toEqual({ error: "Place search is unavailable right now" });
  });

  it("orders places by distance and handles unknown API paths", async () => {
    for (const input of [
      { ...placeInput, name: "Rainbow Grocery", lng: -122.4155, lat: 37.769 },
      { ...placeInput, name: "Farley's", lng: -122.3975, lat: 37.7622 },
    ]) {
      await app.request("/api/places", { method: "POST", headers: authHeaders, body: JSON.stringify(input) }, env);
    }
    const places = await (await app.request("/api/places", {}, env)).json() as Array<{ name: string }>;
    expect(places[0].name).toBe("Farley's");
    const response = await app.request("/api/nope", {}, env);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });
});
