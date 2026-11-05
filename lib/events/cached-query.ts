import { cacheLife } from "next/cache";

import type { SearchFilters } from "./filters";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { Database } from "@/lib/supabase/database.types";

function getCoarseFilterAlternatives(filters: SearchFilters): string[][] {
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

export async function getCachedEventRows(
  filters: SearchFilters,
  startDateTime: string,
  endDateTime: string,
): Promise<Database["public"]["Tables"]["events"]["Row"][]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  const supabase = createSupabasePublicClient();
  let query = supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("start_datetime", startDateTime)
    .lt("start_datetime", endDateTime);

  const coarseFilterGroups = getCoarseFilterAlternatives(filters);
  if (coarseFilterGroups.length > 0) {
    query = query.or(combineAlternatives(coarseFilterGroups));
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("Unable to load public event rows from Supabase.", {
      cause: error,
    });
  }
  return data;
}
