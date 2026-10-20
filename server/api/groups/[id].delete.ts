import { and, eq } from 'drizzle-orm';
import { groups } from '../../db/schema';

/** 删除分组（网站由外键级联删除）。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);
  const id = parseId(event);

  try {
    await db.delete(groups).where(and(eq(groups.id, id), eq(groups.user_id, userId)));
    return { message: '分组已删除' };
  } catch (error) {
    return serverError(event, 'GROUP_DELETE', error);
  }
});
