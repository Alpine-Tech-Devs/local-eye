do $$
declare
  v_weekly_id uuid;
  v_monthly_id uuid;
  v_expected_monthly_count integer;
  v_generated_count integer;
  v_occurrence_count integer;
  v_exception_date date := current_date + 7;
begin
  insert into public.recurring_event_series (
    title,
    venue_name,
    city,
    state,
    latitude,
    longitude,
    category,
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
    'Recurrence test weekly',
    'Test venue',
    'Portsmouth',
    'NH',
    43.0718,
    -70.7626,
    'Storytime',
    'Test source',
    'https://example.com/weekly',
    'weekly',
    extract(isodow from current_date)::smallint,
    current_date,
    current_date + 21,
    '23:50',
    30,
    'UTC'
  )
  returning id into v_weekly_id;

  insert into public.recurring_event_series (
    title,
    venue_name,
    city,
    state,
    latitude,
    longitude,
    category,
    source_name,
    source_url,
    recurrence_frequency,
    day_of_month,
    start_date,
    end_date,
    start_time,
    duration_minutes,
    time_zone
  )
  values (
    'Recurrence test monthly',
    'Test venue',
    'Portsmouth',
    'NH',
    43.0718,
    -70.7626,
    'Storytime',
    'Test source',
    'https://example.com/monthly',
    'monthly',
    15,
    current_date,
    current_date + 60,
    '10:00',
    30,
    'UTC'
  )
  returning id into v_monthly_id;

  select count(*)::integer
  into v_expected_monthly_count
  from pg_catalog.generate_series(
    current_date::timestamp,
    (current_date + 60)::timestamp,
    interval '1 day'
  ) as dates(occurrence_date)
  where extract(day from dates.occurrence_date) = 15;

  select public.generate_recurring_event_occurrences(60)
  into v_generated_count;

  select count(*)::integer
  into v_occurrence_count
  from public.events
  where recurring_series_id = v_weekly_id;

  if v_occurrence_count <> 4 then
    raise exception 'Expected 4 weekly occurrences, got %', v_occurrence_count;
  end if;

  select count(*)::integer
  into v_occurrence_count
  from public.events
  where recurring_series_id = v_monthly_id;

  if v_occurrence_count <> v_expected_monthly_count then
    raise exception 'Expected % monthly occurrences, got %',
      v_expected_monthly_count,
      v_occurrence_count;
  end if;

  perform public.generate_recurring_event_occurrences(60);

  select count(*)::integer
  into v_occurrence_count
  from public.events
  where recurring_series_id = v_weekly_id;

  if v_occurrence_count <> 4 then
    raise exception 'Repeated generation created duplicate weekly occurrences';
  end if;

  insert into public.recurring_event_exceptions (series_id, occurrence_date, reason)
  values (v_weekly_id, v_exception_date, 'Test cancellation');

  perform public.generate_recurring_event_occurrences(60);

  if not exists (
    select 1
    from public.events
    where recurring_series_id = v_weekly_id
      and recurrence_date = v_exception_date
      and status = 'cancelled'
  ) then
    raise exception 'Expected the excepted occurrence to be cancelled';
  end if;

  update public.recurring_event_series
  set day_of_week = (day_of_week % 7) + 1
  where id = v_weekly_id;

  perform public.generate_recurring_event_occurrences(60);

  if not exists (
    select 1
    from public.events
    where recurring_series_id = v_weekly_id
      and recurrence_date = v_exception_date
      and status = 'cancelled'
  ) then
    raise exception 'Changing the recurrence rule did not cancel its old future occurrence';
  end if;

  if v_generated_count < 4 + v_expected_monthly_count then
    raise exception 'Generator returned an unexpected occurrence count';
  end if;

  delete from public.events
  where recurring_series_id in (v_weekly_id, v_monthly_id);

  delete from public.recurring_event_series
  where id in (v_weekly_id, v_monthly_id);
end;
$$;
