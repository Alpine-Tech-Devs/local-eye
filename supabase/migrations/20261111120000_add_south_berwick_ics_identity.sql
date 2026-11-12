alter table public.recurring_event_series
  add column source_id text,
  add column external_id text,
  add constraint recurring_event_series_source_identity_pair
    check ((source_id is null) = (external_id is null)),
  add constraint recurring_event_series_source_external_id_key
    unique (source_id, external_id);

create function public.sync_south_berwick_littles_storytime(
  p_series jsonb,
  p_exceptions jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_series record;
  v_series_id uuid;
  v_generated_count integer;
begin
  if p_series is null
    or jsonb_typeof(p_series) <> 'array'
    or jsonb_array_length(p_series) = 0
  then
    raise exception 'At least one Littles Storytime series is required';
  end if;

  if p_exceptions is null or jsonb_typeof(p_exceptions) <> 'array' then
    raise exception 'Exceptions must be supplied as an array';
  end if;

  for v_series in
    select *
    from pg_catalog.jsonb_to_recordset(p_series) as row_data(
      external_id text,
      title text,
      description text,
      venue_name text,
      address text,
      city text,
      state text,
      latitude double precision,
      longitude double precision,
      min_age numeric,
      max_age numeric,
      price_min numeric,
      price_max numeric,
      is_free boolean,
      indoor_outdoor public.indoor_outdoor,
      category public.event_category,
      registration_required boolean,
      registration_url text,
      image_url text,
      source_name text,
      source_url text,
      recurrence_frequency text,
      day_of_week smallint,
      start_date date,
      end_date date,
      start_time time,
      duration_minutes integer,
      time_zone text,
      is_active boolean
    )
  loop
    if v_series.external_id is null or btrim(v_series.external_id) = '' then
      raise exception 'Every imported series must have an external ID';
    end if;

    insert into public.recurring_event_series (
      source_id,
      external_id,
      title,
      description,
      venue_name,
      address,
      city,
      state,
      latitude,
      longitude,
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
      recurrence_frequency,
      day_of_week,
      day_of_month,
      start_date,
      end_date,
      start_time,
      duration_minutes,
      time_zone,
      is_active
    )
    values (
      'south-berwick-public-library',
      v_series.external_id,
      v_series.title,
      v_series.description,
      v_series.venue_name,
      v_series.address,
      v_series.city,
      v_series.state,
      v_series.latitude,
      v_series.longitude,
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
      v_series.recurrence_frequency,
      v_series.day_of_week,
      null,
      v_series.start_date,
      v_series.end_date,
      v_series.start_time,
      v_series.duration_minutes,
      v_series.time_zone,
      coalesce(v_series.is_active, true)
    )
    on conflict (source_id, external_id) do update
    set
      title = excluded.title,
      description = excluded.description,
      venue_name = excluded.venue_name,
      address = excluded.address,
      city = excluded.city,
      state = excluded.state,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
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
      recurrence_frequency = excluded.recurrence_frequency,
      day_of_week = excluded.day_of_week,
      day_of_month = null,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      start_time = excluded.start_time,
      duration_minutes = excluded.duration_minutes,
      time_zone = excluded.time_zone,
      is_active = excluded.is_active
    returning id into v_series_id;

    delete from public.recurring_event_exceptions
    where series_id = v_series_id;

    insert into public.recurring_event_exceptions (
      series_id,
      occurrence_date,
      reason
    )
    select
      v_series_id,
      exception.occurrence_date,
      exception.reason
    from pg_catalog.jsonb_to_recordset(p_exceptions) as exception(
      external_id text,
      occurrence_date date,
      reason text
    )
    where exception.external_id = v_series.external_id;
  end loop;

  update public.recurring_event_series
  set is_active = false
  where source_id = 'south-berwick-public-library'
    and external_id not in (
      select row_data.external_id
      from pg_catalog.jsonb_to_recordset(p_series) as row_data(external_id text)
    );

  select public.generate_recurring_event_occurrences(365)
  into v_generated_count;

  return v_generated_count;
end;
$$;

revoke all on function public.sync_south_berwick_littles_storytime(jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.sync_south_berwick_littles_storytime(jsonb, jsonb)
  to service_role;
