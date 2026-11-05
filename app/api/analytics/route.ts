import { NextResponse } from "next/server";

import { AnalyticsRequestSchema } from "@/lib/analytics/schema";
import { createSupabaseAnalyticsClient } from "@/lib/analytics/server";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8192) {
    return NextResponse.json(
      { error: "Request body is too large." },
      { status: 413 },
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Could not read request body." },
      { status: 400 },
    );
  }

  if (new TextEncoder().encode(rawBody).byteLength > 8192) {
    return NextResponse.json(
      { error: "Request body is too large." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  const parsed = AnalyticsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid analytics event." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAnalyticsClient();
  const { error } = await supabase.from("analytics_events").insert({
    anon_id: parsed.data.anonId,
    event_type: parsed.data.eventType,
    payload: parsed.data.payload,
  });

  if (error) {
    console.error("Could not insert anonymous analytics event.", error);
    return NextResponse.json(
      { error: "Could not record analytics event." },
      { status: 500 },
    );
  }

  return new Response(null, { status: 204 });
}
