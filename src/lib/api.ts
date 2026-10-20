// 服务端接口公共工具：统一获取 D1 / 用户身份，统一错误响应。
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';
import { createDb, type Db } from '@/db';
import { getCurrentUserId } from '@/lib/get-current-user';

/** 获取 D1 数据库实例，绑定缺失时返回 null。 */
export function getDb(): Db | null {
  try {
    const { env } = getCloudflareContext();
    return env?.DB ? createDb(env.DB) : null;
  } catch {
    // next dev 未初始化或本地没有 D1 绑定
    return null;
  }
}

/** 获取当前用户 ID，未登录返回 null。 */
export function getUserId(req: Request): number | null {
  return getCurrentUserId(req);
}

export const dbUnavailable = () => NextResponse.json({ error: '数据库不可用' }, { status: 503 });
export const unauthorized = () => NextResponse.json({ error: '未登录' }, { status: 401 });
export const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });
export const notFound = (error: string) => NextResponse.json({ error }, { status: 404 });

/** 统一的 500 处理：日志留全文，响应不泄露内部信息。 */
export function serverError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
  return new NextResponse('Internal Error', { status: 500 });
}

/** 解析路径参数里的数字 id。 */
export function parseId(raw: string | undefined): number | null {
  const id = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}
