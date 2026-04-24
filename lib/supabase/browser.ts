'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from '@/lib/env';

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabase() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      getPublicSupabaseUrl(),
      getPublicSupabaseAnonKey(),
    );
  }
  return browserClient;
}

export function resetBrowserSupabase() {
  browserClient = null;
}
