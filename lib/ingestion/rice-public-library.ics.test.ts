import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parseRicePublicLibraryIcsFiles } from "./rice-public-library.ics";

const CALENDARS = [
  "kittery-tues-storytime.ics",
  "kittery-fri-storytime.ics",
].map((filename) =>
  readFileSync(
    resolve(process.cwd(), "data/ingestion/rice-public-library", filename),
    "utf8",
  ),
);
const NOW = new Date("2026-11-11T12:00:00-05:00");

describe("parseRicePublicLibraryIcsFiles", () => {
  it("normalizes the ICS exports into the two six-month weekly series", () => {
    const series = parseRicePublicLibraryIcsFiles(CALENDARS, NOW);

    expect(series).toHaveLength(2);
    expect(series).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source_id: "rice-public-library",
          external_id: "9263",
          title: "Story Time!",
          description:
            "Sing songs, read stories, and do a fun craft in the children's room with Miss Sarah! Story Time is open to all children ages 0-5 and their caregivers. No registration needed; just come on by!",
          venue_name: "Rice Public Library - Children's Room",
          address: "8 Wentworth St, Kittery, ME 03904",
          city: "Kittery",
          min_age: 0,
          max_age: 5,
          day_of_week: 2,
          start_date: "2026-11-17",
          end_date: "2027-05-11",
          start_time: "10:30:00",
          duration_minutes: 30,
          registration_required: false,
          source_url:
            "https://ricepl.librarycalendar.com/event/story-time-9263",
        }),
        expect.objectContaining({
          external_id: "7890",
          day_of_week: 5,
          start_date: "2026-11-13",
          end_date: "2027-05-11",
          duration_minutes: 60,
          source_url:
            "https://ricepl.librarycalendar.com/event/copy-story-time-7890",
        }),
      ]),
    );
  });

  it("rejects a partial set of ICS files", () => {
    expect(() =>
      parseRicePublicLibraryIcsFiles(CALENDARS.slice(0, 1), NOW),
    ).toThrow("Provide both Rice Library Story Time ICS files");
  });

  it("rejects duplicate event IDs", () => {
    expect(() =>
      parseRicePublicLibraryIcsFiles([CALENDARS[0], CALENDARS[0]], NOW),
    ).toThrow("must have unique UIDs");
  });

  it("uses the current Tuesday when it has not started yet", () => {
    const series = parseRicePublicLibraryIcsFiles(
      CALENDARS,
      new Date("2026-11-17T09:00:00-05:00"),
    );

    expect(
      series.find(({ external_id }) => external_id === "9263"),
    ).toMatchObject({
      start_date: "2026-11-17",
      end_date: "2027-05-17",
    });
  });

  it("starts on the following week if today's story time has passed", () => {
    const series = parseRicePublicLibraryIcsFiles(
      CALENDARS,
      new Date("2026-11-17T11:00:00-05:00"),
    );

    expect(
      series.find(({ external_id }) => external_id === "9263"),
    ).toMatchObject({
      start_date: "2026-11-24",
    });
  });
});
