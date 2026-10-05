import type { QuestionnaireConfig } from '@/lib/questionnaire/types';

export const ayushiIntake: QuestionnaireConfig = {
  id: 'ayushi-intake-v1',
  slug: 'intake',
  version: 1,
  name: 'CalmCompanion Intake',
  steps: [
    { id: 'about_you', title: 'A little about you', questionIds: ['full_name', 'age', 'occupation', 'phone_number', 'email', 'current_location', 'preferred_language'] },
    { id: 'what_brings_you', title: 'What brings you here?', questionIds: ['therapy_reason'] },
    { id: 'mental_health_context', title: 'Mental health context', questionIds: ['mental_health_diagnosis', 'diagnosis_details', 'current_medication'] },
    { id: 'therapy_history', title: 'Previous support', questionIds: ['previous_therapy', 'previous_therapy_experience'] },
    { id: 'practical_details', title: 'A practical question', questionIds: ['therapy_cost_concern'] },
    { id: 'availability', title: 'Availability', questionIds: ['preferred_time_slots'] },
    { id: 'anything_else', title: 'Anything else', questionIds: ['additional_questions'] },
    { id: 'review', title: 'Review your answers', questionIds: [] },
  ],
  questions: [
    { id: 'full_name', stepId: 'about_you', type: 'text', label: 'Full Name (you’re welcome to mention your pronouns here)', required: true, placeholder: 'Your name' },
    { id: 'age', stepId: 'about_you', type: 'number', label: 'Age', required: true, min: 13, max: 120, placeholder: 'Age' },
    { id: 'occupation', stepId: 'about_you', type: 'single_choice', label: 'Occupation', required: true, options: [
      { value: 'student', label: 'Student' },
      { value: 'working_professional', label: 'Working Professional' },
      { value: 'other', label: 'Other' },
    ] },
    { id: 'phone_number', stepId: 'about_you', type: 'phone', label: 'Phone Number', required: true, placeholder: '+91 …' },
    { id: 'email', stepId: 'about_you', type: 'email', label: 'Email id', required: true, placeholder: 'you@example.com' },
    { id: 'current_location', stepId: 'about_you', type: 'text', label: 'Where are you currently located?', required: true, placeholder: 'City / country' },
    { id: 'preferred_language', stepId: 'about_you', type: 'single_choice', label: 'Preferred Language', required: true, options: [
      { value: 'english', label: 'English' },
      { value: 'hindi', label: 'Hindi' },
      { value: 'other', label: 'Other' },
    ] },
    { id: 'therapy_reason', stepId: 'what_brings_you', type: 'long_text', label: 'What brings you to therapy at this time?', required: true, placeholder: 'Share as much or as little as feels comfortable.' },
    { id: 'mental_health_diagnosis', stepId: 'mental_health_context', type: 'yes_no', label: 'Have you been formally diagnosed with any mental health condition?', required: true, options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'not_sure', label: 'Not sure / prefer to discuss this with you directly' },
    ] },
    { id: 'diagnosis_details', stepId: 'mental_health_context', type: 'long_text', label: 'If yes, then please specify', required: false, conditions: [{ questionId: 'mental_health_diagnosis', operator: 'equals', value: 'yes' }] },
    { id: 'current_medication', stepId: 'mental_health_context', type: 'long_text', label: 'Are you currently on any medication, or receiving any other kind of treatment?', required: false, placeholder: 'You can mention medication or other treatment here, or leave this blank.' },
    { id: 'previous_therapy', stepId: 'therapy_history', type: 'yes_no', label: 'Have you been in therapy or counseling before?', required: true, options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ] },
    { id: 'previous_therapy_experience', stepId: 'therapy_history', type: 'long_text', label: 'If yes, then how was your experience?', required: false, conditions: [{ questionId: 'previous_therapy', operator: 'equals', value: 'yes' }] },
    { id: 'therapy_cost_concern', stepId: 'practical_details', type: 'single_choice', label: 'Is the cost of therapy a concern for you right now?', required: true, options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'private', label: 'Prefer to discuss privately' },
    ] },
    { id: 'preferred_time_slots', stepId: 'availability', type: 'long_text', label: 'What time slots are you comfortable with?', required: true, placeholder: 'For example: weekday evenings, Saturday mornings…' },
    { id: 'additional_questions', stepId: 'anything_else', type: 'long_text', label: 'Any specific questions or thoughts you’d like to share?', required: false, placeholder: 'Anything else you would like Ayushi to know.' },
  ],
};

export function questionnairePayload(config: QuestionnaireConfig): Record<string, unknown> {
  return {
    id: config.id,
    slug: config.slug,
    version: config.version,
    name: config.name,
    steps: config.steps,
    questions: config.questions,
  };
}
