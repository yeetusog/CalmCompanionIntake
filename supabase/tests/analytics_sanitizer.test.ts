import { describe, expect, it } from 'vitest';
import { sanitizeAnalyticsEvent } from '../../lib/analytics/events';

describe('analytics sanitizer', () => {
  const base = {
    event: 'step_completed',
    sessionId: '11111111-1111-4111-8111-111111111111',
    therapistSlug: 'ayushi-pushkarna',
    questionnaireSlug: 'intake',
    questionnaireVersion: 1,
    stepId: 'about_you',
    stepIndex: 0,
    stepCount: 7,
  };

  it('accepts the allowed behavioral payload', () => expect(sanitizeAnalyticsEvent(base)).toEqual(base));
  it('does not persist sensitive fields', () => {
    const sanitized = sanitizeAnalyticsEvent({ ...base, fullName: 'Sensitive', email: 'person@example.com', answers: { therapy_reason: 'Sensitive' }, diagnosis: 'Sensitive', location: 'Sensitive' });
    expect(sanitized).not.toHaveProperty('fullName');
    expect(sanitized).not.toHaveProperty('email');
    expect(sanitized).not.toHaveProperty('answers');
    expect(sanitized).not.toHaveProperty('diagnosis');
    expect(sanitized).not.toHaveProperty('location');
  });
  it('rejects invalid event names and identifiers', () => {
    expect(sanitizeAnalyticsEvent({ ...base, event: 'made_up_event' })).toBeNull();
    expect(sanitizeAnalyticsEvent({ ...base, sessionId: 'not-a-uuid' })).toBeNull();
    expect(sanitizeAnalyticsEvent({ ...base, stepId: 'therapy_reason' })).toBeNull();
  });
});
