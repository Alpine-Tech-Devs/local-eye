import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parseSouthBerwickLibraryIcs } from "./south-berwick-library.ics";

const CALENDAR = readFileSync(
  resolve(process.cwd(), "lib/ingestion/fixtures/south-berwick-library.ics"),
  "utf8",
);
const EVENTS_PAGE_URL = "https://example.com/library/events";

describe("parseSouthBerwickLibraryIcs", () => {
  it("imports recurring Littles' and Pre-K Storytime series", () => {
    const result = parseSouthBerwickLibraryIcs(CALENDAR, EVENTS_PAGE_URL);

    expect(result.series).toHaveLength(6);
    expect(result.series.map(({ external_id }) => external_id)).toEqual([
      "old-littles@default",
      "2026-spring-littles@default",
      "summer-littles@default",
      "fall-littles@default",
      "pre-k-storytime@default",
      "cancelled-littles@default",
    ]);
    expect(result.series[3]).toMatchObject({
      source_id: "south-berwick-public-library",
      title: "Littles' Storytime",
      description:
        "Join us for books, songs, rhymes, and bounces! Followed by a time for adults and littles to play and socialize. Designed for ages 0-24 months.",
      city: "South Berwick",
      state: "ME",
      min_age: 0,
      max_age: 2,
      category: "Storytime",
      recurrence_frequency: "weekly",
      day_of_week: 4,
      start_date: "2026-09-24",
      end_date: "2026-12-18",
      start_time: "10:30:00",
      duration_minutes: 45,
      time_zone: "America/New_York",
      source_url: EVENTS_PAGE_URL,
    });
    expect(result.series[4]).toMatchObject({
      title: "Pre-K Storytime",
      description:
        "Join us for books, songs, and activities centered around a different theme every week! Followed by a craft. Designed for ages 2-5, but all ages welcome!",
      min_age: 2,
      max_age: 5,
      recurrence_frequency: "weekly",
      day_of_week: 3,
      start_date: "2026-01-14",
      end_date: "2026-05-29",
      start_time: "10:30:00",
      duration_minutes: 45,
    });
    expect(result.series[5].is_active).toBe(false);
    expect(result.exceptions).toEqual([
      {
        external_id: "old-littles@default",
        occurrence_date: "2025-11-27",
        reason: "Excluded by South Berwick Public Library calendar.",
      },
      {
        external_id: "2026-spring-littles@default",
        occurrence_date: "2026-03-05",
        reason: "Excluded by South Berwick Public Library calendar.",
      },
      {
        external_id: "2026-spring-littles@default",
        occurrence_date: "2026-05-28",
        reason: "Excluded by South Berwick Public Library calendar.",
      },
      {
        external_id: "fall-littles@default",
        occurrence_date: "2026-11-26",
        reason: "Excluded by South Berwick Public Library calendar.",
      },
      {
        external_id: "pre-k-storytime@default",
        occurrence_date: "2026-02-04",
        reason: "Excluded by South Berwick Public Library calendar.",
      },
    ]);
  });

  it("uses the last date derived from a COUNT-limited recurrence", () => {
    const result = parseSouthBerwickLibraryIcs(CALENDAR, EVENTS_PAGE_URL);

    expect(result.series[2]).toMatchObject({
      start_date: "2026-07-02",
      end_date: "2026-08-27",
      duration_minutes: 45,
    });
  });

  it("fails safely if the target series is missing", () => {
    expect(() =>
      parseSouthBerwickLibraryIcs(
        "BEGIN:VCALENDAR\nEND:VCALENDAR",
        EVENTS_PAGE_URL,
      ),
    ).toThrow("No recurring South Berwick Library storytimes were found");
  });

  it("rejects recurrence formats the database model cannot represent", () => {
    const unsupportedCalendar = CALENDAR.replace(
      "FREQ=WEEKLY;INTERVAL=1;BYDAY=TH;COUNT=9",
      "FREQ=WEEKLY;INTERVAL=2;BYDAY=TH;COUNT=9",
    );

    expect(() =>
      parseSouthBerwickLibraryIcs(unsupportedCalendar, EVENTS_PAGE_URL),
    ).toThrow("unsupported ICS recurrence rule");
  });
});
