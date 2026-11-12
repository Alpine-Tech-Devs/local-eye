create or replace function public.sync_south_berwick_littles_storytime(
  p_series jsonb,
  p_exceptions jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_generated_count integer;
begin
  select public.sync_south_berwick_littles_storytime_base(
    p_series,
    p_exceptions
  )
  into v_generated_count;

  update public.recurring_event_series as series
  set is_active = coalesce(imported.is_active, true)
  from pg_catalog.jsonb_to_recordset(p_series) as imported(
    external_id text,
    is_active boolean
  )
  where series.source_id = 'south-berwick-public-library'
    and series.external_id = imported.external_id;

  perform public.generate_recurring_event_occurrences(365);

  update public.events as event
  set status = 'published'
  from public.recurring_event_series as series
  where event.recurring_series_id = series.id
    and series.source_id = 'south-berwick-public-library'
    and series.is_active
    and event.status = 'cancelled'
    and event.start_datetime > now()
    and event.recurrence_date >= series.start_date
    and (
      series.end_date is null
      or event.recurrence_date <= series.end_date
    )
    and extract(isodow from event.recurrence_date) = series.day_of_week
    and not exists (
      select 1
      from public.recurring_event_exceptions as exception
      where exception.series_id = series.id
        and exception.occurrence_date = event.recurrence_date
    );

  return v_generated_count;
end;
$$;

revoke all
on function public.sync_south_berwick_littles_storytime(jsonb, jsonb)
from public, anon, authenticated;
grant execute
on function public.sync_south_berwick_littles_storytime(jsonb, jsonb)
to service_role;
