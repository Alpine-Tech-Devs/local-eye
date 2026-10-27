create type public.analytics_event_type as enum (
  'search',
  'result_click',
  'source_click',
  'registration_click',
  'save'
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  anon_id text not null check (length(anon_id) > 0),
  event_type public.analytics_event_type not null,
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now()
);

create index analytics_events_created_at_idx
  on public.analytics_events (created_at desc);
create index analytics_events_anon_id_created_at_idx
  on public.analytics_events (anon_id, created_at desc);

alter table public.analytics_events enable row level security;

revoke all on table public.analytics_events from anon, authenticated;
grant insert on table public.analytics_events to anon;
grant all on table public.analytics_events to service_role;

create policy "Anonymous users can insert analytics events"
on public.analytics_events
for insert
to anon
with check (true);