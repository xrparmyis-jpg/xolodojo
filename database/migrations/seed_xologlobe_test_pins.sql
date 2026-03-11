-- Seed 15 XoloGlobe test markers into MySQL
-- Safe to re-run: it updates/overwrites pinned_nfts for the seed user only.

SET @seed_auth0_id := 'seed|xologlobe-test-markers';
SET @seed_email := 'xologlobe-seed@example.com';
SET @seed_name := 'XoloGlobe Test Markers';
SET @seed_pinned_at := DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-%dT%H:%i:%sZ');

INSERT INTO users (auth0_id, email, name, picture_url)
VALUES (@seed_auth0_id, @seed_email, @seed_name, '/image.png')
ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  name = VALUES(name),
  picture_url = VALUES(picture_url),
  updated_at = CURRENT_TIMESTAMP;

SELECT id INTO @seed_user_id
FROM users
WHERE auth0_id = @seed_auth0_id
LIMIT 1;

SET @seed_pinned_nfts := JSON_ARRAY(
  JSON_OBJECT('token_id','test-marker-001','wallet_address','rtestmarker001','issuer',NULL,'uri',NULL,'latitude',37.7749,'longitude',-122.4194,'image_url','/03c.jpg','title','San Francisco Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('twitter','xolo_sf','instagram','xolo.sf'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-002','wallet_address','rtestmarker002','issuer',NULL,'uri',NULL,'latitude',19.4326,'longitude',-99.1332,'image_url','/03a.jpg','title','Mexico City Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('telegram','xolo_mexico','tiktok','xolomx'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-003','wallet_address','rtestmarker003','issuer',NULL,'uri',NULL,'latitude',-22.9068,'longitude',-43.1729,'image_url','/03b.jpg','title','Rio Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('instagram','xolo.rio','discord','421337009911223344'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-004','wallet_address','rtestmarker004','issuer',NULL,'uri',NULL,'latitude',-34.6037,'longitude',-58.3816,'image_url','/03.jpg','title','Buenos Aires Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('twitter','xolo_ba'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-005','wallet_address','rtestmarker005','issuer',NULL,'uri',NULL,'latitude',38.7223,'longitude',-9.1393,'image_url','/01.jpg','title','Lisbon Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('telegram','xolo_lisbon','instagram','xolo.lx'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-006','wallet_address','rtestmarker006','issuer',NULL,'uri',NULL,'latitude',51.5072,'longitude',-0.1276,'image_url','/02a.jpg','title','London Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('discord','998877665544332211','twitter','xolo_ldn'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-007','wallet_address','rtestmarker007','issuer',NULL,'uri',NULL,'latitude',30.0444,'longitude',31.2357,'image_url','/image.png','title','Cairo Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('tiktok','xolo.cairo'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-008','wallet_address','rtestmarker008','issuer',NULL,'uri',NULL,'latitude',-1.2921,'longitude',36.8219,'image_url','/03b.jpg','title','Nairobi Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('instagram','xolo.nairobi','telegram','xolo_nairobi'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-009','wallet_address','rtestmarker009','issuer',NULL,'uri',NULL,'latitude',-33.9249,'longitude',18.4241,'image_url','/03.jpg','title','Cape Town Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('twitter','xolo_capetown','tiktok','xolo.ct'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-010','wallet_address','rtestmarker010','issuer',NULL,'uri',NULL,'latitude',25.2048,'longitude',55.2708,'image_url','/03c.jpg','title','Dubai Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('instagram','xolo.dubai'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-011','wallet_address','rtestmarker011','issuer',NULL,'uri',NULL,'latitude',19.0760,'longitude',72.8777,'image_url','/01.jpg','title','Mumbai Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('discord','776655443322110099','telegram','xolo_mumbai'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-012','wallet_address','rtestmarker012','issuer',NULL,'uri',NULL,'latitude',13.7563,'longitude',100.5018,'image_url','/image.png','title','Bangkok Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('twitter','xolo_bkk','instagram','xolo.bkk'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-013','wallet_address','rtestmarker013','issuer',NULL,'uri',NULL,'latitude',35.6895,'longitude',139.6917,'image_url','/02a.jpg','title','Tokyo Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('twitter','xolo_tokyo','discord','112233445566778899'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-014','wallet_address','rtestmarker014','issuer',NULL,'uri',NULL,'latitude',-33.8688,'longitude',151.2093,'image_url','/03a.jpg','title','Sydney Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('tiktok','xolo.sydney','telegram','xolo_sydney'),'pinned_at',@seed_pinned_at),
  JSON_OBJECT('token_id','test-marker-015','wallet_address','rtestmarker015','issuer',NULL,'uri',NULL,'latitude',-36.8485,'longitude',174.7633,'image_url','/03.jpg','title','Auckland Test Pin','collection_name','Xolo Test Pins','socials',JSON_OBJECT('instagram','xolo.auckland'),'pinned_at',@seed_pinned_at)
);

INSERT INTO user_profiles (user_id, preferences, updated_at)
VALUES (
  @seed_user_id,
  JSON_OBJECT('pinned_nfts', CAST(@seed_pinned_nfts AS JSON)),
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
  preferences = JSON_SET(COALESCE(preferences, JSON_OBJECT()), '$.pinned_nfts', CAST(@seed_pinned_nfts AS JSON)),
  updated_at = CURRENT_TIMESTAMP;

SELECT JSON_LENGTH(JSON_EXTRACT(preferences, '$.pinned_nfts')) AS seeded_pin_count
FROM user_profiles
WHERE user_id = @seed_user_id;
