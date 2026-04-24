import { buildImportTemplateWorkbook } from '@/lib/admin-import';
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

  const buffer = buildImportTemplateWorkbook();

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="mediterranean-relay-import-template.xlsx"',
    },
  });
}
