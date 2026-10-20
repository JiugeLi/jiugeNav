import { getDb, dbUnavailable, badRequest, serverError, getUserId } from '@/lib/api';
import { groups, users, websites } from '@/db/schema';
import { count, desc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/** 管理员：用户列表 + 每个用户的链接/分组/点击统计。 */
export async function GET(req: Request) {
  const db = getDb();
  if (!db) return dbUnavailable();
  if (!getUserId(req)) return NextResponse.json({ error: '未登录' }, { status: 401 });

  try {
    const rows = await db.select().from(users).orderBy(desc(users.created_at));

    const linkCounts = await db.select({ user_id: websites.user_id, n: count() })
      .from(websites).groupBy(websites.user_id);
    const groupCounts = await db.select({ user_id: groups.user_id, n: count() })
      .from(groups).groupBy(groups.user_id);
    const clickCounts = await db.select({
      user_id: websites.user_id,
      total: sql<number>`COALESCE(SUM(${websites.click_count}), 0)`,
    }).from(websites).groupBy(websites.user_id);

    const toMap = (list: Array<{ user_id: number; n?: number; total?: number }>, key: 'n' | 'total') =>
      Object.fromEntries(list.map((row) => [row.user_id, Number(row[key] ?? 0)]));

    const links = toMap(linkCounts, 'n');
    const groupMap = toMap(groupCounts, 'n');
    const clicks = toMap(clickCounts, 'total');

    return NextResponse.json(rows.map((user) => ({
      ...user,
      linkCount: links[user.id] ?? 0,
      groupCount: groupMap[user.id] ?? 0,
      totalClicks: clicks[user.id] ?? 0,
    })));
  } catch (error) {
    return serverError('ADMIN_USERS_GET', error);
  }
}

/** 管理员：删除用户（级联删除其分组与网站）。 */
export async function DELETE(req: Request) {
  const db = getDb();
  if (!db) return dbUnavailable();
  if (!getUserId(req)) return NextResponse.json({ error: '未登录' }, { status: 401 });

  try {
    const { id } = await req.json() as { id?: number };
    if (!id) return badRequest('用户 ID 不正确');

    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('ADMIN_USERS_DELETE', error);
  }
}
