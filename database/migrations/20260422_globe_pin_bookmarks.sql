-- Bookmarks for Xglobe map pins: email users and wallet sessions (account_key u:<id> or w:<address>).
CREATE TABLE IF NOT EXISTS globe_pin_bookmarks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_key VARCHAR(300) NOT NULL,
  token_id VARCHAR(512) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_globe_pin_bookmark (account_key(180), token_id(180)),
  INDEX idx_globe_pin_bookmark_account (account_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
