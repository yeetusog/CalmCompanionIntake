'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('calmcompanion_render_error', { category: 'render', digest: error.digest }); }, [error]);
  return <main className="flex min-h-screen items-center justify-center px-6"><div className="max-w-md text-center"><p className="eyebrow">CalmCompanion</p><h1 className="display-type mt-3 text-4xl">Something interrupted this page.</h1><p className="body-copy mt-4">Please try again. Your local intake draft is stored separately on this device.</p><Button className="mt-6" onClick={() => reset()}>Try again</Button></div></main>;
}
