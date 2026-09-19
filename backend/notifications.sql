-- Pinay Stars - per-account notifications
-- Run this in phpMyAdmin AFTER users.sql.
--
-- Each signed-in account (admin or member) has its own notification feed.
-- The API writes rows here for app events and for review outcomes:
--   member suggests an actress  -> every admin is notified
--   admin approves a suggestion -> the member who suggested her is notified
--   admin rejects a suggestion  -> the member who suggested her is notified

CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role`       VARCHAR(10)  NOT NULL,
  `account_id` INT UNSIGNED NOT NULL,
  `tone`       VARCHAR(10)  NOT NULL DEFAULT 'info',
  `message`    VARCHAR(255) NOT NULL,
  `actress_id` INT UNSIGNED NULL,
  `is_read`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_account` (`role`, `account_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
