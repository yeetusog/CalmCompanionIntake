-- Run while connected with a privileged SQL role in Supabase SQL Editor.
-- Expected: RLS enabled; anon/authenticated cannot read or write submissions/responses/analytics.

select relname, relrowsecurity
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where pg_namespace.nspname = 'public'
  and relname in ('therapists','therapist_profiles','questionnaires','questionnaire_versions','submissions','responses','analytics_events')
order by relname;

select
  has_table_privilege('anon', 'public.submissions', 'select') as anon_can_select_submissions,
  has_table_privilege('anon', 'public.submissions', 'insert') as anon_can_insert_submissions,
  has_table_privilege('authenticated', 'public.responses', 'select') as authenticated_can_select_responses,
  has_table_privilege('anon', 'public.analytics_events', 'insert') as anon_can_insert_analytics;
