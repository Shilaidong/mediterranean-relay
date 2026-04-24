import type {
  AppProfile,
  CommunityPost,
  ListingSummary,
  ProfileResponse,
} from '@/lib/types';
import { isSystemProfile } from '@/lib/admin';

export function mapListing(row: any): ListingSummary {
  const release = row.inventory?.release ?? {};
  const seller = row.seller ?? {};

  return {
    id: row.id,
    source: isSystemProfile(seller.username) ? 'system' : 'relay',
    headline: row.headline,
    description: row.description ?? null,
    askingPrice: row.asking_price,
    status: row.status,
    createdAt: row.created_at,
    coverPhotoUrl: row.cover_photo_url ?? null,
    seller: {
      id: seller.id,
      username: seller.username ?? 'Relay House',
      avatarUrl: seller.avatar_url ?? null,
    },
    release: {
      id: release.id,
      slug: release.slug,
      title: release.title,
      artist: release.artist,
      year: release.year,
      genre: release.genre,
      rarity: release.rarity,
      coverUrl: release.cover_url ?? null,
      suggestedPriceMin: release.suggested_price_min ?? null,
      suggestedPriceMax: release.suggested_price_max ?? null,
      matrixCodes: release.matrix_codes ?? [],
      tracklist: release.tracklist ?? [],
    },
    inventory: {
      id: row.inventory?.id,
      conditionGrade: row.inventory?.condition_grade ?? 'Very Good',
      conditionNotes: row.inventory?.condition_notes ?? [],
      photoUrls: row.inventory?.photo_urls ?? [],
    },
  };
}

export function mapPost(row: any): CommunityPost {
  return {
    id: row.id,
    source: isSystemProfile(row.author?.username) ? 'system' : 'relay',
    title: row.title,
    body: row.body ?? null,
    createdAt: row.created_at,
    coverImageUrl: row.cover_image_url ?? null,
    author: {
      id: row.author?.id,
      username: row.author?.username ?? 'Relay House',
      avatarUrl: row.author?.avatar_url ?? null,
    },
    release: row.release
      ? {
          id: row.release.id,
          title: row.release.title,
          artist: row.release.artist,
        }
      : null,
  };
}

export function mapProfileResponse(payload: {
  profile: AppProfile;
  isAdmin: boolean;
  activeListings: any[];
  ownedItems: any[];
  ledger: any[];
  orders: any[];
}): ProfileResponse {
  return {
    profile: payload.profile,
    isAdmin: payload.isAdmin,
    activeListings: payload.activeListings.map(mapListing),
    ownedItems: payload.ownedItems.map((item) => {
      const listings = Array.isArray(item.listings)
        ? item.listings
        : item.listings
          ? [item.listings]
          : [];

      return {
        id: item.id,
        conditionGrade: item.condition_grade,
        coverPhotoUrl: item.photo_urls?.[0] ?? null,
        activeListingId:
          listings.find((listing: { status: string }) => listing.status === 'active')?.id ??
          null,
        release: {
          id: item.release.id,
          title: item.release.title,
          artist: item.release.artist,
          year: item.release.year,
          coverUrl: item.release.cover_url ?? null,
        },
      };
    }),
    ledger: payload.ledger.map((entry) => ({
      id: entry.id,
      delta: entry.delta,
      balanceAfter: entry.balance_after,
      entryType: entry.entry_type,
      note: entry.note ?? null,
      createdAt: entry.created_at,
    })),
    orders: payload.orders.map((order) => ({
      id: order.id,
      totalPrice: order.total_price,
      completedAt: order.completed_at,
      role: order.role,
      releaseTitle: order.listing?.inventory?.release?.title ?? 'Unknown release',
    })),
  };
}
