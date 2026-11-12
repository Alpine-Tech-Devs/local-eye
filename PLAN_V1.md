# Local Eye — MVP Build Plan

Companion to [PRODUCT.md](PRODUCT.md). This plan builds only the MVP scope and leaves hooks for the future features (ingestion adapters, ranking, weather, evergreen activities).

Existing starting point: `seacoast-events/` is a fresh Next.js 16 + React 19 + Tailwind v4 + TypeScript scaffold (pnpm). Each phase below ends with a checkpoint you can run and verify.

---

## Phase 0 — Project Foundation

**Goal:** Clean scaffold, tooling, and conventions in place.

1. Rename `seacoast-events/` → `app/` (or keep the folder name; package name becomes `local-eye`). Update `package.json` name and metadata in `layout.tsx` (title: "Local Eye").
2. Strip the create-next-app boilerplate from `app/page.tsx` and `public/`.
3. Add dependencies:
   - `@supabase/supabase-js`, `@supabase/ssr`
   - `zod` (filter/URL param validation, event schema validation)
   - `date-fns` + `date-fns-tz` (America/New_York handling)
   - `lucide-react` (icons)
   - dev: `prettier`, `vitest`
4. Create folder structure:
   ```
   app/                  # routes (App Router)
   components/           # UI components
   lib/
     supabase/           # client/server helpers
     events/             # types, queries, filtering, ranking
     geo/                # haversine, town coordinates
     analytics/          # event tracking
   supabase/
     migrations/
     seed/
   scripts/              # seed runner
   ```
5. Add `.env.local.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
6. Add a short `README.md` with setup steps.

**Checkpoint:** `pnpm dev` renders an empty "Local Eye" page; `pnpm lint` passes.

---

## Phase 1 — Domain Model & Types

**Goal:** A single source of truth for the Event shape, shared by DB, seed data, and UI.

1. `lib/events/types.ts`
   - `Event` type matching the data model in PRODUCT.md (camelCase).
   - `EventCategory` union (Storytime, Museum, Playground, Festival, Farm, Nature, Arts & Crafts, Music, Sports, Open Gym, Educational, Seasonal, Community Event, Other).
   - `IndoorOutdoor` = `"indoor" | "outdoor" | "either"`.
2. `lib/events/schema.ts` — `zod` schema for `Event` (used to validate seed data and later ingestion output).
3. `lib/events/filters.ts`
   - `SearchFilters` type: `childAge`, `date` (`today | tomorrow | weekend | custom` + ISO date), `timeOfDay` (`morning | afternoon | evening | anytime`), `maxDistanceMiles`, `budget` (`free | under10 | under20 | any`), `environment` (`indoor | outdoor | either`), `origin` (`{ lat, lng }` or a town slug).
   - `zod` schema + `parseFiltersFromSearchParams()` / `filtersToSearchParams()` so filters live in the URL (shareable, back-button friendly, no state library).
   - Defaults: today, anytime, 25 miles, any budget, either environment.
4. `lib/geo/`
   - `haversineMiles(a, b)`.
   - `towns.ts`: a **data-driven** list of Seacoast towns with lat/lng (not hard-coded into logic) so other markets can be added later. Used as the "Where are you?" picker and as the default origin.
5. `lib/events/time.ts` — helpers for time-of-day windows (morning < 12, afternoon 12–5, evening ≥ 5) and date-range resolution ("this weekend" → next Sat–Sun in America/New_York).

**Checkpoint:** Unit tests (vitest) for date resolution, time windows, and haversine pass.

---

## Phase 2 — Database (Supabase / Postgres)

**Goal:** Events table live in Supabase, with migrations in the repo.

**Status:** Complete.

1. Create a Supabase project; install the Supabase CLI; `supabase init` and `supabase link`.
2. Events migration (created with `supabase migration new create_events`):
   - `events` table with snake_case columns matching the model (`id uuid`, `title`, `description`, `venue_name`, `address`, `city`, `state`, `latitude`, `longitude`, `start_datetime timestamptz`, `end_datetime`, `min_age`, `max_age`, `price_min numeric`, `price_max`, `is_free`, `indoor_outdoor`, `category`, `registration_required`, `registration_url`, `image_url`, `source_name`, `source_url`, `last_verified_at`, `created_at`, `updated_at`).
   - Postgres enums for `category` and `indoor_outdoor`.
   - Indexes on `start_datetime`, `(city)`, `(is_free)`, `(min_age, max_age)`.
   - `updated_at` trigger.
   - **Forward-compat columns (cheap now, needed later):** `source_id text` (adapter key), `external_id text` (dedupe key per source), `status text default 'published'` (for future moderation), unique on `(source_id, external_id)`.
3. Analytics migration (created with `supabase migration new create_analytics`):
   - `analytics_events` table: `id`, `anon_id`, `event_type` (`search`, `result_click`, `source_click`, `registration_click`, `save`), `payload jsonb`, `created_at`.
4. Row Level Security: `events` readable by anon; `analytics_events` insert-only for anon; everything else service-role only.
5. `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server components / route handlers), `lib/supabase/admin.ts` (service role, scripts only).
6. Generate DB types: `supabase gen types typescript` → `lib/supabase/database.types.ts`. Add a `mapRowToEvent()` function (snake → camel).

