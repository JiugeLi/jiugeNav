import { asc, eq } from 'drizzle-orm';
import { groups, websites } from '../../db/schema';

/** 导出当前用户的分组与网站为 JSON 备份。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);

  try {
    const [userGroups, userWebsites] = await Promise.all([
      db.select().from(groups).where(eq(groups.user_id, userId)).orderBy(asc(groups.sort_order)),
      db.select().from(websites).where(eq(websites.user_id, userId)).orderBy(asc(websites.sort_order)),
    ]);

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: { groups: userGroups, websites: userWebsites },
    };
  } catch (error) {
    return serverError(event, 'GROUPS_EXPORT', error);
  }
});
