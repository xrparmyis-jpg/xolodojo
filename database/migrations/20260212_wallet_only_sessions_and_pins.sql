-- Wallet-only sessions (no users row) and pins owned by wallet when user_id IS NULL.
-- Run after backup. Requires MySQL 8+ / MariaDB with InnoDB.
-- Safe to re-run: skips steps that are already applied (partial runs / Hostinger phpMyAdmin).
--
-- If you see #1091 on DROP FOREIGN KEY: the constraint name may differ (e.g. Hostinger
-- hostinger_setup.sql used an unnamed FK, so MySQL names it user_pins_ibfk_1). The blocks
-- below resolve the real name from information_schema instead of hardcoding.

-- 1) user_sessions: allow wallet-only rows (user_id NULL + wallet_address set)
SET @fk_sess := (
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_sessions'
    AND REFERENCED_TABLE_NAME = 'users'
  LIMIT 1
);
SET @sql_sess := IF(
  @fk_sess IS NOT NULL,
  CONCAT('ALTER TABLE user_sessions DROP FOREIGN KEY `', @fk_sess, '`'),
  'SELECT 1 AS skip_drop_user_sessions_fk'
);
PREPARE stmt_sess FROM @sql_sess;
EXECUTE stmt_sess;
DEALLOCATE PREPARE stmt_sess;

ALTER TABLE user_sessions
  MODIFY user_id INT NULL;

SET @has_wallet_address := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_sessions' AND COLUMN_NAME = 'wallet_address'
);
SET @sql_wa := IF(
  @has_wallet_address = 0,
  'ALTER TABLE user_sessions ADD COLUMN wallet_address VARCHAR(255) NULL AFTER user_id',
  'SELECT 1 AS skip_add_wallet_address'
);
PREPARE stmt_wa FROM @sql_wa;
EXECUTE stmt_wa;
DEALLOCATE PREPARE stmt_wa;

SET @has_wallet_type := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_sessions' AND COLUMN_NAME = 'wallet_type'
);
SET @sql_wt := IF(
  @has_wallet_type = 0,
  'ALTER TABLE user_sessions ADD COLUMN wallet_type VARCHAR(50) NULL AFTER wallet_address',
  'SELECT 1 AS skip_add_wallet_type'
);
PREPARE stmt_wt FROM @sql_wt;
EXECUTE stmt_wt;
DEALLOCATE PREPARE stmt_wt;

SET @has_fk_sess_named := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_sessions'
    AND CONSTRAINT_NAME = 'fk_user_sessions_user' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_fk_sess := IF(
  @has_fk_sess_named = 0,
  'ALTER TABLE user_sessions ADD CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT 1 AS skip_add_fk_user_sessions_user'
);
PREPARE stmt_fk_sess FROM @sql_fk_sess;
EXECUTE stmt_fk_sess;
DEALLOCATE PREPARE stmt_fk_sess;

SET @has_idx_wallet := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_sessions' AND INDEX_NAME = 'idx_user_sessions_wallet'
);
SET @sql_idx := IF(
  @has_idx_wallet = 0,
  'CREATE INDEX idx_user_sessions_wallet ON user_sessions (wallet_address)',
  'SELECT 1 AS skip_idx_user_sessions_wallet'
);
PREPARE stmt_idx FROM @sql_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;

-- 2) user_pins: optional user_id; one row per (wallet_address, token_id) globally
SET @fk_pins := (
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_pins'
    AND REFERENCED_TABLE_NAME = 'users'
  LIMIT 1
);
SET @sql_pins := IF(
  @fk_pins IS NOT NULL,
  CONCAT('ALTER TABLE user_pins DROP FOREIGN KEY `', @fk_pins, '`'),
  'SELECT 1 AS skip_drop_user_pins_fk'
);
PREPARE stmt_pins FROM @sql_pins;
EXECUTE stmt_pins;
DEALLOCATE PREPARE stmt_pins;

SET @has_old_uq := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_pins' AND INDEX_NAME = 'uq_user_pins_owner_token_wallet'
);
SET @sql_drop_old_uq := IF(
  @has_old_uq > 0,
  'ALTER TABLE user_pins DROP INDEX uq_user_pins_owner_token_wallet',
  'SELECT 1 AS skip_drop_uq_user_pins_owner_token_wallet'
);
PREPARE stmt_drop_old_uq FROM @sql_drop_old_uq;
EXECUTE stmt_drop_old_uq;
DEALLOCATE PREPARE stmt_drop_old_uq;

ALTER TABLE user_pins
  MODIFY user_id INT NULL;

SET @has_new_uq := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_pins' AND INDEX_NAME = 'uq_user_pins_wallet_token'
);
SET @sql_new_uq := IF(
  @has_new_uq = 0,
  'ALTER TABLE user_pins ADD UNIQUE KEY uq_user_pins_wallet_token (wallet_address(180), token_id(180))',
  'SELECT 1 AS skip_uq_user_pins_wallet_token'
);
PREPARE stmt_new_uq FROM @sql_new_uq;
EXECUTE stmt_new_uq;
DEALLOCATE PREPARE stmt_new_uq;

SET @has_fk_pins_named := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_pins'
    AND CONSTRAINT_NAME = 'fk_user_pins_user' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_fk_pins := IF(
  @has_fk_pins_named = 0,
  'ALTER TABLE user_pins ADD CONSTRAINT fk_user_pins_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT 1 AS skip_add_fk_user_pins_user'
);
PREPARE stmt_fk_pins FROM @sql_fk_pins;
EXECUTE stmt_fk_pins;
DEALLOCATE PREPARE stmt_fk_pins;
