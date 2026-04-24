import { supabase } from '../lib/supabase';
import { Album, Genre } from '../data/albums';

// Map Supabase album row to Album interface
export function mapAlbum(row: any, currentUserId?: string): Album {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    year: row.year,
    rarity: row.rarity,
    price: row.price,
    cover: row.cover,
    genre: row.genre as Genre,
    owned: currentUserId ? row.owner_id === currentUserId : false,
    wear: {
      grade: row.wear_grade || 'Very Good',
      notes: row.wear_notes || [],
    },
    tracks: row.tracks || [],
  };
}

// Get market albums (not owned by current user, listed for sale)
export async function fetchMarketAlbums(currentUserId?: string) {
  let query = supabase
    .from('albums')
    .select('*')
    .eq('is_listed', true);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => mapAlbum(row, currentUserId));
}

// Get user's owned albums
export async function fetchMyAlbums(userId: string) {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('owner_id', userId);
  if (error) throw error;
  return (data || []).map((row) => mapAlbum(row, userId));
}

// Get single album
export async function fetchAlbum(id: string) {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapAlbum(data) : null;
}

// List a new album
export async function listAlbum(albumData: {
  title: string;
  artist: string;
  year: number;
  rarity: number;
  price: number;
  cover: string;
  genre: Genre;
  wear_grade: string;
  wear_notes: any[];
  tracks: any[];
}) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('albums')
    .insert({
      ...albumData,
      owner_id: userData.user.id,
      is_listed: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Purchase album - calls Edge Function
export async function purchaseAlbum(albumId: string, price: number) {
  const { data, error } = await supabase.functions.invoke('purchase-album', {
    body: { albumId, price },
  });

  if (error) throw error;
  return data;
}
