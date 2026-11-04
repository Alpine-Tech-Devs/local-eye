import { z } from "zod";

import { mapRowToEvent } from "@/lib/supabase/map-row-to-event";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPublishedEvent(id: string) {
  if (!z.uuid().safeParse(id).success) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load event details from Supabase.", {
      cause: error,
    });
  }

  return data ? mapRowToEvent(data) : null;
}
