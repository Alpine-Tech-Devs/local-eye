create type public.event_category as enum (
  'Storytime',
  'Museum',
  'Playground',
  'Festival',
  'Farm',
  'Nature',
  'Arts & Crafts',
  'Music',
  'Sports',
  'Open Gym',
  'Educational',
  'Seasonal',
  'Community Event',
  'Other'
);

create type public.indoor_outdoor as enum ('indoor', 'outdoor', 'either');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  venue_name text not null,
  address text,
  city text not null,
  state text not null check (state ~ '^[A-Z]{2}$'),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  start_datetime timestamptz not null,
  end_datetime timestamptz,
  min_age numeric check (min_age is null or min_age >= 0),
  max_age numeric check (max_age is null or max_age >= 0),
  price_min numeric check (price_min is null or price_min >= 0),
  price_max numeric check (price_max is null or price_max >= 0),
  is_free boolean not null default false,
  indoor_outdoor public.indoor_outdoor not null default 'either',
  category public.event_category not null,
  registration_required boolean not null default false,
  registration_url text,
  image_url text,
  source_name text not null,
  source_url text not null,
  last_verified_at timestamptz,
  source_id text,
  external_id text,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_valid_datetime_range
    check (end_datetime is null or end_datetime >= start_datetime),
  constraint events_valid_age_range
    check (min_age is null or max_age is null or max_age >= min_age),
  constraint events_source_identity_pair
    check ((source_id is null) = (external_id is null)),
  constraint events_source_external_id_key unique (source_id, external_id)
);

create index events_start_datetime_idx on public.events (start_datetime);
create index events_city_idx on public.events (city);
create index events_is_free_idx on public.events (is_free);
create index events_age_range_idx on public.events (min_age, max_age);

create function public.set_events_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_events_updated_at();

alter table public.events enable row level security;

revoke all on table public.events from anon, authenticated;
grant select on table public.events to anon;
grant all on table public.events to service_role;

create policy "Published events are readable by anonymous users"
on public.events
for select
to anon
using (status = 'published');