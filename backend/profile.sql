-- Pinay Stars - editable profiles
-- Run this in phpMyAdmin AFTER users.sql.
--
-- Adds an optional profile photo link to both account tables so members and
-- admins can personalise their profile from the app's Account screen.

ALTER TABLE `admins` ADD COLUMN `avatar_url` VARCHAR(500) NULL AFTER `display_name`;
ALTER TABLE `users`  ADD COLUMN `avatar_url` VARCHAR(500) NULL AFTER `display_name`;
