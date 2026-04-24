create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key,
  username text not null unique,
  avatar_url text,
  bio text,
  credits integer not null default 120 check (credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists catalog_releases (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  artist text not null,
  year integer not null check (year >= 1900 and year <= 2100),
  genre text not null check (genre in ('Jazz', 'Rock', 'Folk', 'Soul', 'Classical')),
  cover_url text,
  rarity integer not null default 50 check (rarity between 0 and 100),
  suggested_price_min integer,
  suggested_price_max integer,
  matrix_codes text[] not null default '{}',
  tracklist jsonb not null default '[]'::jsonb,
  wear_reference jsonb not null default '[]'::jsonb,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  catalog_release_id uuid not null references catalog_releases(id) on delete restrict,
  acquisition_type text not null default 'listing' check (acquisition_type in ('seed', 'listing', 'purchase')),
  condition_grade text not null default 'Very Good',
  condition_notes jsonb not null default '[]'::jsonb,
  photo_urls text[] not null default '{}',
  provenance_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists market_listings (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null unique references inventory_items(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  headline text,
  description text,
  asking_price integer not null check (asking_price > 0),
  suggested_price_min integer,
  suggested_price_max integer,
  cover_photo_url text,
  status text not null default 'active' check (status in ('active', 'sold', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sold_at timestamptz
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references market_listings(id) on delete restrict,
  inventory_item_id uuid not null references inventory_items(id) on delete restrict,
  buyer_id uuid not null references profiles(id) on delete restrict,
  seller_id uuid not null references profiles(id) on delete restrict,
  total_price integer not null check (total_price > 0),
  status text not null default 'completed' check (status in ('completed')),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  delta integer not null,
  balance_after integer not null check (balance_after >= 0),
  entry_type text not null,
  reference_type text,
  reference_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  catalog_release_id uuid references catalog_releases(id) on delete set null,
  title text not null,
  body text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_catalog_releases_slug on catalog_releases(slug);
create index if not exists idx_inventory_items_owner on inventory_items(owner_id);
create index if not exists idx_market_listings_status_created on market_listings(status, created_at desc);
create index if not exists idx_wallet_ledger_user_created on wallet_ledger(user_id, created_at desc);
create index if not exists idx_posts_created on posts(created_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on profiles;
create trigger set_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

drop trigger if exists set_inventory_updated_at on inventory_items;
create trigger set_inventory_updated_at
before update on inventory_items
for each row execute function set_updated_at();

drop trigger if exists set_market_listings_updated_at on market_listings;
create trigger set_market_listings_updated_at
before update on market_listings
for each row execute function set_updated_at();

drop trigger if exists set_posts_updated_at on posts;
create trigger set_posts_updated_at
before update on posts
for each row execute function set_updated_at();

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_username text;
begin
  new_username := nullif(trim(coalesce(new.raw_user_meta_data ->> 'username', '')), '');

  if new_username is null then
    new_username := split_part(coalesce(new.email, 'collector@relay.house'), '@', 1);
  end if;

  insert into public.profiles (id, username, credits)
  values (new.id, new_username, 120)
  on conflict (id) do nothing;

  insert into public.wallet_ledger (user_id, delta, balance_after, entry_type, note)
  values (new.id, 120, 120, 'welcome_bonus', 'New collector bonus')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

create or replace function create_listing(
  p_catalog_release_id uuid,
  p_condition_grade text,
  p_condition_notes jsonb,
  p_photo_urls text[],
  p_asking_price integer,
  p_headline text default null,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inventory_id uuid;
  v_listing_id uuid;
  v_release catalog_releases%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_release
  from catalog_releases
  where id = p_catalog_release_id;

  if not found then
    raise exception 'Release not found';
  end if;

  insert into inventory_items (
    owner_id,
    catalog_release_id,
    acquisition_type,
    condition_grade,
    condition_notes,
    photo_urls
  )
  values (
    v_user_id,
    p_catalog_release_id,
    'listing',
    coalesce(nullif(trim(p_condition_grade), ''), 'Very Good'),
    coalesce(p_condition_notes, '[]'::jsonb),
    coalesce(p_photo_urls, '{}')
  )
  returning id into v_inventory_id;

  insert into market_listings (
    inventory_item_id,
    seller_id,
    headline,
    description,
    asking_price,
    suggested_price_min,
    suggested_price_max,
    cover_photo_url
  )
  values (
    v_inventory_id,
    v_user_id,
    p_headline,
    p_description,
    p_asking_price,
    v_release.suggested_price_min,
    v_release.suggested_price_max,
    coalesce(p_photo_urls[1], v_release.cover_url)
  )
  returning id into v_listing_id;

  return v_listing_id;
end;
$$;

create or replace function purchase_listing(p_listing_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid := auth.uid();
  v_listing market_listings%rowtype;
  v_inventory inventory_items%rowtype;
  v_buyer profiles%rowtype;
  v_seller profiles%rowtype;
  v_order_id uuid;
begin
  if v_buyer_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_listing
  from market_listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if v_listing.status <> 'active' then
    raise exception 'Listing is no longer active';
  end if;

  if v_listing.seller_id = v_buyer_id then
    raise exception 'You cannot purchase your own listing';
  end if;

  select *
  into v_inventory
  from inventory_items
  where id = v_listing.inventory_item_id
  for update;

  select *
  into v_buyer
  from profiles
  where id = v_buyer_id
  for update;

  select *
  into v_seller
  from profiles
  where id = v_listing.seller_id
  for update;

  if v_buyer.credits < v_listing.asking_price then
    raise exception 'Insufficient credits';
  end if;

  update profiles
  set credits = credits - v_listing.asking_price
  where id = v_buyer_id;

  update profiles
  set credits = credits + v_listing.asking_price
  where id = v_listing.seller_id;

  update inventory_items
  set owner_id = v_buyer_id,
      acquisition_type = 'purchase'
  where id = v_inventory.id;

  update market_listings
  set status = 'sold',
      sold_at = now()
  where id = v_listing.id;

  insert into orders (
    listing_id,
    inventory_item_id,
    buyer_id,
    seller_id,
    total_price
  )
  values (
    v_listing.id,
    v_inventory.id,
    v_buyer_id,
    v_listing.seller_id,
    v_listing.asking_price
  )
  returning id into v_order_id;

  insert into wallet_ledger (
    user_id,
    delta,
    balance_after,
    entry_type,
    reference_type,
    reference_id,
    note
  )
  values
    (
      v_buyer_id,
      -v_listing.asking_price,
      v_buyer.credits - v_listing.asking_price,
      'purchase_debit',
      'order',
      v_order_id,
      'Purchased listing'
    ),
    (
      v_listing.seller_id,
      v_listing.asking_price,
      v_seller.credits + v_listing.asking_price,
      'listing_sale',
      'order',
      v_order_id,
      'Listing sale payout'
    );

  return v_order_id;
end;
$$;

grant execute on function create_listing(uuid, text, jsonb, text[], integer, text, text) to authenticated;
grant execute on function purchase_listing(uuid) to authenticated;

alter table profiles enable row level security;
alter table catalog_releases enable row level security;
alter table inventory_items enable row level security;
alter table market_listings enable row level security;
alter table orders enable row level security;
alter table wallet_ledger enable row level security;
alter table posts enable row level security;

create policy "Profiles are publicly readable"
on profiles for select
using (true);

create policy "Users can update their own profile"
on profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Catalog is public"
on catalog_releases for select
using (true);

create policy "Owners can read their inventory"
on inventory_items for select
using (auth.uid() = owner_id);

create policy "Owners can update their inventory"
on inventory_items for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Active listings are public, sellers can read their own"
on market_listings for select
using (status = 'active' or auth.uid() = seller_id);

create policy "Sellers can update their active listings"
on market_listings for update
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

create policy "Users can read their own orders"
on orders for select
using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Users can read their own wallet ledger"
on wallet_ledger for select
using (auth.uid() = user_id);

create policy "Posts are public"
on posts for select
using (true);

create policy "Authenticated users can publish posts"
on posts for insert
with check (auth.uid() = author_id);

create policy "Authors can update their posts"
on posts for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

insert into storage.buckets (id, name, public)
values ('listing-media', 'listing-media', true)
on conflict (id) do nothing;

create policy "Listing media is publicly readable"
on storage.objects for select
using (bucket_id = 'listing-media');

create policy "Users can upload listing media into their folder"
on storage.objects for insert
with check (
  bucket_id = 'listing-media'
  and auth.role() = 'authenticated'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Users can update their own listing media"
on storage.objects for update
using (
  bucket_id = 'listing-media'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'listing-media'
  and split_part(name, '/', 1) = auth.uid()::text
);
