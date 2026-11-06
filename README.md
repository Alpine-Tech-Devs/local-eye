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
check. Database schema migrations are separate from seed data; production
events will be populated by the ingestion pipeline in Phase 3.

## Useful commands

```bash
pnpm lint
pnpm test
pnpm build
```
