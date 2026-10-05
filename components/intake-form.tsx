'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ayushiIntake } from '@/config/questionnaires/intake';
import { validateAll, validateStep, getVisibleQuestions } from '@/lib/questionnaire/engine';
import type { AnswerMap, AnswerValue, QuestionConfig } from '@/lib/questionnaire/types';
import { clearAnalyticsSession, initAnalytics, installAbandonmentTracking, markCurrentStep, markSubmissionCompleted, track } from '@/lib/analytics/client';
import { cn } from '@/lib/utils';
import type { PublicTherapist } from '@/lib/public-profile';

const DRAFT_KEY = 'calmcompanion:intake:v1:ayushi-pushkarna';

interface DraftState { answers: AnswerMap; currentStep: number; updatedAt: string; questionnaireVersion: number; }

type JourneyStage = 'splash' | 'introduction' | 'about' | 'intake' | 'success';

interface IntakeFormProps { therapist: PublicTherapist; }

export function IntakeForm({ therapist }: IntakeFormProps) {
  const [stage, setStage] = useState<JourneyStage>('splash');
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const splashTracked = useRef(false);
  const introductionTracked = useRef(false);
  const restoredTracked = useRef(false);
  const lastTrackedStep = useRef<string | null>(null);
  const stepCount = ayushiIntake.steps.length - 1;

  useEffect(() => {
    initAnalytics({ therapistSlug: therapist.slug, questionnaireSlug: ayushiIntake.slug, questionnaireVersion: ayushiIntake.version });
    if (!splashTracked.current) { track('splash_viewed'); splashTracked.current = true; }
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const draft = JSON.parse(raw) as DraftState;
        if (draft && draft.questionnaireVersion === ayushiIntake.version && draft.answers && typeof draft.currentStep === 'number') {
          setAnswers(draft.answers);
          setStepIndex(Math.min(Math.max(draft.currentStep, 0), stepCount));
          setDraftAvailable(Object.keys(draft.answers).length > 0);
          if (!restoredTracked.current) { track('draft_restored'); restoredTracked.current = true; }
        }
      } catch { /* ignore malformed local draft */ }
    }
    return installAbandonmentTracking();
  }, [therapist.slug, stepCount]);

  useEffect(() => {
    if (stage !== 'introduction') return;
    if (!introductionTracked.current) { track('introduction_viewed'); introductionTracked.current = true; }
  }, [stage]);

  useEffect(() => {
    if (stage !== 'splash') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setStage('introduction'), reduced ? 350 : 1300);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'intake') return;
    const step = ayushiIntake.steps[stepIndex];
    if (!step || step.id === 'review') return;
    markCurrentStep(step.id as Parameters<typeof markCurrentStep>[0], stepIndex, stepCount);
    if (lastTrackedStep.current !== step.id) {
      track('step_viewed', { stepId: step.id as Parameters<typeof markCurrentStep>[0], stepIndex, stepCount });
      lastTrackedStep.current = step.id;
    }
    requestAnimationFrame(() => headingRef.current?.focus());
  }, [stage, stepIndex, stepCount]);


  useEffect(() => {
    if (stage !== 'intake') return;
    const payload: DraftState = { questionnaireVersion: ayushiIntake.version, answers, currentStep: stepIndex, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      setDraftAvailable(Object.keys(answers).length > 0);
    } catch { /* storage may be unavailable */ }
  }, [answers, stage, stepIndex]);

  const step = ayushiIntake.steps[stepIndex];
  const visibleQuestions = useMemo(() => getVisibleQuestions(ayushiIntake, step?.id ?? '', answers), [answers, step?.id]);
  const progress = stage === 'intake' ? Math.round((stepIndex / stepCount) * 100) : 0;

  const updateAnswer = useCallback((questionId: string, value: AnswerValue) => {
    setAnswers((current) => {
      const next = { ...current, [questionId]: value };
      if (questionId === 'mental_health_diagnosis' && value !== 'yes') delete next.diagnosis_details;
      if (questionId === 'previous_therapy' && value !== 'yes') delete next.previous_therapy_experience;
      return next;
    });
    setErrors((current) => ({ ...current, [questionId]: '' }));
    setSubmitError(null);
  }, []);

  const handleNext = () => {
    if (!step) return;
    const issues = validateStep(ayushiIntake, step.id, answers);
    if (issues.length) {
      const nextErrors: Record<string, string> = {};
      for (const issue of issues) nextErrors[issue.questionId] = issue.message;
      setErrors(nextErrors);
      track('validation_error', { stepId: step.id as Parameters<typeof markCurrentStep>[0], stepIndex, stepCount, errorType: issues[0]?.type, errorCount: issues.length });
      return;
    }
    track('step_completed', { stepId: step.id as Parameters<typeof markCurrentStep>[0], stepIndex, stepCount });
    if (stepIndex < stepCount - 1) setStepIndex((value) => value + 1);
    else {
      setStepIndex(stepCount);
      track('review_viewed', { stepId: 'review', stepIndex: stepCount, stepCount });
    }
    setErrors({});
  };

  const handleBack = () => {
    if (stepIndex === 0) { setStage('about'); return; }
    setStepIndex((value) => Math.max(0, value - 1));
    setErrors({});
  };

  const handleStart = () => {
    setStage('intake');
    setStepIndex(0);
    track('intake_started');
  };

  const clearDraft = () => {
    track('draft_cleared');
    localStorage.removeItem(DRAFT_KEY);
    clearAnalyticsSession();
    setAnswers({});
    setStepIndex(0);
    setDraftAvailable(false);
    setErrors({});
  };

  const submit = async () => {
    const issues = validateAll(ayushiIntake, answers);
    if (issues.length) {
      const firstIssue = issues[0];
      const firstStepIndex = ayushiIntake.steps.findIndex((candidate) => candidate.questionIds.includes(firstIssue.questionId));
      setStage('intake');
      setStepIndex(firstStepIndex >= 0 ? firstStepIndex : 0);
      setErrors(Object.fromEntries(issues.map((issue) => [issue.questionId, issue.message])));
      setSubmitError('Please review the highlighted answer before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    track('submission_started');
    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ therapistSlug: therapist.slug, questionnaireSlug: ayushiIntake.slug, questionnaireVersion: ayushiIntake.version, answers }),
      });
      if (!response.ok) throw new Error('submission_failed');
      localStorage.removeItem(DRAFT_KEY);
      setStage('success');
      markSubmissionCompleted();
      track('submission_completed');
      clearAnalyticsSession();
    } catch {
      setSubmitError('We could not submit your intake right now. Your local draft is still on this device.');
      track('submission_failed', { errorType: 'unknown' });
    } finally { setIsSubmitting(false); }
  };

  if (stage === 'splash') {
    return <main className="flex min-h-[100svh] items-center justify-center px-6" aria-label="CalmCompanion splash screen"><div className="splash-brand">CalmCompanion</div></main>;
  }

  if (stage === 'success') {
    return (
      <main className="mx-auto flex min-h-[100svh] w-full max-w-2xl items-center justify-center px-5 py-10">
        <Card className="w-full"><CardContent className="space-y-6 text-center sm:p-10">
          <p className="eyebrow">Thank you</p>
          <h1 className="display-type text-4xl">Your intake has been received.</h1>
          <p className="body-copy mx-auto max-w-xl">Thank you for taking the time to share what’s been going on. Ayushi can now review what you’ve shared before your next conversation.</p>
          <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-muted-foreground">Your submitted answers are now stored in the secure intake system. Your local incomplete draft has been cleared from this device.</p>
        </CardContent></Card>
      </main>
    );
  }

  if (stage === 'introduction') {
    return (
      <main className="mx-auto flex min-h-[100svh] w-full max-w-3xl items-center px-5 py-10 sm:px-8">
        <div className="w-full space-y-8">
          <p className="eyebrow">A private place to begin</p>
          <h1 className="display-type text-5xl leading-tight sm:text-6xl">You don’t have to have everything figured out.</h1>
          <p className="body-copy max-w-2xl text-xl">This is a space to share what’s been going on, at your own pace.</p>
          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button onClick={() => setStage('about')}>Continue</Button>
            {draftAvailable && <Button variant="ghost" onClick={() => { setStage('intake'); }}>Resume saved draft</Button>}
          </div>
        </div>
      </main>
    );
  }

  if (stage === 'about') {
    return (
      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="space-y-10">
          <div className="space-y-4">
            <p className="eyebrow">Meet your therapist</p>
            <h1 className="display-type text-5xl">A little about {therapist.profile.displayName.split(' ')[0]}</h1>
            <p className="body-copy max-w-2xl text-lg">{therapist.profile.introduction}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card><CardContent><h2 className="section-title">What I work with</h2><p className="body-copy mt-3">{therapist.profile.whatIWorkWith}</p></CardContent></Card>
            <Card><CardContent><h2 className="section-title">Session details</h2><p className="body-copy mt-3">{therapist.profile.sessionDetails}</p></CardContent></Card>
            <Card><CardContent><h2 className="section-title">Contact</h2><p className="body-copy mt-3">{therapist.profile.contactDetails}</p></CardContent></Card>
            <Card><CardContent><h2 className="section-title">Privacy</h2><p className="body-copy mt-3">{therapist.profile.privacy}</p></CardContent></Card>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={handleStart}>Begin intake</Button>
            {draftAvailable && <Button variant="secondary" onClick={() => setStage('intake')}>Resume saved draft</Button>}
          </div>
        </div>
      </main>
    );
  }

  if (step?.id === 'review') {
    return <ReviewStep answers={answers} onEdit={(index) => setStepIndex(index)} onBack={() => setStepIndex(stepCount - 1)} onSubmit={submit} submitError={submitError} isSubmitting={isSubmitting} onClear={clearDraft} />;
  }

  return (
    <main className="min-h-[100svh] pb-28">
      <div className="sticky top-0 z-10 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto max-w-3xl px-5 py-4 sm:px-8">
          <div className="mb-3 flex items-center justify-between gap-4 text-xs text-muted-foreground"><span>{step?.title}</span><span>{stepIndex + 1} of {stepCount}</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <h1 ref={headingRef} tabIndex={-1} className="display-type mb-8 text-4xl outline-none sm:text-5xl">{step?.title}</h1>
        <div className="space-y-7">
          {visibleQuestions.map((question) => <QuestionField key={question.id} question={question} value={answers[question.id]} error={errors[question.id]} onChange={updateAnswer} />)}
        </div>
        {submitError && <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{submitError}</p>}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Button variant="ghost" onClick={handleBack}>Back</Button>
          <div className="flex items-center gap-2"><Button variant="ghost" onClick={clearDraft}>Clear draft</Button><Button onClick={handleNext}>Next</Button></div>
        </div>
      </div>
    </main>
  );
}

