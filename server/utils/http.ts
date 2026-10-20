import type { H3Event } from 'h3';
import type { Db } from './db';
import { getDb } from './db';

/** 统一的错误响应：客户端读 data.error / statusMessage。 */
export function fail(event: H3Event, statusCode: number, error: string): never {
  setResponseStatus(event, statusCode);
  throw createError({ statusCode, statusMessage: error, data: { error } });
}

/** 取数据库，缺绑定时直接 503。 */
export function requireDb(event: H3Event): Db {
  const db = getDb(event);
  if (!db) fail(event, 503, '数据库不可用');
  return db;
}

/** 取当前用户 ID（前端通过 X-User-Id 头传递），未登录直接 401。 */
export function requireUserId(event: H3Event): number {
  const raw = getHeader(event, 'x-user-id');
  const userId = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(userId) || userId <= 0) fail(event, 401, '未登录');
  return userId;
}

export function parseId(event: H3Event): number {
  const id = Number.parseInt(getRouterParam(event, 'id') ?? '', 10);
  if (!Number.isFinite(id) || id <= 0) fail(event, 400, 'ID 不正确');
  return id;
}

/** 记录日志并返回 500，不把内部错误暴露给前端。 */
export function serverError(event: H3Event, scope: string, error: unknown): never {
  console.error(`[${scope}]`, error);
  return fail(event, 500, '服务器内部错误');
}
