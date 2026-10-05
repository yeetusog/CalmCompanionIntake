export const ANALYTICS_EVENTS = [
  'splash_viewed', 'introduction_viewed', 'intake_started', 'step_viewed',
  'step_completed', 'validation_error', 'draft_restored', 'draft_cleared',
  'review_viewed', 'submission_started', 'submission_completed',
  'submission_failed', 'intake_abandoned',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];
export type IntakeStepId = 'about_you' | 'what_brings_you' | 'mental_health_context' | 'therapy_history' | 'practical_details' | 'availability' | 'anything_else' | 'review';

export interface AnalyticsEvent {
  event: AnalyticsEventName;
  sessionId: string;
  therapistSlug: string;
  questionnaireSlug: string;
  questionnaireVersion: number;
  occurredAt?: string;
  stepId?: IntakeStepId;
  stepIndex?: number;
  stepCount?: number;
  durationMs?: number;
  errorType?: 'required' | 'invalid_format' | 'invalid_value' | 'unknown';
  errorCount?: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,95}$/;
const STEP_IDS: readonly IntakeStepId[] = ['about_you','what_brings_you','mental_health_context','therapy_history','practical_details','availability','anything_else','review'];

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === 'string' && (ANALYTICS_EVENTS as readonly string[]).includes(value);
}

export function isStepId(value: unknown): value is IntakeStepId {
  return typeof value === 'string' && STEP_IDS.includes(value as IntakeStepId);
}

export function sanitizeAnalyticsEvent(input: unknown): AnalyticsEvent | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  if (!isAnalyticsEventName(value.event)) return null;
  if (typeof value.sessionId !== 'string' || !UUID_RE.test(value.sessionId)) return null;
  if (typeof value.therapistSlug !== 'string' || !SLUG_RE.test(value.therapistSlug)) return null;
  if (typeof value.questionnaireSlug !== 'string' || !SLUG_RE.test(value.questionnaireSlug)) return null;
  if (!Number.isInteger(value.questionnaireVersion) || Number(value.questionnaireVersion) < 1 || Number(value.questionnaireVersion) > 10000) return null;

  const event: AnalyticsEvent = {
    event: value.event,
    sessionId: value.sessionId,
    therapistSlug: value.therapistSlug,
    questionnaireSlug: value.questionnaireSlug,
    questionnaireVersion: Number(value.questionnaireVersion),
  };

  if (value.occurredAt !== undefined) {
    if (typeof value.occurredAt !== 'string' || Number.isNaN(Date.parse(value.occurredAt))) return null;
    event.occurredAt = new Date(value.occurredAt).toISOString();
  }
  if (value.stepId !== undefined) {
    if (!isStepId(value.stepId)) return null;
    event.stepId = value.stepId;
  }
  if (value.stepIndex !== undefined && (!Number.isInteger(value.stepIndex) || Number(value.stepIndex) < 0 || Number(value.stepIndex) > 31)) return null;
  if (value.stepCount !== undefined && (!Number.isInteger(value.stepCount) || Number(value.stepCount) < 1 || Number(value.stepCount) > 32)) return null;
  if (value.durationMs !== undefined && (!Number.isInteger(value.durationMs) || Number(value.durationMs) < 0 || Number(value.durationMs) > 86400000)) return null;
  if (value.errorCount !== undefined && (!Number.isInteger(value.errorCount) || Number(value.errorCount) < 1 || Number(value.errorCount) > 100)) return null;
  if (value.errorType !== undefined && !['required','invalid_format','invalid_value','unknown'].includes(String(value.errorType))) return null;
  if (value.stepIndex !== undefined) event.stepIndex = Number(value.stepIndex);
  if (value.stepCount !== undefined) event.stepCount = Number(value.stepCount);
  if (value.durationMs !== undefined) event.durationMs = Number(value.durationMs);
  if (value.errorCount !== undefined) event.errorCount = Number(value.errorCount);
  if (value.errorType !== undefined) event.errorType = value.errorType as AnalyticsEvent['errorType'];
  return event;
}
