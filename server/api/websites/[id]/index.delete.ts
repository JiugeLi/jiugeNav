import { and, eq } from 'drizzle-orm';
import { websites } from '../../../db/schema';

/** 删除网站。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);
  const id = parseId(event);

  try {
    await db.delete(websites).where(and(eq(websites.id, id), eq(websites.user_id, userId)));
    return { message: '网站已删除' };
  } catch (error) {
    return serverError(event, 'WEBSITE_DELETE', error);
  }
});
