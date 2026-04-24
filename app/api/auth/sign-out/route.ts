import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();

  const response = NextResponse.json({ ok: true });
  const requestCookies = await import('next/headers').then(({ cookies }) => cookies());

  for (const cookie of requestCookies.getAll()) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    }
  }

  return response;
}
