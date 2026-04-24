import { jsonError, jsonOk } from '@/lib/http';
import {
  parseImportWorkbook,
  slugify,
  type ImportCollectionRow,
} from '@/lib/admin-import';
import { isAdminEmail } from '@/lib/env';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function findAuthUserByEmail(email: string) {
  const admin = getAdminSupabase() as any;
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(error.message);
    }

    const match = data.users.find(
      (user: { email?: string | null }) =>
        user.email?.trim().toLowerCase() === email.trim().toLowerCase(),
    );

    if (match) {
      return match;
    }

    if (data.users.length < 200) {
      return null;
    }

    page += 1;
  }
}

async function ensureTargetUser(account: {
  target_email: string;
  target_username: string;
  target_password?: string;
  avatar_url?: string;
  bio?: string;
  credits?: number;
}) {
  const admin = getAdminSupabase();
  const db = admin as any;
  const existingAuthUser = await findAuthUserByEmail(account.target_email);

  let userId = existingAuthUser?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: account.target_email,
      password: account.target_password || 'ChangeThis123!',
      email_confirm: true,
      user_metadata: {
        username: account.target_username,
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? 'Failed to create target account.');
    }

    userId = data.user.id;
  }

  const profileUpdates: Record<string, string | number | null> = {
    id: userId,
    username: account.target_username,
  };

  if (account.avatar_url?.trim()) {
    profileUpdates.avatar_url = account.avatar_url.trim();
  }
  if (account.bio?.trim()) {
    profileUpdates.bio = account.bio.trim();
  }
  if (Number.isFinite(account.credits)) {
    profileUpdates.credits = Number(account.credits);
  }

  const { error } = await db.from('profiles').upsert(profileUpdates, {
    onConflict: 'id',
  });

  if (error) {
    throw new Error(error.message);
  }

  return userId;
}

async function clearTargetContent(userId: string) {
  const admin = getAdminSupabase() as any;

  const { data: listings, error: listingsError } = await admin
    .from('market_listings')
    .select('id, inventory_item_id')
    .eq('seller_id', userId);

  if (listingsError) {
    throw new Error(listingsError.message);
  }

  const listingIds = listings?.map((listing: { id: string }) => listing.id) ?? [];

  if (listingIds.length) {
    const { data: referencedListingOrders, error: referencedListingOrdersError } = await admin
      .from('orders')
      .select('listing_id')
      .in('listing_id', listingIds);

    if (referencedListingOrdersError) {
      throw new Error(referencedListingOrdersError.message);
    }

    const protectedListingIds = new Set(
      referencedListingOrders?.map((order: { listing_id: string }) => order.listing_id) ??
        [],
    );
    const deletableListingIds = listingIds.filter(
      (listingId: string) => !protectedListingIds.has(listingId),
    );

    if (deletableListingIds.length) {
      const { error } = await admin
        .from('market_listings')
        .delete()
        .in('id', deletableListingIds);

      if (error) {
        throw new Error(error.message);
      }
    }

    if (protectedListingIds.size) {
      const { error } = await admin
        .from('market_listings')
        .update({
          status: 'sold',
          sold_at: new Date().toISOString(),
          description:
            'Retained because this listing is referenced by order history.',
        })
        .in('id', Array.from(protectedListingIds));

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  const { data: ownedInventory, error: ownedInventoryError } = await admin
    .from('inventory_items')
    .select('id')
    .eq('owner_id', userId);

  if (ownedInventoryError) {
    throw new Error(ownedInventoryError.message);
  }

  const ownedInventoryIds =
    ownedInventory?.map((item: { id: string }) => item.id) ?? [];

  if (!ownedInventoryIds.length) {
    const { error: postsError } = await admin.from('posts').delete().eq('author_id', userId);

    if (postsError) {
      throw new Error(postsError.message);
    }

    return;
  }

  const { data: referencedOrders, error: referencedOrdersError } = await admin
    .from('orders')
    .select('inventory_item_id')
    .in('inventory_item_id', ownedInventoryIds);

  if (referencedOrdersError) {
    throw new Error(referencedOrdersError.message);
  }

  const protectedInventoryIds = new Set(
    referencedOrders?.map((order: { inventory_item_id: string }) => order.inventory_item_id) ??
      [],
  );
  const deletableInventoryIds = ownedInventoryIds.filter(
    (inventoryId: string) => !protectedInventoryIds.has(inventoryId),
  );

  if (deletableInventoryIds.length) {
    const { error: inventoryError } = await admin
      .from('inventory_items')
      .delete()
      .in('id', deletableInventoryIds);

    if (inventoryError) {
      throw new Error(inventoryError.message);
    }
  }

  if (protectedInventoryIds.size) {
    const { error: inventoryError } = await admin
      .from('inventory_items')
      .update({
        provenance_note: 'Retained because this inventory item is referenced by order history.',
      })
      .in('id', Array.from(protectedInventoryIds));

    if (inventoryError) {
      throw new Error(inventoryError.message);
    }
  }

  const { error: postsError } = await admin.from('posts').delete().eq('author_id', userId);

  if (postsError) {
    throw new Error(postsError.message);
  }
}

async function upsertRelease(row: ImportCollectionRow) {
  const admin = getAdminSupabase() as any;
  const payload = {
    slug: row.slug || slugify(`${row.artist}-${row.title}-${row.year}`),
    title: row.title,
    artist: row.artist,
    year: row.year,
    genre: row.genre,
    cover_url: row.coverUrl,
    rarity: row.rarity,
    suggested_price_min: row.suggestedPriceMin,
    suggested_price_max: row.suggestedPriceMax,
    matrix_codes: row.matrixCodes,
    tracklist: row.tracklist,
  };

  const { data, error } = await admin
    .from('catalog_releases')
    .upsert(payload, { onConflict: 'slug' })
    .select('id, slug')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? `Failed to upsert release ${row.title}.`);
  }

  return data;
}

