import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { EventCard } from "@/components/events/EventCard";
import { SiteHeader } from "@/components/SiteHeader";
import {
  filtersToSearchParams,
  parseFiltersFromSearchParams,
} from "@/lib/events/filters";
import { searchEvents } from "@/lib/events/query";
import { EVENT_TIME_ZONE } from "@/lib/events/time";
import { getTownBySlug } from "@/lib/geo/towns";

interface ResultsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getSearchSummary(
  filters: ReturnType<typeof parseFiltersFromSearchParams>,
) {
  const age =
    filters.childAge === undefined
      ? "any age"
      : `${filters.childAge === 0 ? "under 1" : `${filters.childAge}-year-old`}`;
  let date: string;
  switch (filters.date.preset) {
    case "today":
      date = "today";
      break;
    case "tomorrow":
      date = "tomorrow";
      break;
    case "weekend":
      date = "this weekend";
      break;
    case "custom":
      date = new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        timeZone: EVENT_TIME_ZONE,
      }).format(new Date(`${filters.date.date}T12:00:00`));
      break;
  }
  const time = filters.timeOfDay === "anytime" ? "" : `, ${filters.timeOfDay}`;
  const town =
    typeof filters.origin === "string"
      ? (getTownBySlug(filters.origin)?.name ?? "your area")
      : "your area";

  return `For ${age} · ${date}${time} · within ${filters.maxDistanceMiles} mi of ${town}`;
}

function makeSearchHref(
  filters: ReturnType<typeof parseFiltersFromSearchParams>,
) {
  return `/results?${filtersToSearchParams(filters).toString()}`;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const filters = parseFiltersFromSearchParams(params);
  const search = await searchEvents(filters, { limit: 3 });
  const exactResults = search.initialResults;
  const remainingSlots = Math.max(0, 3 - exactResults.length);
  const flexibleResults = search.relaxedSuggestions.slice(0, remainingSlots);
  const editHref = `/?${filtersToSearchParams(filters).toString()}`;
  const widenedDistance = Math.min(
    500,
    Math.max(40, Math.ceil((filters.maxDistanceMiles * 1.5) / 5) * 5),
  );
  const widerSearchHref = makeSearchHref({
    ...filters,
    maxDistanceMiles: widenedDistance,
  });
  const anyTimeSearchHref = makeSearchHref({
    ...filters,
    timeOfDay: "anytime",
  });

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8 sm:pt-12">
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-blue-700"
          href={editHref}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Edit your answers
        </Link>

        <div className="mb-8 mt-6">
          <p className="text-sm font-medium text-blue-700">
            {search.totalResults === 0
              ? "A few ideas to try"
              : `${search.totalResults} ${search.totalResults === 1 ? "match" : "matches"}`}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Local suggestions
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {getSearchSummary(filters)}
          </p>
        </div>

        <div className="space-y-8">
          {exactResults.length > 0 && (
            <section aria-labelledby="exact-results-heading">
              <h2
                className="mb-4 text-lg font-semibold text-slate-950"
                id="exact-results-heading"
              >
                {search.totalResults === 1 ? "Your match" : "Best matches"}
              </h2>
              <div className="space-y-4">
                {exactResults.map(({ event, distanceMiles }) => (
                  <EventCard
                    distanceMiles={distanceMiles}
                    event={event}
                    key={event.id}
                  />
                ))}
              </div>
            </section>
          )}

          {flexibleResults.length > 0 && (
            <section aria-labelledby="flexible-results-heading">
              <h2
                className="text-lg font-semibold text-slate-950"
                id="flexible-results-heading"
              >
                {exactResults.length > 0
                  ? "If you’re flexible"
                  : "No exact matches — try these"}
              </h2>
              <p className="mb-4 mt-1 text-sm leading-6 text-slate-600">
                These options broaden the distance and time of day.
              </p>
              <div className="space-y-4">
                {flexibleResults.map(({ event, distanceMiles }) => (
                  <EventCard
                    distanceMiles={distanceMiles}
                    event={event}
                    flexible
                    key={event.id}
                  />
                ))}
              </div>
            </section>
          )}

          {exactResults.length === 0 && flexibleResults.length === 0 && (
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="font-semibold text-slate-900">
                No suggestions found for those answers.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Try widening your search or choosing a different time.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  href={widerSearchHref}
                >
                  Try {widenedDistance} miles
                </Link>
                {filters.timeOfDay !== "anytime" && (
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                    href={anyTimeSearchHref}
                  >
                    Try any time
                  </Link>
                )}
                <Link
                  className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-blue-700"
                  href={editHref}
                >
                  Change answers
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
