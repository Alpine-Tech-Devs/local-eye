do $$
declare
  v_external_id text := 'local-ics-sync-test';
  v_start_date date;
  v_day_of_week smallint;
  v_series_payload jsonb;
  v_exception_payload jsonb;
  v_generated_count integer;
  v_series_id uuid;
  v_event_count integer;
begin
  v_start_date := current_date + 1
    + ((4 - extract(isodow from current_date)::integer + 7) % 7);
  v_day_of_week := extract(isodow from v_start_date)::smallint;
  v_series_payload := jsonb_build_array(jsonb_build_object(
    'external_id', v_external_id,
    'title', 'Littles'' Storytime',
    'description', 'Designed for ages 0-24 months.',
    'venue_name', 'South Berwick Public Library',
    'address', null,
    'city', 'South Berwick',
    'state', 'ME',
    'latitude', 43.2342,
    'longitude', -70.8095,
    'min_age', 0,
    'max_age', 2,
    'price_min', null,
    'price_max', null,
    'is_free', false,
    'indoor_outdoor', 'either',
    'category', 'Storytime',
    'registration_required', false,
    'registration_url', null,
    'image_url', null,
    'source_name', 'South Berwick Public Library',
    'source_url', 'https://example.com/library/events',
    'recurrence_frequency', 'weekly',
    'day_of_week', v_day_of_week,
    'start_date', v_start_date,
    'end_date', v_start_date + 14,
    'start_time', '10:30:00',
    'duration_minutes', 45,
    'time_zone', 'America/New_York'
  ));
  v_exception_payload := jsonb_build_array(jsonb_build_object(
    'external_id', v_external_id,
    'occurrence_date', v_start_date,
    'reason', 'Integration test exception.'
  ));

  select public.sync_south_berwick_littles_storytime(
    v_series_payload,
    v_exception_payload
  )
  into v_generated_count;

  select id
  into v_series_id
  from public.recurring_event_series
  where source_id = 'south-berwick-public-library'
    and external_id = v_external_id;

  if v_series_id is null or v_generated_count < 3 then
    raise exception 'ICS sync did not create its series and occurrences';
  end if;

  if not exists (
    select 1
    from public.events
    where recurring_series_id = v_series_id
      and recurrence_date = v_start_date
      and status = 'cancelled'
  ) then
    raise exception 'ICS exception was not applied to its occurrence';
  end if;

  perform public.sync_south_berwick_littles_storytime(
    v_series_payload,
    v_exception_payload
  );

  select count(*)::integer
  into v_event_count
  from public.events
  where recurring_series_id = v_series_id;

  if v_event_count <> 3 then
    raise exception 'Repeated ICS sync created duplicate event occurrences';
  end if;

  select public.sync_south_berwick_littles_storytime(
    v_series_payload,
    '[]'::jsonb
  )
  into v_generated_count;

  if not exists (
    select 1
    from public.events
    where recurring_series_id = v_series_id
      and recurrence_date = v_start_date
      and status = 'published'
  ) then
    raise exception 'A removed ICS exception did not republish its event';
  end if;

  v_series_payload := jsonb_set(
    v_series_payload,
    '{0,is_active}',
    'false'::jsonb
  );
  perform public.sync_south_berwick_littles_storytime(
    v_series_payload,
    '[]'::jsonb
  );

  if exists (
    select 1
    from public.events
    where recurring_series_id = v_series_id
      and start_datetime > now()
      and status = 'published'
  ) then
    raise exception 'A cancelled ICS series still has published future events';
  end if;

  delete from public.events
  where recurring_series_id = v_series_id;

  delete from public.recurring_event_series
  where id = v_series_id;
end;
$$;
