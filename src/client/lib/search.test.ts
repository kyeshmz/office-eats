import { describe, expect, it } from "vitest";
import { filterPlaces } from "./search";
import type { Place } from "../../shared/types";

const places: Place[] = [
  {
    id: "coffee",
    name: "Blue Bottle",
    category: "coffee",
    address: "1 Market Street",
    lng: -122.4,
    lat: 37.7,
    description: "Bright espresso bar",
    createdAt: "2026-01-01T00:00:00.000Z",
    distanceMeters: 350,
    reviewCount: 3,
    avgRating: 4.5,
  },
  {
    id: "park",
    name: "Mission Playground",
    category: "park",
    address: "2 Valencia Street",
    lng: -122.41,
    lat: 37.76,
    description: null,
    createdAt: "2026-01-02T00:00:00.000Z",
    distanceMeters: 1200,
    reviewCount: 0,
    avgRating: null,
  },
];

describe("filterPlaces", () => {
  it("returns all places in order for empty and whitespace queries", () => {
    expect(filterPlaces(places, "")).toBe(places);
    expect(filterPlaces(places, "  ")).toBe(places);
  });

  it("matches name case-insensitively", () => {
    expect(filterPlaces(places, "BLUE").map((place) => place.id)).toEqual(["coffee"]);
  });

  it("matches address, category, and description", () => {
    expect(filterPlaces(places, "market").map((place) => place.id)).toEqual(["coffee"]);
    expect(filterPlaces(places, "PARK").map((place) => place.id)).toEqual(["park"]);
    expect(filterPlaces(places, "espresso").map((place) => place.id)).toEqual(["coffee"]);
  });

  it("requires every token and handles missing descriptions", () => {
    expect(filterPlaces(places, "blue espresso").map((place) => place.id)).toEqual(["coffee"]);
    expect(filterPlaces(places, "blue park")).toEqual([]);
    expect(filterPlaces(places, "mission").map((place) => place.id)).toEqual(["park"]);
  });
});
