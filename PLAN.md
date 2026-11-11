# Local Eye — Project Plan

Companion to [PRODUCT.md](PRODUCT.md) and the archived MVP plan in [PLAN_V1.md](PLAN_V1.md). This plan keeps the broader roadmap intact while explicitly including the ingestion work that powers the live catalog and the later expansion phase.

---

## Phase 1 — Recurring Event Automation

**Status:** Complete (implemented and locally verified). Production activation still requires applying the migration and setting the Vercel environment variables.

**Goal:** Enter one-time events in `events` or add a recurring series once in Supabase Studio, so generated occurrences appear in search without weekly manual entry.

1. Use the existing `events` table for one-time events and a separate `recurring_event_series` row for a recurring event.
2. Store weekly or monthly recurrence, the weekday or day of month, start time, duration, time zone, and optional end date on the series.
3. Generate dated occurrence rows in `events` within the search horizon, linked to their series and uniquely identified by series and date.
4. Make generation idempotent; edits refresh future events while preserving past events.
5. Support individual cancellations through `recurring_event_exceptions` and deactivate a series to cancel its future occurrences.
6. Run the generator daily through a bearer-secret-protected route and Vercel Cron; generated rows use the existing event schema and search query.

**Checkpoint:** A weekly or monthly series entered once in Supabase Studio produces searchable dated events without duplicates or weekly manual entry.

---

## Phase 2 — Dynamic Event Ingestion

**Goal:** Populate and refresh the MVP catalog using a small set of reliable, real Seacoast sources rather than hand-authored records.

1. Select 3–5 structured sources such as iCal feeds, RSS feeds, or APIs from libraries, museums, and recreation departments.
2. Define the `SourceAdapter` contract and create a small source registry.
3. Implement source-specific adapters and isolate parsing logic from the common ingestion pipeline.
4. Validate normalized records using the event Zod schema, deduplicate by `(source_id, external_id)`, and upsert them via the service-role Supabase client.
5. Track freshness with `last_verified_at` and only mark an event cancelled or unpublished after a successful authoritative sync.
6. Expose a server-only ingestion endpoint protected by a cron secret and schedule daily syncs.
7. Keep fixture data for testing and local development, while adding a `pnpm ingest` command for one-off syncs.

**Checkpoint:** Repeated syncs update existing records without duplication and refresh the catalog without exposing secrets.

### Phase 2a — Library Storytimes (first dataset)

**Goal:** Add a real, recurring, high-signal data source quickly.

1. Prioritize recurring library storytimes as the initial source family.
2. Build the ingestion adapter for the feed format and validate output against the shared event schema.
3. Confirm recurring events appear and update correctly over repeated syncs.

**Checkpoint:** The first live source family is operational and producing recurring event entries.

---

## Phase 3 — Ingestion Expansion (post-MVP)

**Goal:** Expand source coverage after the initial dynamic pipeline proves reliable.

1. Add adapters for additional calendars and source formats based on demand and reliability.
2. Add monitoring, retry/backoff, and alerts for stale or failing sources.
3. Review and normalize edge cases that require manual intervention.
4. Consider deterministic webpage extraction for feeds without structured formats, with human review where needed.

**Checkpoint:** New sources can be added independently without disrupting the existing live catalog.

---

## Key Decisions

- Source data is pulled dynamically from a few structured feeds.
