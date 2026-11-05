import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Database } from "../lib/supabase/database.types";

function getDevelopmentEnv(name: string) {
  const file = readFileSync(
    resolve(process.cwd(), ".env.development.local"),
    "utf8",
  );
  const line = file
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${name}=`));
  if (!line) throw new Error(`Missing ${name} in .env.development.local.`);
  return line.slice(name.length + 1).replace(/^["']|["']$/g, "");
}

function getTomorrowInNewYork() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day + 1))
    .toISOString()
    .slice(0, 10);
}

let supabase: SupabaseClient<Database>;
let eventId: string;
const eventTitle = `Playwright smoke event ${crypto.randomUUID()}`;

test.beforeAll(async () => {
  const url = getDevelopmentEnv("NEXT_PUBLIC_SUPABASE_URL");
  const parsedUrl = new URL(url);
  if (
    parsedUrl.hostname !== "localhost" &&
    parsedUrl.hostname !== "127.0.0.1" &&
    parsedUrl.hostname !== "::1"
  ) {
    throw new Error("End-to-end tests may only write to local Supabase.");
  }

  supabase = createClient<Database>(
    url,
    getDevelopmentEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );

  const startDateTime = new Date(`${getTomorrowInNewYork()}T15:00:00.000Z`);
  const { data, error } = await supabase
    .from("events")
    .insert({
      title: eventTitle,
      description: "Local event used by the automated browser smoke test.",
      venue_name: "Portsmouth Test Library",
      address: "1 Test Way",
      city: "Portsmouth",
      state: "NH",
      latitude: 43.0718,
      longitude: -70.7626,
      start_datetime: startDateTime.toISOString(),
      end_datetime: new Date(
        startDateTime.getTime() + 60 * 60 * 1000,
      ).toISOString(),
      category: "Storytime",
      is_free: true,
      indoor_outdoor: "indoor",
      source_name: "Local Eye test",
      source_url: "https://example.com/test-event",
      status: "published",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error("Could not create the local smoke-test event.", {
      cause: error,
    });
  }
  eventId = data.id;
});

test.afterAll(async () => {
  if (!eventId || !supabase) return;
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) {
    throw new Error("Could not remove the local smoke-test event.", {
      cause: error,
    });
  }
});

test("searches for an event and opens its details", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  const todayRadio = page.getByRole("radio", { name: "Today" });
  await todayRadio.focus();
  await page.keyboard.press("ArrowRight");
  const tomorrowRadio = page.getByRole("radio", { name: "Tomorrow" });
  await expect(tomorrowRadio).toBeChecked();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Show suggestions" }).click();

  await expect(page.getByRole("heading", { name: eventTitle })).toBeVisible();
  await page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: eventTitle }) })
    .getByRole("link", { name: "Event details", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: eventTitle }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View original source" }),
  ).toHaveAttribute("href", "https://example.com/test-event");
});
