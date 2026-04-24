import { supabase } from '../lib/supabase';

export interface Transaction {
  id: string;
  albumTitle: string;
  artist: string;
  price: number;
  date: string;
  cover: string;
}

export interface Post {
  id: string;
  title: string;
  author: string;
  replies: number;
  cover?: string;
  time: string;
}

export interface Collector {
  id: string;
  name: string;
  avatar: string;
  followers: number;
}

// Get recent transactions
export async function fetchTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, album:albums(title, artist, cover)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data || []).map((t: any) => ({
    id: t.id,
    albumTitle: t.album?.title || 'Unknown',
    artist: t.album?.artist || 'Unknown',
    price: t.price,
    date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cover: t.album?.cover || '',
  }));
}

// Get posts
export async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles(username)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    author: p.author?.username || 'Anonymous',
    replies: 0,
    cover: p.cover_url,
    time: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));
}

// Get collectors (profiles with most credits/activity)
export async function fetchCollectors() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, credits')
    .order('credits', { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.username,
    avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${p.username}&background=E8E4D9&color=1A4B9E`,
    followers: p.credits,
  }));
}

// Create post
export async function createPost(title: string, content?: string, coverUrl?: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: userData.user.id,
      title,
      content,
      cover_url: coverUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
