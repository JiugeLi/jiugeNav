-- 修正 websites.created_at / groups.created_at 的时间类型
-- 原建表语句使用 `integer DEFAULT CURRENT_TIMESTAMP`，SQLite 会写入文本
-- （如 '2026-08-28 09:43:15'），而 Drizzle 以 `{ mode: 'timestamp' }` 按 Unix 秒解析，
-- 结果 created_at 全部为 null，"本周新增" 统计恒等于全站数量。
-- SQLite 不支持修改列默认值，只能重建表。
CREATE TABLE `__websites_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL DEFAULT 1,
	`group_id` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`logo_url` text,
	`logo_type` text DEFAULT 'default',
	`description` text,
	`username` text,
	`password` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`click_count` integer DEFAULT 0 NOT NULL,
	`last_clicked_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`is_public` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__websites_new` (
	`id`, `user_id`, `group_id`, `name`, `url`, `logo_url`, `logo_type`, `description`,
	`username`, `password`, `sort_order`, `click_count`, `last_clicked_at`, `created_at`, `is_public`
)
SELECT
	`id`, `user_id`, `group_id`, `name`, `url`, `logo_url`, `logo_type`, `description`,
	`username`, `password`, `sort_order`, `click_count`, `last_clicked_at`,
	CASE
		WHEN typeof(`created_at`) = 'text' THEN COALESCE(CAST(strftime('%s', `created_at`) AS integer), unixepoch())
		WHEN typeof(`created_at`) IN ('integer', 'real') AND `created_at` > 100000000000
			THEN CAST(`created_at` / 1000 AS integer)
		WHEN typeof(`created_at`) IN ('integer', 'real') THEN CAST(`created_at` AS integer)
		ELSE unixepoch()
	END,
	COALESCE(`is_public`, 1)
FROM `websites`;
--> statement-breakpoint
DROP TABLE `websites`;
--> statement-breakpoint
ALTER TABLE `__websites_new` RENAME TO `websites`;
