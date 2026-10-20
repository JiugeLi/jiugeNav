import { count, eq, sql } from 'drizzle-orm';
import { websites } from '../db/schema';

/** 当前用户：链接总数 / 总点击 / 本周点击 / 本周新增。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);

  try {
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;

    const [totals, weekly] = await Promise.all([
      db.select({
        totalLinks: count(),
        totalClicks: sql<number>`COALESCE(SUM(${websites.click_count}), 0)`,
      }).from(websites).where(eq(websites.user_id, userId)),

      db.select({
        weeklyClicks: sql<number>`COALESCE(SUM(CASE WHEN ${websites.last_clicked_at} >= ${sevenDaysAgo} THEN ${websites.click_count} ELSE 0 END), 0)`,
        newLinksThisWeek: sql<number>`COALESCE(SUM(CASE WHEN ${websites.created_at} >= ${sevenDaysAgo} THEN 1 ELSE 0 END), 0)`,
      }).from(websites).where(eq(websites.user_id, userId)),
    ]);

    return {
      totalLinks: Number(totals[0]?.totalLinks ?? 0),
      totalClicks: Number(totals[0]?.totalClicks ?? 0),
      weeklyClicks: Number(weekly[0]?.weeklyClicks ?? 0),
      newLinksThisWeek: Number(weekly[0]?.newLinksThisWeek ?? 0),
    };
  } catch (error) {
    return serverError(event, 'STATS_GET', error);
  }
});
