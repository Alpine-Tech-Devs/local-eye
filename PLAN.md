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

1. Create a Supabase project; install the Supabase CLI; `supabase init` and `supabase link`.
2. Migration `0001_events.sql`:
   - `events` table with snake_case columns matching the model (`id uuid`, `title`, `description`, `venue_name`, `address`, `city`, `state`, `latitude`, `longitude`, `start_datetime timestamptz`, `end_datetime`, `min_age`, `max_age`, `price_min numeric`, `price_max`, `is_free`, `indoor_outdoor`, `category`, `registration_required`, `registration_url`, `image_url`, `source_name`, `source_url`, `last_verified_at`, `created_at`, `updated_at`).
   - Postgres enums for `category` and `indoor_outdoor`.
   - Indexes on `start_datetime`, `(city)`, `(is_free)`, `(min_age, max_age)`.
   - `updated_at` trigger.
   - **Forward-compat columns (cheap now, needed later):** `source_id text` (adapter key), `external_id text` (dedupe key per source), `status text default 'published'` (for future moderation), unique on `(source_id, external_id)`.
3. Migration `0002_analytics.sql`:
   - `analytics_events` table: `id`, `anon_id`, `event_type` (`search`, `result_click`, `source_click`, `registration_click`, `save`), `payload jsonb`, `created_at`.
