import { describe, expect, it, vi } from "vitest";

import {
  fetchRiceOccurrenceSourceLinks,
  parseRiceOccurrenceDetailUrl,
  RICE_PUBLIC_LIBRARY_CANCELLATIONS,
} from "./rice-public-library-links";
import { parseRicePublicLibraryIcsFiles } from "./rice-public-library.ics";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CALENDARS = [
  "kittery-tues-storytime.ics",
  "kittery-fri-storytime.ics",
].map((filename) =>
  readFileSync(
    resolve(process.cwd(), "data/ingestion/rice-public-library", filename),
    "utf8",
  ),
);
const SERIES = parseRicePublicLibraryIcsFiles(
  CALENDARS,
  new Date("2026-11-11T12:00:00-05:00"),
);

function fragment(date: string, href: string, time = "10:30am–11:00am") {
  return `<div data-date="${date}"><article class="event-card"><h3><a href="${href}" class="lc-event__link">Story Time!</a></h3><div class="lc-event-info-item lc-event-info-item--time">${time}</div></article></div>`;
}

describe("Rice Library occurrence source links", () => {
  it("extracts the event detail URL only from the matching title and start time", () => {
    expect(
      parseRiceOccurrenceDetailUrl(
        fragment("2026-11-20", "/event/copy-story-time-7894"),
        "2026-11-20",
        "10:30:00",
      ),
    ).toBe("https://ricepl.librarycalendar.com/event/copy-story-time-7894");
  });

  it("rejects fragments that do not contain the expected Story Time occurrence", () => {
    expect(() =>
      parseRiceOccurrenceDetailUrl(
        fragment("2026-11-20", "/event/story-time-other", "11:30am–12:00pm"),
        "2026-11-20",
        "10:30:00",
      ),
    ).toThrow("found 0");
  });

  it("fetches each scheduled date, skipping the Thanksgiving cancellation", async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const requestUrl = new URL(input.toString());
      const date = requestUrl.searchParams.get("current_date");
      if (!date) {
        throw new Error("Missing requested calendar date.");
      }
      return new Response(fragment(date, `/event/story-time-${date}`));
    });

    const links = await fetchRiceOccurrenceSourceLinks(
      SERIES,
      RICE_PUBLIC_LIBRARY_CANCELLATIONS,
      { fetcher, delayMs: 0 },
    );

    expect(links).toHaveLength(51);
    expect(fetcher).toHaveBeenCalledTimes(51);
    expect(links).toContainEqual({
      external_id: "7890",
      occurrence_date: "2026-11-20",
      source_url:
        "https://ricepl.librarycalendar.com/event/story-time-2026-11-20",
    });
    expect(
      links.some(({ occurrence_date }) => occurrence_date === "2026-11-27"),
    ).toBe(false);
  });
});
