import { asc, desc, eq } from 'drizzle-orm';
import { websites } from '../../db/schema';

/** 当前用户的全部网站。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);

  try {
    const rows = await db.select().from(websites)
      .where(eq(websites.user_id, userId))
      .orderBy(asc(websites.group_id), desc(websites.click_count), asc(websites.sort_order));

    setHeader(event, 'cache-control', 'public, s-maxage=60, stale-while-revalidate=120');
    return rows;
  } catch (error) {
    return serverError(event, 'WEBSITES_GET', error);
  }
});
