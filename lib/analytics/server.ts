import { sanitizeAnalyticsEvent, type AnalyticsEvent } from './events';
import { createAdminClient } from '@/lib/supabase/admin';

export async function recordAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  const safe = sanitizeAnalyticsEvent(event);
  if (!safe) throw new Error('Invalid analytics event');
  const supabase = createAdminClient();
  const { error } = await supabase.from('analytics_events').insert({
    event_name: safe.event,
    session_id: safe.sessionId,
    therapist_slug: safe.therapistSlug,
    questionnaire_slug: safe.questionnaireSlug,
    questionnaire_version: safe.questionnaireVersion,
    occurred_at: safe.occurredAt ?? new Date().toISOString(),
    step_id: safe.stepId ?? null,
    step_index: safe.stepIndex ?? null,
    step_count: safe.stepCount ?? null,
    duration_ms: safe.durationMs ?? null,
    error_type: safe.errorType ?? null,
    error_count: safe.errorCount ?? null,
  });
  if (error) throw new Error(`Analytics persistence failed: ${error.code}`);
}
