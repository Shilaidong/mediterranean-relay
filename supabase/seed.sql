insert into profiles (id, username, avatar_url, bio, credits)
values
  ('11111111-1111-1111-1111-111111111111', 'Relay House', 'https://ui-avatars.com/api/?name=Relay+House&background=E8E4D9&color=1A4B9E', 'Archive steward for the marketplace.', 640),
  ('22222222-2222-2222-2222-222222222222', 'AegeanWax', 'https://ui-avatars.com/api/?name=Aegean+Wax&background=E8E4D9&color=1A4B9E', 'Mediterranean jazz and soul curator.', 410)
on conflict (id) do nothing;

insert into catalog_releases (
  id, slug, title, artist, year, genre, cover_url, rarity,
  suggested_price_min, suggested_price_max, matrix_codes, tracklist, wear_reference, description
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'kind-of-blue-monaco',
    'Kind of Blue',
    'Miles Davis',
    1959,
    'Jazz',
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800',
    82,
    42,
    58,
    '{"KOB-MC-59-A","CL-1355-A"}',
    '[{"name":"So What","duration":"9:22"},{"name":"Freddie Freeloader","duration":"9:46"},{"name":"Blue in Green","duration":"5:37"}]'::jsonb,
    '[{"x":30,"y":40,"label":"Sleeve corner wear"},{"x":70,"y":65,"label":"Fine surface line on side B"}]'::jsonb,
    'Monaco relay copy with documented matrix signatures.'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'aja-first-press',
    'Aja',
    'Steely Dan',
    1977,
    'Rock',
    'https://images.unsplash.com/photo-1605672611471-782163515431?q=80&w=800',
    61,
    28,
    39,
    '{"AJA-AB1006-A","AB1006-SRC"}',
    '[{"name":"Black Cow","duration":"5:10"},{"name":"Aja","duration":"7:56"},{"name":"Deacon Blues","duration":"7:33"}]'::jsonb,
    '[{"x":50,"y":50,"label":"Label oxidation mark"}]'::jsonb,
    'Well-kept first-press copy with mellow top end.'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'pet-sounds-1966',
    'Pet Sounds',
    'The Beach Boys',
    1966,
    'Soul',
    'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=800',
    68,
    34,
    46,
    '{"PS-66-A","T-2458-A"}',
    '[{"name":"Wouldn''t It Be Nice","duration":"2:25"},{"name":"God Only Knows","duration":"2:51"}]'::jsonb,
    '[{"x":40,"y":60,"label":"Minor handling marks"}]'::jsonb,
    'Warm-toned West Coast soul-pop benchmark.'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    'blue-train-deep-cut',
    'Blue Train',
    'John Coltrane',
    1957,
    'Jazz',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800',
    87,
    52,
    67,
    '{"BLUETRAIN-RVG","BN1577-A"}',
    '[{"name":"Blue Train","duration":"10:42"},{"name":"Moment''s Notice","duration":"9:10"},{"name":"Locomotion","duration":"7:14"}]'::jsonb,
    '[]'::jsonb,
    'High-demand RVG cut with excellent sleeve integrity.'
  )
on conflict (id) do nothing;

insert into inventory_items (
  id, owner_id, catalog_release_id, acquisition_type, condition_grade, condition_notes, photo_urls, provenance_note
)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'seed',
    'Near Mint',
    '[{"x":30,"y":40,"label":"Sleeve corner wear"}]'::jsonb,
    '{"https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800"}',
    'Seeded archive inventory'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'seed',
    'Very Good+',
    '[{"x":50,"y":50,"label":"Label oxidation mark"}]'::jsonb,
    '{"https://images.unsplash.com/photo-1605672611471-782163515431?q=80&w=800"}',
    'Seeded archive inventory'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'seed',
    'Near Mint',
    '[{"x":40,"y":60,"label":"Minor handling marks"}]'::jsonb,
    '{"https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=800"}',
    'Seeded archive inventory'
  )
on conflict (id) do nothing;

insert into market_listings (
  id, inventory_item_id, seller_id, headline, description, asking_price,
  suggested_price_min, suggested_price_max, cover_photo_url, status
)
values
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '11111111-1111-1111-1111-111111111111',
    'Monaco archive copy',
    'Stored in relay humidity control. Includes inspection sleeve.',
    48,
    42,
    58,
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800',
    'active'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '11111111-1111-1111-1111-111111111111',
    'Bright room classic rock copy',
    'Soft sleeve, clean runout, relay graded by house team.',
    34,
    28,
    39,
    'https://images.unsplash.com/photo-1605672611471-782163515431?q=80&w=800',
    'active'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    '22222222-2222-2222-2222-222222222222',
    'West coast soul copy',
    'Warm mastering and crisp jacket spine.',
    41,
    34,
    46,
    'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=800',
    'active'
  )
on conflict (id) do nothing;

insert into posts (id, author_id, catalog_release_id, title, body, cover_image_url)
values
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'How we grade relay matrix copies',
    'A quick breakdown of sleeve, runout, and visual grading for archive-ready listings.',
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'Pet Sounds storage notes from a humid city',
    'Humidity control matters more than fancy sleeves when your room swings all summer.',
    'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=400'
  )
on conflict (id) do nothing;
