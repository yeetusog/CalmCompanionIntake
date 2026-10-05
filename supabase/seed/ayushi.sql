-- Optional manual seed/reseed script for SQL Editor.
-- Run migrations first. This script also keeps the therapist copy easy to customize.
-- The migration 20261003000200_seed_ayushi.sql already performs this seed automatically.

select id, name, email, slug, status, auth_user_id
from public.therapists
where slug = 'ayushi-pushkarna';

select q.id, q.name, q.slug, q.status, v.version, v.published_at
from public.questionnaires q
left join public.questionnaire_versions v on v.questionnaire_id = q.id
where q.slug = 'intake';
