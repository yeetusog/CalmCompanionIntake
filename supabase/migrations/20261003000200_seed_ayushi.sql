-- Initial V1 seed. The therapist is linked to a Supabase Auth user later.
-- No auth password/token is stored in this database table.

do $$
declare
  v_therapist_id uuid;
  v_questionnaire_id uuid;
begin
  select id into v_therapist_id from public.therapists where slug = 'ayushi-pushkarna' limit 1;
  if v_therapist_id is null then
    insert into public.therapists (name, email, slug, status)
    values ('Ayushi Pushkarna', null, 'ayushi-pushkarna', 'active')
    returning id into v_therapist_id;
  end if;

  insert into public.therapist_profiles (
    therapist_id, display_name, introduction, specialties, session_details, contact_details, visual_config
  ) values (
    v_therapist_id,
    'Ayushi Pushkarna',
    'A warm, private space to begin the conversation at your own pace.',
    'Share what has been going on in your own words. Your intake helps create context for the first conversation.',
    'Session format, timing, and practical details can be discussed directly with Ayushi after your intake is received.',
    'Professional contact details can be configured here before publishing your final profile copy.',
    '{"accent":"160 24% 33%","background":"40 35% 97%","fontFamily":"Georgia, Cambria, Times New Roman, serif"}'::jsonb
  )
  on conflict (therapist_id) do update set
    display_name = excluded.display_name,
    introduction = excluded.introduction,
    specialties = excluded.specialties,
    session_details = excluded.session_details,
    contact_details = excluded.contact_details,
    visual_config = excluded.visual_config,
    updated_at = now();

  select id into v_questionnaire_id from public.questionnaires where public.questionnaires.therapist_id = v_therapist_id and slug = 'intake' limit 1;
  if v_questionnaire_id is null then
    insert into public.questionnaires (therapist_id, name, slug, status)
    values (v_therapist_id, 'CalmCompanion Intake', 'intake', 'active')
    returning id into v_questionnaire_id;
  else
    update public.questionnaires set name = 'CalmCompanion Intake', status = 'active', updated_at = now() where id = v_questionnaire_id;
  end if;

  insert into public.questionnaire_versions (questionnaire_id, version, schema, published_at)
  values (
    v_questionnaire_id,
    1,
    $json$
    {
      "id": "ayushi-intake-v1",
      "slug": "intake",
      "version": 1,
      "name": "CalmCompanion Intake",
      "steps": [
        {"id":"about_you","title":"A little about you","questionIds":["full_name","age","occupation","phone_number","email","current_location","preferred_language"]},
        {"id":"what_brings_you","title":"What brings you here?","questionIds":["therapy_reason"]},
        {"id":"mental_health_context","title":"Mental health context","questionIds":["mental_health_diagnosis","diagnosis_details","current_medication"]},
        {"id":"therapy_history","title":"Previous support","questionIds":["previous_therapy","previous_therapy_experience"]},
        {"id":"practical_details","title":"A practical question","questionIds":["therapy_cost_concern"]},
        {"id":"availability","title":"Availability","questionIds":["preferred_time_slots"]},
        {"id":"anything_else","title":"Anything else","questionIds":["additional_questions"]},
        {"id":"review","title":"Review your answers","questionIds":[]}
      ],
      "questions": [
        {"id":"full_name","stepId":"about_you","type":"text","label":"Full Name (you’re welcome to mention your pronouns here)","required":true},
        {"id":"age","stepId":"about_you","type":"number","label":"Age","required":true,"min":13,"max":120},
        {"id":"occupation","stepId":"about_you","type":"single_choice","label":"Occupation","required":true,"options":[{"value":"student","label":"Student"},{"value":"working_professional","label":"Working Professional"},{"value":"other","label":"Other"}]},
        {"id":"phone_number","stepId":"about_you","type":"phone","label":"Phone Number","required":true},
        {"id":"email","stepId":"about_you","type":"email","label":"Email id","required":true},
        {"id":"current_location","stepId":"about_you","type":"text","label":"Where are you currently located?","required":true},
        {"id":"preferred_language","stepId":"about_you","type":"single_choice","label":"Preferred Language","required":true,"options":[{"value":"english","label":"English"},{"value":"hindi","label":"Hindi"},{"value":"other","label":"Other"}]},
        {"id":"therapy_reason","stepId":"what_brings_you","type":"long_text","label":"What brings you to therapy at this time?","required":true},
        {"id":"mental_health_diagnosis","stepId":"mental_health_context","type":"yes_no","label":"Have you been formally diagnosed with any mental health condition?","required":true,"options":[{"value":"yes","label":"Yes"},{"value":"no","label":"No"},{"value":"not_sure","label":"Not sure / prefer to discuss this with you directly"}]},
        {"id":"diagnosis_details","stepId":"mental_health_context","type":"long_text","label":"If yes, then please specify","conditions":[{"questionId":"mental_health_diagnosis","operator":"equals","value":"yes"}]},
        {"id":"current_medication","stepId":"mental_health_context","type":"long_text","label":"Are you currently on any medication, or receiving any other kind of treatment?"},
        {"id":"previous_therapy","stepId":"therapy_history","type":"yes_no","label":"Have you been in therapy or counseling before?","required":true,"options":[{"value":"yes","label":"Yes"},{"value":"no","label":"No"}]},
        {"id":"previous_therapy_experience","stepId":"therapy_history","type":"long_text","label":"If yes, then how was your experience?","conditions":[{"questionId":"previous_therapy","operator":"equals","value":"yes"}]},
        {"id":"therapy_cost_concern","stepId":"practical_details","type":"single_choice","label":"Is the cost of therapy a concern for you right now?","required":true,"options":[{"value":"yes","label":"Yes"},{"value":"no","label":"No"},{"value":"private","label":"Prefer to discuss privately"}]},
        {"id":"preferred_time_slots","stepId":"availability","type":"long_text","label":"What time slots are you comfortable with?","required":true},
        {"id":"additional_questions","stepId":"anything_else","type":"long_text","label":"Any specific questions or thoughts you’d like to share?"}
      ]
    }
    $json$::jsonb,
    now()
  )
  on conflict (questionnaire_id, version) do update set
    schema = excluded.schema,
    published_at = excluded.published_at;
end $$;
