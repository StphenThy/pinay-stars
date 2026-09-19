-- Pinay Stars - member ratings & reviews
-- Run this in phpMyAdmin AFTER users.sql.
--
-- Members rate an actress 1-5 stars with an optional comment; one review per member per actress.
-- The API keeps pinay_actresses.rating (average) and reviews_count (count) in sync automatically,
-- so every card in the app shows real numbers. The seeded editorial numbers are retired below.

CREATE TABLE IF NOT EXISTS `reviews` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actress_id` INT UNSIGNED NOT NULL,
  `user_id`    INT UNSIGNED NOT NULL,
  `rating`     TINYINT UNSIGNED NOT NULL,
  `comment`    VARCHAR(500) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_one_per_member` (`actress_id`, `user_id`),
  KEY `idx_actress` (`actress_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

UPDATE `pinay_actresses` SET `rating` = 0, `reviews_count` = 0;
