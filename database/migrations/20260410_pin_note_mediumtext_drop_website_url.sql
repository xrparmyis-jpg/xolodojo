-- XoloGlobe pin notes: store rich HTML (sanitized); remove standalone website field (use links in note instead).
ALTER TABLE user_pins
  MODIFY COLUMN pin_note MEDIUMTEXT NULL,
  DROP COLUMN website_url;
