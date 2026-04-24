import { jsonError, jsonOk } from '@/lib/http';
import { hasSupabasePublicEnv } from '@/lib/env';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { mapListing } from '@/lib/supabase/mappers';
import { listingSelect } from '@/lib/supabase/selects';
import { getServerSupabase } from '@/lib/supabase/server';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

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

  const body = (await request.json()) as {
    releaseId?: string;
    manualRelease?: {
      title?: string;
      artist?: string;
      year?: number;
      genre?: 'Jazz' | 'Rock' | 'Folk' | 'Soul' | 'Classical';
      matrixCode?: string;
      coverUrl?: string | null;
    };
    conditionGrade?: string;
    conditionNotes?: { label: string; x?: number; y?: number }[];
    photoUrls?: string[];
    askingPrice?: number;
    headline?: string;
    description?: string;
  };

  let releaseId = body.releaseId;

  if (!releaseId && body.manualRelease) {
    const title = body.manualRelease.title?.trim();
    const artist = body.manualRelease.artist?.trim();
    const year = Number(body.manualRelease.year);
    const genre = body.manualRelease.genre;
    const matrixCode = body.manualRelease.matrixCode?.trim();

    if (!title || !artist || !year || !genre) {
      return jsonError('Manual release requires title, artist, year, and genre.');
    }

    const admin = getAdminSupabase();
    const catalogTable = admin.from('catalog_releases' as never);
    const slugBase = slugify(`${artist}-${title}`) || slugify(title) || `release-${Date.now()}`;
    const { data: createdRelease, error: insertError } = await catalogTable
      .insert({
        slug: `${slugBase}-${Date.now().toString().slice(-6)}`,
        title,
        artist,
        year,
        genre,
        rarity: 50,
        matrix_codes: matrixCode ? [matrixCode] : [],
        cover_url: body.manualRelease.coverUrl ?? body.photoUrls?.[0] ?? null,
        description: body.description?.trim() || null,
      } as never)
      .select('id')
      .single();

    if (insertError || !createdRelease) {
      return jsonError(insertError?.message ?? 'Failed to create catalog release.', 500);
    }

    releaseId = (createdRelease as { id: string }).id;
  }

  if (!releaseId) {
    return jsonError('A catalog release must be selected or created.');
  }

  if (!body.askingPrice || body.askingPrice <= 0) {
    return jsonError('Asking price must be greater than zero.');
  }

  const { data: listingId, error: rpcError } = await supabase.rpc('create_listing', {
    p_catalog_release_id: releaseId,
    p_condition_grade: body.conditionGrade ?? 'Very Good',
    p_condition_notes: body.conditionNotes ?? [],
    p_photo_urls: body.photoUrls ?? [],
    p_asking_price: body.askingPrice,
    p_headline: body.headline?.trim() || null,
    p_description: body.description?.trim() || null,
  });

  if (rpcError || !listingId) {
    return jsonError(rpcError?.message ?? 'Failed to create listing.', 500);
  }

  const { data, error } = await supabase
    .from('market_listings')
    .select(listingSelect)
    .eq('id', listingId)
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? 'Listing created but could not be loaded.', 500);
  }

  return jsonOk({ listing: mapListing(data) }, 201);
}
