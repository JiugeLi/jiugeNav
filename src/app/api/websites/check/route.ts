import { getDb, getUserId, unauthorized, dbUnavailable, badRequest, serverError } from '@/lib/api';
import { websites } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const BATCH_SIZE = 10;
const TIMEOUT_MS = 5000;

interface CheckResult {
  id: number;
  name: string;
  url: string;
  status: 'ok' | 'error' | 'timeout';
  statusCode?: number;
  error?: string;
}

async function checkLink(url: string): Promise<Omit<CheckResult, 'id' | 'name'>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; SoloLink LinkChecker)' };

  try {
    // 先 HEAD，失败再退化为 GET
    let response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal, headers })
      .catch(() => fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal, headers }));

    const ok = response.status >= 200 && response.status < 400;
    return { url, status: ok ? 'ok' : 'error', statusCode: response.status };
  } catch (error) {
    const aborted = (error as Error)?.name === 'AbortError';
    return {
      url,
      status: aborted ? 'timeout' : 'error',
      error: aborted ? '超时' : (error as Error)?.message || 'Unknown error',
    };
  } finally {
    clearTimeout(timer);
  }
}

/** 分批检查链接，每批 10 条，前端轮询直到 isLastBatch。 */
export async function GET(req: Request) {
  const db = getDb();
  if (!db) return dbUnavailable();

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  try {
    const batchIndex = Math.max(0, Number(new URL(req.url).searchParams.get('batch')) || 0);

    const all = await db.select({ id: websites.id, name: websites.name, url: websites.url })
      .from(websites)
      .where(eq(websites.user_id, userId));

    const start = batchIndex * BATCH_SIZE;
    const slice = all.slice(start, start + BATCH_SIZE);
    const isLastBatch = start + BATCH_SIZE >= all.length;

    const results: CheckResult[] = await Promise.all(
      slice.map(async (site) => ({ id: site.id, name: site.name, ...(await checkLink(site.url)) }))
    );

    return NextResponse.json({
      total: all.length,
      batchIndex,
      batchSize: BATCH_SIZE,
      isLastBatch,
      results,
      progress: all.length === 0 || isLastBatch ? 100 : Math.round(((batchIndex + 1) * BATCH_SIZE / all.length) * 100),
    });
  } catch (error) {
    return serverError('WEBSITES_CHECK', error);
  }
}

/** 批量删除失效链接。 */
export async function DELETE(req: Request) {
  const db = getDb();
  if (!db) return dbUnavailable();

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  try {
    const { ids } = await req.json() as { ids?: number[] };
    if (!Array.isArray(ids) || ids.length === 0) return badRequest('请选择要删除的链接');

    await db.delete(websites).where(and(
      eq(websites.user_id, userId),
      inArray(websites.id, ids),
    ));

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    return serverError('WEBSITES_CHECK_DELETE', error);
  }
}
