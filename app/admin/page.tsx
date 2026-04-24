import { AdminPageClient } from '@/components/admin-page-client';
import { requireAdmin } from '@/lib/admin';

export default async function AdminPage() {
  await requireAdmin('/admin');
  return <AdminPageClient />;
}
