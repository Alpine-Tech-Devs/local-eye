import {
  Building2,
  CalendarDays,
  ExternalLink,
  MapPin,
  Ticket,
  Trees,
} from "lucide-react";
import Link from "next/link";

import type { Event } from "@/lib/events/types";
import { EVENT_TIME_ZONE } from "@/lib/events/time";
import { SaveButton } from "./SaveButton";

const CATEGORY_STYLES: Record<string, string> = {
  Storytime: "bg-sky-100 text-sky-900",
  Museum: "bg-violet-100 text-violet-900",
  Playground: "bg-emerald-100 text-emerald-900",
  Festival: "bg-amber-100 text-amber-900",
  Farm: "bg-lime-100 text-lime-900",
  Nature: "bg-green-100 text-green-900",
  "Arts & Crafts": "bg-pink-100 text-pink-900",
  Music: "bg-indigo-100 text-indigo-900",
  Sports: "bg-orange-100 text-orange-900",
  "Open Gym": "bg-cyan-100 text-cyan-900",
  Educational: "bg-blue-100 text-blue-900",
  Seasonal: "bg-rose-100 text-rose-900",
  "Community Event": "bg-teal-100 text-teal-900",
  Other: "bg-slate-100 text-slate-900",
};

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

function formatPrice(event: Event) {
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

function formatAges(event: Event) {
  if (event.minAge === null && event.maxAge === null) return "All ages";
  if (event.minAge === null) return `Up to age ${event.maxAge}`;
  if (event.maxAge === null) return `Ages ${event.minAge}+`;
  if (event.minAge === event.maxAge) return `Age ${event.minAge}`;
  return `Ages ${event.minAge}–${event.maxAge}`;
}

export interface EventCardProps {
  event: Event;
  distanceMiles?: number;
  flexible?: boolean;
}

export function EventCard({
  event,
  distanceMiles,
  flexible = false,
}: EventCardProps) {
  const SettingIcon =
    event.indoorOutdoor === "indoor"
      ? Building2
      : event.indoorOutdoor === "outdoor"
        ? Trees
        : MapPin;
  const categoryStyle =
    CATEGORY_STYLES[event.category] ?? CATEGORY_STYLES.Other;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div
        aria-hidden="true"
        className={`flex h-20 items-end px-5 pb-3 sm:px-6 ${categoryStyle}`}
      >
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold backdrop-blur">
          {event.category}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {flexible && (
              <p className="mb-3">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                  Flexible suggestion
                </span>
              </p>
            )}
            <h2 className="text-lg font-semibold leading-snug text-slate-950">
              <Link
                className="rounded-sm hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-700"
                href={`/events/${event.id}`}
              >
                {event.title}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {event.venueName} · {event.city}, {event.state}
            </p>
          </div>
          <SaveButton eventId={event.id} />
        </div>

        <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <CalendarDays
              aria-hidden="true"
              className="size-4 shrink-0 text-blue-700"
            />
            {formatEventDate(event.startDateTime, event.endDateTime)}
          </p>
          {distanceMiles !== undefined && (
            <p className="flex items-center gap-2">
              <MapPin
                aria-hidden="true"
                className="size-4 shrink-0 text-blue-700"
              />
              {distanceMiles.toFixed(1)} mi away
            </p>
          )}
          <p className="flex items-center gap-2">
            <Ticket
              aria-hidden="true"
              className="size-4 shrink-0 text-blue-700"
            />
            <span
              className={event.isFree ? "font-semibold text-emerald-800" : ""}
            >
              {formatPrice(event)}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <SettingIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-blue-700"
            />
            <span className="capitalize">{event.indoorOutdoor}</span>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {formatAges(event)}
          </span>
          {event.registrationRequired && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
              Registration required
            </span>
          )}
        </div>

        {event.description && (
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
            {event.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3">
          <Link
            className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-blue-700"
            href={`/events/${event.id}`}
          >
            Event details
          </Link>
          <a
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-700"
            href={event.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            Original source
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        </div>
      </div>
    </article>
  );
}
