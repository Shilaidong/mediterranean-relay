import { buildImportSpecMarkdown } from '@/lib/admin-import';
import { isAdminEmail } from '@/lib/env';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return new Response('Unauthorized', { status: 401 });
  }

  return new Response(buildImportSpecMarkdown(), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mediterranean-relay-import-spec.md"',
    },
  });
}
