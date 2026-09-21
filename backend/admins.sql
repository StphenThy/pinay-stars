-- Pinay Stars - admin accounts
-- Run this in phpMyAdmin AFTER schema.sql and seed.sql.
--
-- Creates the admins table and one starter account. No real password hash is
-- committed here: a hash in a public repository can be cracked offline.
--
-- To create the first admin:
--   1. Generate a bcrypt hash of a strong password. Any of these work:
--        php -r "echo password_hash('YOUR-PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
--        https://bcrypt-generator.com  (cost 10 or higher)
--   2. Paste the hash in place of REPLACE_WITH_BCRYPT_HASH below, then run the file.
--   3. Sign in and change the password again from the app's Account screen.
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
VALUES ('admin', 'REPLACE_WITH_BCRYPT_HASH', 'Casting Director');
