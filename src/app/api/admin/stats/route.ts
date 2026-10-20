import { getDb, dbUnavailable, serverError, unauthorized, getUserId } from '@/lib/api';
import { groups, users, websites } from '@/db/schema';
import { count, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/** 管理员总览统计。 */
export async function GET(req: Request) {
  const db = getDb();
  if (!db) return dbUnavailable();
  if (!getUserId(req)) return unauthorized();

  try {
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
    const newSince = (column: typeof websites.created_at | typeof users.created_at) =>
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

    return NextResponse.json({
      totalUsers: userStats[0]?.total ?? 0,
      totalLinks: linkStats[0]?.total ?? 0,
      totalGroups: groupStats[0]?.total ?? 0,
      totalClicks: Number(linkStats[0]?.clicks ?? 0),
      newUsersThisWeek: Number(userStats[0]?.newThisWeek ?? 0),
      newLinksThisWeek: Number(linkStats[0]?.newThisWeek ?? 0),
    });
  } catch (error) {
    return serverError('ADMIN_STATS_GET', error);
  }
}
