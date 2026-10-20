import { and, eq, sql } from 'drizzle-orm';
import { websites } from '../../../db/schema';

/** 记录一次点击：click_count +1 并刷新 last_clicked_at。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);
  const id = parseId(event);

  try {
    const updated = await db.update(websites)
      .set({
        click_count: sql`${websites.click_count} + 1`,
        // timestamp 列必须传 Date，传数字会触发 value.getTime is not a function
        last_clicked_at: new Date(),
      })
      .where(and(eq(websites.id, id), eq(websites.user_id, userId)))
      .returning({ id: websites.id, click_count: websites.click_count });

    if (!updated.length) fail(event, 404, '网站不存在');
    return updated[0];
  } catch (error) {
    return serverError(event, 'WEBSITE_CLICK', error);
  }
});
