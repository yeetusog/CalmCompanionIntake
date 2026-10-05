import { NextResponse } from 'next/server';
import { persistSubmission, validateSubmissionPayload } from '@/lib/intake-server';

const MAX_BODY_BYTES = 65536;

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

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const url = new URL(request.url);
  return origin === url.origin;
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ error: 'Unable to submit this intake.' }, { status: 403 });
    const body = await readLimitedBody(request);
    if (!body) return NextResponse.json({ error: 'Unable to submit this intake.' }, { status: 400 });
    const payload = validateSubmissionPayload(JSON.parse(body));
    if (!payload) return NextResponse.json({ error: 'Please review your answers and try again.' }, { status: 400 });
    const submissionId = await persistSubmission(payload);
    return NextResponse.json({ ok: true, submissionId }, { status: 201 });
  } catch (error) {
    console.error('intake_submission_failed', { category: 'intake', message: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'We could not submit your intake right now. Your local draft is still on this device.' }, { status: 500 });
  }
}
