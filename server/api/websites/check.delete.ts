import { and, eq, inArray } from 'drizzle-orm';
import { websites } from '../../db/schema';

/**
 * 批量删除失效链接。
 * ids 走查询参数（DELETE /api/websites/check?ids=1,2,3）：
 * Workers 运行时对带 body 的 DELETE 支持不稳定，readBody 会拿到 undefined。
 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);

  const ids = String(getQuery(event).ids ?? '')
    .split(',')
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (ids.length === 0) fail(event, 400, '请选择要删除的链接');

  try {
    await db.delete(websites).where(and(
      eq(websites.user_id, userId),
      inArray(websites.id, ids),
    ));

    return { success: true, deleted: ids.length };
  } catch (error) {
    return serverError(event, 'WEBSITES_CHECK_DELETE', error);
  }
});
