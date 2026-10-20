import { count, desc, eq, sql } from 'drizzle-orm';
import { groups, users, websites } from '../../db/schema';

/** 管理员：用户列表 + 每人的链接/分组/点击统计。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  requireUserId(event);

  try {
    const [rows, linkCounts, groupCounts, clickTotals] = await Promise.all([
      db.select().from(users).orderBy(desc(users.created_at)),
      db.select({ user_id: websites.user_id, n: count() }).from(websites).groupBy(websites.user_id),
      db.select({ user_id: groups.user_id, n: count() }).from(groups).groupBy(groups.user_id),
      db.select({
        user_id: websites.user_id,
        total: sql<number>`COALESCE(SUM(${websites.click_count}), 0)`,
      }).from(websites).groupBy(websites.user_id),
    ]);

    const toMap = (list: Array<{ user_id: number }>, pick: (row: any) => number) =>
      Object.fromEntries(list.map((row) => [row.user_id, pick(row)]));

    const links = toMap(linkCounts, (r) => Number(r.n ?? 0));
    const groupMap = toMap(groupCounts, (r) => Number(r.n ?? 0));
    const clicks = toMap(clickTotals, (r) => Number(r.total ?? 0));

    return rows.map((user) => ({
      ...user,
      linkCount: links[user.id] ?? 0,
      groupCount: groupMap[user.id] ?? 0,
      totalClicks: clicks[user.id] ?? 0,
    }));
  } catch (error) {
    return serverError(event, 'ADMIN_USERS_GET', error);
  }
});