**Checkpoint (complete):** `supabase db push --linked` succeeds; a server component can `select * from events` and log the result. Types are generated into `lib/supabase/database.types.ts`, and no production event seed data is required for this phase.

---

## Phase 3 — Dynamic Event Ingestion

**Goal:** Populate and refresh the MVP from a small set of reliable, real Seacoast sources instead of relying on hand-authored event data.

**Status:** Dynamic ingestion is deferred. Events are being added manually in Supabase to bootstrap the catalog; return to this phase to build and validate automated ingestion before relying on it for ongoing updates.

1. Select an initial 3–5 structured sources, prioritizing public iCal feeds, RSS feeds, or APIs from libraries, museums, and recreation departments. Verify source terms, stable event identifiers, and update/cancellation behavior. Do not build general-purpose scraping or AI extraction for the MVP.
2. `lib/ingestion/types.ts` — define a `SourceAdapter` interface with source metadata, `fetchRawEvents()`, and `normalize(raw)` methods. Each adapter converts its source format into the shared event input shape.
3. Add a small code-based source registry and implement one adapter per selected source (for example, an iCal adapter where the source supports it). Keep source-specific parsing isolated from the common ingestion pipeline.
4. `lib/ingestion/pipeline.ts` — validate normalized records with the event Zod schema, deduplicate by `(source_id, external_id)`, and upsert through the server-only Supabase service-role client. Preserve source name and original URL; store unknown details as unknown rather than inventing age, price, or environment values.
5. Track successful syncs and event freshness using `last_verified_at`. Treat cancellations and events missing from a feed carefully: only mark an event cancelled/unpublished after a complete successful sync from a source whose feed is authoritative for removals; never unpublish events because a fetch or parse failed. Add any required columns/indexes in a migration.
6. `app/api/ingest/route.ts` — expose a server-only sync endpoint protected by a cron secret. Schedule it with Vercel Cron (daily to start); report per-source success/failure and avoid treating partial failures as a successful full sync. Keep secrets and service-role credentials out of client code.
7. Keep a small relative-date fixture file for tests and local development, not as the production event catalog. Add `pnpm ingest` for a one-off local sync and document how to configure sources and run a sync.

**Checkpoint:** A manual sync imports current events from each configured source, repeated syncs update rather than duplicate them, and the scheduled endpoint refreshes data without exposing privileged credentials.

### Phase 3a — Library Storytimes (first dataset)

**Goal:** Get real, recurring, verifiable data into the catalog quickly, using library storytimes as the first source family, and build the recurrence/upsert plumbing that automated ingestion will reuse.

**Why storytimes first:** ~13 libraries across the towns in `lib/geo/towns.ts`; nearly all free and indoor; tight, well-labeled age bands; predictable weekly schedules. They exercise the age, date, and distance filters well with a small dataset.

**Current state (Nov 2026):** No seed data exists. `supabase/seed/` and `scripts/` contain only `.gitkeep`, `supabase/config.toml` points at a non-existent `./seed.sql`, and events have been typed into the Supabase dashboard by hand. The schema already supports idempotent seeding via the unique `(source_id, external_id)` constraint and `last_verified_at`.

