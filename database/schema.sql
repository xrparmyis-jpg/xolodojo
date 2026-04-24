-- Donovan Database Schema (MySQL) — local session auth (no Auth0)
-- Run migrations in database/migrations/ for upgrades; this file reflects the full current shape.

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(32) NOT NULL,
  name VARCHAR(255) NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  picture_url TEXT NULL,
  reset_token VARCHAR(255) NULL,
  reset_token_expiry DATETIME NULL,
  email_verified_at DATETIME NULL,
  verification_token VARCHAR(255) NULL,
  verification_token_expiry DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id INT NULL,
  wallet_address VARCHAR(255) NULL,
  wallet_type VARCHAR(50) NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_sessions_user (user_id),
  INDEX idx_user_sessions_wallet (wallet_address),
  INDEX idx_user_sessions_expires (expires_at),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bio TEXT,
  wallet_address VARCHAR(255),
  wallet_type VARCHAR(50),
  connected_wallet_id INT,
  preferences JSON DEFAULT ('{}'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_id (user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_wallet_address (wallet_address),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  wallet_type VARCHAR(50) NOT NULL,
  is_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_wallet (user_id, wallet_address),
  INDEX idx_user_id (user_id),
  INDEX idx_wallet_address (wallet_address),
  INDEX idx_is_connected (is_connected),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_pins (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
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
  pin_note MEDIUMTEXT NULL,
  pinned_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_user_pins_wallet_token (wallet_address(180), token_id(180)),
  INDEX idx_user_pins_user_id (user_id),
  INDEX idx_user_pins_pinned_at (pinned_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS globe_pin_bookmarks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_key VARCHAR(300) NOT NULL,
  token_id VARCHAR(512) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_globe_pin_bookmark (account_key(180), token_id(180)),
  INDEX idx_globe_pin_bookmark_account (account_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
