import type { AnswerMap, AnswerValue, ConditionOperator, QuestionConfig, QuestionnaireConfig } from './types';

export function getQuestion(config: QuestionnaireConfig, questionId: string): QuestionConfig | undefined {
  return config.questions.find((question) => question.id === questionId);
}

function matches(value: AnswerValue, operator: ConditionOperator, expected: string | number | boolean): boolean {
  if (operator === 'contains') {
    return Array.isArray(value) && value.includes(String(expected));
  }
  if (operator === 'equals') return String(value ?? '') === String(expected);
  return String(value ?? '') !== String(expected);
}

export function isQuestionVisible(question: QuestionConfig, answers: AnswerMap): boolean {
  if (!question.conditions?.length) return true;
  return question.conditions.every((condition) => matches(answers[condition.questionId], condition.operator, condition.value));
}

export function getVisibleQuestions(config: QuestionnaireConfig, stepId: string, answers: AnswerMap): QuestionConfig[] {
  return config.questions.filter((question) => question.stepId === stepId && isQuestionVisible(question, answers));
}

function stringValue(value: AnswerValue): string {
  if (Array.isArray(value)) return value.join(', ');
  return value === null || value === undefined ? '' : String(value);
}

export interface ValidationIssue {
  questionId: string;
  type: 'required' | 'invalid_format' | 'invalid_value';
  message: string;
}

export function validateStep(config: QuestionnaireConfig, stepId: string, answers: AnswerMap): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const questions = getVisibleQuestions(config, stepId, answers);

  for (const question of questions) {
    const raw = answers[question.id];
    const text = stringValue(raw).trim();
    if (question.required && !text) {
      issues.push({ questionId: question.id, type: 'required', message: 'Please complete this field.' });
      continue;
    }
    if (!text) continue;

    if (question.options && ['single_choice', 'yes_no', 'dropdown'].includes(question.type)) {
      const allowed = new Set(question.options.map((option) => option.value));
      if (!allowed.has(text)) {
        issues.push({ questionId: question.id, type: 'invalid_value', message: 'Please choose one of the available options.' });
        continue;
      }
    }
    if (question.type === 'multiple_choice') {
      if (!Array.isArray(raw) || raw.some((item) => !question.options?.some((option) => option.value === item))) {
        issues.push({ questionId: question.id, type: 'invalid_value', message: 'Please choose valid options.' });
        continue;
      }
    }
    if (text.length > 10000) {
      issues.push({ questionId: question.id, type: 'invalid_value', message: 'Please keep this answer under 10,000 characters.' });
      continue;
    }

    if (question.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      issues.push({ questionId: question.id, type: 'invalid_format', message: 'Please enter a valid email address.' });
    }
    if (question.type === 'phone' && !/^\+?[0-9()\-\s]{8,20}$/.test(text)) {
      issues.push({ questionId: question.id, type: 'invalid_format', message: 'Please enter a valid phone number.' });
    }
    if (question.type === 'number') {
      const numeric = Number(raw);
      if (!Number.isFinite(numeric)) {
        issues.push({ questionId: question.id, type: 'invalid_value', message: 'Please enter a valid number.' });
      } else {
        if (question.min !== undefined && numeric < question.min) issues.push({ questionId: question.id, type: 'invalid_value', message: `Please enter a number of at least ${question.min}.` });
        if (question.max !== undefined && numeric > question.max) issues.push({ questionId: question.id, type: 'invalid_value', message: `Please enter a number no greater than ${question.max}.` });
      }
    }
  }

  return issues;
}

export function validateAll(config: QuestionnaireConfig, answers: AnswerMap): ValidationIssue[] {
  return config.steps.filter((step) => step.id !== 'review').flatMap((step) => validateStep(config, step.id, answers));
}
