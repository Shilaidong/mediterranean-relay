import { jsonError, jsonOk } from '@/lib/http';
import { hasSupabasePublicEnv } from '@/lib/env';
import { isAdminEmail } from '@/lib/env';
import { mapProfileResponse } from '@/lib/supabase/mappers';
import { listingSelect } from '@/lib/supabase/selects';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET() {
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

  const [profileRes, activeListingsRes, ownedItemsRes, ledgerRes, ordersRes] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, credits, created_at')
        .eq('id', user.id)
        .single(),
      supabase
        .from('market_listings')
        .select(listingSelect)
        .eq('seller_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('inventory_items')
        .select(
          'id, condition_grade, photo_urls, listings:market_listings!market_listings_inventory_item_id_fkey(id, status), release:catalog_releases!inventory_items_catalog_release_id_fkey(id, title, artist, year, cover_url)',
        )
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('wallet_ledger')
        .select('id, delta, balance_after, entry_type, note, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('orders')
        .select(
          'id, total_price, completed_at, buyer_id, seller_id, listing:market_listings!orders_listing_id_fkey(inventory:inventory_items!market_listings_inventory_item_id_fkey(release:catalog_releases!inventory_items_catalog_release_id_fkey(title)))',
        )
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('completed_at', { ascending: false })
        .limit(10),
    ]);

  if (profileRes.error || !profileRes.data) {
    return jsonError(profileRes.error?.message ?? 'Profile not found.', 404);
  }

  const dashboardErrors = [
    ['active listings', activeListingsRes.error],
    ['owned items', ownedItemsRes.error],
    ['ledger', ledgerRes.error],
    ['orders', ordersRes.error],
  ].filter(([, error]) => error);

  if (dashboardErrors.length) {
    const [section, error] = dashboardErrors[0] as [
      string,
      { message?: string; code?: string } | null,
    ];

    console.error('[profile/me] dashboard query failed', {
      section,
      error,
    });

    return jsonError(
      `Failed to load profile ${section}: ${error?.message ?? 'Unknown Supabase error.'}`,
      500,
    );
  }

  return jsonOk(
    mapProfileResponse({
      profile: profileRes.data,
      isAdmin: isAdminEmail(user.email),
      activeListings: activeListingsRes.data ?? [],
      ownedItems: ownedItemsRes.data ?? [],
      ledger: ledgerRes.data ?? [],
      orders: (ordersRes.data ?? []).map((order) => ({
        ...order,
        role: order.buyer_id === user.id ? 'buyer' : 'seller',
      })),
    }),
  );
}
