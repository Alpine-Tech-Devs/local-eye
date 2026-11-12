import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET is not configured for recurrence generation.");
    return NextResponse.json(
      { error: "Recurrence generation is not configured." },
      { status: 503 },
    );
  }

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc(
    "generate_recurring_event_occurrences",
    { p_days_ahead: 365 },
  );

  if (error) {
    console.error("Could not generate recurring event occurrences.", error);
    return NextResponse.json(
      { error: "Could not generate recurring event occurrences." },
      { status: 500 },
    );
  }

  return NextResponse.json({ generatedOccurrences: data });
}
