import { redirect } from 'next/navigation';
import { hasSupabasePublicEnv } from '@/lib/env';
import { getServerSupabase } from '@/lib/supabase/server';

export async function requireUser(nextPath: string) {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}
