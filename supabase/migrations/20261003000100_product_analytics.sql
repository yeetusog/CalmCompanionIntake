create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  session_id uuid not null,
  therapist_slug text not null,
  questionnaire_slug text not null,
  questionnaire_version integer not null check (questionnaire_version > 0),
  occurred_at timestamptz not null default now(),
  step_id text,
  step_index integer check (step_index is null or step_index >= 0),
  step_count integer check (step_count is null or step_count between 1 and 32),
  duration_ms integer check (duration_ms is null or duration_ms between 0 and 86400000),
  error_type text check (error_type is null or error_type in ('required', 'invalid_format', 'invalid_value', 'unknown')),
  error_count integer check (error_count is null or error_count between 1 and 100),
  created_at timestamptz not null default now(),
  constraint analytics_events_event_name_chk check (event_name in (
    'splash_viewed','introduction_viewed','intake_started','step_viewed',
    'step_completed','validation_error','draft_restored','draft_cleared',
    'review_viewed','submission_started','submission_completed',
    'submission_failed','intake_abandoned'
  )),
  constraint analytics_events_step_id_chk check (step_id is null or step_id in (
    'about_you','what_brings_you','mental_health_context','therapy_history','practical_details','availability','anything_else','review'
  ))
);

create index if not exists analytics_events_funnel_idx on public.analytics_events (therapist_slug, questionnaire_slug, questionnaire_version, event_name, occurred_at desc);
create index if not exists analytics_events_session_idx on public.analytics_events (session_id, occurred_at desc);
create index if not exists analytics_events_step_idx on public.analytics_events (therapist_slug, questionnaire_slug, questionnaire_version, step_index, event_name);

alter table public.analytics_events enable row level security;
revoke all on table public.analytics_events from anon, authenticated;
grant insert, select on table public.analytics_events to service_role;
