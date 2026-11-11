# Local Eye — Project Plan

Companion to [PRODUCT.md](PRODUCT.md) and the archived MVP plan in [MVP.md](MVP.md). This plan keeps the broader roadmap intact while explicitly including the ingestion work that powers the live catalog and the later expansion phase.

---

## Phase 1 — Recurring Event Automation

**Goal:** Automatically keep recurring events in the database and available in search so they do not need to be added manually each week.

1. Identify reliable sources for recurring events, prioritizing structured calendars or feeds from libraries and other local organizers.
2. Define how a recurring event is represented, including its source, stable external identifier, schedule, and any exceptions or cancellations.
3. Implement an importer that expands each recurrence into dated event records within the search horizon and upserts them by stable source/event identity and occurrence date.
4. Ensure updated schedules refresh existing records, cancelled occurrences stop appearing in search, and failed or incomplete imports do not remove valid events.
5. Run the importer on a schedule and record the last successful sync so stale or failed imports can be detected.
6. Verify generated occurrences use the existing event schema and database fields and are returned by the normal search query.

**Checkpoint:** A recurring event is automatically refreshed into searchable dated events without weekly manual database entry; repeated syncs create no duplicates.

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
