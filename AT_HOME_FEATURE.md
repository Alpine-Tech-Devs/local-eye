# Little Bay Mouse — Weekly At-Home Feature

Companion to [PLAN.md](PLAN.md) and [PRODUCT.md](PRODUCT.md).

## Idea

[@littlebaymouse](https://www.instagram.com/littlebaymouse/) is a public Instagram account run by a retired children's librarian. Every Monday she posts a themed set of a **book**, a **craft**, and a **nursery rhyme** for young children.

This is the "evergreen / at-home" content PRODUCT.md already anticipates for when there are few scheduled events. A former children's librarian is a credible, on-brand voice for the site, and the content pairs naturally with library storytimes.

## Recommendation summary

- **Treat it as a weekly feature, not an event.** It has no venue or time slot, so it does not belong in the `events` table. Give it a small content type of its own and a dedicated spot in the UI.
- **Start manual, automate later.** Instagram's API is the hard part. A manual weekly entry gets it live in a day and costs the author nothing. Automate only if the manual step becomes a chore.
- **Make the site the hub, Instagram the destination.** Show a teaser (theme, book, craft, rhyme, optional photo) and link out to the post. This keeps attribution clean and sends traffic to her account.

## Current state

A lightweight version ships first: a quiet one-line callout (`components/AtHomeCallout.tsx`) that names Little Bay Mouse, says what she posts and where, and links to the Instagram profile. It appears only at the bottom of the results page — never on the home page, mid-questionnaire, or on event detail pages. It is a plain link with no analytics and no schema changes. Everything below builds on that.

## Step-by-step plan

### Step 0 — Agreement with the author (1 conversation)

1. Confirm she is happy for her posts to be surfaced and credited on the site, with links to `instagram.com/littlebaymouse`.
2. Agree on a short bio line (e.g. "Retired children's librarian …") and a display name.
3. Ask her to add a consistent, parseable structure to captions going forward, for example first line is the theme, then `Book:`, `Craft:`, `Rhyme:`. This makes both manual entry and future automation trivial.

### Step 1 — Measure the callout (½ day, no content model yet)

1. Migration: `alter type public.analytics_event_type add value if not exists 'feature_click';`
2. Extend `AnalyticsRequestSchema` in `lib/analytics/schema.ts` with a `feature_click` variant whose payload is `{ feature: 'little-bay-mouse', placement: 'results' }`; add a test; regenerate `database.types.ts`.
3. Make `AtHomeCallout` a client component that calls `trackAnalyticsEvent("feature_click", …)` on click.
4. Add `feature_click` to the analytics summary view so click-through is visible alongside `source_click`.

This tells you whether the feature is worth the larger build below before writing any content-model code.

### Step 2 — Content model (½ day)

1. New migration: `weekly_features` table
   - `id uuid`, `week_of date` (the Monday), `title`, `book_title`, `book_author`, `craft_summary`, `rhyme_title`
   - `age_min` / `age_max` (nullable), `instagram_url`, `image_url` (nullable), `status text default 'published'`, timestamps
   - unique on `week_of`
2. RLS mirrors `events`: anon can read `status = 'published'`; service role writes.
3. Zod schema and `mapRowToWeeklyFeature()` alongside the existing event schema in `lib/`.

### Step 3 — UI placement (1 day)

1. **Home page:** a compact "This week from Little Bay Mouse" card under the hero — photo or placeholder, theme, the three items as chips (Book / Craft / Rhyme), "See the post" link, and her bio line. Hidden if no feature exists for the current or previous week.
2. **Results page:** show the same card at the bottom when results are sparse (fewer than 3) or when `environment = indoor` on a weekday. It is the natural rainy-day fallback.
3. **Archive page** at `/at-home` (or `/little-bay-mouse`): past weeks with the current one on top. Useful for SEO and for parents who want a backlog.
4. Replace the simple results-page callout from "Current state" with a link to the archive page once it exists.

### Step 4 — Manual publishing workflow (½ day)

1. `supabase/seed/weekly-features.ts` plus a `pnpm seed:features` script using the same upsert-by-key pattern as the storytime seed (key = `week_of`).
2. Monday routine: copy the post URL, fill in theme/book/craft/rhyme, run the script. About five minutes.
3. Images: use her photos only with permission. Otherwise use a brand-colored placeholder showing the theme text. Instagram CDN URLs expire, so store a copy (Supabase Storage) rather than hot-linking.

### Step 5 — Automate the Instagram pull (optional, 1–2 days)

1. Ask her to switch to a free **Creator** account (required for API access; no downside for her).
2. Create a Meta app, connect her account, and store a long-lived access token in Vercel environment variables.
3. A cron route (same pattern as the Phase 3 ingestion endpoint) fetches recent media via the Instagram Graph API each Monday evening, parses the structured caption from Step 0, and upserts a **draft** feature for review before publishing.
4. Do not scrape or use unofficial embeds; they break often and violate terms. The official oEmbed endpoint also requires an app token, so it saves little over the Graph API.

### Step 6 — Cross-promotion (ongoing)

1. She adds the site link to her profile bio; the site links to her from the footer callout and the archive page.
2. Once storytime data is in, consider pairing "Library storytime this week" with "Little Bay Mouse craft" when themes overlap.

## Open decisions

- Public archive page (SEO value) vs. current week only on the home page.
- Show her photos directly (needs permission, stored copies, and a `remotePatterns` entry) or link out only.
- Whether the callout should appear on every page or only home and results.

## Checkpoint

A weekly feature can be published in under five minutes, appears on the home page and sparse results, links back to the original Instagram post with credit, and `feature_click` events show up in the analytics summary view.