4. Row Level Security: `events` readable by anon; `analytics_events` insert-only for anon; everything else service-role only.
5. `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server components / route handlers), `lib/supabase/admin.ts` (service role, scripts only).
6. Generate DB types: `supabase gen types typescript` → `lib/supabase/database.types.ts`. Add a `mapRowToEvent()` function (snake → camel).

**Checkpoint:** `supabase db push` succeeds; a server component can `select * from events` and log the result.

---

## Phase 3 — Seed Data

**Goal:** 40–60 realistic Seacoast events spanning the next ~3 weeks so every filter combination yields results.

1. `supabase/seed/events.json` — hand-authored events. Cover:
   - Every category at least twice.
   - Every launch town at least once (South Berwick, Eliot, Kittery, York, Portsmouth, Dover, Durham, Newmarket, Exeter, Stratham, Greenland, Rye, Hampton).
   - Mix of free / <$10 / <$20 / >$20; indoor / outdoor; morning / afternoon / evening; registration required vs. drop-in; age ranges 0–2, 2–5, 5–10, all ages.
   - Real venues where possible (libraries, Children's Museum of NH, Seacoast Science Center, Strawbery Banke, farms, rec departments) with real source URLs.
2. **Relative dates:** store `startOffsetDays` + `startTime` in the seed file so the seed script computes absolute `start_datetime` from "today". Keeps seed data evergreen for demos.
3. `scripts/seed.ts` — validates with the zod schema, converts to rows, upserts via service-role client. Wire to `pnpm seed`.

**Checkpoint:** `pnpm seed` loads data; Supabase table editor shows the events.

---

## Phase 4 — Query, Filter & Rank Logic

**Goal:** Deterministic, testable search that returns a *small* set of relevant results.

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

**Checkpoint:** Unit tests for ranking order and empty-state relaxation.

---

## Phase 5 — UI: Home / Search

**Goal:** Mobile-first home page that asks "What should we do?" and gets to results in one tap.

1. `app/layout.tsx` — app shell: top bar (logo, Saved link), bottom-safe padding, `viewport` meta, light/dark via Tailwind.
2. `components/search/SearchForm.tsx` (client component):
   - Headline **"What should we do?"**
   - Child age: stepper or chips (`<1`, `1`, `2`, … `12+`).
   - Date: segmented control (Today / Tomorrow / This weekend / Pick a date → native `<input type="date">`).
   - Time: Morning / Afternoon / Evening / Anytime.
   - Distance: slider or chips (10 / 15 / 25 / 40 mi) + "Where from?" town picker (defaults to last used, persisted in `localStorage`).
   - Budget: Free / Under $10 / Under $20 / Any.
   - Environment: Indoor / Outdoor / Either.
   - Submit → `router.push('/results?…')` with serialized filters.
   - Remember last filters in `localStorage` so returning users get one-tap search.
3. Design system basics: `components/ui/` — `Chip`, `SegmentedControl`, `Button`, `Card`, `Badge`. Keep it to what's used.
4. Large tap targets (≥44px), single-column layout, sticky submit button on mobile.

**Checkpoint:** Form works on a phone-sized viewport; URL reflects selections.

---

## Phase 6 — UI: Results & Event Detail

**Goal:** Scannable result cards and a detail page that always links back to the source.

1. `app/results/page.tsx` (server component): parse filters from `searchParams`, call `searchEvents`, render.
   - Summary line: "6 things for your 2-year-old · Saturday morning · within 25 mi of Portsmouth" with an **Edit** link back to `/` preserving params.
   - `Suspense` + skeleton cards for loading.
2. `components/events/EventCard.tsx`:
   - Image (or category-colored placeholder), title, venue · town, date + time range, age badge, price badge (**Free** highlighted), indoor/outdoor icon, distance ("~12 mi"), "Registration required" badge, save button.
3. `app/events/[id]/page.tsx`:
   - Everything on the card plus full description, address (link to Apple/Google Maps), registration button, **"View original source"** button, source name, "Last verified" date.
   - `generateMetadata` for shareable titles.
4. Relaxed-results section when exact matches are thin (from Phase 4).
5. Empty state copy that stays on-brand and offers one-tap widening (e.g., "Try 40 miles" / "Any time").

**Checkpoint:** Full flow: home → results → detail → source link opens organizer's site.

---

## Phase 7 — Save / Favorite

**Goal:** Favorites without requiring accounts (repeat usage > registrations).

1. `lib/saved/useSavedEvents.ts` — `localStorage`-backed hook (array of event IDs), hydrated safely to avoid SSR mismatch.
2. Heart toggle on `EventCard` and detail page.
3. `app/saved/page.tsx` — fetch saved IDs from storage, load events by ID, show cards; past events grouped under "Past".
4. Note for later: when auth is added, migrate `localStorage` favorites to a `saved_events` table on first login.

**Checkpoint:** Saving persists across reloads; Saved page lists them.

---

## Phase 8 — Basic Analytics

**Goal:** Measure the success metric — do parents come back?

1. `lib/analytics/anonId.ts` — generate a UUID in `localStorage` on first visit (no PII).
2. `lib/analytics/track.ts` — `track(eventType, payload)` → `POST /api/analytics` (route handler inserts into `analytics_events` with anon client; fire-and-forget with `navigator.sendBeacon` fallback).
3. Instrument:
   - `search` (filters payload)
   - `result_click` (event id, rank position)
   - `source_click` / `registration_click` (event id)
   - `save` / `unsave`
   - `session_start` (to derive returning users)
4. `supabase/views/analytics_summary.sql` — a few SQL views: unique users, searches, returning users (anon_id seen on ≥2 distinct days), searches per returning user, clicks per search. Query in Supabase dashboard — no admin UI needed yet.

**Checkpoint:** Events appear in `analytics_events`; views return sensible numbers.

---

## Phase 9 — Polish, Quality & Launch

1. **Accessibility:** labels on all controls, focus states, keyboard navigation for segmented controls, color contrast.
2. **Performance:** `next/image` with remote patterns for source image domains; results page cached briefly (`revalidate` ~5 min) keyed by params.
3. **SEO basics:** metadata, OG image, `robots.txt`, `sitemap` for event detail pages.
4. **Error handling:** `error.tsx` and `not-found.tsx` for results and event routes.
5. **Tests:** vitest for lib; one Playwright smoke test for home → results → detail.
6. **CI:** GitHub Action for lint + typecheck + tests on PR.
7. **Deploy:** Vercel project, env vars, Supabase production project, custom domain. Preview deploys per PR.
8. **Legal/trust:** footer with "Events are sourced from organizers — always confirm details at the original source" + simple privacy note (anonymous analytics only).

**Checkpoint:** Production URL works on a real phone; share it with 5–10 Seacoast parents.

---

## Phase 10 — Ingestion Architecture Stub (design only, minimal code)

**Goal:** Make the "add adapters later" promise concrete without building scrapers.

1. `lib/ingestion/types.ts` — `SourceAdapter` interface: `{ id, name, fetchRawEvents(): Promise<RawEvent[]>, normalize(raw): EventInput }`.
2. `lib/ingestion/pipeline.ts` — pure functions with TODO bodies: `dedupe()`, `categorize()`, `upsertEvents()`. Document the flow from PRODUCT.md in comments.
3. One **manual adapter** `adapters/manualJson.ts` that reads the seed file — proving the pipeline shape end-to-end and replacing the one-off seed script.
4. `docs/ingestion.md` — short note on adding an adapter (e.g., library calendar iCal feed first; AI extraction last).

**Checkpoint:** `pnpm ingest manual` produces the same result as `pnpm seed`.

---

## Suggested Sequencing & Effort

| Phase | Est. effort | Notes |
|---|---|---|
| 0 Foundation | ½ day | |
| 1 Domain model | ½ day | Tests here save time later |
| 2 Database | ½–1 day | Supabase setup included |
| 3 Seed data | 1 day | Most time is authoring realistic events |
| 4 Query/rank | 1 day | |
| 5 Home UI | 1–2 days | Most design iteration here |
| 6 Results/detail | 1–2 days | |
| 7 Favorites | ½ day | |
| 8 Analytics | ½–1 day | |
| 9 Polish/launch | 1–2 days | |
| 10 Ingestion stub | ½ day | |

Roughly **8–12 working days** for a solo developer to a shareable MVP.

---

## Decisions Made (and why)

- **Filters in URL, not global state** — shareable, back-button safe, and server components can render results directly.
- **No auth in MVP** — favorites and analytics are anonymous via `localStorage`; aligns with "repeat usage > registrations."
- **Coarse filtering in SQL, fine ranking in TS** — keeps SQL simple and ranking testable; dataset is small.
- **Relative seed dates** — demo always has upcoming events.
- **Forward-compat DB columns** (`source_id`, `external_id`, `status`) — nearly free now, avoids a painful migration when ingestion and community submission arrive.
- **Towns as data, not code** — satisfies "don't hard-code the market."

## Explicitly Deferred

Weather, evergreen activities (`places` table), community submission + moderation, real ingestion adapters, accounts, business profiles, promoted listings, native apps.
