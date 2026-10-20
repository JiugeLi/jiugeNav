import { getDb, getUserId, unauthorized, dbUnavailable, serverError } from '@/lib/api';
import { groups, websites } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/** 导出当前用户的全部分组与网站为 JSON 备份。 */
export async function GET(req: Request) {
  const db = getDb();
  if (!db) return dbUnavailable();

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  try {
    const [userGroups, userWebsites] = await Promise.all([
      db.select().from(groups).where(eq(groups.user_id, userId)).orderBy(asc(groups.sort_order)),
      db.select().from(websites).where(eq(websites.user_id, userId)).orderBy(asc(websites.sort_order)),
    ]);

    return NextResponse.json({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: { groups: userGroups, websites: userWebsites },
    });
  } catch (error) {
    return serverError('GROUPS_EXPORT', error);
  }
}
