"use client";

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
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="font-semibold text-slate-900">No saved events yet</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Tap the heart on an event to keep it here for later.
        </p>
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
