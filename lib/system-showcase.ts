import type { CommunityPost, ListingSummary } from '@/lib/types';

export const systemListings: ListingSummary[] = [];

export const systemPosts: CommunityPost[] = [];

export const systemCollectors: Array<{
  id: string;
  name: string;
  avatar: string;
  followers: number;
  source: 'system';
}> = [];

export const systemRecentSales: Array<{
  id: string;
  albumTitle: string;
  artist: string;
  cover: string;
  price: number;
  date: string;
  source: 'system';
}> = [];

export function getSystemListingById(_id: string) {
  return null;
}
