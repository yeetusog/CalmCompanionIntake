import { describe, expect, it } from 'vitest';
import { validateSubmissionPayload } from '@/lib/intake-server';

describe('intake submission payload', () => {
  const base = { therapistSlug: 'ayushi-pushkarna', questionnaireSlug: 'intake', questionnaireVersion: 1, answers: {} };

  it('rejects unknown question ids', () => {
    expect(validateSubmissionPayload({ ...base, answers: { unexpected: 'value' } })).toBeNull();
  });

  it('rejects nested objects as answer values', () => {
    expect(validateSubmissionPayload({ ...base, answers: { full_name: { bad: true } } })).toBeNull();
  });
});
