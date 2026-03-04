# NFT Pins DB Setup

This project stores pinned NFTs in `user_profiles.preferences` as JSON under the key `pinned_nfts`.

## Important

There is **no separate `nft_pins` table** in the current implementation.

The API (`api/user/pinned-nfts.ts`) expects:
- `users` table with `auth0_id`
- `user_profiles` table with:
  - `user_id` (unique per user)
  - `preferences` JSON column

## 1) Verify required structure

Run:

```sql
SHOW COLUMNS FROM users;
SHOW COLUMNS FROM user_profiles;
SHOW INDEX FROM user_profiles;
```

You should have:
- `users.auth0_id`
- `user_profiles.user_id`
- `user_profiles.preferences` (JSON)
- unique key on `user_profiles.user_id`

## 2) Patch older schema (only if needed)

If `preferences` is missing:

```sql
ALTER TABLE user_profiles
ADD COLUMN preferences JSON DEFAULT ('{}');
```

If unique key on `user_id` is missing:

```sql
ALTER TABLE user_profiles
ADD UNIQUE KEY unique_user_id (user_id);
```

## 3) Optional quick data sanity check

Check a user profile row:

```sql
SELECT user_id, preferences
FROM user_profiles
LIMIT 5;
```

A pinned NFT payload shape in `preferences` should look like:

```json
{
  "pinned_nfts": [
    {
      "token_id": "0008ABC...",
      "issuer": "r...",
      "uri": "697066733A2F2F...",
      "title": "My NFT #1",
      "collection_name": "My Collection",
      "pinned_at": "2026-03-03T12:34:56.000Z"
    }
  ]
}
```

## 4) If teammate is initializing from scratch

Use the main schema file:

```bash
docker exec -i donovan-db mysql -udonovan_user -pdonovan_password donovan_db < database/schema.sql
```

That already includes the required `preferences` JSON column on `user_profiles`.
