import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseUrl, getServiceRoleKey } from '@/lib/env';

let adminClient: ReturnType<typeof createClient> | null = null;

export function getAdminSupabase() {
  if (!adminClient) {
    adminClient = createClient(getPublicSupabaseUrl(), getServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
