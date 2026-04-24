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
  bio: 'QA fixture account for full product walkthroughs across browse, sell, profile, and community.',
  avatarUrl:
    'https://ui-avatars.com/api/?name=Relay+Test+Collector&background=E8E4D9&color=1A4B9E',
};

const COUNTERPARTY_ONE_ID = '33333333-3333-3333-3333-333333333333';
const COUNTERPARTY_TWO_ID = '44444444-4444-4444-4444-444444444444';

const RELEASE_IDS = {
  kindOfBlue: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  aja: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  petSounds: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
  blueTrain: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
};

const FIXTURE_IDS = {
  inventoryOwnedBlueTrain: '55555555-5555-5555-5555-555555555551',
  inventoryOwnedPetSounds: '55555555-5555-5555-5555-555555555552',
  inventoryListingKindOfBlue: '55555555-5555-5555-5555-555555555553',
  inventoryListingAja: '55555555-5555-5555-5555-555555555554',
  inventorySoldOutgoing: '55555555-5555-5555-5555-555555555555',
  inventoryPurchasedIncoming: '55555555-5555-5555-5555-555555555556',
  listingActiveKindOfBlue: '66666666-6666-6666-6666-666666666661',
  listingActiveAja: '66666666-6666-6666-6666-666666666662',
  listingSoldOutgoing: '66666666-6666-6666-6666-666666666663',
  listingPurchasedIncoming: '66666666-6666-6666-6666-666666666664',
  orderSoldOutgoing: '77777777-7777-7777-7777-777777777771',
  orderPurchasedIncoming: '77777777-7777-7777-7777-777777777772',
  postOne: '88888888-8888-8888-8888-888888888881',
  postTwo: '88888888-8888-8888-8888-888888888882',
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

async function waitForProfile(userId) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (data?.id) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Profile trigger did not create the test profile in time.');
}

async function ensureCounterparties() {
  const { error } = await supabase.from('profiles').upsert(
    [
      {
        id: COUNTERPARTY_ONE_ID,
        username: 'RelayCounterparty',
        avatar_url:
          'https://ui-avatars.com/api/?name=Relay+Counterparty&background=E8E4D9&color=1A4B9E',
        bio: 'Fixture buyer and seller for QA transaction flows.',
        credits: 820,
      },
      {
        id: COUNTERPARTY_TWO_ID,
        username: 'HarborSeller',
        avatar_url:
          'https://ui-avatars.com/api/?name=Harbor+Seller&background=E8E4D9&color=1A4B9E',
        bio: 'Fixture counterparty used for marketplace history.',
        credits: 760,
      },
    ],
    { onConflict: 'id' },
  );

  if (error) {
    throw error;
  }
}

async function cleanupFixtures(testUserId) {
  const { error: ordersError } = await supabase
    .from('orders')
    .delete()
    .in('id', [FIXTURE_IDS.orderSoldOutgoing, FIXTURE_IDS.orderPurchasedIncoming]);
  if (ordersError) {
    throw ordersError;
  }

  const { error: listingsError } = await supabase
    .from('market_listings')
    .delete()
    .in('id', [
      FIXTURE_IDS.listingActiveKindOfBlue,
      FIXTURE_IDS.listingActiveAja,
      FIXTURE_IDS.listingSoldOutgoing,
      FIXTURE_IDS.listingPurchasedIncoming,
    ]);
  if (listingsError) {
    throw listingsError;
  }

  const { error: inventoryError } = await supabase
    .from('inventory_items')
    .delete()
    .in('id', [
      FIXTURE_IDS.inventoryOwnedBlueTrain,
      FIXTURE_IDS.inventoryOwnedPetSounds,
      FIXTURE_IDS.inventoryListingKindOfBlue,
      FIXTURE_IDS.inventoryListingAja,
      FIXTURE_IDS.inventorySoldOutgoing,
      FIXTURE_IDS.inventoryPurchasedIncoming,
    ]);
  if (inventoryError) {
    throw inventoryError;
  }

  const { error: postsError } = await supabase
    .from('posts')
    .delete()
    .in('id', [FIXTURE_IDS.postOne, FIXTURE_IDS.postTwo]);
  if (postsError) {
    throw postsError;
  }

  const { error: ledgerError } = await supabase
    .from('wallet_ledger')
    .delete()
    .eq('user_id', testUserId);
  if (ledgerError) {
    throw ledgerError;
  }
}

async function ensureCatalog() {
  const { data, error } = await supabase
    .from('catalog_releases')
    .select('id')
    .in('id', Object.values(RELEASE_IDS));

  if (error) {
    throw error;
  }

  if ((data ?? []).length !== Object.keys(RELEASE_IDS).length) {
    throw new Error('Expected seed catalog releases are missing. Run supabase/seed.sql first.');
  }
}

