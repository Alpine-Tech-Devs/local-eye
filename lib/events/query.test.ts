import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "../supabase/database.types";
import { createSupabaseServerClient } from "../supabase/server";
import { searchEvents } from "./query";
import type { SearchFilters } from "./filters";

vi.mock("../supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const NOW = new Date("2026-11-03T15:00:00.000Z");
const EVENT_ROW: Database["public"]["Tables"]["events"]["Row"] = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Storytime",
  description: "Stories and songs.",
  venue_name: "Portsmouth Library",
  address: "1 Library Way",
  city: "Portsmouth",
  state: "NH",
  latitude: 43.0718,
  longitude: -70.7626,
  start_datetime: "2026-11-03T10:30:00-05:00",
  end_datetime: "2026-11-03T11:00:00-05:00",
  min_age: 2,
  max_age: 5,
  price_min: 0,
  price_max: 0,
  is_free: true,
  indoor_outdoor: "indoor",
  category: "Storytime",
  registration_required: false,
  registration_url: null,
  image_url: null,
  source_name: "Portsmouth Library",
  source_url: "https://example.com/events",
  last_verified_at: "2026-11-03T14:00:00.000Z",
  source_id: null,
  external_id: null,
  status: "published",
  created_at: "2026-11-01T00:00:00.000Z",
  updated_at: "2026-11-01T00:00:00.000Z",
};

function makeFilters(overrides: Partial<SearchFilters> = {}): SearchFilters {
  return {
    childAge: 3,
    date: { preset: "today" },
    timeOfDay: "morning",
    maxDistanceMiles: 25,
    budget: "under20",
    environment: "indoor",
    origin: "portsmouth",
    ...overrides,
  };
}

function mockSupabaseRows(rows: Database["public"]["Tables"]["events"]["Row"][]) {
  const requestedUrls: URL[] = [];
  const fetchMock: typeof fetch = async (input) => {
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    requestedUrls.push(new URL(requestUrl));

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}`,
      },
    });
  };

  vi.mocked(createSupabaseServerClient).mockResolvedValue(
    createClient<Database>("https://example.supabase.co", "test-key", {
      global: { fetch: fetchMock },
    }),
  );

  return requestedUrls;
}

describe("searchEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pushes coarse filters to Supabase and returns a show-more result shape", async () => {
    const rows = Array.from({ length: 9 }, (_, index) => ({
      ...EVENT_ROW,
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      title: `Storytime ${index + 1}`,
    }));
    const requestedUrls = mockSupabaseRows(rows);

    const result = await searchEvents(makeFilters(), { now: NOW });

    expect(result.totalResults).toBe(9);
    expect(result.results).toHaveLength(9);
    expect(result.initialResults).toHaveLength(8);
    expect(result.hasMore).toBe(true);
    expect(result.relaxedFilters).toBeNull();
    expect(requestedUrls).toHaveLength(1);
    expect(requestedUrls[0].searchParams.get("status")).toBe("eq.published");
    expect(requestedUrls[0].searchParams.get("start_datetime")).toContain("gte.");
    expect(requestedUrls[0].searchParams.get("or")).toContain("min_age");
    expect(requestedUrls[0].searchParams.get("or")).toContain("is_free");
  });

  it("supports limiting the initial suggestions to three", async () => {
    mockSupabaseRows(
      Array.from({ length: 5 }, (_, index) => ({
        ...EVENT_ROW,
        id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      })),
    );

    const result = await searchEvents(makeFilters(), {
      now: NOW,
      limit: 3,
    });

    expect(result.initialResults).toHaveLength(3);
    expect(result.totalResults).toBe(5);
    expect(result.hasMore).toBe(true);
  });

  it("returns additional nearby events as relaxed suggestions when exact results are sparse", async () => {
    const fartherEvent = {
      ...EVENT_ROW,
      id: "00000000-0000-4000-8000-000000000002",
      title: "Afternoon Storytime",
      latitude: 43.09,
      start_datetime: "2026-11-03T13:00:00-05:00",
      end_datetime: "2026-11-03T13:30:00-05:00",
    };
    mockSupabaseRows([EVENT_ROW, fartherEvent]);

    const result = await searchEvents(
      makeFilters({ maxDistanceMiles: 1 }),
      { now: NOW },
    );

    expect(result.totalResults).toBe(1);
    expect(result.initialResults.map(({ event }) => event.id)).toEqual([
      EVENT_ROW.id,
    ]);
    expect(result.relaxedFilters).toMatchObject({
      maxDistanceMiles: 1.5,
      timeOfDay: "anytime",
    });
    expect(result.relaxedSuggestions.map(({ event }) => event.id)).toEqual([
      fartherEvent.id,
    ]);
  });
});
