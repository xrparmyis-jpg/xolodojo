-- User pins stored separately from user_profiles.preferences (MySQL 8+ / MariaDB 10.6+).
-- Run once on existing DBs. After backfill, `preferences.pinned_nfts` is removed.
--
-- JSON_TABLE uses portable column definitions (no MySQL-only NULL ON EMPTY / ON ERROR),
-- so this runs on MariaDB (e.g. Hostinger) as well as MySQL 8.

CREATE TABLE IF NOT EXISTS user_pins (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_id VARCHAR(512) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NULL,
  uri TEXT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  image_url TEXT NULL,
  title VARCHAR(512) NULL,
  collection_name VARCHAR(512) NULL,
  socials JSON NULL,
  pin_note VARCHAR(512) NULL,
  website_url VARCHAR(512) NULL,
  pinned_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_user_pins_owner_token_wallet (user_id, token_id(180), wallet_address(180)),
  INDEX idx_user_pins_user_id (user_id),
  INDEX idx_user_pins_pinned_at (pinned_at),
  CONSTRAINT fk_user_pins_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backfill from legacy JSON (requires JSON_TABLE — not available on older MariaDB).
INSERT INTO user_pins (
  user_id,
  token_id,
  wallet_address,
  issuer,
  uri,
  latitude,
  longitude,
  image_url,
  title,
  collection_name,
  socials,
  pin_note,
  website_url,
  pinned_at
)
SELECT
  up.user_id,
  LEFT(TRIM(jt.token_id), 512),
  LOWER(TRIM(jt.wallet_address)),
  NULLIF(TRIM(jt.issuer), ''),
  NULLIF(TRIM(jt.uri), ''),
  jt.latitude,
  jt.longitude,
  NULLIF(TRIM(jt.image_url), ''),
  NULLIF(TRIM(jt.title), ''),
  NULLIF(TRIM(jt.collection_name), ''),
  IF(
    jt.socials IS NOT NULL
    AND TRIM(jt.socials) <> ''
    AND JSON_VALID(jt.socials),
    jt.socials,
    NULL
  ),
  NULLIF(TRIM(jt.pin_note), ''),
  NULLIF(TRIM(jt.website_url), ''),
  COALESCE(
    STR_TO_DATE(
      REPLACE(SUBSTRING(TRIM(jt.pinned_at_raw), 1, 19), 'T', ' '),
      '%Y-%m-%d %H:%i:%s'
    ),
    CURRENT_TIMESTAMP(3)
  )
FROM user_profiles up
CROSS JOIN JSON_TABLE(
  COALESCE(JSON_EXTRACT(up.preferences, '$.pinned_nfts'), JSON_ARRAY()),
  '$[*]' COLUMNS (
    token_id VARCHAR(512) PATH '$.token_id',
    wallet_address VARCHAR(255) PATH '$.wallet_address',
    issuer VARCHAR(255) PATH '$.issuer',
    uri VARCHAR(8192) PATH '$.uri',
    latitude DECIMAL(10, 7) PATH '$.latitude',
    longitude DECIMAL(10, 7) PATH '$.longitude',
    image_url VARCHAR(2048) PATH '$.image_url',
    title VARCHAR(512) PATH '$.title',
    collection_name VARCHAR(512) PATH '$.collection_name',
    socials LONGTEXT PATH '$.socials',
    pin_note VARCHAR(512) PATH '$.pin_note',
    website_url VARCHAR(512) PATH '$.website_url',
    pinned_at_raw VARCHAR(80) PATH '$.pinned_at'
  )
) AS jt
WHERE
  jt.token_id IS NOT NULL
  AND CHAR_LENGTH(TRIM(jt.token_id)) > 0
  AND jt.wallet_address IS NOT NULL
  AND CHAR_LENGTH(TRIM(jt.wallet_address)) > 0
  AND jt.latitude IS NOT NULL
  AND jt.longitude IS NOT NULL
ON DUPLICATE KEY UPDATE user_pins.user_id = user_pins.user_id;

UPDATE user_profiles
SET preferences = JSON_REMOVE(COALESCE(preferences, JSON_OBJECT()), '$.pinned_nfts')
WHERE JSON_CONTAINS_PATH(
  COALESCE(preferences, JSON_OBJECT()),
  'one',
  '$.pinned_nfts'
);