function QuestionField({ question, value, error, onChange }: { question: QuestionConfig; value: AnswerValue; error?: string; onChange: (id: string, value: AnswerValue) => void }) {
  const fieldId = `question-${question.id}`;
  const help = question.helperText || question.description;
  const labelNode = <label htmlFor={fieldId} className="block text-lg font-medium leading-relaxed">{question.label}{question.required && <span aria-hidden="true"> *</span>}</label>;
  const errorNode = error ? <p id={`${fieldId}-error`} className="text-sm font-medium text-destructive" role="alert">{error}</p> : null;

  if (question.type === 'single_choice' || question.type === 'yes_no' || question.type === 'multiple_choice') {
    return <fieldset className="space-y-3" aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : undefined}>
      <legend className="block text-lg font-medium leading-relaxed">{question.label}{question.required && <span aria-hidden="true"> *</span>}</legend>
      {help && <p className="text-sm leading-6 text-muted-foreground">{help}</p>}
      <ChoiceList question={question} value={value} multiple={question.type === 'multiple_choice'} onChange={onChange} />
      {errorNode}
    </fieldset>;
  }

  return <div className="space-y-3">
    {labelNode}
    {help && <p className="text-sm leading-6 text-muted-foreground">{help}</p>}
    {question.type === 'text' && <Input id={fieldId} value={typeof value === 'string' ? value : ''} placeholder={question.placeholder} onChange={(event) => onChange(question.id, event.target.value)} aria-describedby={error ? `${fieldId}-error` : undefined} autoComplete={question.id === 'full_name' ? 'name' : 'off'} />}
    {question.type === 'email' && <Input id={fieldId} type="email" inputMode="email" autoComplete="email" value={typeof value === 'string' ? value : ''} placeholder={question.placeholder} onChange={(event) => onChange(question.id, event.target.value)} aria-describedby={error ? `${fieldId}-error` : undefined} />}
    {question.type === 'phone' && <Input id={fieldId} type="tel" inputMode="tel" autoComplete="tel" value={typeof value === 'string' ? value : ''} placeholder={question.placeholder} onChange={(event) => onChange(question.id, event.target.value)} aria-describedby={error ? `${fieldId}-error` : undefined} />}
    {question.type === 'number' && <Input id={fieldId} type="number" inputMode="numeric" value={typeof value === 'number' || typeof value === 'string' ? value : ''} min={question.min} max={question.max} onChange={(event) => onChange(question.id, event.target.value ? Number(event.target.value) : null)} aria-describedby={error ? `${fieldId}-error` : undefined} />}
    {question.type === 'long_text' && <Textarea id={fieldId} value={typeof value === 'string' ? value : ''} placeholder={question.placeholder} onChange={(event) => onChange(question.id, event.target.value)} aria-describedby={error ? `${fieldId}-error` : undefined} />}
    {question.type === 'dropdown' && <select id={fieldId} className="min-h-12 w-full rounded-xl border border-input bg-background px-4 py-3" value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(question.id, event.target.value)} aria-describedby={error ? `${fieldId}-error` : undefined}><option value="">Select an option</option>{question.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
    {errorNode}
  </div>;
}
function ChoiceList({ question, value, multiple = false, onChange }: { question: QuestionConfig; value: AnswerValue; multiple?: boolean; onChange: (id: string, value: AnswerValue) => void }) {
  const values = Array.isArray(value) ? value : [];
  return <div className="space-y-2">{question.options?.map((option) => {
    const checked = multiple ? values.includes(option.value) : value === option.value;
    return <label key={option.value} className={cn('flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 transition', checked && 'border-primary bg-primary/5')}>
      <input type={multiple ? 'checkbox' : 'radio'} name={question.id} value={option.value} checked={checked} onChange={() => {
        if (multiple) onChange(question.id, checked ? values.filter((item) => item !== option.value) : [...values, option.value]);
        else onChange(question.id, option.value);
      }} className="h-4 w-4 accent-[hsl(var(--primary))]" />
      <span className="text-sm leading-6">{option.label}</span>
    </label>;
  })}</div>;
}

