import { describe, expect, it } from 'vitest';
import { ayushiIntake } from '@/config/questionnaires/intake';
import { getVisibleQuestions, validateStep } from '@/lib/questionnaire/engine';

describe('questionnaire engine', () => {
  it('shows diagnosis details only after a yes diagnosis answer', () => {
    expect(getVisibleQuestions(ayushiIntake, 'mental_health_context', { mental_health_diagnosis: 'no' }).map((q) => q.id)).toEqual(['mental_health_diagnosis', 'current_medication']);
    expect(getVisibleQuestions(ayushiIntake, 'mental_health_context', { mental_health_diagnosis: 'yes' }).map((q) => q.id)).toContain('diagnosis_details');
  });

  it('shows previous therapy experience only after yes', () => {
    expect(getVisibleQuestions(ayushiIntake, 'therapy_history', { previous_therapy: 'no' }).map((q) => q.id)).toEqual(['previous_therapy']);
    expect(getVisibleQuestions(ayushiIntake, 'therapy_history', { previous_therapy: 'yes' }).map((q) => q.id)).toContain('previous_therapy_experience');
  });

  it('validates required fields and email/phone formats', () => {
    const issues = validateStep(ayushiIntake, 'about_you', { full_name: '', age: 16, occupation: 'student', phone_number: '123', email: 'bad', current_location: 'Goa', preferred_language: 'english' });
    expect(issues.map((issue) => issue.questionId)).toEqual(expect.arrayContaining(['full_name', 'phone_number', 'email']));
  });
});
