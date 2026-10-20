import { getDb, getUserId, unauthorized, dbUnavailable, badRequest, notFound, serverError, parseId } from '@/lib/api';
import { groups } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  if (!db) return dbUnavailable();

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const id = parseId((await params).id);
  if (!id) return badRequest('分组 ID 不正确');

  try {
    const body = await req.json() as { name?: string; icon?: string; sort_order?: number };
    const name = body.name?.trim();
    if (!name) return badRequest('分组名称不能为空');

    const result = await db.update(groups)
      .set({ name, icon: body.icon, sort_order: Number(body.sort_order) || 0 })
      .where(and(eq(groups.id, id), eq(groups.user_id, userId)))
      .returning();

    if (!result.length) return notFound('分组不存在');
    return NextResponse.json(result[0]);
  } catch (error) {
    return serverError('GROUP_PUT', error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  if (!db) return dbUnavailable();

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const id = parseId((await params).id);
  if (!id) return badRequest('分组 ID 不正确');

  try {
    // 只能删除自己的分组，网站由外键级联删除
    await db.delete(groups).where(and(eq(groups.id, id), eq(groups.user_id, userId)));
    return NextResponse.json({ message: '分组已删除' });
  } catch (error) {
    return serverError('GROUP_DELETE', error);
  }
}