**Step 1 — Curated recurring rules + seed script (1–2 days)**

1. `supabase/seed/storytimes.ts` — one hand-verified record per program, not per occurrence:
   - library name, address, city/state, lat/lng
   - weekday, start/end time (local, `America/New_York`)
   - age band (e.g. Baby Lapsit 0–18 mo, Toddler 18 mo–3 yr, Preschool 3–5 yr) as `minAge`/`maxAge`
   - `registrationRequired` + `registrationUrl` where applicable
   - `sourceName`, `sourceUrl` (the library's program page), `verifiedOn` date
   - optional `blackoutDates` / `seasonEnd` for school-vacation weeks and session breaks
2. `scripts/seed-storytimes.ts` — expands each rule into concrete instances for the next 6–8 weeks, validates each with the existing event Zod schema, and upserts through `createSupabaseAdminClient()` with `source_id = "manual:library-storytimes"` and `external_id = "<library-slug>:<program-slug>:<YYYY-MM-DD>"`. Sets `last_verified_at` from `verifiedOn`. Re-running updates rather than duplicates.
3. Add `pnpm seed` to `package.json`. Document required env vars (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) in README.
4. Start with 4–5 libraries that are quick to verify (Portsmouth, Dover, Rice/Kittery, York, Exeter), then fill in the remaining towns.
5. Housekeeping: point `[db.seed] sql_paths` in `supabase/config.toml` at a real dev fixture or remove it so local resets aren't referencing a missing file.

**Step 2 — Replace manual rules with real feeds, one library at a time**

1. Most Seacoast libraries use LibCal, Assabet Interactive, or Google Calendar, all of which expose iCal feeds with stable UIDs and RRULEs. Look for a "Subscribe / iCal" link on each library's events page and record it alongside the manual rule.
2. Build the `SourceAdapter` interface and an iCal adapter (Phase 3 items 2–4). Reuse the recurrence-expansion code from Step 1.
3. Filter to storytime-like titles initially so book clubs, tax help, and board meetings are not ingested; widen later.
4. Each converted library gets its own `source_id` (e.g. `ical:portsmouth-public-library`); delete its manual rule once the feed is verified for two consecutive weeks.

**Step 3 — Automate**

1. `app/api/ingest/route.ts` behind a cron secret, scheduled daily on Vercel (Phase 3 item 6).
2. Have the same cron re-run the Step 1 seed so manual rules keep rolling forward until every library is on a feed.
3. Surface per-source sync status (last success, last error, row count) in a private SQL view, matching the analytics summary pattern.

**Checkpoint:** `pnpm seed` populates 6–8 weeks of storytimes for all Seacoast libraries, running it twice produces no duplicates, the home → results flow returns real storytimes filtered by age and town, and at least one library is sourced from a live iCal feed.

---

## Phase 4 — Query, Filter & Rank Logic

**Goal:** Deterministic, testable search that returns a _small_ set of relevant results.

**Status:** Complete.

1. `lib/events/query.ts` — `searchEvents(filters)`:
   - Push coarse filters to Postgres: date range, `is_free`/price, `indoor_outdoor`, age overlap (`min_age <= childAge <= max_age`, nulls = all ages), `status = 'published'`.
   - Apply in TypeScript: time-of-day window on `start_datetime`, distance via haversine from origin, then ranking.
2. `lib/events/rank.ts` — simple deterministic score (document the weights):
   - Age fit (tight range match > "all ages").
   - Distance (closer is better, linear decay to max).
   - Time-of-day exactness.
   - Free bonus when budget is `free`/tight.
   - Freshness (`last_verified_at` recent).
   - Tie-break: start time ascending.
3. Return top **N = 8** by default, with a "show more" that reveals the rest. This enforces the "6 good things, not 147" principle.
4. Empty-state logic: if < 3 results, compute the relaxed suggestions (widen distance, drop time-of-day) and return them labeled, so the UI can say "Nothing exact — here's what's nearby if you're flexible."

**Checkpoint (complete):** Unit tests cover ranking, filter behavior, and relaxed distance/time suggestions. Search returns all ranked exact matches with the first 8 marked as the initial results; relaxed suggestions are provided when fewer than 3 exact matches exist.

---

## Phase 5 — UI: Home / Search

**Goal:** Mobile-first home page that asks "What should we do?" and gets to results in one tap.

**Status:** Complete. The home page starts with only the intro and Start button, then presents a three-question wizard with progress. Submitting the third question navigates to `/results`, which displays no more than three suggestions.

1. `app/layout.tsx` — app shell: clean white-and-blue top bar (logo, Saved link), bottom-safe padding, `viewport` meta.
2. `components/search/SearchForm.tsx` (client component):
   - Intro: **"Looking for something to do in Seacoast, Maine & New Hampshire? Answer 3 questions and get local suggestions."**
   - Three steps: child age; date and time; starting town and maximum distance.
   - Budget and environment under a collapsed **More options** section.
   - Submit after the third question → `router.push('/results?…')` with serialized filters.
   - Remember last filters in `localStorage` so returning users get one-tap search.
3. Design system basics: `components/ui/` — `Chip`, `SegmentedControl`, and `Button`.
4. Large tap targets (≥44px), clear spacing, centered readable content on desktop, and a sticky submit button on mobile.

**Checkpoint (complete):** Only the intro and Start button appear initially; the three questions display one at a time with progress. At a phone-sized viewport there is no horizontal overflow, saved selections are restored, and submission navigates with serialized filters.

---

## Phase 6 — UI: Results & Event Detail

**Goal:** Scannable result cards and a detail page that always links back to the source.

**Status:** Complete. Results, reusable event cards, loading and empty states, flexible suggestions, and published-event detail pages are implemented.

1. `app/results/page.tsx` (server component): parse filters from `searchParams`, call `searchEvents`, render.
   - Summary line for the submitted answers with an **Edit** link back to `/` preserving params. Show no more than three exact or relaxed suggestions.
   - Route-level loading skeleton while results load.
2. `components/events/EventCard.tsx`:
   - Category-colored placeholder, title, venue · town, date + time range, age and price, indoor/outdoor, distance, registration badge, event detail link, and save button.
3. `app/events/[id]/page.tsx`:
   - Everything on the card plus full description, address (link to Apple/Google Maps), registration button, **"View original source"** button, source name, "Last verified" date.
   - `generateMetadata` for shareable titles.
4. Separate flexible suggestions when exact matches are thin; never show more than three cards total.
5. Empty state offers one-tap distance and time widening.

**Checkpoint (complete):** Full flow: home → results → event detail → source link opens organizer's site. Saved events persist locally and appear on the Saved page.

---

## Phase 7 — Save / Favorite

**Goal:** Favorites without requiring accounts (repeat usage > registrations).

**Status:** Complete. Saved IDs use localStorage and the Saved page groups upcoming and past events.

1. `components/events/SaveButton.tsx` — localStorage-backed event IDs with an external-store subscription to avoid SSR mismatch and sync saved cards.
2. Heart toggle on `EventCard` and detail page.
3. `app/saved/page.tsx` — fetch saved IDs from storage, load events by ID, show cards; past events grouped under "Past".
4. Note for later: when auth is added, migrate `localStorage` favorites to a `saved_events` table on first login.

**Checkpoint:** Saving persists across reloads; Saved page lists them.

---

## Phase 8 — Basic Analytics

**Goal:** Measure the success metric — do parents come back?

**Status:** Migrations applied locally and to production. Anonymous tracking, the validated insert endpoint, event instrumentation, and private SQL summary views are implemented. Production migration history confirms both analytics migrations. Live event insertion and SQL view queries still need verification; direct production SQL queries failed because the CLI temporary database login rejected its password.

1. `lib/analytics/anonId.ts` — generate a UUID in `localStorage` on first visit (no PII).
2. `lib/analytics/track.ts` — `track(eventType, payload)` → `POST /api/analytics` (route handler inserts into `analytics_events` with anon client; fire-and-forget with `navigator.sendBeacon` fallback).
3. Instrument:
   - `search` (filters payload)
   - `result_click` (event id, rank position)
   - `source_click` / `registration_click` (event id)
   - `save` / `unsave`
   - `session_start` (to derive returning users)
4. `supabase/views/analytics_summary.sql` — a few SQL views: unique users, searches, returning users (anon_id seen on ≥2 distinct days), searches per returning user, clicks per search. Query in Supabase dashboard — no admin UI needed yet.
5. Migrations are applied locally and to production. Verify analytics inserts and query `private.analytics_overview` in the Supabase SQL Editor.

**Checkpoint:** Migrations are applied to local and production databases; live analytics event and view verification remains pending.

---

## Phase 9 — Polish, Quality & Launch

**Status:** Steps 1–6 complete; deployment and legal/trust work (steps 7–8) remain.

1. **Accessibility:** labels on all controls, focus states, keyboard navigation for segmented controls, color contrast.
2. **Performance:** `next/image` with remote patterns for source image domains; results page cached briefly (`revalidate` ~5 min) keyed by params.
3. **SEO basics:** metadata, OG image, `robots.txt`, `sitemap` for event detail pages.
4. **Error handling:** `error.tsx` and `not-found.tsx` for results and event routes.
5. **Tests:** vitest for lib; one Playwright smoke test for home → results → detail.
6. **CI:** GitHub Action for lint + typecheck + tests on PR. **Complete:** `.github/workflows/ci.yml` runs all three checks on pull requests.
7. **Deploy:** Vercel project, env vars, Supabase production project, custom domain. Preview deploys per PR.
8. **Legal/trust:** footer with "Events are sourced from organizers — always confirm details at the original source" + simple privacy note (anonymous analytics only).

**Checkpoint:** Production URL works on a real phone; share it with 5–10 Seacoast parents.

---

## Phase 10 — Ingestion Expansion (post-MVP)

**Goal:** Expand source coverage after the initial dynamic pipeline proves reliable.

1. Add adapters for additional calendars and source formats based on local parent demand and source reliability.
2. Add monitoring, retry/backoff, and alerts for stale or failing sources; provide a lightweight review workflow for records that cannot be confidently normalized.
3. Consider deterministic webpage extraction for sources without structured feeds. Use AI extraction only as a later fallback, with validation and human review where needed.

**Checkpoint:** New sources can be added independently, and sync health is visible without disrupting existing event data.

---

## Suggested Sequencing & Effort

| Phase                  | Est. effort | Notes                                     |
| ---------------------- | ----------- | ----------------------------------------- |
| 0 Foundation           | ½ day       |                                           |
| 1 Domain model         | ½ day       | Tests here save time later                |
| 2 Database             | ½–1 day     | Supabase setup included                   |
| 3 Dynamic ingestion    | 2–3 days    | Depends on source feed quality and access |
| 4 Query/rank           | 1 day       |                                           |
| 5 Home UI              | 1–2 days    | Most design iteration here                |
| 6 Results/detail       | 1–2 days    |                                           |
| 7 Favorites            | ½ day       |                                           |
| 8 Analytics            | ½–1 day     |                                           |
| 9 Polish/launch        | 1–2 days    |                                           |
| 10 Ingestion expansion | Later       | Add sources after MVP launch              |

Roughly **9–14 working days** for a solo developer to a shareable MVP, depending on source availability and feed quality.

---

## Decisions Made (and why)

- **Filters in URL, not global state** — shareable, back-button safe, and server components can render results directly.
- **No auth in MVP** — favorites and analytics are anonymous via `localStorage`; aligns with "repeat usage > registrations."
- **Coarse filtering in SQL, fine ranking in TS** — keeps SQL simple and ranking testable; dataset is small.
- **Dynamic source data from the MVP** — a few reliable structured feeds provide current events; fixtures remain for tests and local development.
- **Forward-compat DB columns** (`source_id`, `external_id`, `status`) — nearly free now, avoids a painful migration when ingestion and community submission arrive.
- **Towns as data, not code** — satisfies "don't hard-code the market."

## Explicitly Deferred

Weather, evergreen activities (`places` table), community submission + moderation, broad ingestion coverage and general-purpose scraping, accounts, business profiles, promoted listings, native apps.
