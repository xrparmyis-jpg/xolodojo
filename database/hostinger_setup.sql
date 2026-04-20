-- Hostinger Database Setup Script
-- Run this in your Hostinger MySQL database (u800797523_xolo_dojo)
-- You can run this via phpMyAdmin, MySQL Workbench, or command line

-- Users table (linked to Auth0)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auth0_id VARCHAR(255) UNIQUE NOT NULL COMMENT 'Auth0 user.sub (unique identifier)',
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  picture_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_auth0_id (auth0_id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Profiles table (extended user data)
CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bio TEXT,
  wallet_address VARCHAR(255),
  wallet_type VARCHAR(50) COMMENT 'metamask, coinbase, walletconnect, etc.',
  preferences JSON DEFAULT ('{}') COMMENT 'Store flexible preferences',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_id (user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_wallet_address (wallet_address),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Globe pins (one row per user + token + wallet)
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
  pin_note MEDIUMTEXT NULL,
  pinned_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_user_pins_owner_token_wallet (user_id, token_id(180), wallet_address(180)),
  INDEX idx_user_pins_user_id (user_id),
  INDEX idx_user_pins_pinned_at (pinned_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables were created
SHOW TABLES;

-- Check table structure
DESCRIBE users;
DESCRIBE user_profiles;
DESCRIBE user_pins;
