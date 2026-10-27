import { describe, expect, it } from "vitest";

import {
  DEFAULT_SEARCH_FILTERS,
  filtersToSearchParams,
  parseFiltersFromSearchParams,
} from "./filters";

describe("SearchFilters URL serialization", () => {
  it("applies defaults when no filters are provided", () => {
    expect(parseFiltersFromSearchParams(new URLSearchParams())).toEqual(
      DEFAULT_SEARCH_FILTERS,
    );
  });

  it("round-trips custom dates, child age, and coordinate origins", () => {
    const filters = {
      childAge: 2,
      date: { preset: "custom", date: "2026-10-28" },
      timeOfDay: "morning",
      maxDistanceMiles: 15,
      budget: "under20",
      environment: "indoor",
      origin: { lat: 43.0718, lng: -70.7626 },
    } as const;

    expect(
      parseFiltersFromSearchParams(filtersToSearchParams(filters)),
    ).toEqual(filters);
  });

  it("accepts town slugs and the framework searchParams object shape", () => {
    expect(
      parseFiltersFromSearchParams({
        date: "weekend",
        origin: "dover",
        childAge: "4",
      }),
    ).toEqual({
      ...DEFAULT_SEARCH_FILTERS,
      childAge: 4,
      date: { preset: "weekend" },
      origin: "dover",
    });
  });

  it("falls back to defaults for invalid input", () => {
    expect(
      parseFiltersFromSearchParams(
        new URLSearchParams("date=custom&customDate=not-a-date&origin=unknown"),
      ),
    ).toEqual(DEFAULT_SEARCH_FILTERS);
  });
});