async function importCollectionRow(userId: string, row: ImportCollectionRow, releaseId: string) {
  const admin = getAdminSupabase() as any;

  const { data: inventory, error: inventoryError } = await admin
    .from('inventory_items')
    .insert({
      owner_id: userId,
      catalog_release_id: releaseId,
      acquisition_type: 'seed',
      condition_grade: row.conditionGrade,
      condition_notes: row.conditionNotes,
      photo_urls: row.photoUrls,
      provenance_note: 'Imported from admin workbook',
    })
    .select('id')
    .single();

  if (inventoryError || !inventory) {
    throw new Error(inventoryError?.message ?? `Failed to import inventory for ${row.title}.`);
  }

  if (row.publish && row.askingPrice && row.askingPrice > 0) {
    const { error: listingError } = await admin.from('market_listings').insert({
      inventory_item_id: inventory.id,
      seller_id: userId,
      headline: row.headline,
      description: row.description,
      asking_price: row.askingPrice,
      suggested_price_min: row.suggestedPriceMin,
      suggested_price_max: row.suggestedPriceMax,
      cover_photo_url: row.photoUrls[0] ?? row.coverUrl,
    });

    if (listingError) {
      throw new Error(listingError.message);
    }
  }
}

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return jsonError('Unauthorized.', 401);
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return jsonError('Excel 文件缺失。');
  }

  try {
    const parsed = parseImportWorkbook(Buffer.from(await file.arrayBuffer()));
    const targetUserId = await ensureTargetUser(parsed.account);

    if (parsed.account.clear_existing) {
      await clearTargetContent(targetUserId);
    }

    const admin = getAdminSupabase() as any;
    const currentProfileRes = await admin
      .from('profiles')
      .select('credits')
      .eq('id', targetUserId)
      .single();

    if (!currentProfileRes.error && Number.isFinite(parsed.account.credits)) {
      const nextCredits = Number(parsed.account.credits);
      const currentCredits = currentProfileRes.data?.credits ?? 0;

      await admin
        .from('profiles')
        .update({ credits: nextCredits })
        .eq('id', targetUserId);

      await admin.from('wallet_ledger').insert({
        user_id: targetUserId,
        delta: nextCredits - currentCredits,
        balance_after: nextCredits,
        entry_type: 'admin_import_seed',
        note: 'Adjusted during admin workbook import',
      });
    }

    const releaseMap = new Map<string, string>();
    let publishedCount = 0;

    for (const row of parsed.collectionRows) {
      const release = await upsertRelease(row);
      releaseMap.set(release.slug, release.id);
      await importCollectionRow(targetUserId, row, release.id);
      if (row.publish) {
        publishedCount += 1;
      }
    }

    if (parsed.postRows.length) {
      const postsPayload = parsed.postRows.map((post) => ({
        author_id: targetUserId,
        catalog_release_id: post.releaseSlug ? releaseMap.get(post.releaseSlug) ?? null : null,
        title: post.title,
        body: post.body,
        cover_image_url: post.coverImageUrl,
      }));

      const { error } = await admin.from('posts').insert(postsPayload);

      if (error) {
        throw new Error(error.message);
      }
    }

    return jsonOk({
      summary: {
        accountEmail: parsed.account.target_email,
        username: parsed.account.target_username,
        importedReleases: parsed.collectionRows.length,
        publishedListings: publishedCount,
        importedPosts: parsed.postRows.length,
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Import failed.', 500);
  }
}
