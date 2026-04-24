import { jsonError, jsonOk } from '@/lib/http';
import { hasSupabasePublicEnv } from '@/lib/env';
import { getAdminSupabase } from '@/lib/supabase/admin';
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

  const formData = await request.formData();
  const files = formData
    .getAll('files')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!files.length) {
    return jsonError('At least one file is required.');
  }

  const admin = getAdminSupabase();
  const uploads = await Promise.all(
    files.map(async (file) => {
      const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitized}`;
      const bytes = Buffer.from(await file.arrayBuffer());

      const { error } = await admin.storage.from('listing-media').upload(path, bytes, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        throw error;
      }

      const { data } = admin.storage.from('listing-media').getPublicUrl(path);
      return data.publicUrl;
    }),
  ).catch((error: Error) => {
    throw new Error(error.message || 'Upload failed.');
  });

  return jsonOk({ photoUrls: uploads });
}
