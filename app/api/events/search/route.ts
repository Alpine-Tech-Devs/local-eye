import { NextResponse } from "next/server";
import { z } from "zod";

import { parseFiltersFromSearchParams } from "@/lib/events/filters";
import { searchEvents } from "@/lib/events/query";
import { EVENT_SEARCH_PAGE_SIZE } from "@/lib/events/search-page";

const asOfSchema = z.iso.datetime({ offset: true });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawOffset = url.searchParams.get("offset");
  const offset = rawOffset === null ? Number.NaN : Number(rawOffset);
  const asOf = asOfSchema.safeParse(url.searchParams.get("asOf"));

  if (!Number.isSafeInteger(offset) || offset < 0) {
    return NextResponse.json(
      { error: "A non-negative result offset is required." },
      { status: 400 },
    );
  }
  if (!asOf.success) {
    return NextResponse.json(
      { error: "A valid search timestamp is required." },
      { status: 400 },
    );
  }

  const search = await searchEvents(
    parseFiltersFromSearchParams(url.searchParams),
    {
      now: new Date(asOf.data),
      limit: EVENT_SEARCH_PAGE_SIZE,
      offset,
    },
  );

  return NextResponse.json({
    results: search.initialResults,
    totalResults: search.totalResults,
    hasMore: search.hasMore,
  });
}
