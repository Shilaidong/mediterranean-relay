# Supabase Setup Guide

This project assumes a brand-new Supabase project with no reused tables, policies, buckets, or functions.

## 1. Create a new Supabase project

In the Supabase dashboard:

1. Create a new project.
2. Wait for the database to finish provisioning.
3. Open `Project Settings -> API`.
4. Copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key

## 2. Configure local environment

Copy the env template:

```bash
cp .env.example .env.local
```

Then fill:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 3. Initialize the database

Open the Supabase SQL Editor and run the files in this order:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

Important notes:

- `schema.sql` creates the new tables, indexes, RLS policies, storage bucket, triggers, and RPC functions.
- `seed.sql` inserts demo profiles, releases, listings, and community posts for the rebuilt app.

## 4. Auth settings

Open `Authentication -> Providers -> Email`.

Recommended first-pass settings:

- Enable Email provider
- Enable email/password sign-in
- Disable email confirmation for early local testing

If you keep email confirmation enabled, registration may create the user without immediately signing them into the app.

## 5. Storage expectations

The SQL setup creates a public bucket named:

- `listing-media`

Uploads are scoped to:

- `authenticated users`
- path prefix equal to the current user id

Example object path:

```text
<user-id>/1713320000000-cover.jpg
```

## 6. Start the app

```bash
npm run dev
```

Open:

- [http://localhost:3000/browse](http://localhost:3000/browse)

## 7. Verify the connection

Use the health endpoint after env setup:

- [http://localhost:3000/api/health](http://localhost:3000/api/health)

Expected shape:

```json
{
  "ok": true,
  "envConfigured": true,
  "databaseReachable": true,
  "counts": {
    "catalogReleases": 4,
    "activeListings": 3,
    "posts": 2
  }
}
```

If env vars are missing, it will return a configuration error instead of pretending the app is connected.

## 8. Smoke test checklist

After setup, verify:

1. `/browse` shows seeded market listings.
2. `/register` creates a user and auto-creates a `profiles` row.
3. `/sell` requires login and can create a new listing.
4. `/community` loads posts and allows logged-in posting.
5. `/profile` shows owned inventory, active listings, ledger, and orders.
6. `/listing/[id]` can purchase a listing if the current profile has enough credits.

## 9. Common setup issues

### `Supabase environment is not configured yet.`

Your `.env.local` is missing one or more required keys.

### `Authentication required.`

You are hitting a protected route or action without an active Supabase session.

### Upload succeeds but image does not show

Check that:

- the object exists in `listing-media`
- the bucket is public
- the object path begins with the current user id

### Register works but profile is missing

This usually means the `handle_new_user()` trigger from `schema.sql` was not created successfully. Re-run the schema and inspect the SQL execution output.
