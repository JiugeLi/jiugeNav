import { asc, eq } from 'drizzle-orm';
import { groups } from '../../db/schema';

/** 当前用户的分组列表。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);

  try {
    const rows = await db.select().from(groups)
      .where(eq(groups.user_id, userId))
      .orderBy(asc(groups.sort_order));

    setHeader(event, 'cache-control', 'public, s-maxage=60, stale-while-revalidate=120');
    return rows;
  } catch (error) {
    return serverError(event, 'GROUPS_GET', error);
  }
});
