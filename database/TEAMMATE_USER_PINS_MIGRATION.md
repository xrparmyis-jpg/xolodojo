# Teammate DB sync after `user_pins` change

Use this when you’ve pulled the latest `xolodojo` code and the API expects a **`user_pins`** table instead of pins living only in **`user_profiles.preferences.pinned_nfts`**.

---

## Copy-paste prompt for an AI assistant

```
We use the xolodojo repo. I pulled the latest main (or shared branch). The app now reads/writes globe pins in MySQL table `user_pins` instead of JSON in `user_profiles.preferences.pinned_nfts`.

My database already existed and worked yesterday; same Docker/env as the team (`DB_*` in .env.local). 

Please:
1. Confirm MySQL is up and which DB name/host/port/user the API uses (from .env.local or docker-compose).
2. Run the migration file in the repo once: `database/migrations/20260405_user_pins_table.sql` against that database (mysql CLI, Docker exec, or phpMyAdmin “SQL” tab — whole file).
3. Verify: `SHOW TABLES LIKE 'user_pins';` and `SELECT COUNT(*) FROM user_pins;` (count should match prior pins after backfill, or 0 if none in JSON).
4. Start the API (`npm run dev:api` or `npm run dev:full`) and smoke-test profile + XoloGlobe pins.

Do not re-run the migration blindly if `user_pins` is already populated and prefs were cleaned — ask me first. If the SQL errors, capture the exact message and MariaDB/MySQL version (`SELECT VERSION();`).
```

---

## Human one-liner (Docker, default compose user/db)

From the **repo root**, after `docker compose up -d`:

```bash
docker compose exec -T mysql mysql -udonovan_user -pdonovan_password donovan_db < database/migrations/20260405_user_pins_table.sql
```

Adjust user/password/database if your `.env.local` differs.

---

## What the migration does

- Creates **`user_pins`** if missing (FK to `users`).
- **Backfills** from `preferences.pinned_nfts` via `JSON_TABLE` (works on MySQL 8 and MariaDB 10.6+ with the syntax in that file).
- **Removes** `pinned_nfts` from `preferences` so data isn’t duplicated.

---

## If the API errors before migration

Symptoms: `ER_NO_SUCH_TABLE` / `user_pins` doesn’t exist. Fix: run the migration above once.

---

## Optional: 15 test globe pins (seed user only)

```bash
docker compose exec -T mysql mysql -udonovan_user -pdonovan_password donovan_db < database/migrations/seed_xologlobe_test_pins.sql
```

Safe on dev; skip on shared prod unless you want fake markers.
