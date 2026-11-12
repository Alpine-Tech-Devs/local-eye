import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { parseSouthBerwickLibraryIcs } from "../lib/ingestion/south-berwick-library.ics";
import type { Database, Json } from "../lib/supabase/database.types";

const MAX_CALENDAR_BYTES = 2 * 1024 * 1024;
const SOURCE_EVENTS_URL_KEY = "SOUTH_BERWICK_LIBRARY_EVENTS_URL";

function getPublicHttpsUrl(value: string | undefined, name: string): URL {
  if (!value) {
    throw new Error(`${name} is not configured in the environment.`);
  }

  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username.length > 0 ||
    url.password.length > 0
  ) {
    throw new Error(`${name} must be a public HTTPS URL.`);
  }
  return url;
}

async function main() {
  loadEnvConfig(process.cwd(), true);

  const args =
    process.argv[2] === "--" ? process.argv.slice(3) : process.argv.slice(2);
  if (args.length !== 1) {
    throw new Error(
      'Provide the exported ICS file path: pnpm ingest:south-berwick -- "/path/to/calendar.ics"',
    );
  }
  const [calendarPath] = args;

  const absoluteCalendarPath = resolve(calendarPath);
  const fileStats = statSync(absoluteCalendarPath);
  if (!fileStats.isFile()) {
    throw new Error("The provided ICS path is not a file.");
  }
  if (fileStats.size === 0 || fileStats.size > MAX_CALENDAR_BYTES) {
    throw new Error("The ICS file must be between 1 byte and 2 MiB.");
  }

  const calendarText = readFileSync(absoluteCalendarPath, "utf8");
  const eventsPageUrl = getPublicHttpsUrl(
    process.env[SOURCE_EVENTS_URL_KEY],
    SOURCE_EVENTS_URL_KEY,
  );
  const imported = parseSouthBerwickLibraryIcs(
    calendarText,
    eventsPageUrl.toString(),
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { data: generatedOccurrences, error } = await supabase.rpc(
    "sync_south_berwick_littles_storytime",
    {
      p_series: JSON.parse(JSON.stringify(imported.series)) as Json,
      p_exceptions: JSON.parse(JSON.stringify(imported.exceptions)) as Json,
    },
  );
  if (error) {
    throw new Error(
      "Could not sync South Berwick Library storytimes into Supabase.",
      {
        cause: error,
      },
    );
  }

  console.log(
    `Imported ${imported.series.length} series and ${imported.exceptions.length} exceptions; generated ${generatedOccurrences} occurrences.`,
  );
}

main().catch((error: unknown) => {
  console.error("South Berwick Library ICS import failed.", error);
  process.exitCode = 1;
});