async function insertFixtures(testUserId) {
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: testUserId,
      username: TEST_ACCOUNT.username,
      avatar_url: TEST_ACCOUNT.avatarUrl,
      bio: TEST_ACCOUNT.bio,
      credits: 494,
    },
    { onConflict: 'id' },
  );
  if (profileError) {
    throw profileError;
  }

  const { error: inventoryError } = await supabase.from('inventory_items').upsert(
    [
      {
        id: FIXTURE_IDS.inventoryOwnedBlueTrain,
        owner_id: testUserId,
        catalog_release_id: RELEASE_IDS.blueTrain,
        acquisition_type: 'seed',
        condition_grade: 'Near Mint',
        condition_notes: [{ x: 28, y: 34, label: 'QA fixture · glossy sleeve edge' }],
        photo_urls: ['https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800'],
        provenance_note: 'QA_TEST_FIXTURE',
      },
      {
        id: FIXTURE_IDS.inventoryOwnedPetSounds,
        owner_id: testUserId,
        catalog_release_id: RELEASE_IDS.petSounds,
        acquisition_type: 'purchase',
        condition_grade: 'Very Good+',
        condition_notes: [{ x: 54, y: 62, label: 'QA fixture · light handling wear' }],
        photo_urls: ['https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=800'],
        provenance_note: 'QA_TEST_FIXTURE',
      },
      {
        id: FIXTURE_IDS.inventoryListingKindOfBlue,
        owner_id: testUserId,
        catalog_release_id: RELEASE_IDS.kindOfBlue,
        acquisition_type: 'listing',
        condition_grade: 'Near Mint',
        condition_notes: [{ x: 31, y: 41, label: 'QA fixture · archive sleeve corner mark' }],
        photo_urls: ['https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800'],
        provenance_note: 'QA_TEST_FIXTURE',
      },
      {
        id: FIXTURE_IDS.inventoryListingAja,
        owner_id: testUserId,
        catalog_release_id: RELEASE_IDS.aja,
        acquisition_type: 'listing',
        condition_grade: 'Very Good',
        condition_notes: [{ x: 48, y: 53, label: 'QA fixture · label oxidation note' }],
        photo_urls: ['https://images.unsplash.com/photo-1605672611471-782163515431?q=80&w=800'],
        provenance_note: 'QA_TEST_FIXTURE',
      },
      {
        id: FIXTURE_IDS.inventorySoldOutgoing,
        owner_id: COUNTERPARTY_ONE_ID,
        catalog_release_id: RELEASE_IDS.kindOfBlue,
        acquisition_type: 'purchase',
        condition_grade: 'Very Good+',
        condition_notes: [{ x: 36, y: 45, label: 'QA fixture · sold outgoing archive mark' }],
        photo_urls: ['https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800'],
        provenance_note: 'QA_TEST_FIXTURE',
      },
      {
        id: FIXTURE_IDS.inventoryPurchasedIncoming,
        owner_id: testUserId,
        catalog_release_id: RELEASE_IDS.blueTrain,
        acquisition_type: 'purchase',
        condition_grade: 'Near Mint',
        condition_notes: [{ x: 52, y: 38, label: 'QA fixture · purchased incoming mark' }],
        photo_urls: ['https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800'],
        provenance_note: 'QA_TEST_FIXTURE',
      },
    ],
    { onConflict: 'id' },
  );
  if (inventoryError) {
    throw inventoryError;
  }

  const { error: listingsError } = await supabase.from('market_listings').upsert(
    [
      {
        id: FIXTURE_IDS.listingActiveKindOfBlue,
        inventory_item_id: FIXTURE_IDS.inventoryListingKindOfBlue,
        seller_id: testUserId,
        headline: 'QA archive jazz copy',
        description: 'Fixture listing for browse and detail testing.',
        asking_price: 54,
        suggested_price_min: 42,
        suggested_price_max: 58,
        cover_photo_url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800',
        status: 'active',
      },
      {
        id: FIXTURE_IDS.listingActiveAja,
        inventory_item_id: FIXTURE_IDS.inventoryListingAja,
        seller_id: testUserId,
        headline: 'QA bright room rock copy',
        description: 'Fixture listing for scroll density and seller-state testing.',
        asking_price: 37,
        suggested_price_min: 28,
        suggested_price_max: 39,
        cover_photo_url: 'https://images.unsplash.com/photo-1605672611471-782163515431?q=80&w=800',
        status: 'active',
      },
      {
        id: FIXTURE_IDS.listingSoldOutgoing,
        inventory_item_id: FIXTURE_IDS.inventorySoldOutgoing,
        seller_id: testUserId,
        headline: 'QA sold archive copy',
        description: 'Fixture sold listing from the test account.',
        asking_price: 46,
        suggested_price_min: 42,
        suggested_price_max: 58,
        cover_photo_url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800',
        status: 'sold',
        sold_at: '2026-04-16T09:45:00.000Z',
      },
      {
        id: FIXTURE_IDS.listingPurchasedIncoming,
        inventory_item_id: FIXTURE_IDS.inventoryPurchasedIncoming,
        seller_id: COUNTERPARTY_TWO_ID,
        headline: 'QA purchased Coltrane copy',
        description: 'Fixture sold listing purchased by the test account.',
        asking_price: 52,
        suggested_price_min: 52,
        suggested_price_max: 67,
        cover_photo_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800',
        status: 'sold',
        sold_at: '2026-04-15T14:20:00.000Z',
      },
    ],
    { onConflict: 'id' },
  );
  if (listingsError) {
    throw listingsError;
  }

  const { error: ordersError } = await supabase.from('orders').upsert(
    [
      {
        id: FIXTURE_IDS.orderSoldOutgoing,
        listing_id: FIXTURE_IDS.listingSoldOutgoing,
        inventory_item_id: FIXTURE_IDS.inventorySoldOutgoing,
        buyer_id: COUNTERPARTY_ONE_ID,
        seller_id: testUserId,
        total_price: 46,
        status: 'completed',
        completed_at: '2026-04-16T09:45:00.000Z',
        created_at: '2026-04-16T09:45:00.000Z',
      },
      {
        id: FIXTURE_IDS.orderPurchasedIncoming,
        listing_id: FIXTURE_IDS.listingPurchasedIncoming,
        inventory_item_id: FIXTURE_IDS.inventoryPurchasedIncoming,
        buyer_id: testUserId,
        seller_id: COUNTERPARTY_TWO_ID,
        total_price: 52,
        status: 'completed',
        completed_at: '2026-04-15T14:20:00.000Z',
        created_at: '2026-04-15T14:20:00.000Z',
      },
    ],
    { onConflict: 'id' },
  );
  if (ordersError) {
    throw ordersError;
  }

  const { error: ledgerError } = await supabase.from('wallet_ledger').insert([
    {
      user_id: testUserId,
      delta: 120,
      balance_after: 120,
      entry_type: 'welcome_bonus',
      note: 'QA fixture welcome bonus',
      created_at: '2026-04-14T08:00:00.000Z',
    },
    {
      user_id: testUserId,
      delta: 380,
      balance_after: 500,
      entry_type: 'fixture_grant',
      note: 'QA fixture top-up for marketplace walkthrough',
      created_at: '2026-04-14T08:05:00.000Z',
    },
    {
      user_id: testUserId,
      delta: -52,
      balance_after: 448,
      entry_type: 'purchase',
      reference_type: 'order',
      reference_id: FIXTURE_IDS.orderPurchasedIncoming,
      note: 'Purchased Blue Train QA fixture',
      created_at: '2026-04-15T14:20:00.000Z',
    },
    {
      user_id: testUserId,
      delta: 46,
      balance_after: 494,
      entry_type: 'sale',
      reference_type: 'order',
      reference_id: FIXTURE_IDS.orderSoldOutgoing,
      note: 'Sold Kind of Blue QA fixture',
      created_at: '2026-04-16T09:45:00.000Z',
    },
  ]);
  if (ledgerError) {
    throw ledgerError;
  }

  const { error: postsError } = await supabase.from('posts').upsert(
    [
      {
        id: FIXTURE_IDS.postOne,
        author_id: testUserId,
        catalog_release_id: RELEASE_IDS.kindOfBlue,
        title: 'QA fixture · matrix notes for archive-grade jazz copies',
        body: 'Built for UI testing so the community feed shows authored posts from the test account.',
        cover_image_url:
          'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400',
      },
      {
        id: FIXTURE_IDS.postTwo,
        author_id: testUserId,
        catalog_release_id: RELEASE_IDS.blueTrain,
        title: 'QA fixture · sleeve and runout checklist before publishing',
        body: 'Second fixture thread to make the profile and community tabs feel populated.',
        cover_image_url:
          'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400',
      },
    ],
    { onConflict: 'id' },
  );
  if (postsError) {
    throw postsError;
  }
}

async function main() {
  await ensureCatalog();
  const testUserId = await ensureTestUser();
  await waitForProfile(testUserId);
  await ensureCounterparties();
  await cleanupFixtures(testUserId);
  await insertFixtures(testUserId);

  console.log(
    JSON.stringify(
      {
        ok: true,
        email: TEST_ACCOUNT.email,
        password: TEST_ACCOUNT.password,
        username: TEST_ACCOUNT.username,
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
