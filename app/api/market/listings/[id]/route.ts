import { jsonError, jsonOk } from '@/lib/http';
import { hasSupabasePublicEnv } from '@/lib/env';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { mapListing } from '@/lib/supabase/mappers';
import { listingSelect } from '@/lib/supabase/selects';
import { getSystemListingById } from '@/lib/system-showcase';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabasePublicEnv()) {
    return jsonError('Supabase environment is not configured yet.', 503);
  }

  const { id } = await params;
  const systemListing = getSystemListingById(id);
  if (systemListing) {
    return jsonOk({ listing: systemListing });
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('market_listings')
    .select(listingSelect)
    .eq('id', id)
    .single();

  if (error || !data) {
    return jsonError('Listing not found.', 404);
  }

  return jsonOk({ listing: mapListing(data) });
}
