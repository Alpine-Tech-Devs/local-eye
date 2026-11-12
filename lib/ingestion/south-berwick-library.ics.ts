import ICAL from "ical.js";

import { getTownBySlug } from "../geo/towns";
import type { Database } from "../supabase/database.types";

const TIME_ZONE = "America/New_York";
const SOURCE_ID = "south-berwick-public-library";
const SOURCE_NAME = "South Berwick Public Library";
const TARGET_TITLES = new Set(["Littles' Storytime", "Pre-K Storytime"]);
const TOWN = getTownBySlug("south-berwick");

type SeriesInsert =
  Database["public"]["Tables"]["recurring_event_series"]["Insert"];

export interface SouthBerwickSeriesImport extends Omit<
  SeriesInsert,
  "id" | "created_at" | "updated_at"
> {
  source_id: string;
  external_id: string;
}

export interface SouthBerwickExceptionImport {
  external_id: string;
  occurrence_date: string;
  reason: string;
}

export interface SouthBerwickIcsImport {
  series: SouthBerwickSeriesImport[];
  exceptions: SouthBerwickExceptionImport[];
}

function localDateAndTime(date: Date) {
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

function localDateFromTime(time: ICAL.Time): string {
  if (time.isDate || time.zone.tzid === "floating") {
    return [
      String(time.year).padStart(4, "0"),
      String(time.month).padStart(2, "0"),
      String(time.day).padStart(2, "0"),
    ].join("-");
  }
  return localDateAndTime(time.toJSDate()).date;
}

function normalizeDescription(description: string): string {
  return description
    .replace(
      /^(?:Mondays?|Tuesdays?|Wednesdays?|Thursdays?|Fridays?|Saturdays?|Sundays?)\s*,?\s*(?:at\s*)?\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\s*/i,
      "",
    )
    .replace(/\u00a0/g, " ")
    .replace(/([.!?])(?=\S)/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

function getEndDate(rule: ICAL.Recur, start: ICAL.Time): string | null {
  if (rule.count !== null) {
    if (rule.count < 1 || rule.count > 10_000) {
      throw new Error("Unsupported ICS recurrence count.");
    }

    const iterator = rule.iterator(start);
    let finalOccurrence: ICAL.Time | null = null;
    for (let index = 0; index < rule.count; index += 1) {
      finalOccurrence = iterator.next();
      if (!finalOccurrence) {
        throw new Error("Could not expand the ICS recurrence count.");
      }
    }
    if (!finalOccurrence) {
      throw new Error("Could not expand the ICS recurrence count.");
    }
    return localDateFromTime(finalOccurrence);
  }

  return rule.until ? localDateFromTime(rule.until) : null;
}

function getAgeRange(
  description: string,
  title: string,
): {
  min_age: number;
  max_age: number;
} {
  const ageRange = description.match(
    /ages?\s+(\d+)\s*[-–]\s*(\d+)\s*(months?|years?)?/i,
  );
  if (!ageRange) {
    throw new Error(`${title} ICS entry has no supported age range.`);
  }

  const ageMultiplier = ageRange[3]?.toLowerCase().startsWith("month")
    ? 1 / 12
    : 1;
  return {
    min_age: Number(ageRange[1]) * ageMultiplier,
    max_age: Number(ageRange[2]) * ageMultiplier,
  };
}

function getWeeklyDay(
  rule: ICAL.Recur,
  start: ICAL.Time,
  title: string,
): number {
  const days = rule.parts.BYDAY;
  if (
    rule.freq !== "WEEKLY" ||
    rule.interval !== 1 ||
    !days ||
    days.length !== 1 ||
    !/^(SU|MO|TU|WE|TH|FR|SA)$/.test(days[0])
  ) {
    throw new Error(`${title} uses an unsupported ICS recurrence rule.`);
  }

  const icalDay = ICAL.Recur.icalDayToNumericDay(days[0]);
  const isoDay = icalDay === 1 ? 7 : icalDay - 1;
  if (start.dayOfWeek() !== icalDay) {
    throw new Error("ICS recurrence day does not match its DTSTART.");
  }
  return isoDay;
}

function getDurationMinutes(event: ICAL.Event, title: string): number {
  if (event.startDate.isDate || event.endDate.isDate) {
    throw new Error(`All-day ${title} entries are not supported.`);
  }

  const duration =
    (event.endDate.toJSDate().getTime() -
      event.startDate.toJSDate().getTime()) /
    60_000;
  if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
    throw new Error(`${title} has an invalid event duration.`);
  }
  return duration;
}

export function parseSouthBerwickLibraryIcs(
  calendarText: string,
  eventsPageUrl: string,
): SouthBerwickIcsImport {
  if (!TOWN) {
    throw new Error("South Berwick town coordinates are not configured.");
  }

  const root = new ICAL.Component(ICAL.parse(calendarText));
  const series: SouthBerwickSeriesImport[] = [];
  const exceptions: SouthBerwickExceptionImport[] = [];
  const seenUids = new Set<string>();

  for (const component of root.getAllSubcomponents("vevent")) {
    const event = new ICAL.Event(component);
    const title = event.summary.trim();
    if (!TARGET_TITLES.has(title)) {
      continue;
    }

    const externalId = event.uid.trim();
    if (!externalId || seenUids.has(externalId)) {
      throw new Error(`${title} ICS entries need unique UIDs.`);
    }
    seenUids.add(externalId);

    const recurrenceProperties = component.getAllProperties("rrule");
    if (recurrenceProperties.length === 0) {
      continue;
    }
    if (recurrenceProperties.length !== 1) {
      throw new Error(`Each ${title} ICS entry must have one recurrence rule.`);
    }
    const recurrenceValue = recurrenceProperties[0].getFirstValue();
    if (!(recurrenceValue instanceof ICAL.Recur)) {
      throw new Error(`Could not read the ${title} recurrence rule.`);
    }
    const rule = recurrenceValue;
    const start = event.startDate;
    const { date: startDate, time: startTime } = localDateAndTime(
      start.toJSDate(),
    );
    const description = normalizeDescription(event.description);
    const ageRange = getAgeRange(description, title);

    series.push({
      source_id: SOURCE_ID,
      external_id: externalId,
      title,
      description,
      venue_name: "South Berwick Public Library",
      address: "27 Young Street",
      city: TOWN.name,
      state: TOWN.state,
      latitude: TOWN.lat,
      longitude: TOWN.lng,
      ...ageRange,
      price_min: null,
      price_max: null,
      is_free: true,
      indoor_outdoor: "indoor",
      category: "Storytime",
      registration_required: false,
      registration_url: null,
      image_url: null,
      source_name: SOURCE_NAME,
      source_url: eventsPageUrl,
      recurrence_frequency: "weekly",
      day_of_week: getWeeklyDay(rule, start, title),
      day_of_month: null,
      start_date: startDate,
      end_date: getEndDate(rule, start),
      start_time: startTime,
      duration_minutes: getDurationMinutes(event, title),
      time_zone: TIME_ZONE,
      is_active:
        String(
          component.getFirstPropertyValue("status") ?? "",
        ).toUpperCase() !== "CANCELLED",
    });

    for (const property of component.getAllProperties("exdate")) {
      for (const date of property.getValues()) {
        if (!(date instanceof ICAL.Time)) {
          throw new Error(`Could not read a ${title} exception date.`);
        }
        exceptions.push({
          external_id: externalId,
          occurrence_date: localDateFromTime(date),
          reason: "Excluded by South Berwick Public Library calendar.",
        });
      }
    }
  }

  if (series.length === 0) {
    throw new Error(
      "No recurring South Berwick Library storytimes were found in the ICS.",
    );
  }

  return { series, exceptions };
}
