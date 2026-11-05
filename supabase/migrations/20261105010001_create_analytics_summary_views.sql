create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace view private.analytics_daily_summary as
select
  created_at::date as event_date,
  count(*) filter (where event_type = 'session_start') as session_starts,
  count(*) filter (where event_type = 'search') as searches,
  count(*) filter (where event_type = 'result_click') as result_clicks,
  count(*) filter (where event_type = 'source_click') as source_clicks,
  count(*) filter (where event_type = 'registration_click') as registration_clicks,
  count(*) filter (where event_type = 'save') as saves,
  count(*) filter (where event_type = 'unsave') as unsaves,
  count(distinct anon_id) as unique_users
from public.analytics_events
group by created_at::date;

create or replace view private.analytics_user_summary as
select
  anon_id,
  count(distinct created_at::date) as active_days,
  count(*) filter (where event_type = 'session_start') as session_starts,
  count(*) filter (where event_type = 'search') as searches,
  count(*) filter (where event_type in ('result_click', 'source_click', 'registration_click')) as clicks,
  count(*) filter (where event_type in ('save', 'unsave')) as save_actions,
  count(distinct created_at::date) >= 2 as is_returning_user
from public.analytics_events
group by anon_id;

create or replace view private.analytics_overview as
select
  count(distinct anon_id) as unique_users,
  count(*) filter (where is_returning_user) as returning_users,
  coalesce(sum(searches), 0) as searches,
  coalesce(sum(clicks), 0) as clicks,
  coalesce(sum(save_actions), 0) as save_actions,
  coalesce(
    (sum(searches) filter (where is_returning_user))::numeric /
      nullif(count(*) filter (where is_returning_user), 0),
    0
  ) as searches_per_returning_user,
  coalesce(
    sum(clicks)::numeric / nullif(sum(searches), 0),
    0
  ) as clicks_per_search
from private.analytics_user_summary;

revoke all on all tables in schema private from public, anon, authenticated;
