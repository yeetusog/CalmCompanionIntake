select
  q.slug,
  v.version,
  jsonb_array_length(v.schema->'questions') as question_count,
  v.published_at is not null as is_published
from public.questionnaires q
join public.questionnaire_versions v on v.questionnaire_id = q.id
where q.slug = 'intake'
order by v.version desc;
