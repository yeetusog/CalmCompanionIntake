import { IntakeForm } from '@/components/intake-form';
import { getPublicTherapist } from '@/lib/public-profile';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const therapist = await getPublicTherapist('ayushi-pushkarna');
  if (!therapist) {
    return <main className="flex min-h-screen items-center justify-center px-6"><div className="max-w-md text-center"><h1 className="display-type text-4xl">This intake is unavailable.</h1><p className="body-copy mt-4">The therapist profile could not be loaded. Please check the Supabase setup.</p></div></main>;
  }
  return <IntakeForm therapist={therapist} />;
}
