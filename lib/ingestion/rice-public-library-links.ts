import type { RiceSeriesImport } from "./rice-public-library.ics";

const CALENDAR_FRAGMENT_URL =
  "https://ricepl.librarycalendar.com/events/feed/html";
const LIBRARY_ORIGIN = "https://ricepl.librarycalendar.com";

export interface RiceOccurrenceSourceLink {
  external_id: string;
  occurrence_date: string;
  source_url: string;
}

export interface RiceOccurrenceCancellation {
  external_id: string;
  occurrence_date: string;
  reason: string;
}

export const RICE_PUBLIC_LIBRARY_CANCELLATIONS: RiceOccurrenceCancellation[] = [
  {
    external_id: "7890",
    occurrence_date: "2026-11-27",
    reason: "Canceled for the U.S. Thanksgiving holiday.",
  },
];

function decodeHtml(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, value: string) =>
      String.fromCodePoint(Number(value)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) =>
      String.fromCodePoint(Number.parseInt(value, 16)),
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/gi, "'")
    .replace(/&apos;/gi, "'");
}

function getAttribute(attributes: string, name: string): string | undefined {
  const match = attributes.match(
    new RegExp(
      `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
      "i",
    ),
  );
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function getVisibleText(html: string): string {
  return decodeHtml(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function formatClockTime(time: string): string {
  const match = time.match(/^(\d{2}):(\d{2})/);
  if (!match) {
    throw new Error(`Unsupported Rice Library start time: ${time}`);
  }
  const hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? "pm" : "am";
  return `${hour % 12 || 12}:${minute}${period}`;
}

export function parseRiceOccurrenceDetailUrl(
  html: string,
  occurrenceDate: string,
  startTime: string,
): string {
  const dayMatch = html.match(
    /<[^>]*\bdata-date\s*=\s*["']([^"']+)["'][^>]*>/i,
  );
  if (dayMatch && dayMatch[1] !== occurrenceDate) {
    throw new Error(
      `Rice calendar fragment date ${dayMatch[1]} did not match ${occurrenceDate}.`,
    );
  }

  const cards = html.match(
    /<article\b[^>]*class=["'][^"']*\bevent-card\b[^"']*["'][\s\S]*?<\/article>/gi,
  );
  const expectedTime = formatClockTime(startTime);
  const matches: string[] = [];

  for (const card of cards ?? []) {
    const anchors = card.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi);
    for (const [, attributes, label] of anchors) {
      const className = getAttribute(attributes, "class") ?? "";
      if (
        !className.split(/\s+/).includes("lc-event__link") ||
        getVisibleText(label) !== "Story Time!"
      ) {
        continue;
      }

      const timeMatch = card.match(
        /<[^>]*class=["'][^"']*lc-event-info-item--time[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i,
      );
      if (
        !timeMatch ||
        !getVisibleText(timeMatch[1])
          .replace(/\s/g, "")
          .toLowerCase()
          .includes(expectedTime)
      ) {
        continue;
      }

      const href = getAttribute(attributes, "href");
      if (href) {
        matches.push(new URL(href, LIBRARY_ORIGIN).toString());
      }
    }
  }

  if (matches.length !== 1) {
    throw new Error(
      `Expected one Rice Story Time link at ${expectedTime} on ${occurrenceDate}; found ${matches.length}.`,
    );
  }

  const url = new URL(matches[0]);
  if (
    url.protocol !== "https:" ||
    url.origin !== LIBRARY_ORIGIN ||
    !url.pathname.startsWith("/event/")
  ) {
    throw new Error(`Rice Story Time URL is not an allowed event link: ${url}`);
  }
  return url.toString();
}

function dateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isCancelled(
  seriesExternalId: string,
  date: string,
  cancellations: RiceOccurrenceCancellation[],
): boolean {
  return cancellations.some(
    (cancellation) =>
      cancellation.external_id === seriesExternalId &&
      cancellation.occurrence_date === date,
  );
}

export async function fetchRiceOccurrenceSourceLinks(
  series: RiceSeriesImport[],
  cancellations: RiceOccurrenceCancellation[] = RICE_PUBLIC_LIBRARY_CANCELLATIONS,
  options: { fetcher?: typeof fetch; delayMs?: number } = {},
): Promise<RiceOccurrenceSourceLink[]> {
  const fetcher = options.fetcher ?? fetch;
  const delayMs = options.delayMs ?? 1000;
  const links: RiceOccurrenceSourceLink[] = [];
  let requestCount = 0;

  for (const recurringSeries of series) {
    const date = new Date(`${recurringSeries.start_date}T12:00:00.000Z`);
    const endDate = new Date(`${recurringSeries.end_date}T12:00:00.000Z`);

    while (date <= endDate) {
      const occurrenceDate = dateString(date);
      const dayOfWeek = date.getUTCDay() || 7;
      if (
        dayOfWeek === recurringSeries.day_of_week &&
        !isCancelled(recurringSeries.external_id, occurrenceDate, cancellations)
      ) {
        if (requestCount > 0 && delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const fragmentUrl = new URL(CALENDAR_FRAGMENT_URL);
        fragmentUrl.searchParams.set("_wrapper_format", "lc_calendar_feed");
        fragmentUrl.searchParams.set("current_date", occurrenceDate);
        fragmentUrl.searchParams.set("ongoing_events", "hide");
        const response = await fetcher(fragmentUrl, {
          headers: { "User-Agent": "Local Eye library-calendar importer" },
          signal: AbortSignal.timeout(20_000),
        });
        if (!response.ok) {
          throw new Error(
            `Rice calendar request for ${occurrenceDate} failed with HTTP ${response.status}.`,
          );
        }

        const sourceUrl = parseRiceOccurrenceDetailUrl(
          await response.text(),
          occurrenceDate,
          recurringSeries.start_time,
        );
        links.push({
          external_id: recurringSeries.external_id,
          occurrence_date: occurrenceDate,
          source_url: sourceUrl,
        });
        requestCount += 1;
      }
      date.setUTCDate(date.getUTCDate() + 1);
    }
  }

  return links;
}
