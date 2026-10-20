import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * 创建 Drizzle 数据库实例。
 * D1 绑定由 OpenNext 注入：线上是 Worker 的 env.DB，
 * 本地 `next dev` 由 next.config.mjs 里的 initOpenNextCloudflareForDev() 提供。
 */
export const createDb = (d1: D1Database) => drizzle(d1, { schema });

export type Db = ReturnType<typeof createDb>;
