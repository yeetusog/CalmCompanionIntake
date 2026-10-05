import { ayushiIntake } from '@/config/questionnaires/intake';
import type { QuestionnaireConfig } from '@/lib/questionnaire/types';

const questionnairesByTherapist: Record<string, QuestionnaireConfig> = {
  'ayushi-pushkarna': ayushiIntake,
};

export function getQuestionnaireForTherapist(therapistSlug: string): QuestionnaireConfig | null {
  return questionnairesByTherapist[therapistSlug] ?? null;
}
