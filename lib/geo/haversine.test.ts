import { describe, expect, it } from "vitest";

import { haversineMiles } from "./haversine";

describe("haversineMiles", () => {
  it("returns zero for the same point", () => {
    expect(haversineMiles({ lat: 43.0718, lng: -70.7626 }, { lat: 43.0718, lng: -70.7626 })).toBe(0);
  });

  it("returns the approximate distance between Portsmouth and Dover", () => {
    expect(haversineMiles({ lat: 43.0718, lng: -70.7626 }, { lat: 43.1979, lng: -70.8737 })).toBeCloseTo(
      10.1,
      0,
    );
  });

  it("handles points on opposite sides of the antimeridian", () => {
    expect(haversineMiles({ lat: 0, lng: 179.9 }, { lat: 0, lng: -179.9 })).toBeCloseTo(
      13.8,
      0,
    );
  });
});