function ReviewStep({ answers, onEdit, onBack, onSubmit, submitError, isSubmitting, onClear }: { answers: AnswerMap; onEdit: (index: number) => void; onBack: () => void; onSubmit: () => void; submitError: string | null; isSubmitting: boolean; onClear: () => void }) {
  return <main className="min-h-[100svh] pb-28"><div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12"><p className="eyebrow">Before you submit</p><h1 className="display-type mt-3 text-4xl sm:text-5xl">Review your answers</h1><p className="body-copy mt-4">Take a moment to check what you’ve shared. You can edit any section before submitting.</p><div className="mt-8 space-y-4">{ayushiIntake.steps.filter((step) => step.id !== 'review').map((step, index) => <Card key={step.id}><CardContent><div className="flex items-start justify-between gap-4"><div><h2 className="section-title">{step.title}</h2><div className="mt-4 space-y-4">{step.questionIds.filter((id) => getVisibleQuestions(ayushiIntake, step.id, answers).some((question) => question.id === id)).map((questionId) => { const q = ayushiIntake.questions.find((item) => item.id === questionId)!; const value = answers[questionId]; return <div key={questionId}><p className="text-sm text-muted-foreground">{q.label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{Array.isArray(value) ? value.join(', ') : String(value ?? '—')}</p></div>; })}</div></div><Button variant="ghost" className="shrink-0" onClick={() => onEdit(index)}>Edit</Button></div></CardContent></Card>)}</div>{submitError && <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{submitError}</p>}</div><div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"><div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3 sm:px-8"><Button variant="ghost" onClick={onBack}>Back</Button><div className="flex items-center gap-2"><Button variant="ghost" onClick={onClear}>Clear draft</Button><Button onClick={onSubmit} disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit intake'}</Button></div></div></div></main>;
}
