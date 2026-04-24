import { jsonError, jsonOk } from '@/lib/http';
import { listingSelect } from '@/lib/supabase/selects';
import { mapListing } from '@/lib/supabase/mappers';
import { getServerSupabase } from '@/lib/supabase/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError('Authentication required.', 401);
  }

  const { data: existing, error: existingError } = await supabase
    .from('market_listings')
    .select('id, seller_id, status')
    .eq('id', id)
    .single();

  if (existingError || !existing) {
    return jsonError(existingError?.message ?? 'Listing not found.', 404);
  }

  if (existing.seller_id !== user.id) {
    return jsonError('You can only manage your own listings.', 403);
  }

  if (existing.status !== 'active') {
    return jsonError('Only active listings can be cancelled.');
  }

  const { data, error } = await supabase
    .from('market_listings')
    .update({
      status: 'cancelled',
    })
    .eq('id', id)
    .eq('seller_id', user.id)
    .eq('status', 'active')
    .select(listingSelect)
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? 'Failed to cancel listing.', 500);
  }

  return jsonOk({ listing: mapListing(data) });
}
