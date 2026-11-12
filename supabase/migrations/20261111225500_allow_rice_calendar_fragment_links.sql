alter table public.rice_public_library_occurrence_source_links
  drop constraint rice_public_library_occurrence_source_links_source_url_check,
  add constraint rice_public_library_occurrence_source_links_source_url_check
    check (
      source_url ~ '^https://ricepl\.librarycalendar\.com/event/[^/]+$'
      or source_url ~ '^https://ricepl\.librarycalendar\.com/events/feed/html\?_wrapper_format=lc_calendar_feed&current_date=\d{4}-\d{2}-\d{2}&ongoing_events=hide$'
    );
