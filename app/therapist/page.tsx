import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SignOutButton } from '@/components/sign-out-button';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function TherapistPage() {
  let supabase;
  try { supabase = await createServerClient(); } catch { redirect('/therapist/login'); }
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect('/therapist/login');

  const admin = createAdminClient();
  const { data: therapist } = await admin.from('therapists').select('id,name,email,slug').eq('auth_user_id', userId).eq('status', 'active').single();
  if (!therapist) return <main className="flex min-h-screen items-center justify-center px-6"><div className="max-w-md text-center"><h1 className="display-type text-4xl">Therapist access is not linked.</h1><p className="body-copy mt-4">Create the Supabase Auth user and set its UUID on the corresponding therapist record.</p><SignOutButton /></div></main>;

  const { data: submissions } = await admin.from('submissions').select('id,status,submitted_at,questionnaire_version_id').eq('therapist_id', therapist.id).order('submitted_at', { ascending: false }).limit(50);
  const ids = (submissions ?? []).map((item) => item.id);
  const { data: responses } = ids.length ? await admin.from('responses').select('submission_id,question_id,response_value').in('submission_id', ids) : { data: [] };
  const grouped = new Map<string, typeof responses>();
  for (const response of responses ?? []) grouped.set(response.submission_id, [...(grouped.get(response.submission_id) ?? []), response]);

  return <main className="min-h-screen px-5 py-8 sm:px-8"><div className="mx-auto max-w-6xl space-y-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Private therapist view</p><h1 className="display-type mt-2 text-4xl">{therapist.name}</h1><p className="body-copy mt-2">{submissions?.length ?? 0} recent submission{(submissions?.length ?? 0) === 1 ? '' : 's'}.</p></div><SignOutButton /></header><div className="grid gap-4">{(submissions ?? []).map((submission) => <Card key={submission.id}><CardContent><div className="flex flex-col gap-5"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">Submission {submission.id.slice(0, 8)}…</p><p className="text-xs text-muted-foreground">{submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : '—'} · {submission.status}</p></div><span className="text-xs text-muted-foreground">Questionnaire version recorded</span></div><div className="grid gap-4 border-t border-border pt-5 md:grid-cols-2">{(grouped.get(submission.id) ?? []).map((response) => <div key={`${submission.id}-${response.question_id}`}><p className="text-sm text-muted-foreground">{response.question_id}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{Array.isArray(response.response_value) ? response.response_value.join(', ') : String(response.response_value ?? '—')}</p></div>)}</div></div></CardContent></Card>)}</div></div></main>;
}
