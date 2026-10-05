import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeAnalyticsEvent } from '@/lib/analytics/events';

const MAX_BODY_BYTES = 8192;

async function readLimitedBody(request: Request): Promise<string | null> {
  const length = request.headers.get('content-length');
  if (length) {
    const size = Number(length);
    if (!Number.isFinite(size) || size < 0 || size > MAX_BODY_BYTES) return null;
  }
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let body = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return body;
  } finally { reader.releaseLock(); }
}

export async function POST(request: Request) {
  try {
    const body = await readLimitedBody(request);
    if (!body) return NextResponse.json({ ok: false }, { status: 400 });
    const event = sanitizeAnalyticsEvent(JSON.parse(body));
    if (!event) return NextResponse.json({ ok: false }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase.from('analytics_events').insert({
      event_name: event.event,
      session_id: event.sessionId,
      therapist_slug: event.therapistSlug,
      questionnaire_slug: event.questionnaireSlug,
      questionnaire_version: event.questionnaireVersion,
      occurred_at: event.occurredAt ?? new Date().toISOString(),
      step_id: event.stepId ?? null,
      step_index: event.stepIndex ?? null,
      step_count: event.stepCount ?? null,
      duration_ms: event.durationMs ?? null,
      error_type: event.errorType ?? null,
      error_count: event.errorCount ?? null,
    });

    if (error) {
      console.error('analytics_persistence_failed', { code: error.code, category: 'analytics' });
      return NextResponse.json({ ok: false }, { status: 202 });
    }
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
