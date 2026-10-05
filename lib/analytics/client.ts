'use client';

import type { AnalyticsEvent, AnalyticsEventName, IntakeStepId } from './events';

const STORAGE_KEY = 'calmcompanion:analytics:session:v1';
const SESSION_TTL_MS = 30 * 60 * 1000;

type AnalyticsContext = Pick<AnalyticsEvent, 'therapistSlug' | 'questionnaireSlug' | 'questionnaireVersion'>;
interface SessionState { sessionId: string; lastActivityAt: number; }

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getSessionId(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const state = raw ? JSON.parse(raw) as SessionState : null;
    const now = Date.now();
    if (state && typeof state.sessionId === 'string' && now - state.lastActivityAt < SESSION_TTL_MS) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastActivityAt: now }));
      return state.sessionId;
    }
    const next = { sessionId: uuid(), lastActivityAt: now };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next.sessionId;
  } catch { return uuid(); }
}

let context: AnalyticsContext | null = null;
let abandonmentSent = false;
let submissionCompleted = false;
let currentStep: { id: IntakeStepId; index: number; count: number } | null = null;

export function initAnalytics(next: AnalyticsContext): void { context = next; }

export function track(
  event: AnalyticsEventName,
  metadata: Partial<Pick<AnalyticsEvent, 'stepId' | 'stepIndex' | 'stepCount' | 'durationMs' | 'errorType' | 'errorCount'>> = {},
): void {
  if (!context) return;
  const payload: AnalyticsEvent = { event, sessionId: getSessionId(), ...context, ...metadata };
  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

export function markCurrentStep(id: IntakeStepId, index: number, count: number): void { currentStep = { id, index, count }; }
export function markSubmissionCompleted(): void { submissionCompleted = true; }
export function trackAbandonmentOnce(): void {
  if (abandonmentSent || submissionCompleted || !currentStep) return;
  abandonmentSent = true;
  track('intake_abandoned', { stepId: currentStep.id, stepIndex: currentStep.index, stepCount: currentStep.count });
}
export function installAbandonmentTracking(): () => void {
  const handler = () => trackAbandonmentOnce();
  window.addEventListener('pagehide', handler);
  return () => window.removeEventListener('pagehide', handler);
}
export function clearAnalyticsSession(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
