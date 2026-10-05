'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function TherapistLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      window.location.assign('/therapist');
    } catch {
      setError('Sign-in failed. Check the therapist account and try again.');
    } finally { setLoading(false); }
  }

  return <main className="flex min-h-[100svh] items-center justify-center px-5 py-10"><Card className="w-full max-w-md"><CardContent className="space-y-6 sm:p-8"><div><p className="eyebrow">CalmCompanion</p><h1 className="display-type mt-2 text-4xl">Therapist sign in</h1></div><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><label className="text-sm font-medium" htmlFor="email">Email</label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><div className="space-y-2"><label className="text-sm font-medium" htmlFor="password">Password</label><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>{error && <p className="text-sm text-destructive" role="alert">{error}</p>}<Button className="w-full" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button></form></CardContent></Card></main>;
}
