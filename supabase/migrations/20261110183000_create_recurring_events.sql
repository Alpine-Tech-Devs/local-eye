create table public.recurring_event_series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  venue_name text not null,
  address text,
  city text not null,
  state text not null check (state ~ '^[A-Z]{2}$'),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
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
  recurrence_frequency text not null
    check (recurrence_frequency in ('weekly', 'monthly')),
  day_of_week smallint,
  day_of_month smallint,
  start_date date not null,
  end_date date,
  start_time time not null,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  time_zone text not null default 'America/New_York',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_event_series_valid_age_range
    check (min_age is null or max_age is null or max_age >= min_age),
  constraint recurring_event_series_valid_date_range
    check (end_date is null or end_date >= start_date),
  constraint recurring_event_series_valid_weekly_day
    check (
      (
        recurrence_frequency = 'weekly'
        and day_of_week is not null
        and day_of_week between 1 and 7
        and day_of_month is null
      )
      or
      (
        recurrence_frequency = 'monthly'
        and day_of_week is null
        and day_of_month is not null
        and day_of_month between 1 and 31
      )
    )
);

create table public.recurring_event_exceptions (
  series_id uuid not null
    references public.recurring_event_series (id) on delete cascade,
  occurrence_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  primary key (series_id, occurrence_date)
);

alter table public.events
  add column recurring_series_id uuid
    references public.recurring_event_series (id),
  add column recurrence_date date,
  add constraint events_recurring_occurrence_pair
    check ((recurring_series_id is null) = (recurrence_date is null)),
  add constraint events_recurring_occurrence_key
    unique (recurring_series_id, recurrence_date);

create index recurring_event_series_active_idx
  on public.recurring_event_series (is_active, start_date, end_date);

create function public.set_recurring_event_series_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger recurring_event_series_set_updated_at
before update on public.recurring_event_series
for each row
execute function public.set_recurring_event_series_updated_at();

alter table public.recurring_event_series enable row level security;
alter table public.recurring_event_exceptions enable row level security;

revoke all on table public.recurring_event_series from anon, authenticated;
revoke all on table public.recurring_event_exceptions from anon, authenticated;
grant all on table public.recurring_event_series to service_role;
grant all on table public.recurring_event_exceptions to service_role;

create function public.generate_recurring_event_occurrences(p_days_ahead integer default 365)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_series public.recurring_event_series%rowtype;
  v_today date;
  v_horizon_end date;
  v_occurrence_date date;
  v_from_date date;
  v_to_date date;
  v_inserted_count integer := 0;
  v_row_count integer;
begin
  if p_days_ahead is null or p_days_ahead < 1 or p_days_ahead > 730 then
    raise exception 'p_days_ahead must be between 1 and 730';
  end if;

  for v_series in
    select *
    from public.recurring_event_series
  loop
    v_today := (now() at time zone v_series.time_zone)::date;
    v_horizon_end := v_today + p_days_ahead;
    v_from_date := greatest(v_series.start_date, v_today);
    v_to_date := least(coalesce(v_series.end_date, v_horizon_end), v_horizon_end);

    if v_series.is_active and v_from_date <= v_to_date then
      for v_occurrence_date in
        select dates.occurrence_date::date
        from pg_catalog.generate_series(
          v_from_date::timestamp,
          v_to_date::timestamp,
          interval '1 day'
        ) as dates(occurrence_date)
        where
          (
            v_series.recurrence_frequency = 'weekly'
            and extract(isodow from dates.occurrence_date) = v_series.day_of_week
          )
          or
          (
            v_series.recurrence_frequency = 'monthly'
            and extract(day from dates.occurrence_date) = v_series.day_of_month
          )
      loop
        insert into public.events (
          title,
          description,
          venue_name,
          address,
          city,
          state,
          latitude,
          longitude,
          start_datetime,
          end_datetime,
          min_age,
          max_age,
          price_min,
          price_max,
          is_free,
          indoor_outdoor,
          category,
          registration_required,
          registration_url,
          image_url,
          source_name,
          source_url,
          last_verified_at,
          status,
          recurring_series_id,
          recurrence_date
        )
        values (
          v_series.title,
          v_series.description,
          v_series.venue_name,
          v_series.address,
          v_series.city,
          v_series.state,
          v_series.latitude,
          v_series.longitude,
          (v_occurrence_date + v_series.start_time) at time zone v_series.time_zone,
          (
            v_occurrence_date
            + v_series.start_time
            + pg_catalog.make_interval(mins => v_series.duration_minutes)
          ) at time zone v_series.time_zone,
          v_series.min_age,
          v_series.max_age,
          v_series.price_min,
          v_series.price_max,
          v_series.is_free,
          v_series.indoor_outdoor,
          v_series.category,
          v_series.registration_required,
          v_series.registration_url,
          v_series.image_url,
          v_series.source_name,
          v_series.source_url,
          now(),
          case
            when exists (
              select 1
              from public.recurring_event_exceptions as exception
              where exception.series_id = v_series.id
                and exception.occurrence_date = v_occurrence_date
            ) then 'cancelled'
            else 'published'
          end,
          v_series.id,
          v_occurrence_date
        )
        on conflict (recurring_series_id, recurrence_date) do update
        set
          title = excluded.title,
          description = excluded.description,
          venue_name = excluded.venue_name,
          address = excluded.address,
          city = excluded.city,
          state = excluded.state,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          start_datetime = excluded.start_datetime,
          end_datetime = excluded.end_datetime,
          min_age = excluded.min_age,
          max_age = excluded.max_age,
          price_min = excluded.price_min,
          price_max = excluded.price_max,
          is_free = excluded.is_free,
          indoor_outdoor = excluded.indoor_outdoor,
          category = excluded.category,
          registration_required = excluded.registration_required,
          registration_url = excluded.registration_url,
          image_url = excluded.image_url,
          source_name = excluded.source_name,
          source_url = excluded.source_url,
          last_verified_at = excluded.last_verified_at,
          status = case
            when excluded.status = 'cancelled' then 'cancelled'
            else public.events.status
          end
        where public.events.start_datetime >= now();

        get diagnostics v_row_count = row_count;
        v_inserted_count := v_inserted_count + v_row_count;
      end loop;
    end if;

    update public.events as event
    set status = 'cancelled'
    where event.recurring_series_id = v_series.id
      and event.recurrence_date >= v_today
      and event.start_datetime > now()
      and event.status = 'published'
      and (
        not v_series.is_active
        or event.recurrence_date < v_series.start_date
        or (v_series.end_date is not null and event.recurrence_date > v_series.end_date)
        or (
          v_series.recurrence_frequency = 'weekly'
          and extract(isodow from event.recurrence_date) <> v_series.day_of_week
        )
        or (
          v_series.recurrence_frequency = 'monthly'
          and extract(day from event.recurrence_date) <> v_series.day_of_month
        )
        or exists (
          select 1
          from public.recurring_event_exceptions as exception
          where exception.series_id = v_series.id
            and exception.occurrence_date = event.recurrence_date
        )
      );
  end loop;

  return v_inserted_count;
end;
$$;

revoke all on function public.generate_recurring_event_occurrences(integer)
  from public, anon, authenticated;
grant execute on function public.generate_recurring_event_occurrences(integer)
  to service_role;
