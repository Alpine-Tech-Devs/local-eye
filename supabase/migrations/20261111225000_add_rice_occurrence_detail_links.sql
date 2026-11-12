drop trigger if exists events_rice_occurrence_source_url on public.events;
drop function if exists public.set_rice_occurrence_source_url();

create table public.rice_public_library_occurrence_source_links (
  series_id uuid not null
    references public.recurring_event_series (id) on delete cascade,
  occurrence_date date not null,
  source_url text not null
    check (source_url ~ '^https://ricepl\.librarycalendar\.com/event/[^/]+$'),
  created_at timestamptz not null default now(),
  primary key (series_id, occurrence_date)
);

alter table public.rice_public_library_occurrence_source_links enable row level security;
revoke all on table public.rice_public_library_occurrence_source_links
  from public, anon, authenticated;
grant all on table public.rice_public_library_occurrence_source_links
  to service_role;

create function public.set_rice_occurrence_detail_url()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_source_url text;
begin
  if new.recurring_series_id is null or new.recurrence_date is null then
    return new;
  end if;

  if exists (
    select 1
    from public.recurring_event_series as series
    where series.id = new.recurring_series_id
      and series.source_id = 'rice-public-library'
  ) then
    select link.source_url
    into v_source_url
    from public.rice_public_library_occurrence_source_links as link
    where link.series_id = new.recurring_series_id
      and link.occurrence_date = new.recurrence_date;

    if found then
      new.source_url := v_source_url;
    end if;
  end if;

  return new;
end;
$$;

create trigger events_rice_occurrence_detail_url
before insert or update of recurring_series_id, recurrence_date, source_url
on public.events
for each row
execute function public.set_rice_occurrence_detail_url();
