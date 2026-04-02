# XoloGlobe Test Markers Seed

This seeds 15 shared test markers into the DB so everyone sees the same pins on XoloGlobe.

## Files

- SQL seed: `database/migrations/seed_xologlobe_test_pins.sql`

## What it does

- Creates/updates a seed user: `seed|xologlobe-test-markers`
- Writes 15 pinned markers across global coordinates, each with a short multi-line `pin_note` (globe popup description)
- Uses these image URLs from `public/`:
  - `/03c.jpg`
  - `/03a.jpg`
  - `/03b.jpg`
  - `/03.jpg`
  - `/01.jpg`
  - `/02a.jpg`
  - `/image.png`

## Run locally (Docker MySQL)

The app **does not** auto-load this SQL. If pins have no `pin_note` (or you never ran the seed), run:

From repo root (adjust user/password/db if your `docker-compose` differs):

```bash
docker compose exec -T mysql mysql -udonovan_user -pdonovan_password donovan_db < database/migrations/seed_xologlobe_test_pins.sql
```

You should see `seeded_pin_count` return `15`.

**Not using Docker?** Run the same file in any MySQL client pointed at your local `DB_*` database (same as the API).

## Verify in app

1. Run app/API (`npm run dev:full`)
2. Open XoloGlobe page
3. Confirm the 15 pins render

## Re-run behavior

- Safe to rerun.
- It overwrites only the seed user's `preferences.pinned_nfts` with the same 15 markers.

## Production / live server (same DB your Vercel API uses)

Deploying to Vercel **never** runs migrations or seeds. The globe reads pins from MySQL as-is.

**To put the mock pins + descriptions on the live DB:**

1. Open your host’s MySQL tool (phpMyAdmin, DBeaver, etc.) **or** use the CLI from a machine that is allowed to connect to prod.
2. Run the **contents** of `database/migrations/seed_xologlobe_test_pins.sql` once — or from your laptop:

   `mysql -h YOUR_DB_HOST -P YOUR_PORT -u YOUR_DB_USER -p YOUR_DB_NAME < database/migrations/seed_xologlobe_test_pins.sql`

   Use the same values as in Vercel: `DB_HOST`, `DB_PORT` (often `3306`), `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

3. Reload XoloGlobe; the 15 test markers should include the multi-line `pin_note` text.

No schema migration is required: `pin_note` lives inside the existing `preferences.pinned_nfts` JSON.

Before your real launch, remove test data (see below) or replace `pinned_nfts` for that seed user.

## Remove the seed markers

```bash
docker compose exec -T mysql mysql -udonovan_user -pdonovan_password donovan_db -e "DELETE up FROM user_profiles up JOIN users u ON u.id = up.user_id WHERE u.auth0_id = 'seed|xologlobe-test-markers'; DELETE FROM users WHERE auth0_id = 'seed|xologlobe-test-markers';"
```
