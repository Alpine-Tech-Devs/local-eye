import type { SearchFilters } from "./filters";
import { SearchFiltersSchema } from "./filters";
import {
  getRelaxedSearchFilters,
  matchesEventFilters,
  rankEvents,
  type RankedEvent,
} from "./rank";
import { resolveDateRange } from "./time";
import type { Event } from "./types";
import { createSupabaseServerClient } from "../supabase/server";
import { mapRowToEvent } from "../supabase/map-row-to-event";

const DEFAULT_RESULT_LIMIT = 8;
const RELAXED_RESULTS_THRESHOLD = 3;

export interface SearchEventsOptions {
  now?: Date;
  limit?: number;
}

export interface SearchEventsResult {
  results: RankedEvent[];
  initialResults: RankedEvent[];
  totalResults: number;
  hasMore: boolean;
  relaxedSuggestions: RankedEvent[];
  relaxedFilters: SearchFilters | null;
  totalRelaxedSuggestions: number;
}

function validateLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Search result limit must be a positive integer.");
  }
  return limit;
}

function getCoarseFilterAlternatives(
  filters: SearchFilters,
): string[][] {
  const groups: string[][] = [];
  if (filters.childAge !== undefined) {
    const age = filters.childAge;
    groups.push([
      "min_age.is.null,max_age.is.null",
      `min_age.is.null,max_age.gte.${age}`,
      `min_age.lte.${age},max_age.is.null`,
      `min_age.lte.${age},max_age.gte.${age}`,
    ]);
  }

  if (filters.environment === "indoor" || filters.environment === "outdoor") {
    groups.push([
      `indoor_outdoor.eq.${filters.environment}`,
      "indoor_outdoor.eq.either",
    ]);
  }

  switch (filters.budget) {
    case "free":
      groups.push(["is_free.eq.true"]);
      break;
    case "under10":
      groups.push(["is_free.eq.true", "price_max.lte.10"]);
      break;
    case "under20":
      groups.push(["is_free.eq.true", "price_max.lte.20"]);
      break;
  }

  return groups;
}

function combineAlternatives(groups: string[][]): string {
  let combinations = [""];
  for (const alternatives of groups) {
    combinations = combinations.flatMap((combination) =>
      alternatives.map((alternative) =>
        [combination, alternative].filter(Boolean).join(","),
      ),
    );
  }

  return combinations.map((combination) => `and(${combination})`).join(",");
}

function getEffectiveDateStart(filters: SearchFilters, now: Date): Date {
  const { start } = resolveDateRange(filters.date, now);
  return new Date(Math.max(start.getTime(), now.getTime()));
}

export async function searchEvents(
  inputFilters: SearchFilters,
  options: SearchEventsOptions = {},
): Promise<SearchEventsResult> {
  const filters = SearchFiltersSchema.parse(inputFilters);
  const now = options.now ?? new Date();
  const limit = validateLimit(options.limit ?? DEFAULT_RESULT_LIMIT);
  const dateRange = resolveDateRange(filters.date, now);

  if (getEffectiveDateStart(filters, now) >= dateRange.end) {
    return {
      results: [],
      initialResults: [],
      totalResults: 0,
      hasMore: false,
      relaxedSuggestions: [],
      relaxedFilters: null,
      totalRelaxedSuggestions: 0,
    };
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("start_datetime", getEffectiveDateStart(filters, now).toISOString())
    .lt("start_datetime", dateRange.end.toISOString());

  const coarseFilterGroups = getCoarseFilterAlternatives(filters);
  if (coarseFilterGroups.length > 0) {
    query = query.or(combineAlternatives(coarseFilterGroups));
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("Unable to search Supabase events.", { cause: error });
  }

  const events: Event[] = data.map(mapRowToEvent);
  const matchingEvents = events.filter((event) =>
    matchesEventFilters(event, filters, now),
  );
  const results = rankEvents(matchingEvents, filters, now);
  const shouldSuggestRelaxed = results.length < RELAXED_RESULTS_THRESHOLD;

  let relaxedSuggestions: RankedEvent[] = [];
  let relaxedFilters: SearchFilters | null = null;
  if (shouldSuggestRelaxed) {
    const relaxed = getRelaxedSearchFilters(filters);
    relaxedFilters = relaxed;
    const exactIds = new Set(results.map(({ event }) => event.id));
    relaxedSuggestions = rankEvents(
      events.filter(
        (event) =>
          !exactIds.has(event.id) &&
          matchesEventFilters(event, relaxed, now),
      ),
      relaxed,
      now,
    );
  }

  return {
    results,
    initialResults: results.slice(0, limit),
    totalResults: results.length,
    hasMore: results.length > limit,
    relaxedSuggestions,
    relaxedFilters,
    totalRelaxedSuggestions: relaxedSuggestions.length,
  };
}
