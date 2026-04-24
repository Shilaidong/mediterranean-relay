import { requireUser } from '@/lib/auth';
import { HomePageClient } from '@/components/home-page-client';

export default async function HomePage() {
  await requireUser('/home');
  return <HomePageClient />;
}
