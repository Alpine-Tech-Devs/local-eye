import { ArrowLeft, ExternalLink, Eye } from "lucide-react";
import Link from "next/link";

import { searchEvents } from "@/lib/events/query";
import {
  filtersToSearchParams,
  parseFiltersFromSearchParams,
} from "@/lib/events/filters";
import { EVENT_TIME_ZONE } from "@/lib/events/time";
import type { RankedEvent } from "@/lib/events/rank";
import { getTownBySlug } from "@/lib/geo/towns";

interface ResultsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface DisplayEvent extends RankedEvent {
  relaxed: boolean;
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
  const time =
    filters.timeOfDay === "anytime" ? "" : `, ${filters.timeOfDay}`;
  const town =
    typeof filters.origin === "string"
      ? getTownBySlug(filters.origin)?.name ?? "your area"
      : "your area";

  return `For ${age} · ${date}${time} · within ${filters.maxDistanceMiles} mi of ${town}`;
}

function formatEventDate(startDateTime: string, endDateTime: string | null) {
  const start = new Date(startDateTime);
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: EVENT_TIME_ZONE,
  }).format(start);
  const startTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: EVENT_TIME_ZONE,
  }).format(start);

  if (!endDateTime) return `${date} · ${startTime}`;
  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: EVENT_TIME_ZONE,
  }).format(new Date(endDateTime));
  return `${date} · ${startTime}–${endTime}`;
}

function formatPrice(event: RankedEvent["event"]) {
  if (event.isFree) return "Free";
  if (event.priceMin !== null && event.priceMax !== null) {
    return event.priceMin === event.priceMax
      ? `$${event.priceMin}`
      : `$${event.priceMin}–$${event.priceMax}`;
  }
  if (event.priceMin !== null) return `From $${event.priceMin}`;
  if (event.priceMax !== null) return `Up to $${event.priceMax}`;
  return "Price not listed";
}

function ResultCard({ result }: { result: DisplayEvent }) {
  const { event, distanceMiles, relaxed } = result;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      {relaxed && (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-blue-700">
          Flexible suggestion
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-snug text-slate-950">
            {event.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {event.venueName} · {event.city}, {event.state}
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
          {formatPrice(event)}
        </span>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-800">
        {formatEventDate(event.startDateTime, event.endDateTime)}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>{distanceMiles.toFixed(1)} mi away</span>
        {event.minAge !== null || event.maxAge !== null ? (
          <span>
            Ages {event.minAge ?? "all"}
            {event.maxAge !== null && event.maxAge !== event.minAge
              ? `–${event.maxAge}`
              : ""}
          </span>
        ) : (
          <span>All ages</span>
        )}
        <span className="capitalize">{event.indoorOutdoor}</span>
      </div>
      {event.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {event.description}
        </p>
      )}
      <a
        className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-blue-700"
        href={event.sourceUrl}
        rel="noreferrer"
        target="_blank"
      >
        View event details at {event.sourceName}
        <ExternalLink aria-hidden="true" className="size-4" />
      </a>
    </article>
  );
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const filters = parseFiltersFromSearchParams(params);
  const search = await searchEvents(filters, { limit: 3 });
  const displayResults: DisplayEvent[] = search.initialResults.map((result) => ({
    ...result,
    relaxed: false,
  }));
  const remainingSlots = Math.max(0, 3 - displayResults.length);

  if (remainingSlots > 0) {
    displayResults.push(
      ...search.relaxedSuggestions
        .slice(0, remainingSlots)
        .map((result) => ({ ...result, relaxed: true })),
    );
  }

  const editHref = `/?${filtersToSearchParams(filters).toString()}`;
  const hasExactResults = search.totalResults > 0;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"
        >
          <Link
            aria-label="Local Eye home"
            className="inline-flex items-center gap-2 text-slate-900"
            href="/"
          >
            <Eye aria-hidden="true" className="size-5 text-blue-700" />
            <span className="text-base font-semibold tracking-tight">
              Local Eye
            </span>
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-700"
            href="/saved"
          >
            Saved
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-12 pt-10 sm:px-8 sm:pt-14">
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

        {displayResults.length > 0 ? (
          <div className="space-y-4">
            {!hasExactResults && search.totalRelaxedSuggestions > 0 && (
              <p className="text-sm leading-6 text-slate-600">
                No exact matches. These suggestions broaden the distance and
                time of day to help you find something nearby.
              </p>
            )}
            {displayResults.map((result) => (
              <ResultCard key={result.event.id} result={result} />
            ))}
          </div>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="font-semibold text-slate-900">
              No suggestions found for those answers.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Try another day, a different time, or a wider distance.
            </p>
            <Link
              className="mt-4 inline-flex min-h-11 items-center font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900"
              href={editHref}
            >
              Change answers
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
