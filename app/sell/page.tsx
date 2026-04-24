import { requireUser } from '@/lib/auth';
import { SellPageClient } from '@/components/sell-page-client';

export default async function SellPage() {
  await requireUser('/sell');
  return <SellPageClient />;
}
