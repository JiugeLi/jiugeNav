import { eq } from 'drizzle-orm';
import { websites } from '../../db/schema';

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
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal, headers })
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
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);

  try {
    const batchIndex = Math.max(0, Number(getQuery(event).batch) || 0);

    const all = await db.select({ id: websites.id, name: websites.name, url: websites.url })
      .from(websites)
      .where(eq(websites.user_id, userId));

    const slice = all.slice(batchIndex * BATCH_SIZE, batchIndex * BATCH_SIZE + BATCH_SIZE);
    const isLastBatch = (batchIndex + 1) * BATCH_SIZE >= all.length;

    const results: CheckResult[] = await Promise.all(
      slice.map(async (site) => ({ id: site.id, name: site.name, ...(await checkLink(site.url)) })),
    );

    return {
      total: all.length,
      batchIndex,
      batchSize: BATCH_SIZE,
      isLastBatch,
      results,
      progress: all.length === 0 || isLastBatch
        ? 100
        : Math.round(((batchIndex + 1) * BATCH_SIZE / all.length) * 100),
    };
  } catch (error) {
    return serverError(event, 'WEBSITES_CHECK', error);
  }
});
