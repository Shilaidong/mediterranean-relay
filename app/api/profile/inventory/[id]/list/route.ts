import { jsonError, jsonOk } from '@/lib/http';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { listingSelect } from '@/lib/supabase/selects';
import { mapListing } from '@/lib/supabase/mappers';
import { getServerSupabase } from '@/lib/supabase/server';

export async function POST(
  request: Request,
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

  let body: {
    askingPrice?: number;
    headline?: string;
    description?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError('Invalid request body.');
  }

  if (!body.askingPrice || body.askingPrice <= 0) {
    return jsonError('Asking price must be greater than zero.');
  }

  const { data: inventory, error: inventoryError } = await supabase
    .from('inventory_items')
    .select(
      'id, owner_id, photo_urls, release:catalog_releases!inventory_items_catalog_release_id_fkey(id, title, cover_url, suggested_price_min, suggested_price_max)',
    )
    .eq('id', id)
    .single();

  if (inventoryError || !inventory) {
    return jsonError(inventoryError?.message ?? 'Inventory item not found.', 404);
  }

  if (inventory.owner_id !== user.id) {
    return jsonError('You can only list items you own.', 403);
  }

  const { data: activeListing, error: activeListingError } = await supabase
    .from('market_listings')
    .select('id')
    .eq('inventory_item_id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (activeListingError) {
    return jsonError(activeListingError.message, 500);
  }

  if (activeListing) {
    return jsonError('This item is already listed.');
  }

  const release = Array.isArray(inventory.release) ? inventory.release[0] : inventory.release;

  const admin = getAdminSupabase() as any;
  const { data: created, error: createError } = await admin
    .from('market_listings')
    .insert({
      inventory_item_id: id,
      seller_id: user.id,
      headline: body.headline?.trim() || `${release?.title ?? 'Archive'} copy`,
      description: body.description?.trim() || null,
      asking_price: body.askingPrice,
      suggested_price_min: release?.suggested_price_min ?? null,
      suggested_price_max: release?.suggested_price_max ?? null,
      cover_photo_url: inventory.photo_urls?.[0] ?? release?.cover_url ?? null,
      status: 'active',
    })
    .select(listingSelect)
    .single();

  if (createError || !created) {
    return jsonError(createError?.message ?? 'Failed to create listing.', 500);
  }

  return jsonOk({ listing: mapListing(created) }, 201);
}
