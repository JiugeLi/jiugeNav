-- groups / users 的 created_at 同样是文本（建表默认 CURRENT_TIMESTAMP），
-- Drizzle 按 Unix 秒解析会得到 null（例如管理员页用户创建时间显示为空）。
-- 这里只做数据订正，不重建表：
--   * 重建 groups 需要 DROP TABLE，而 D1 的 foreign_keys=1，
--     websites.group_id ON DELETE CASCADE 会把全部网站一起删掉，风险太高。
--   * 因此改为写入标准 Unix 秒，并在代码里显式写 created_at（见 groups/users 插入逻辑）。
UPDATE `groups`
SET `created_at` = CAST(strftime('%s', `created_at`) AS integer)
WHERE typeof(`created_at`) = 'text';
--> statement-breakpoint
UPDATE `users`
SET `created_at` = CAST(strftime('%s', `created_at`) AS integer)
WHERE typeof(`created_at`) = 'text';
--> statement-breakpoint
UPDATE `users`
SET `last_login` = CAST(strftime('%s', `last_login`) AS integer)
WHERE `last_login` IS NOT NULL AND typeof(`last_login`) = 'text';
