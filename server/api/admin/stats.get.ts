import { count, sql } from 'drizzle-orm';
import { groups, users, websites } from '../../db/schema';

/** 管理员总览统计。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  requireUserId(event);

  try {
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
    const newSince = (column: typeof users.created_at | typeof websites.created_at) =>
      sql<number>`COALESCE(SUM(CASE WHEN ${column} >= ${sevenDaysAgo} THEN 1 ELSE 0 END), 0)`;

    const [userStats, linkStats, groupStats] = await Promise.all([
      db.select({ total: count(), newThisWeek: newSince(users.created_at) }).from(users),
      db.select({
        total: count(),
        clicks: sql<number>`COALESCE(SUM(${websites.click_count}), 0)`,
        newThisWeek: newSince(websites.created_at),
      }).from(websites),
      db.select({ total: count() }).from(groups),
    ]);

    return {
      totalUsers: Number(userStats[0]?.total ?? 0),
      totalLinks: Number(linkStats[0]?.total ?? 0),
      totalGroups: Number(groupStats[0]?.total ?? 0),
      totalClicks: Number(linkStats[0]?.clicks ?? 0),
      newUsersThisWeek: Number(userStats[0]?.newThisWeek ?? 0),
      newLinksThisWeek: Number(linkStats[0]?.newThisWeek ?? 0),
    };
  } catch (error) {
    return serverError(event, 'ADMIN_STATS_GET', error);
  }
});
