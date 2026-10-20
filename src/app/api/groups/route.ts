import { getDb, getUserId, unauthorized, dbUnavailable, serverError, badRequest } from '@/lib/api';
import { groups } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const db = getDb();
  if (!db) return dbUnavailable();

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  try {
    const result = await db.select().from(groups)
      .where(eq(groups.user_id, userId))
      .orderBy(asc(groups.sort_order));

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    return serverError('GROUPS_GET', error);
  }
}

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return dbUnavailable();

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  try {
    const body = await req.json() as { name?: string; icon?: string; sort_order?: number };
    const name = body.name?.trim();
    if (!name) return badRequest('分组名称不能为空');

    const result = await db.insert(groups).values({
      user_id: userId,
      name,
      icon: body.icon || '📁',
      sort_order: Number(body.sort_order) || 0,
      created_at: new Date(),
    }).returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    return serverError('GROUPS_POST', error);
  }
}
