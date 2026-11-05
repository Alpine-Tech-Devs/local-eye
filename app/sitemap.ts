import type { MetadataRoute } from "next";

import { getCachedPublishedEventMetadata } from "@/lib/events/sitemap";
import { getSiteUrl } from "@/lib/seo/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const events = await getCachedPublishedEventMetadata();

  return [
    {
      url: siteUrl.toString(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...events.map((event) => ({
      url: new URL(`/events/${event.id}`, siteUrl).toString(),
      lastModified: event.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
