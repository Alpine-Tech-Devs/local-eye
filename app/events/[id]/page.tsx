import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  MapPin,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TrackedAnchor } from "@/components/analytics/TrackedLink";
import { SaveButton } from "@/components/events/SaveButton";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublishedEvent } from "@/lib/events/get-published-event";
import { EVENT_TIME_ZONE } from "@/lib/events/time";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

function formatEventDate(startDateTime: string, endDateTime: string | null) {
  const start = new Date(startDateTime);
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
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

function formatVerifiedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: EVENT_TIME_ZONE,
  }).format(new Date(value));
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getPublishedEvent(id);

  if (!event) return { title: "Event not found | Little Plans Around Here" };

  return {
    title: event.title,
    description:
      event.description ??
      `${event.title} at ${event.venueName} in ${event.city}, ${event.state}.`,
    openGraph: {
      title: event.title,
      description:
        event.description ??
        `${event.title} at ${event.venueName} in ${event.city}, ${event.state}.`,
      images: [`/events/${event.id}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await getPublishedEvent(id);
  if (!event) notFound();

  const mapQuery = event.address
    ? `${event.venueName}, ${event.address}, ${event.city}, ${event.state}`
    : `${event.latitude},${event.longitude}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className="flex-1 text-slate-900">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8 sm:pt-12">
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-orange-700 hover:text-orange-900 focus-visible:outline-2 focus-visible:outline-orange-500"
          href="/"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to search
        </Link>

        <article className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-orange-100">
          <div aria-hidden="true" className="bg-brand h-2" />
          <div className="p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-orange-700">
                  {event.category}
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {event.title}
                </h1>
                <p className="mt-2 text-base text-slate-600">
                  {event.venueName} · {event.city}, {event.state}
                </p>
              </div>
              <SaveButton eventId={event.id} />
            </div>

            <dl className="mt-7 grid gap-x-6 gap-y-5 border-y border-slate-100 py-6 sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-4 text-orange-500"
                  />
                  When
                </dt>
                <dd className="mt-2 text-sm leading-6 text-slate-900">
                  {formatEventDate(event.startDateTime, event.endDateTime)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Ticket aria-hidden="true" className="size-4 text-orange-500" />
                  Price
                </dt>
                <dd className="mt-2 text-sm text-slate-900">
                  {event.isFree
                    ? "Free"
                    : event.priceMin !== null && event.priceMax !== null
                      ? event.priceMin === event.priceMax
                        ? `$${event.priceMin}`
                        : `$${event.priceMin}–$${event.priceMax}`
                      : event.priceMin !== null
                        ? `From $${event.priceMin}`
                        : event.priceMax !== null
                          ? `Up to $${event.priceMax}`
                          : "Price not listed"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-600">Ages</dt>
                <dd className="mt-2 text-sm text-slate-900">
                  {event.minAge === null && event.maxAge === null
                    ? "All ages"
                    : event.minAge === null
                      ? `Up to age ${event.maxAge}`
                      : event.maxAge === null
                        ? `Ages ${event.minAge}+`
                        : event.minAge === event.maxAge
                          ? `Age ${event.minAge}`
                          : `Ages ${event.minAge}–${event.maxAge}`}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-600">Setting</dt>
                <dd className="mt-2 text-sm capitalize text-slate-900">
                  {event.indoorOutdoor}
                </dd>
              </div>
            </dl>

            {event.description && (
              <section className="mt-7">
                <h2 className="text-lg font-semibold text-slate-950">
                  About this event
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                  {event.description}
                </p>
              </section>
            )}

            <section className="mt-7">
              <h2 className="text-lg font-semibold text-slate-950">Location</h2>
              <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-700">
                <MapPin
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-orange-500"
                />
                <span>
                  {event.venueName}
                  {event.address && (
                    <>
                      <br />
                      {event.address}
                    </>
                  )}
                  <br />
                  {event.city}, {event.state}
                </span>
              </p>
              <a
                className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-orange-700 underline decoration-orange-200 underline-offset-4 hover:text-orange-900 focus-visible:outline-2 focus-visible:outline-orange-500"
                href={mapUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open in Google Maps
                <ExternalLink aria-hidden="true" className="size-4" />
              </a>
            </section>

            <section className="mt-7 flex flex-wrap gap-3">
              {event.registrationUrl ? (
                <TrackedAnchor
                  className="bg-brand inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-md shadow-orange-200/70 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                  href={event.registrationUrl}
                  rel="noreferrer"
                  target="_blank"
                  eventId={event.id}
                  eventType="registration_click"
                >
                  {event.registrationRequired
                    ? "Register for this event"
                    : "More information"}
                  <ExternalLink aria-hidden="true" className="size-4" />
                </TrackedAnchor>
              ) : event.registrationRequired ? (
                <p className="text-sm leading-6 text-slate-600">
                  Registration is required. Check the organizer’s source for
                  registration details.
                </p>
              ) : null}
              <TrackedAnchor
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                href={event.sourceUrl}
                rel="noreferrer"
                target="_blank"
                eventId={event.id}
                eventType="source_click"
              >
                View original source
                <ExternalLink aria-hidden="true" className="size-4" />
              </TrackedAnchor>
            </section>
            <p className="mt-5 text-xs leading-5 text-slate-500">
              Source: {event.sourceName}
              {event.lastVerifiedAt &&
                ` · Last verified ${formatVerifiedDate(event.lastVerifiedAt)}`}
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
