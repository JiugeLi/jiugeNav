// D1 + Drizzle：绑定从 OpenNext 时代保持一致（wrangler.toml 里的 DB）。
import { drizzle } from 'drizzle-orm/d1';
import type { H3Event } from 'h3';
import * as schema from '../db/schema';

type D1Binding = Parameters<typeof drizzle>[0];

export type Db = ReturnType<typeof createDb>;
export type { schema };

export function createDb(d1: D1Binding) {
  return drizzle(d1, { schema });
}

/**
 * 取当前请求的 D1 绑定。
 * 线上由 Nitro 的 cloudflare_module 预设注入，本地 dev 由 nitro-cloudflare-dev 提供。
 */
export function getDb(event: H3Event): Db | null {
  const env = (event.context as { cloudflare?: { env?: { DB?: D1Binding } } }).cloudflare?.env;
  return env?.DB ? createDb(env.DB) : null;
}
