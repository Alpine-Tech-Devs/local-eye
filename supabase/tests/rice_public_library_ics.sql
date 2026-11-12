do $$
declare
  v_tuesday date;
  v_tuesday_id uuid;
  v_uid text := 'test-tuesday-' || txid_current()::text;
  v_detail_url text := 'https://ricepl.librarycalendar.com/event/story-time-test';
  v_fragment_url text;
begin
  v_tuesday := current_date
    + ((2 - extract(isodow from current_date)::integer + 6) % 7 + 1);
  v_fragment_url :=
    'https://ricepl.librarycalendar.com/events/feed/html'
    || '?_wrapper_format=lc_calendar_feed&current_date='
    || (v_tuesday + 7)::text
    || '&ongoing_events=hide';

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
    is_free,
    indoor_outdoor,
    category,
    registration_required,
    source_name,
    source_url,
    recurrence_frequency,
    day_of_week,
    start_date,
    end_date,
    start_time,
    duration_minutes,
    time_zone
  )
  values (
    'rice-public-library',
    v_uid,
    'Story Time! Test',
    'Rice Library test',
    'Rice Public Library',
    '8 Wentworth St, Kittery, ME 03904',
    'Kittery',
    'ME',
    43.0881,
    -70.7362,
    0,
    5,
    true,
    'indoor',
    'Storytime',
    false,
    'Rice Public Library',
    'https://ricepl.librarycalendar.com/event/story-time-original',
    'weekly',
    2,
    v_tuesday,
    v_tuesday + 7,
    '10:30:00',
    30,
    'America/New_York'
  )
  returning id into v_tuesday_id;

  insert into public.rice_public_library_occurrence_source_links (
    series_id,
    occurrence_date,
    source_url
  )
  values (v_tuesday_id, v_tuesday, v_detail_url);
  insert into public.rice_public_library_occurrence_source_links (
    series_id,
    occurrence_date,
    source_url
  )
  values (v_tuesday_id, v_tuesday + 7, v_fragment_url);

  perform public.generate_recurring_event_occurrences(30);

  if not exists (
    select 1
    from public.events as event
    where event.recurring_series_id = v_tuesday_id
      and event.recurrence_date = v_tuesday
      and event.source_url = v_detail_url
  ) then
    raise exception 'Rice occurrence did not use its detail-page URL';
  end if;

  update public.events
  set source_url = 'https://ricepl.librarycalendar.com/event/wrong-link'
  where recurring_series_id = v_tuesday_id
    and recurrence_date = v_tuesday;

  perform public.generate_recurring_event_occurrences(30);

  if not exists (
    select 1
    from public.events as event
    where event.recurring_series_id = v_tuesday_id
      and event.recurrence_date = v_tuesday
      and event.source_url = v_detail_url
  ) then
    raise exception 'Rice occurrence detail URL was not restored on refresh';
  end if;

  if not exists (
    select 1
    from public.events as event
    where event.recurring_series_id = v_tuesday_id
      and event.recurrence_date = v_tuesday + 7
      and event.source_url = v_fragment_url
  ) then
    raise exception 'Rice calendar fragment URL was not applied to its date';
  end if;

  delete from public.events
  where recurring_series_id = v_tuesday_id;
  delete from public.recurring_event_series
  where id = v_tuesday_id;
end;
$$;
