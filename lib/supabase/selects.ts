export const listingSelect = `
  id,
  headline,
  description,
  asking_price,
  status,
  created_at,
  cover_photo_url,
  seller:profiles!market_listings_seller_id_fkey (
    id,
    username,
    avatar_url
  ),
  inventory:inventory_items!market_listings_inventory_item_id_fkey (
    id,
    condition_grade,
    condition_notes,
    photo_urls,
    release:catalog_releases!inventory_items_catalog_release_id_fkey (
      id,
      slug,
      title,
      artist,
      year,
      genre,
      rarity,
      cover_url,
      suggested_price_min,
      suggested_price_max,
      matrix_codes,
      tracklist
    )
  )
`;

export const postSelect = `
  id,
  title,
  body,
  cover_image_url,
  created_at,
  author:profiles!posts_author_id_fkey (
    id,
    username,
    avatar_url
  ),
  release:catalog_releases!posts_catalog_release_id_fkey (
    id,
    title,
    artist
  )
`;
