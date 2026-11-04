import { describe, expect, it } from "vitest";

import {
  DEFAULT_SEARCH_FILTERS,
  type SearchFilters,
} from "./filters";
import {
  getRelaxedSearchFilters,
  matchesEventFilters,
  rankEvents,
} from "./rank";
import type { Event } from "./types";

const NOW = new Date("2026-11-03T15:00:00.000Z");
const TODAY_EVENT_TIME = "2026-11-03T10:30:00-05:00";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    title: "Storytime",
    description: null,
    venueName: "Library",
    address: null,
    city: "Portsmouth",
    state: "NH",
    latitude: 43.0718,
    longitude: -70.7626,
    startDateTime: TODAY_EVENT_TIME,
    endDateTime: null,
    minAge: null,
    maxAge: null,
    priceMin: null,
    priceMax: null,
    isFree: true,
    indoorOutdoor: "indoor",
    category: "Storytime",
    registrationRequired: false,
    registrationUrl: null,
    imageUrl: null,
    sourceName: "Library",
    sourceUrl: "https://example.com/events",
    lastVerifiedAt: "2026-11-03T14:00:00.000Z",
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeFilters(overrides: Partial<SearchFilters> = {}): SearchFilters {
  return {
    ...DEFAULT_SEARCH_FILTERS,
    date: { preset: "today" },
    timeOfDay: "morning",
    ...overrides,
  };
}

describe("matchesEventFilters", () => {
  it("matches the selected local date, time, age, environment, budget, and distance", () => {
    const filters = makeFilters({
      childAge: 3,
      environment: "indoor",
      budget: "under10",
      maxDistanceMiles: 5,
    });

    expect(matchesEventFilters(makeEvent({ minAge: 2, maxAge: 4 }), filters, NOW))
      .toBe(true);
    expect(matchesEventFilters(makeEvent({ minAge: 4, maxAge: 5 }), filters, NOW))
      .toBe(false);
    expect(
      matchesEventFilters(
        makeEvent({ indoorOutdoor: "outdoor" }),
        filters,
        NOW,
      ),
    ).toBe(false);
  });

  it("treats unknown age bounds and either environment as inclusive", () => {
    const filters = makeFilters({ childAge: 2, environment: "outdoor" });
    expect(
      matchesEventFilters(
        makeEvent({ minAge: null, maxAge: null, indoorOutdoor: "either" }),
        filters,
        NOW,
      ),
    ).toBe(true);
  });

  it("excludes events that have already started or exceed the selected budget", () => {
    const filters = makeFilters({ budget: "under10" });
    expect(
      matchesEventFilters(
        makeEvent({ startDateTime: "2026-11-03T09:00:00-05:00" }),
        filters,
        NOW,
      ),
    ).toBe(false);
    expect(
      matchesEventFilters(
        makeEvent({ isFree: false, priceMax: 15 }),
        filters,
        NOW,
      ),
    ).toBe(false);
  });
});

describe("rankEvents", () => {
  it("ranks relevant age, distance, time, free, and fresh events above weaker matches", () => {
    const filters = makeFilters({
      childAge: 3,
      budget: "under10",
      maxDistanceMiles: 25,
    });
    const closeAndFresh = makeEvent({
      minAge: 2,
      maxAge: 4,
      lastVerifiedAt: "2026-11-03T14:00:00.000Z",
    });
    const fartherAndStale = makeEvent({
      id: "00000000-0000-4000-8000-000000000002",
      latitude: 43.2,
      longitude: -70.9,
      minAge: 0,
      maxAge: 12,
      isFree: false,
      priceMax: 8,
      lastVerifiedAt: "2026-03-01T00:00:00.000Z",
    });

    expect(rankEvents([fartherAndStale, closeAndFresh], filters, NOW)[0].event)
      .toEqual(closeAndFresh);
  });

  it("uses start time and stable text keys as deterministic tie-breakers", () => {
    const filters = makeFilters({ timeOfDay: "anytime" });
    const later = makeEvent({
      id: "00000000-0000-4000-8000-000000000002",
      startDateTime: "2026-11-03T11:00:00-05:00",
    });
    const earlier = makeEvent({
      id: "00000000-0000-4000-8000-000000000003",
      startDateTime: "2026-11-03T10:45:00-05:00",
    });

    expect(rankEvents([later, earlier], filters, NOW).map(({ event }) => event.id))
      .toEqual([earlier.id, later.id]);
  });

  it("prefers events near the center of the selected time window", () => {
    const filters = makeFilters();
    const centered = makeEvent({
      startDateTime: "2026-11-03T09:00:00-05:00",
    });
    const nearWindowEnd = makeEvent({
      id: "00000000-0000-4000-8000-000000000002",
      startDateTime: "2026-11-03T11:30:00-05:00",
    });

    expect(
      rankEvents(
        [nearWindowEnd, centered],
        filters,
        new Date("2026-11-03T13:00:00.000Z"),
      )[0].event,
    ).toEqual(centered);
  });
});

describe("getRelaxedSearchFilters", () => {
  it("widens distance by 50 percent and drops the time-of-day constraint", () => {
    expect(
      getRelaxedSearchFilters(makeFilters({ maxDistanceMiles: 20 })),
    ).toMatchObject({ maxDistanceMiles: 30, timeOfDay: "anytime" });
  });

  it("does not exceed the supported distance maximum", () => {
    expect(
      getRelaxedSearchFilters(makeFilters({ maxDistanceMiles: 500 }))
        .maxDistanceMiles,
    ).toBe(500);
  });
});
