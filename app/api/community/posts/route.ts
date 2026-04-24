import { jsonError, jsonOk } from '@/lib/http';
import { hasSupabasePublicEnv } from '@/lib/env';
import { mapPost } from '@/lib/supabase/mappers';
import { postSelect } from '@/lib/supabase/selects';
import { getServerSupabase } from '@/lib/supabase/server';
export async function GET() {
  if (!hasSupabasePublicEnv()) {
    return jsonError('Supabase environment is not configured yet.', 503);
  }

  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('posts')
    .select(postSelect)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonOk({ posts: (data ?? []).map(mapPost) });
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
    title?: string;
    body?: string;
    coverImageUrl?: string;
    releaseId?: string | null;
  };

  if (!body.title?.trim()) {
    return jsonError('Post title is required.');
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      catalog_release_id: body.releaseId ?? null,
      title: body.title.trim(),
      body: body.body?.trim() || null,
      cover_image_url: body.coverImageUrl?.trim() || null,
    })
    .select(postSelect)
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? 'Failed to create post.', 500);
  }

  return jsonOk({ post: mapPost(data) }, 201);
}
