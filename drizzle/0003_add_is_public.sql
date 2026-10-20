-- 补齐 websites.is_public 列
-- schema.ts 中声明了 is_public，但 0000 建表语句遗漏，导致生产库缺列，
-- 新增/更新网站时 D1 报 “table websites has no column named is_public”。
ALTER TABLE `websites` ADD `is_public` integer DEFAULT 1 NOT NULL;
