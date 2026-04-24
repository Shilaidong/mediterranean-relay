import { redirect } from 'next/navigation';
import { getAdminEmails, getSystemShowcaseUsername, isAdminEmail } from '@/lib/env';
import { requireUser } from '@/lib/auth';

export async function requireAdmin(nextPath = '/admin') {
  const user = await requireUser(nextPath);

  if (!user?.email || !isAdminEmail(user.email)) {
    redirect('/browse');
  }

  return user;
}

export function hasAdminConfigured() {
  return getAdminEmails().length > 0;
}

export function isSystemProfile(username?: string | null) {
  return (
    username?.trim().toUpperCase() === getSystemShowcaseUsername().trim().toUpperCase()
  );
}
