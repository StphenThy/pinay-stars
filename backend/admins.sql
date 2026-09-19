-- Pinay Stars - admin accounts
-- Run this in phpMyAdmin AFTER schema.sql and seed.sql.
--
-- Creates the admins table and one starter account:
--   username: admin
--   password: (given to you in chat - change it from the app's Account screen after first login)
--
-- Passwords are stored as bcrypt hashes and verified by PHP's password_verify().

CREATE TABLE IF NOT EXISTS `admins` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(60)  NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name`  VARCHAR(120) NOT NULL DEFAULT 'Administrator',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `admins` (`username`, `password_hash`, `display_name`)
VALUES ('admin', '$2a$10$tzxRMK0bBFf61jJvyKEgYeON7dVQcSrK9kzF7sPiDdTE/ABHxC212', 'Casting Director');