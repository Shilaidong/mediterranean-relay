import { requireUser } from '@/lib/auth';
import { ProfilePageClient } from '@/components/profile-page-client';

export default async function ProfilePage() {
  await requireUser('/profile');
  return <ProfilePageClient />;
}
