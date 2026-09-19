-- Pinay Stars - schema migration
-- Run this ONCE in phpMyAdmin (Freehostia > Databases > phpMyAdmin > SQL tab).
--
-- IMPORTANT: this script assumes the table is named `pinay_actresses`.
-- If yours is named differently (check the left sidebar in phpMyAdmin),
-- use Find & Replace on `pinay_actresses` before running.
--
-- Every column below is nullable or has a default, so your existing rows survive.
-- Run this BEFORE seed.sql.

ALTER TABLE `pinay_actresses`
  ADD COLUMN `stage_name`    VARCHAR(120) NULL AFTER `name`,
  ADD COLUMN `genres`        VARCHAR(255) NULL,
  ADD COLUMN `films`         TEXT         NULL,
  ADD COLUMN `tv_series`     TEXT         NULL,
  ADD COLUMN `awards`        TEXT         NULL,
  ADD COLUMN `years_active`  VARCHAR(80)  NULL,
  ADD COLUMN `status`        VARCHAR(20)  NOT NULL DEFAULT 'active',
  ADD COLUMN `rating`        DECIMAL(3,2) NOT NULL DEFAULT 4.80,
  ADD COLUMN `reviews_count` INT          NOT NULL DEFAULT 0;

-- Speeds up the directory search and the Manage screen's status tabs.
ALTER TABLE `pinay_actresses`
  ADD INDEX `idx_name`   (`name`),
  ADD INDEX `idx_status` (`status`);

-- Multi-value columns (`genres`, `films`, `tv_series`, `awards`) are PIPE-delimited,
-- not comma-delimited:
--
--     Hello, Love, Goodbye|A Very Good Girl|The Hows of Us
--
-- Film titles contain commas ("Hello, Love, Goodbye" is one single title), so a comma
-- separator would split that one film into three. The app splits on "|" only.
--
-- `status` is one of: active, review, draft, on_leave, hiatus, overseas, memoriam
