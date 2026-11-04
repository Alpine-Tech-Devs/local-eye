import { toZonedTime } from "date-fns-tz";

import { getTownBySlug } from "../geo/towns";
import { haversineMiles } from "../geo/haversine";
import type { SearchFilters } from "./filters";
import {
  EVENT_TIME_ZONE,
  matchesTimeOfDay,
  resolveDateRange,
} from "./time";
import type { Event, GeoPoint } from "./types";

const TIME_WINDOWS = {
  morning: { center: 9, halfWidth: 3 },
  afternoon: { center: 14.5, halfWidth: 2.5 },
  evening: { center: 20.5, halfWidth: 3.5 },
} as const;

export interface RankedEvent {
  event: Event;
  distanceMiles: number;
  score: number;
}

function getOriginPoint(origin: SearchFilters["origin"]): GeoPoint {
  if (typeof origin !== "string") return origin;

  const town = getTownBySlug(origin);
  if (!town) throw new Error(`Unknown event origin town: ${origin}`);
  return town;
}

function ageFitScore(event: Event, childAge: number | undefined): number {
  if (childAge === undefined) return 20;

  if (event.minAge === null && event.maxAge === null) return 18;
  if (event.minAge === null || event.maxAge === null) return 24;

  const ageRange = event.maxAge - event.minAge;
  if (ageRange <= 3) return 30;
  if (ageRange <= 6) return 27;
  return 24;
}

function timeFitScore(
  startDateTime: string,
  timeOfDay: SearchFilters["timeOfDay"],
): number {
  if (timeOfDay === "anytime") return 10;

  const { center, halfWidth } = TIME_WINDOWS[timeOfDay];
  const localStart = toZonedTime(new Date(startDateTime), EVENT_TIME_ZONE);
  const hour = localStart.getHours() + localStart.getMinutes() / 60;
  return 20 * Math.max(0, 1 - Math.abs(hour - center) / halfWidth);
}

function freshnessScore(lastVerifiedAt: string | null, now: Date): number {
  if (lastVerifiedAt === null) return 0;

  const ageInDays = Math.max(
    0,
    (now.getTime() - Date.parse(lastVerifiedAt)) / (24 * 60 * 60 * 1000),
  );
  return Math.max(0, 10 * (1 - ageInDays / 180));
}

export function getRelaxedSearchFilters(filters: SearchFilters): SearchFilters {
  return {
    ...filters,
    maxDistanceMiles: Math.min(filters.maxDistanceMiles * 1.5, 500),
    timeOfDay: "anytime",
  };
}

export function matchesEventFilters(
  event: Event,
  filters: SearchFilters,
  now = new Date(),
): boolean {
  const start = Date.parse(event.startDateTime);
  const dateRange = resolveDateRange(filters.date, now);
  const effectiveStart = Math.max(dateRange.start.getTime(), now.getTime());

  if (start < effectiveStart || start >= dateRange.end.getTime()) return false;
  if (!matchesTimeOfDay(new Date(start), filters.timeOfDay)) return false;

  if (
    filters.childAge !== undefined &&
    ((event.minAge !== null && event.minAge > filters.childAge) ||
      (event.maxAge !== null && event.maxAge < filters.childAge))
  ) {
    return false;
  }

  if (
    filters.environment !== "either" &&
    event.indoorOutdoor !== "either" &&
    event.indoorOutdoor !== filters.environment
  ) {
    return false;
  }

  if (filters.budget === "free" && !event.isFree) return false;
  if (
    filters.budget === "under10" &&
    !event.isFree &&
    (event.priceMax === null || event.priceMax > 10)
  ) {
    return false;
  }
  if (
    filters.budget === "under20" &&
    !event.isFree &&
    (event.priceMax === null || event.priceMax > 20)
  ) {
    return false;
  }

  const distance = haversineMiles(getOriginPoint(filters.origin), {
    lat: event.latitude,
    lng: event.longitude,
  });
  return distance <= filters.maxDistanceMiles;
}

export function rankEvents(
  events: Event[],
  filters: SearchFilters,
  now = new Date(),
): RankedEvent[] {
  const origin = getOriginPoint(filters.origin);

  /**
   * Weighted 100-point score: age fit (18-30), distance (linear to zero at the
   * distance cap), time-window proximity (0-20), free bonus (10), and freshness
   * (10 decaying linearly to zero over 180 days). Ties prefer earlier events.
   */
  return events
    .map((event) => {
      const distanceMiles = haversineMiles(origin, {
        lat: event.latitude,
        lng: event.longitude,
      });
      const distanceScore =
        30 * Math.max(0, 1 - distanceMiles / filters.maxDistanceMiles);
      const freeScore =
        filters.budget !== "any" && event.isFree ? 10 : 0;
      const score =
        ageFitScore(event, filters.childAge) +
        distanceScore +
        timeFitScore(event.startDateTime, filters.timeOfDay) +
        freeScore +
        freshnessScore(event.lastVerifiedAt, now);

      return { event, distanceMiles, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        Date.parse(a.event.startDateTime) - Date.parse(b.event.startDateTime) ||
        a.event.title.localeCompare(b.event.title) ||
        a.event.id.localeCompare(b.event.id),
    );
}
