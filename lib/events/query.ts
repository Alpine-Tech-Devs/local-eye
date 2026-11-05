import type { SearchFilters } from "./filters";
import { SearchFiltersSchema } from "./filters";
import { getCachedEventRows } from "./cached-query";
import {
  getRelaxedSearchFilters,
  matchesEventFilters,
  rankEvents,
  type RankedEvent,
} from "./rank";
import { resolveDateRange } from "./time";
import type { Event } from "./types";
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

  const rows = await getCachedEventRows(
    filters,
    dateRange.start.toISOString(),
    dateRange.end.toISOString(),
  );
  const events: Event[] = rows.map(mapRowToEvent);
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
          !exactIds.has(event.id) && matchesEventFilters(event, relaxed, now),
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
