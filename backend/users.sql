-- Pinay Stars - member accounts
-- Run this in phpMyAdmin AFTER admins.sql.
--
-- Members register from inside the app. Their favorites are stored here so they
-- follow the account across devices, and suggestions they submit are linked to them.

CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(60)  NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name`  VARCHAR(120) NOT NULL,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per (account, actress). role is 'user' or 'admin' so admins can have favorites too.
CREATE TABLE IF NOT EXISTS `favorites` (
  `role`       VARCHAR(10)  NOT NULL,
  `account_id` INT UNSIGNED NOT NULL,
  `actress_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role`, `account_id`, `actress_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Which member suggested a record (NULL for admin-created and anonymous submissions).
ALTER TABLE `pinay_actresses`
  ADD COLUMN `submitted_by` INT UNSIGNED NULL AFTER `status`;
