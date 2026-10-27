import { describe, expect, it } from "vitest";

import { EventSchema } from "./schema";

const validEvent = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Library storytime",
  description: null,
  venueName: "Portsmouth Public Library",
  address: "175 Parrott Ave",
  city: "Portsmouth",
  state: "NH",
  latitude: 43.0718,
  longitude: -70.7626,
  startDateTime: "2026-10-27T10:00:00-04:00",
  endDateTime: "2026-10-27T11:00:00-04:00",
  minAge: 0,
  maxAge: 5,
  priceMin: 0,
  priceMax: 0,
  isFree: true,
  indoorOutdoor: "indoor",
  category: "Storytime",
  registrationRequired: false,
  registrationUrl: null,
  imageUrl: null,
  sourceName: "Portsmouth Public Library",
  sourceUrl: "https://example.com/events",
  lastVerifiedAt: null,
  createdAt: "2026-10-01T12:00:00Z",
  updatedAt: "2026-10-01T12:00:00Z",
};

describe("EventSchema", () => {
  it("accepts a complete event using the shared domain shape", () => {
    expect(EventSchema.safeParse(validEvent).success).toBe(true);
  });

  it("rejects invalid categories, coordinates, and reversed age ranges", () => {
    expect(
      EventSchema.safeParse({
        ...validEvent,
        category: "Unknown",
        latitude: 91,
        minAge: 6,
        maxAge: 2,
      }).success,
    ).toBe(false);
  });

  it("rejects an end time before the start time", () => {
    expect(
      EventSchema.safeParse({
        ...validEvent,
        endDateTime: "2026-10-27T09:00:00-04:00",
      }).success,
    ).toBe(false);
  });
});
