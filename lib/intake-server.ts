import { createAdminClient } from '@/lib/supabase/admin';
import { ayushiIntake } from '@/config/questionnaires/intake';
import type { AnswerMap, AnswerValue } from '@/lib/questionnaire/types';
import { validateAll } from '@/lib/questionnaire/engine';

export interface SubmissionRequest {
  therapistSlug: string;
  questionnaireSlug: string;
  questionnaireVersion: number;
  answers: AnswerMap;
}

function ensureAnswerSafe(value: unknown): value is AnswerValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return typeof value !== 'string' || value.length <= 10000;
  }
  if (Array.isArray(value)) return value.length <= 32 && value.every((item) => typeof item === 'string' && item.length <= 1000);
  return false;
}

export function validateSubmissionPayload(raw: unknown): SubmissionRequest | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  if (body.therapistSlug !== 'ayushi-pushkarna' || body.questionnaireSlug !== ayushiIntake.slug || body.questionnaireVersion !== ayushiIntake.version) return null;
  if (!body.answers || typeof body.answers !== 'object' || Array.isArray(body.answers)) return null;

  const answersRecord = body.answers as Record<string, unknown>;
  if (Object.keys(answersRecord).length > ayushiIntake.questions.length) return null;

  const answers: AnswerMap = {};
  for (const [questionId, value] of Object.entries(answersRecord)) {
    if (!ayushiIntake.questions.some((question) => question.id === questionId)) return null;
    if (!ensureAnswerSafe(value)) return null;
    answers[questionId] = value;
  }

  return {
    therapistSlug: 'ayushi-pushkarna',
    questionnaireSlug: ayushiIntake.slug,
    questionnaireVersion: ayushiIntake.version,
    answers,
  };
}

export async function persistSubmission(payload: SubmissionRequest): Promise<string> {
  const issues = validateAll(ayushiIntake, payload.answers);
  if (issues.length) throw new Error('Invalid intake submission.');

  const supabase = createAdminClient();
  const { data: therapist, error: therapistError } = await supabase
    .from('therapists')
    .select('id')
    .eq('slug', payload.therapistSlug)
    .eq('status', 'active')
    .single();
  if (therapistError || !therapist) throw new Error('Therapist unavailable.');

  const { data: questionnaire, error: questionnaireError } = await supabase
    .from('questionnaires')
    .select('id')
    .eq('therapist_id', therapist.id)
    .eq('slug', payload.questionnaireSlug)
    .eq('status', 'active')
    .single();
  if (questionnaireError || !questionnaire) throw new Error('Questionnaire unavailable.');

  const { data: version, error: versionError } = await supabase
    .from('questionnaire_versions')
    .select('id,version')
    .eq('questionnaire_id', questionnaire.id)
    .eq('version', payload.questionnaireVersion)
    .not('published_at', 'is', null)
    .single();
  if (versionError || !version) throw new Error('Questionnaire version unavailable.');

  const submissionId = crypto.randomUUID();
  const { error: submissionError } = await supabase.from('submissions').insert({
    id: submissionId,
    therapist_id: therapist.id,
    questionnaire_id: questionnaire.id,
    questionnaire_version_id: version.id,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
  });
  if (submissionError) throw new Error(`Submission persistence failed: ${submissionError.code}`);

  const responseRows = Object.entries(payload.answers).map(([questionId, responseValue]) => ({
    submission_id: submissionId,
    question_id: questionId,
    response_value: responseValue,
  }));
  const { error: responseError } = await supabase.from('responses').insert(responseRows);
  if (responseError) {
    await supabase.from('submissions').update({ status: 'failed' }).eq('id', submissionId);
    throw new Error(`Response persistence failed: ${responseError.code}`);
  }

  return submissionId;
}
