import { z } from "zod";

import { getTownBySlug } from "../geo/towns";
import type { GeoPoint } from "./types";

export const TIME_OF_DAY_OPTIONS = [
  "morning",
  "afternoon",
  "evening",
  "anytime",
] as const;
export type TimeOfDay = (typeof TIME_OF_DAY_OPTIONS)[number];

export const BUDGET_OPTIONS = ["free", "under10", "under20", "any"] as const;
export type Budget = (typeof BUDGET_OPTIONS)[number];

export const ENVIRONMENT_OPTIONS = ["indoor", "outdoor", "either"] as const;
export type Environment = (typeof ENVIRONMENT_OPTIONS)[number];

export type DateFilter =
  | { preset: "today" | "tomorrow" | "weekend" }
  | { preset: "custom"; date: string };

export type EventOrigin = string | GeoPoint;

export interface SearchFilters {
  childAges: number[];
  date: DateFilter;
  timeOfDay: TimeOfDay;
  maxDistanceMiles: number;
  budget: Budget;
  environment: Environment;
  origin: EventOrigin;
}

const dateFilterSchema = z.discriminatedUnion("preset", [
  z.object({ preset: z.literal("today") }),
  z.object({ preset: z.literal("tomorrow") }),
  z.object({ preset: z.literal("weekend") }),
  z.object({ preset: z.literal("custom"), date: z.iso.date() }),
]);

const eventOriginSchema = z.union([
  z.string().refine((slug) => getTownBySlug(slug) !== undefined, {
    message: "Unknown town slug",
  }),
  z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
]);

const searchFiltersObjectSchema = z.object({
  childAges: z.array(z.number().int().min(0).max(18)).default([]),
  date: dateFilterSchema,
  timeOfDay: z.enum(TIME_OF_DAY_OPTIONS),
  maxDistanceMiles: z.number().positive().max(500),
  budget: z.enum(BUDGET_OPTIONS),
  environment: z.enum(ENVIRONMENT_OPTIONS),
  origin: eventOriginSchema,
});

export const SearchFiltersSchema = z.preprocess((value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }

  const filters = value as Record<string, unknown>;
  if ("childAges" in filters || !("childAge" in filters)) return value;

  const { childAge, ...rest } = filters;
  return { ...rest, childAges: childAge === undefined ? [] : [childAge] };
}, searchFiltersObjectSchema);

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  childAges: [],
  date: { preset: "today" },
  timeOfDay: "anytime",
  maxDistanceMiles: 25,
  budget: "any",
  environment: "either",
  origin: "portsmouth",
};

type SearchParamsInput =
  URLSearchParams | Record<string, string | string[] | undefined>;

function getParam(params: SearchParamsInput, key: string): string | undefined {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? undefined;
  }

  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getParams(params: SearchParamsInput, key: string): string[] {
  if (params instanceof URLSearchParams) return params.getAll(key);

  const value = params[key];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function parseOrigin(value: string | undefined): EventOrigin | undefined {
  if (!value) return undefined;
  const coordinates = value.split(",");

  if (coordinates.length === 2) {
    const [lat, lng] = coordinates.map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return undefined;
  }

  return value;
}

export function parseFiltersFromSearchParams(
  params: SearchParamsInput,
): SearchFilters {
  const rawDate = getParam(params, "date") ?? "today";
  const date =
    rawDate === "custom"
      ? {
          preset: "custom" as const,
          date: getParam(params, "customDate") ?? "",
        }
      : { preset: rawDate };
  const rawChildAges = getParams(params, "childAges").filter(
    (age) => age !== "",
  );
  const rawLegacyChildAge = getParam(params, "childAge");
  const rawDistance = getParam(params, "maxDistanceMiles");
  const rawFilters = {
    childAges:
      rawChildAges.length > 0
        ? rawChildAges.map(Number)
        : rawLegacyChildAge === undefined
          ? []
          : [Number(rawLegacyChildAge)],
    date,
    timeOfDay: getParam(params, "timeOfDay") ?? "anytime",
    maxDistanceMiles: rawDistance === undefined ? 25 : Number(rawDistance),
    budget: getParam(params, "budget") ?? "any",
    environment: getParam(params, "environment") ?? "either",
    origin: parseOrigin(getParam(params, "origin")) ?? "portsmouth",
  };
  const result = SearchFiltersSchema.safeParse(rawFilters);

  return result.success ? result.data : { ...DEFAULT_SEARCH_FILTERS };
}

export function filtersToSearchParams(filters: SearchFilters): URLSearchParams {
  const validFilters = SearchFiltersSchema.parse(filters);
  const params = new URLSearchParams();

  for (const age of validFilters.childAges) {
    params.append("childAges", String(age));
  }

  params.set("date", validFilters.date.preset);
  if (validFilters.date.preset === "custom") {
    params.set("customDate", validFilters.date.date);
  }
  params.set("timeOfDay", validFilters.timeOfDay);
  params.set("maxDistanceMiles", String(validFilters.maxDistanceMiles));
  params.set("budget", validFilters.budget);
  params.set("environment", validFilters.environment);
  params.set(
    "origin",
    typeof validFilters.origin === "string"
      ? validFilters.origin
      : `${validFilters.origin.lat},${validFilters.origin.lng}`,
  );

  return params;
}
