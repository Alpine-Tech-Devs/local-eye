import ICAL from "ical.js";

import { getTownBySlug } from "../geo/towns";
import type { Database } from "../supabase/database.types";

const TIME_ZONE = "America/New_York";
const SOURCE_ID = "rice-public-library";
const SOURCE_NAME = "Rice Public Library";
const STORY_TIME_IDS = new Set(["9263", "7890"]);
const TOWN = getTownBySlug("kittery");

type SeriesInsert =
  Database["public"]["Tables"]["recurring_event_series"]["Insert"];

export type RiceSeriesImport = Omit<
  SeriesInsert,
  "id" | "created_at" | "updated_at"
> & {
  source_id: string;
  external_id: string;
};

function getLocalDateTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}:00`,
  };
}

function decodeDescription(description: string): string {
  return description
    .replace(/&#(\d+);/g, (_, value: string) =>
      String.fromCodePoint(Number(value)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) =>
      String.fromCodePoint(Number.parseInt(value, 16)),
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getNextOccurrenceDate(
  firstDate: string,
  startTime: string,
  dayOfWeek: number,
  now: Date,
): string {
  const today = getLocalDateTime(now);
  const date = new Date(`${today.date}T00:00:00.000Z`);
  const currentDay = date.getUTCDay() || 7;
  let daysUntil = (dayOfWeek - currentDay + 7) % 7;

  if (daysUntil === 0 && today.time > startTime) {
    daysUntil = 7;
  }
  date.setUTCDate(date.getUTCDate() + daysUntil);

  const nextDate = date.toISOString().slice(0, 10);
  return nextDate < firstDate ? firstDate : nextDate;
}

function addCalendarMonths(date: string, months: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const targetMonth = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 0),
  ).getUTCDate();
  targetMonth.setUTCDate(Math.min(day, lastDay));
  return targetMonth.toISOString().slice(0, 10);
}

function parseEvent(calendarText: string, now: Date): RiceSeriesImport {
  if (!TOWN) {
    throw new Error("Kittery town coordinates are not configured.");
  }

  const root = new ICAL.Component(ICAL.parse(calendarText));
  const components = root.getAllSubcomponents("vevent");
  if (components.length !== 1) {
    throw new Error("Each Rice Library ICS file must contain one event.");
  }

  const component = components[0];
  const event = new ICAL.Event(component);
  const externalId = event.uid.trim();
  if (
    !STORY_TIME_IDS.has(externalId) ||
    event.summary.trim() !== "Story Time!"
  ) {
    throw new Error(
      "The ICS file is not one of the approved Rice story times.",
    );
  }
  if (event.startDate.isDate || event.endDate.isDate) {
    throw new Error("All-day Rice Library story times are not supported.");
  }

  const start = event.startDate.toJSDate();
  const end = event.endDate.toJSDate();
  const durationMinutes = (end.getTime() - start.getTime()) / 60_000;
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 1440
  ) {
    throw new Error("Rice Library story time has an invalid event duration.");
  }

  const { date: firstDate, time: startTime } = getLocalDateTime(start);
  const startUtcDate = new Date(`${firstDate}T12:00:00.000Z`);
  const dayOfWeek = startUtcDate.getUTCDay() || 7;
  const startDate = getNextOccurrenceDate(firstDate, startTime, dayOfWeek, now);
  const endDate = addCalendarMonths(getLocalDateTime(now).date, 6);
  const description = decodeDescription(event.description);
  const ageRange = description.match(/ages?\s+(\d+)\s*[-–]\s*(\d+)/i);
  if (!ageRange) {
    throw new Error("Rice Library story time description has no age range.");
  }

  const location = String(component.getFirstPropertyValue("location") ?? "");
  const addressMatch = location.match(
    /,\s*(\d+.+?),\s*(?:United States|USA)\s*$/i,
  );
  if (!addressMatch) {
    throw new Error("Rice Library story time has no supported street address.");
  }

  const room = decodeDescription(
    String(component.getFirstPropertyValue("room") ?? ""),
  );
  const sourceUrl = String(component.getFirstPropertyValue("url") ?? "");
  const parsedSourceUrl = new URL(sourceUrl);
  if (parsedSourceUrl.protocol !== "https:") {
    throw new Error("Rice Library event URL must use HTTPS.");
  }

  return {
    source_id: SOURCE_ID,
    external_id: externalId,
    title: event.summary.trim(),
    description,
    venue_name: room ? `${SOURCE_NAME} - ${room}` : SOURCE_NAME,
    address: addressMatch[1],
    city: TOWN.name,
    state: TOWN.state,
    latitude: TOWN.lat,
    longitude: TOWN.lng,
    min_age: Number(ageRange[1]),
    max_age: Number(ageRange[2]),
    price_min: null,
    price_max: null,
    is_free: true,
    indoor_outdoor: "indoor",
    category: "Storytime",
    registration_required: /registration required/i.test(description),
    registration_url: null,
    image_url: null,
    source_name: SOURCE_NAME,
    source_url: parsedSourceUrl.toString(),
    recurrence_frequency: "weekly",
    day_of_week: dayOfWeek,
    day_of_month: null,
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    duration_minutes: durationMinutes,
    time_zone: TIME_ZONE,
    is_active: true,
  };
}

export function parseRicePublicLibraryIcsFiles(
  calendarTexts: string[],
  now = new Date(),
): RiceSeriesImport[] {
  if (calendarTexts.length !== STORY_TIME_IDS.size) {
    throw new Error("Provide both Rice Library Story Time ICS files.");
  }

  const series = calendarTexts.map((calendarText) =>
    parseEvent(calendarText, now),
  );
  if (
    new Set(series.map(({ external_id }) => external_id)).size !== series.length
  ) {
    throw new Error("Rice Library Story Time ICS files must have unique UIDs.");
  }
  if (
    new Set(series.map(({ day_of_week }) => day_of_week)).size !== series.length
  ) {
    throw new Error(
      "Rice Library Story Time ICS files must use different weekdays.",
    );
  }

  return series;
}
