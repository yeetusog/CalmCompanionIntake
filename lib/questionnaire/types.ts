export type QuestionType =
  | 'text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'number'
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'yes_no';

export type ConditionOperator = 'equals' | 'not_equals' | 'contains';

export interface QuestionCondition {
  questionId: string;
  operator: ConditionOperator;
  value: string | number | boolean;
}

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionConfig {
  id: string;
  stepId: string;
  type: QuestionType;
  label: string;
  description?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: QuestionOption[];
  conditions?: QuestionCondition[];
}

export interface QuestionnaireStep {
  id: string;
  title: string;
  description?: string;
  questionIds: string[];
}

export interface QuestionnaireConfig {
  id: string;
  slug: string;
  version: number;
  name: string;
  steps: QuestionnaireStep[];
  questions: QuestionConfig[];
}

export type AnswerValue = string | number | boolean | string[] | null;
export type AnswerMap = Record<string, AnswerValue>;
