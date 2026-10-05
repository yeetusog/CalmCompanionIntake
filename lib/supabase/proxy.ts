import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { getSupabasePublicConfig } from '@/lib/supabase/client';

export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabasePublicConfig();

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}