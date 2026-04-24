import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        if (index === -1) {
          return [line, ''];
        }
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

async function loadEnvFile(filename) {
  try {
    const content = await fs.readFile(path.join(rootDir, filename), 'utf8');
    return parseEnv(content);
  } catch {
    return {};
  }
}

const env = {
  ...(await loadEnvFile('.env')),
  ...(await loadEnvFile('.env.local')),
  ...process.env,
};

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_ACCOUNT = {
  email: 'relay.test.collector@medrelay.dev',
  password: 'RelayTest123!',
  username: 'RelayTestCollector',
  bio: 'QA account for Mediterranean Relay testing. Catalog data should be added through admin imports.',
  avatarUrl:
    'https://ui-avatars.com/api/?name=Relay+Test+Collector&background=E8E4D9&color=1A4B9E',
};

const LEGACY_FIXTURE = {
  profileIds: [
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
  ],
  releaseIds: [
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
  ],
  inventoryIds: [
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    '55555555-5555-5555-5555-555555555551',
    '55555555-5555-5555-5555-555555555552',
    '55555555-5555-5555-5555-555555555553',
    '55555555-5555-5555-5555-555555555554',
    '55555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555556',
  ],
  listingIds: [
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    '66666666-6666-6666-6666-666666666661',
    '66666666-6666-6666-6666-666666666662',
    '66666666-6666-6666-6666-666666666663',
    '66666666-6666-6666-6666-666666666664',
  ],
  orderIds: [
    '77777777-7777-7777-7777-777777777771',
    '77777777-7777-7777-7777-777777777772',
  ],
  postIds: [
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    '88888888-8888-8888-8888-888888888881',
    '88888888-8888-8888-8888-888888888882',
  ],
};

async function ensureTestUser() {
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    throw listError;
  }

  const existing = listed.users.find((user) => user.email === TEST_ACCOUNT.email);
  if (existing) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password: TEST_ACCOUNT.password,
      email_confirm: true,
      user_metadata: {
        username: TEST_ACCOUNT.username,
      },
    });
    if (updateError) {
      throw updateError;
    }
    return existing.id;
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: TEST_ACCOUNT.email,
    password: TEST_ACCOUNT.password,
    email_confirm: true,
    user_metadata: {
      username: TEST_ACCOUNT.username,
    },
  });

  if (createError || !created.user) {
    throw createError ?? new Error('Failed to create test user.');
  }

  return created.user.id;
}

async function cleanupLegacyFixtures() {
  await supabase
    .from('wallet_ledger')
    .delete()
    .or('note.ilike.%QA fixture%,entry_type.eq.fixture_grant');
  await supabase.from('orders').delete().in('id', LEGACY_FIXTURE.orderIds);
  await supabase.from('posts').delete().in('id', LEGACY_FIXTURE.postIds);
  await supabase.from('market_listings').delete().in('id', LEGACY_FIXTURE.listingIds);
  await supabase.from('inventory_items').delete().in('id', LEGACY_FIXTURE.inventoryIds);
  await supabase.from('catalog_releases').delete().in('id', LEGACY_FIXTURE.releaseIds);
  await supabase.from('profiles').delete().in('id', LEGACY_FIXTURE.profileIds);
}

async function upsertProfile(userId) {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      username: TEST_ACCOUNT.username,
      avatar_url: TEST_ACCOUNT.avatarUrl,
      bio: TEST_ACCOUNT.bio,
      credits: 5000,
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw error;
  }
}

async function main() {
  const testUserId = await ensureTestUser();
  await cleanupLegacyFixtures();
  await upsertProfile(testUserId);

  console.log(
    JSON.stringify(
      {
        ok: true,
        email: TEST_ACCOUNT.email,
        password: TEST_ACCOUNT.password,
        username: TEST_ACCOUNT.username,
        note: 'Legacy placeholder album fixtures were not re-created.',
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
