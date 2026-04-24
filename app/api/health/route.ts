import { jsonError, jsonOk } from '@/lib/http';
import { hasSupabasePublicEnv } from '@/lib/env';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  if (!hasSupabasePublicEnv()) {
    return jsonError('Supabase environment is not configured yet.', 503);
  }

  const supabase = await getServerSupabase();

  const [releasesRes, listingsRes, postsRes] = await Promise.all([
    supabase
      .from('catalog_releases')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('market_listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true }),
  ]);

  if (releasesRes.error || listingsRes.error || postsRes.error) {
    return jsonError(
      releasesRes.error?.message ||
        listingsRes.error?.message ||
        postsRes.error?.message ||
        'Database health check failed.',
      500,
    );
  }

  return jsonOk({
    ok: true,
    envConfigured: true,
    databaseReachable: true,
    counts: {
      catalogReleases: releasesRes.count ?? 0,
      activeListings: listingsRes.count ?? 0,
      posts: postsRes.count ?? 0,
    },
  });
}
