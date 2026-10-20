import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 用户表
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatar: text('avatar'),
  google_id: text('google_id').unique(),
  // 库中仍是 CURRENT_TIMESTAMP 默认值（文本），代码插入时必须显式传 created_at。
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  last_login: integer('last_login', { mode: 'timestamp' }),
});

// 分组表（添加 user_id）
export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  icon: text('icon').default('📁').notNull(),
  sort_order: integer('sort_order').default(0).notNull(),
  // 库中仍是 CURRENT_TIMESTAMP 默认值（文本），代码插入时必须显式传 created_at。
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// 网站表（添加 user_id）
export const websites = sqliteTable('websites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  group_id: integer('group_id').references(() => groups.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  logo_url: text('logo_url'),
  logo_type: text('logo_type').default('default'),
  description: text('description'),
  username: text('username'),
  password: text('password'),
  sort_order: integer('sort_order').default(0).notNull(),
  click_count: integer('click_count').default(0).notNull(),
  last_clicked_at: integer('last_clicked_at', { mode: 'timestamp' }),
  // 必须与迁移后的库默认值一致：`integer DEFAULT (unixepoch())`。
  // SQLite 的 CURRENT_TIMESTAMP 写入的是文本，Drizzle 按 Unix 秒解析会得到 null。
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  is_public: integer('is_public').default(1).notNull(),
});

// 管理员表（保留用于密码登录的管理员）
export const admin = sqliteTable('admin', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  password_hash: text('password_hash').notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type Website = typeof websites.$inferSelect;
export type NewWebsite = typeof websites.$inferInsert;
export type Admin = typeof admin.$inferSelect;
export type NewAdmin = typeof admin.$inferInsert;
