import { cacheLife } from "next/cache";

import { createSupabasePublicClient } from "@/lib/supabase/public";

export async function getCachedPublishedEventMetadata() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(50_000);

  if (error) {
    throw new Error("Unable to load events for the sitemap.", { cause: error });
  }
  return data;
}
