import { describe, expect, it } from "vitest";

import {
  DEFAULT_SEARCH_FILTERS,
  filtersToSearchParams,
  parseFiltersFromSearchParams,
  SearchFiltersSchema,
  type SearchFilters,
} from "./filters";

describe("SearchFilters URL serialization", () => {
  it("applies defaults when no filters are provided", () => {
    expect(parseFiltersFromSearchParams(new URLSearchParams())).toEqual(
      DEFAULT_SEARCH_FILTERS,
    );
  });

  it("round-trips custom dates, multiple child ages, and coordinate origins", () => {
    const filters = {
      childAges: [2, 6],
      date: { preset: "custom", date: "2026-10-28" },
      timeOfDay: "morning",
      maxDistanceMiles: 15,
      budget: "under20",
      environment: "indoor",
      origin: { lat: 43.0718, lng: -70.7626 },
    } satisfies SearchFilters;

    expect(
      parseFiltersFromSearchParams(filtersToSearchParams(filters)),
    ).toEqual(filters);
  });

  it("accepts multiple ages and the framework searchParams object shape", () => {
    expect(
      parseFiltersFromSearchParams({
        date: "weekend",
        origin: "dover",
        childAges: ["2", "6"],
      }),
    ).toEqual({
      ...DEFAULT_SEARCH_FILTERS,
      childAges: [2, 6],
      date: { preset: "weekend" },
      origin: "dover",
    });
  });

  it("continues to parse legacy single-age URLs and saved filters", () => {
    expect(
      parseFiltersFromSearchParams({
        childAge: "4",
      }),
    ).toEqual({ ...DEFAULT_SEARCH_FILTERS, childAges: [4] });
    expect(
      SearchFiltersSchema.parse({
        date: { preset: "today" },
        timeOfDay: "anytime",
        maxDistanceMiles: 25,
        budget: "any",
        environment: "either",
        origin: "portsmouth",
        childAge: 3,
      }),
    ).toEqual({ ...DEFAULT_SEARCH_FILTERS, childAges: [3] });
  });

  it("falls back to defaults for invalid input", () => {
    expect(
      parseFiltersFromSearchParams(
        new URLSearchParams("date=custom&customDate=not-a-date&origin=unknown"),
      ),
    ).toEqual(DEFAULT_SEARCH_FILTERS);
  });
});
