import { jsonError, jsonOk } from '@/lib/http';
import { hasSupabasePublicEnv } from '@/lib/env';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { mapListing } from '@/lib/supabase/mappers';
import { listingSelect } from '@/lib/supabase/selects';
export async function GET() {
  if (!hasSupabasePublicEnv()) {
    return jsonError('Supabase environment is not configured yet.', 503);
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('market_listings')
    .select(listingSelect)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonOk({ listings: (data ?? []).map(mapListing) });
}
