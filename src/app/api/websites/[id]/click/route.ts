import { getDb, getUserId, unauthorized, dbUnavailable, badRequest, serverError, parseId } from '@/lib/api';
import { websites } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/** 记录一次点击：click_count +1，并刷新 last_clicked_at（Unix 秒）。 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  if (!db) return dbUnavailable();

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const id = parseId((await params).id);
  if (!id) return badRequest('网站 ID 不正确');

  try {
    const result = await db.update(websites)
      .set({
        click_count: sql`${websites.click_count} + 1`,
        last_clicked_at: new Date(),
      })
      .where(and(eq(websites.id, id), eq(websites.user_id, userId)))
      .returning({ id: websites.id, click_count: websites.click_count });

    if (!result.length) return NextResponse.json({ error: '网站不存在' }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error) {
    return serverError('WEBSITE_CLICK', error);
  }
}
