-- Pinay Stars - sign-out that actually revokes tokens
-- Run this in phpMyAdmin on Freehostia (Databases > phpMyAdmin > SQL tab).
-- Safe to run at any time: until the column exists the API treats every
-- account as version 0 and sign-out only clears the device, as before.
--
-- Each account carries a token_version that is mixed into its token
-- signature. POST ?action=logout bumps it, so every token issued earlier
-- for that account (on any device) stops validating immediately.

ALTER TABLE `admins` ADD COLUMN `token_version` INT UNSIGNED NOT NULL DEFAULT 1 AFTER `password_hash`;
ALTER TABLE `users`  ADD COLUMN `token_version` INT UNSIGNED NOT NULL DEFAULT 1 AFTER `password_hash`;
