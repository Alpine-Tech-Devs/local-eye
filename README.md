# Little Plans Around Here

Big fun, close to home. Little Plans Around Here helps families find family-friendly things to do around here.

## Setup

Requirements: Node.js 20.9 or later and pnpm 9.12.1.

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app. Replace
the placeholder Supabase values in `.env.local` with your project credentials.
Next.js also loads `.env.development.local` while running `pnpm dev`. The
publishable (or legacy anon) key is public; never expose the service-role key
with a `NEXT_PUBLIC_` prefix.

## Database setup

The Supabase migrations are tracked in `supabase/migrations/`. To link a
different checkout to your project and apply them:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push --linked
supabase gen types typescript --linked --schema public > lib/supabase/database.types.ts
```

The home page makes a small server-side query to `events` as a connectivity
check. Database schema migrations are separate from event data.

## Recurring events

Apply the migrations, then enter one-time events directly in the `events` table
using Supabase Studio. For recurring events, add one row to
`recurring_event_series` instead; the daily generator creates dated `events`
rows that the existing search can find. Do not add generated occurrences
manually.

The series table stores the shared event details plus:

- `recurrence_frequency`: `weekly` or `monthly`
- `day_of_week`: ISO weekday number (`1` Monday through `7` Sunday) for weekly
  recurrences; leave `day_of_month` empty
- `day_of_month`: `1` through `31` for monthly recurrences; leave `day_of_week`
  empty. Months without that date are skipped.
- `start_date` and optional `end_date`
- `start_time`, `duration_minutes`, and `time_zone` (default
  `America/New_York`)
- `is_active`: set to false to cancel future occurrences. Keep the series row
  rather than deleting it; generated event rows retain their series reference.

After adding a series or a cancellation exception, run
`select public.generate_recurring_event_occurrences(365);` in the Supabase SQL
Editor to generate or refresh occurrences immediately. To cancel one
occurrence, add its date to `recurring_event_exceptions` for that series and
run the generator. Updating a series refreshes future occurrences; past events
are left unchanged. Future events no longer matching an edited schedule are
marked cancelled.

Vercel runs the same generator daily using the schedule in `vercel.json`. Set
`CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project environment;
the endpoint rejects requests without `Authorization: Bearer <CRON_SECRET>`.
For local development, set `CRON_SECRET` in `.env.local` and call the endpoint
with that authorization header, or run the SQL function directly in Supabase
Studio. Run `pnpm test:db` with local Supabase running to exercise weekly and
monthly generation, duplicate prevention, schedule edits, and cancellations.

## South Berwick Library ICS import

The South Berwick Public Library importer accepts recurring entries titled
exactly `Littles' Storytime` or `Pre-K Storytime`. It reads the ICS recurrence
rule and excluded dates, and does not import the library's other programs.

This library provides an export file rather than a live feed URL, so import it
from your local machine whenever you download an updated calendar. There is no
ICS ingestion cron; new changes in the library calendar will not be reflected
until you run the command again.

Set these variables in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: the target
  Supabase project and server-only write credential
- `SOUTH_BERWICK_LIBRARY_EVENTS_URL`: the library event page to show as the
  event's source link

```bash
pnpm ingest:south-berwick -- "/path/to/Full Calendar.ics"
```

The importer preserves the calendar's event UIDs for idempotent updates,
converts times to `America/New_York`, derives the age range from each event's
description, and syncs `EXDATE` exceptions and cancelled series. The database sync runs
transactionally, deactivates series removed from a successfully parsed feed,
and generates searchable occurrences.
Unsupported recurrence rules, an unreadable file, missing credentials, or an
export without the target event stop the import without changing existing
database rows. Apply the migrations to the selected Supabase project before
running the command.

## Rice Public Library ICS import

The Rice Public Library importer reads the Tuesday and Friday Story Time
exports from `data/ingestion/rice-public-library/`. It uses the event UID for
idempotent updates and schedules each event weekly at the time and duration
in its export, from the next occurrence through six months from the import
date.

Run the importer after updating those local ICS files:

```bash
pnpm ingest:rice-library
```

It upserts only the Rice Public Library series, then generates searchable
occurrences. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in
`.env.local`; the selected Supabase project must have the recurring-event
migrations applied.

## Useful commands

```bash
pnpm lint
pnpm test
pnpm test:db
pnpm build
```
