import { getDb, getUserId, unauthorized, dbUnavailable, serverError } from '@/lib/api';
import { websites } from '@/db/schema';
import { count, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/** 当前用户的链接数 / 总点击 / 本周点击 / 本周新增。 */
export async function GET(req: Request) {
  const db = getDb();
  if (!db) return dbUnavailable();

  const userId = getUserId(req);
  if (!userId) return unauthorized();

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

    return NextResponse.json({
      totalLinks: totals[0]?.totalLinks ?? 0,
      totalClicks: totals[0]?.totalClicks ?? 0,
      weeklyClicks: weekly[0]?.weeklyClicks ?? 0,
      newLinksThisWeek: weekly[0]?.newLinksThisWeek ?? 0,
    });
  } catch (error) {
    return serverError('STATS_GET', error);
  }
}
