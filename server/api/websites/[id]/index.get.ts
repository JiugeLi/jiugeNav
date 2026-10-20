import { and, eq } from 'drizzle-orm';
import { websites } from '../../../db/schema';

/** 单个网站详情。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);
  const id = parseId(event);

  try {
    const rows = await db.select().from(websites)
      .where(and(eq(websites.id, id), eq(websites.user_id, userId)));

    if (!rows.length) fail(event, 404, '网站不存在');
    return rows[0];
  } catch (error) {
    return serverError(event, 'WEBSITE_GET', error);
  }
});
