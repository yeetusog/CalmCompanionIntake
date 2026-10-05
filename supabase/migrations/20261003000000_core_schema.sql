create extension if not exists pgcrypto;

do $$ begin
  create type public.therapist_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.questionnaire_status as enum ('draft', 'active', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.submission_status as enum ('submitted', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists public.therapists (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,95}$'),
  status public.therapist_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.therapist_profiles (
  therapist_id uuid primary key references public.therapists(id) on delete cascade,
  display_name text not null,
  introduction text not null,
  specialties text not null,
  session_details text not null,
  contact_details text not null,
  visual_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,95}$'),
  status public.questionnaire_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (therapist_id, slug)
);

create table if not exists public.questionnaire_versions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.questionnaires(id) on delete cascade,
  version integer not null check (version > 0),
  schema jsonb not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (questionnaire_id, version)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.therapists(id) on delete restrict,
  questionnaire_id uuid not null references public.questionnaires(id) on delete restrict,
  questionnaire_version_id uuid not null references public.questionnaire_versions(id) on delete restrict,
  status public.submission_status not null default 'submitted',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  question_id text not null,
  response_value jsonb not null,
  created_at timestamptz not null default now(),
  unique (submission_id, question_id)
);

create index if not exists submissions_therapist_submitted_idx on public.submissions(therapist_id, submitted_at desc);
create index if not exists responses_submission_idx on public.responses(submission_id);
create index if not exists questionnaire_versions_lookup_idx on public.questionnaire_versions(questionnaire_id, version, published_at);

alter table public.therapists enable row level security;
alter table public.therapist_profiles enable row level security;
alter table public.questionnaires enable row level security;
alter table public.questionnaire_versions enable row level security;
alter table public.submissions enable row level security;
alter table public.responses enable row level security;

revoke all on table public.therapists from anon, authenticated;
revoke all on table public.therapist_profiles from anon, authenticated;
revoke all on table public.questionnaires from anon, authenticated;
revoke all on table public.questionnaire_versions from anon, authenticated;
revoke all on table public.submissions from anon, authenticated;
revoke all on table public.responses from anon, authenticated;

grant select on public.therapists to service_role;
grant select on public.therapist_profiles to service_role;
grant select on public.questionnaires to service_role;
grant select on public.questionnaire_versions to service_role;
grant insert, select, update on public.submissions to service_role;
grant insert, select on public.responses to service_role;
grant update on public.therapists to service_role;
