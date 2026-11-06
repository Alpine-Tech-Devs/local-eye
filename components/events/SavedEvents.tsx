"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EventCard } from "@/components/events/EventCard";
import {
  SAVED_EVENTS_CHANGED_EVENT,
  readSavedEventIds,
} from "@/components/events/SaveButton";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapRowToEvent } from "@/lib/supabase/map-row-to-event";
import type { Event } from "@/lib/events/types";

export function SavedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loadedAt, setLoadedAt] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSavedEvents() {
      try {
        const ids = readSavedEventIds();
        if (ids.length === 0) {
          if (active) {
            setEvents([]);
            setLoadedAt(Date.now());
            setErrorMessage(null);
          }
          return;
        }

        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .in("id", ids)
          .eq("status", "published");

        if (error) {
          throw new Error("Unable to load saved events.", { cause: error });
        }

        if (active) {
          setErrorMessage(null);
          setLoadedAt(Date.now());
          const eventsById = new Map(
            data.map((row) => {
              const event = mapRowToEvent(row);
              return [event.id, event] as const;
            }),
          );
          setEvents(
            ids.flatMap((id) => {
              const event = eventsById.get(id);
              return event ? [event] : [];
            }),
          );
        }
      } catch (error) {
        console.error("Could not load saved events.", error);
        if (active) {
          setErrorMessage(
            "Saved events could not be loaded. Please try again later.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadSavedEvents();
    window.addEventListener(SAVED_EVENTS_CHANGED_EVENT, loadSavedEvents);
    window.addEventListener("storage", loadSavedEvents);
    return () => {
      active = false;
      window.removeEventListener(SAVED_EVENTS_CHANGED_EVENT, loadSavedEvents);
      window.removeEventListener("storage", loadSavedEvents);
    };
  }, []);

  const upcomingEvents = events.filter(
    (event) => Date.parse(event.startDateTime) >= loadedAt,
  );
  const pastEvents = events.filter(
    (event) => Date.parse(event.startDateTime) < loadedAt,
  );

  if (isLoading) {
    return (
      <p className="text-sm text-slate-600" role="status">
        Loading your saved events…
      </p>
    );
  }

  if (errorMessage) {
    return (
      <p
        className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900"
        role="alert"
      >
        {errorMessage}
      </p>
    );
  }

  if (events.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-orange-200 bg-white/60 p-8 text-center">
        <span
          aria-hidden="true"
          className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-orange-50 text-orange-500"
        >
          <Heart className="size-6" />
        </span>
        <h2 className="mt-4 font-semibold text-slate-900">
          Nothing saved yet
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
          Tap the heart on any event to keep it here. Saved events stay on
          this device — no account needed.
        </p>
        <Link
          className="bg-brand mt-6 inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-md shadow-orange-200/70 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          href="/"
        >
          Find something to do
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {upcomingEvents.length > 0 && (
        <section aria-labelledby="upcoming-saved-events">
          <h2
            className="mb-4 text-lg font-semibold text-slate-950"
            id="upcoming-saved-events"
          >
            Upcoming
          </h2>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </div>
        </section>
      )}
      {pastEvents.length > 0 && (
        <section aria-labelledby="past-saved-events">
          <h2
            className="mb-4 text-lg font-semibold text-slate-950"
            id="past-saved-events"
          >
            Past
          </h2>
          <div className="space-y-4">
            {pastEvents.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
