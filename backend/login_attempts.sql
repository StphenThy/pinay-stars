-- Pinay Stars - login / registration rate limiting
-- Run this in phpMyAdmin on Freehostia (Databases > phpMyAdmin > SQL tab).
-- Safe to run at any time: until this table exists the API simply skips the
-- limit checks, so the order of uploading pinay_actresses.php and running this
-- file does not matter.
--
-- One row per failed sign-in or per registration. The API counts recent rows
-- per IP and per username and answers 429 Too Many Requests over the limit.
-- Rows older than a day are purged by the API itself.

CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kind`         VARCHAR(10)  NOT NULL,             -- 'login' or 'register'
  `ip`           VARCHAR(45)  NOT NULL,             -- IPv4 or IPv6 text
  `username`     VARCHAR(60)  NOT NULL DEFAULT '',
  `attempted_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ip`   (`kind`, `ip`, `attempted_at`),
  KEY `idx_user` (`kind`, `username`, `attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
