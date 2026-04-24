import { jsonError, jsonOk } from '@/lib/http';
import { hasSupabasePublicEnv } from '@/lib/env';
import { getServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return jsonError('Supabase environment is not configured yet.', 503);
  }

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError('Authentication required.', 401);
  }

  const body = (await request.json()) as { listingId?: string };
  if (!body.listingId) {
    return jsonError('Listing id is required.');
  }

  const { data, error } = await supabase.rpc('purchase_listing', {
    p_listing_id: body.listingId,
  });

  if (error || !data) {
    return jsonError(error?.message ?? 'Purchase failed.', 400);
  }

  return jsonOk({ orderId: data });
}
