"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { EventCard } from "@/components/events/EventCard";
import type { RankedEvent } from "@/lib/events/rank";
import {
  EVENT_SEARCH_PAGE_SIZE,
  EventSearchPageSchema,
} from "@/lib/events/search-page";

interface InfiniteEventResultsProps {
  initialResults: RankedEvent[];
  initialHasMore: boolean;
  initialTotalResults: number;
  searchParams: string;
}

export function InfiniteEventResults({
  initialResults,
  initialHasMore,
  initialTotalResults,
  searchParams,
}: InfiniteEventResultsProps) {
  const [results, setResults] = useState(initialResults);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [totalResults, setTotalResults] = useState(initialTotalResults);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadMoreButtonRef = useRef<HTMLButtonElement | null>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams(searchParams);
      params.set("offset", String(results.length));
      const response = await fetch(`/api/events/search?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Search request failed with status ${response.status}.`);
      }

      const payload: unknown = await response.json();
      const parsed = EventSearchPageSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("The search response did not match the expected format.", {
          cause: parsed.error,
        });
      }
      if (parsed.data.hasMore && parsed.data.results.length === 0) {
        throw new Error("The search returned an empty page with more results.");
      }

      setResults((current) => [...current, ...parsed.data.results]);
      setHasMore(parsed.data.hasMore);
      setTotalResults(parsed.data.totalResults);
    } catch (error) {
      console.error("Could not load more search results.", error);
      setErrorMessage("More events could not be loaded. Please try again.");
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [hasMore, results.length, searchParams]);

  useEffect(() => {
    const button = loadMoreButtonRef.current;
    if (!button || !hasMore || errorMessage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(button);

    return () => observer.disconnect();
  }, [errorMessage, hasMore, loadMore]);

  return (
    <>
      <div className="space-y-4">
        {results.map(
          ({ event, distanceMiles, matchingChildAges }, index) => (
            <EventCard
              distanceMiles={distanceMiles}
              event={event}
              key={event.id}
              matchingChildAges={matchingChildAges}
              resultPosition={index + 1}
            />
          ),
        )}
      </div>
      {hasMore && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-wait disabled:opacity-70"
            disabled={isLoading}
            onClick={() => void loadMore()}
            ref={loadMoreButtonRef}
            type="button"
          >
            {isLoading
              ? "Loading more events…"
              : errorMessage
                ? "Try loading again"
                : `Load ${EVENT_SEARCH_PAGE_SIZE} more events`}
          </button>
          {isLoading && (
            <p aria-live="polite" className="text-sm text-slate-600" role="status">
              Loading more events…
            </p>
          )}
          {errorMessage && (
            <p className="text-sm text-red-800" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      )}
      {!hasMore && totalResults > 0 && (
        <p
          aria-live="polite"
          className="mt-6 text-center text-sm text-slate-500"
          role="status"
        >
          You&apos;ve seen all {totalResults} matches.
        </p>
      )}
    </>
  );
}
