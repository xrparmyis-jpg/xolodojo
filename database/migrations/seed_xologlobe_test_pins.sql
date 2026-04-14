-- Seed 15 XoloGlobe test markers + shared seed user (session auth).
-- Safe to re-run: replaces pins for the seed user only (DELETE + INSERT).
-- Does not rotate password if the seed user already exists (ON DUPLICATE KEY).
--
-- Seed account (login to manage pins if needed):
--   Email:    xologlobe-seed@example.com
--   Username: xologlobe_seed
--   Password: XoloGlobeSeed!
--
-- Requires tables from database/migrations/20260210_replace_auth0_with_session_auth.sql (or equivalent).

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @seed_email := 'xologlobe-seed@example.com';
SET @seed_username := 'xologlobe_seed';
SET @seed_name := 'XoloGlobe Test Markers';
-- scrypt hash for password XoloGlobeSeed! (matches server/lib/sessionAuth.ts hashPassword)
SET @seed_password := 'scrypt:a1b2c3d4e5f60718293a4b5c6d7e8f01:78c75732ee04a37138b2d6645cbe2cd8cd49c0d0297ead1c9444b0b8b5077548b0b27a40d004325d981f2ad344e1c4551d392351e113e62ccb47e49adfefdaa7';

INSERT INTO users (email, username, name, password, role, picture_url, email_verified_at)
VALUES (
  @seed_email,
  @seed_username,
  @seed_name,
  @seed_password,
  'user',
  '/image.png',
  UTC_TIMESTAMP()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  picture_url = VALUES(picture_url),
  email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP()),
  updated_at = CURRENT_TIMESTAMP;

SELECT id INTO @seed_user_id
FROM users
WHERE email = @seed_email
LIMIT 1;

INSERT INTO user_profiles (user_id, preferences, updated_at)
VALUES (@seed_user_id, JSON_OBJECT(), CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

DELETE FROM user_pins WHERE user_id = @seed_user_id;

INSERT INTO user_pins (
  user_id, token_id, wallet_address, issuer, uri,
  latitude, longitude, image_url, title, collection_name,
  socials, pin_note, website_url, pinned_at
) VALUES
  (@seed_user_id, 'test-marker-001', 'rtestmarker001', NULL, NULL, 37.7749, -122.4194, '/03c.jpg', 'San Francisco Test Pin', 'Xolo Test Pins', JSON_OBJECT('twitter', 'xolo_sf', 'instagram', 'xolo.sf'), 'Pacific-edge city — fog, hills, and the bay nearby.\n\nStaging test pin only.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-002', 'rtestmarker002', NULL, NULL, 19.4326, -99.1332, '/03a.jpg', 'Mexico City Test Pin', 'Xolo Test Pins', JSON_OBJECT('telegram', 'xolo_mexico', 'tiktok', 'xolomx'), 'High valley capital ringed by mountains and volcanoes.\n\nTest data only.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-003', 'rtestmarker003', NULL, NULL, -22.9068, -43.1729, '/03b.jpg', 'Rio Test Pin', 'Xolo Test Pins', JSON_OBJECT('instagram', 'xolo.rio', 'discord', '421337009911223344'), 'Granite peaks and Atlantic beaches along the same coast.\n\nStaging marker.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-004', 'rtestmarker004', NULL, NULL, -34.6037, -58.3816, '/03.jpg', 'Buenos Aires Test Pin', 'Xolo Test Pins', JSON_OBJECT('twitter', 'xolo_ba'), 'Pampas edge meeting a wide river estuary.\n\nTest pin.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-005', 'rtestmarker005', NULL, NULL, 38.7223, -9.1393, '/01.jpg', 'Lisbon Test Pin', 'Xolo Test Pins', JSON_OBJECT('telegram', 'xolo_lisbon', 'instagram', 'xolo.lx'), 'River mouth opening to the Atlantic swell.\n\nStaging only.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-006', 'rtestmarker006', NULL, NULL, 51.5072, -0.1276, '/02a.jpg', 'London Test Pin', 'Xolo Test Pins', JSON_OBJECT('discord', '998877665544332211', 'twitter', 'xolo_ldn'), 'Thames corridor through a low clay basin.\n\nTest marker.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-007', 'rtestmarker007', NULL, NULL, 30.0444, 31.2357, '/image.png', 'Cairo Test Pin', 'Xolo Test Pins', JSON_OBJECT('tiktok', 'xolo.cairo'), 'Nile brightness against desert haze.\n\nStaging pin.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-008', 'rtestmarker008', NULL, NULL, -1.2921, 36.8219, '/03b.jpg', 'Nairobi Test Pin', 'Xolo Test Pins', JSON_OBJECT('instagram', 'xolo.nairobi', 'telegram', 'xolo_nairobi'), 'Cool highlands before the Rift drops east.\n\nTest data.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-009', 'rtestmarker009', NULL, NULL, -33.9249, 18.4241, '/03.jpg', 'Cape Town Test Pin', 'Xolo Test Pins', JSON_OBJECT('twitter', 'xolo_capetown', 'tiktok', 'xolo.ct'), 'Table Mountain above two ocean strands.\n\nStaging only.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-010', 'rtestmarker010', NULL, NULL, 25.2048, 55.2708, '/03c.jpg', 'Dubai Test Pin', 'Xolo Test Pins', JSON_OBJECT('instagram', 'xolo.dubai'), 'Desert coast with a fast-built shoreline.\n\nTest pin.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-011', 'rtestmarker011', NULL, NULL, 19.0760, 72.8777, '/01.jpg', 'Mumbai Test Pin', 'Xolo Test Pins', JSON_OBJECT('discord', '776655443322110099', 'telegram', 'xolo_mumbai'), 'Dense grid facing the Arabian Sea.\n\nStaging marker.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-012', 'rtestmarker012', NULL, NULL, 13.7563, 100.5018, '/image.png', 'Bangkok Test Pin', 'Xolo Test Pins', JSON_OBJECT('twitter', 'xolo_bkk', 'instagram', 'xolo.bkk'), 'Delta heat and river-laced sprawl.\n\nTest data.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-013', 'rtestmarker013', NULL, NULL, 35.6895, 139.6917, '/02a.jpg', 'Tokyo Test Pin', 'Xolo Test Pins', JSON_OBJECT('twitter', 'xolo_tokyo', 'discord', '112233445566778899'), 'Deep bays and layered ridges toward the Pacific.\n\nStaging pin.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-014', 'rtestmarker014', NULL, NULL, -33.8688, 151.2093, '/03a.jpg', 'Sydney Test Pin', 'Xolo Test Pins', JSON_OBJECT('tiktok', 'xolo.sydney', 'telegram', 'xolo_sydney'), 'Sandstone rims around a drowned valley harbour.\n\nTest only.', NULL, UTC_TIMESTAMP(3)),
  (@seed_user_id, 'test-marker-015', 'rtestmarker015', NULL, NULL, -36.8485, 174.7633, '/03.jpg', 'Auckland Test Pin', 'Xolo Test Pins', JSON_OBJECT('instagram', 'xolo.auckland'), 'Volcanic cones between two busy harbours.\n\nStaging marker.', NULL, UTC_TIMESTAMP(3));

SELECT COUNT(*) AS seeded_pin_count FROM user_pins WHERE user_id = @seed_user_id;
