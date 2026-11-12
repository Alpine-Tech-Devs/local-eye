import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { parseRicePublicLibraryIcsFiles } from "../lib/ingestion/rice-public-library.ics";
import type { Database } from "../lib/supabase/database.types";

const MAX_CALENDAR_BYTES = 2 * 1024 * 1024;
const CALENDAR_PATHS = [
  "data/ingestion/rice-public-library/kittery-tues-storytime.ics",
  "data/ingestion/rice-public-library/kittery-fri-storytime.ics",
];

async function main() {
  loadEnvConfig(process.cwd(), true);

  const calendarTexts = CALENDAR_PATHS.map((calendarPath) => {
    const absolutePath = resolve(calendarPath);
    const fileStats = statSync(absolutePath);
    if (
      !fileStats.isFile() ||
      fileStats.size === 0 ||
      fileStats.size > MAX_CALENDAR_BYTES
    ) {
      throw new Error(
        `ICS file must be between 1 byte and 2 MiB: ${calendarPath}`,
      );
    }
    return readFileSync(absolutePath, "utf8");
  });
  const series = parseRicePublicLibraryIcsFiles(calendarTexts);

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
  const { error: upsertError } = await supabase
    .from("recurring_event_series")
    .upsert(series, { onConflict: "source_id,external_id" });
  if (upsertError) {
    throw new Error("Could not upsert Rice Library Story Time series.", {
      cause: upsertError,
    });
  }

  const { data: generatedOccurrences, error: generationError } =
    await supabase.rpc("generate_recurring_event_occurrences", {
      p_days_ahead: 365,
    });
  if (generationError) {
    throw new Error("Could not generate Rice Library Story Time occurrences.", {
      cause: generationError,
    });
  }

  console.log(
    `Imported ${series.length} Rice Library series; generated ${generatedOccurrences} occurrences.`,
  );
}

main().catch((error: unknown) => {
  console.error("Rice Public Library ICS import failed.", error);
  process.exitCode = 1;
});
