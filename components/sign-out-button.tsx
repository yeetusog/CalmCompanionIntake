'use client';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  return <Button variant="secondary" onClick={async () => { await createClient().auth.signOut(); window.location.assign('/therapist/login'); }}>Sign out</Button>;
}
