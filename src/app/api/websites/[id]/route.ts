import { getDb, getUserId, unauthorized, dbUnavailable, badRequest, notFound, serverError, parseId } from '@/lib/api';
import { websites } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { normalizeUrl } from '@/lib/url';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const db = getDb();
  if (!db) return dbUnavailable();

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const id = parseId((await params).id);
  if (!id) return badRequest('网站 ID 不正确');

  try {
    const result = await db.select().from(websites)
      .where(and(eq(websites.id, id), eq(websites.user_id, userId)));

    if (!result.length) return notFound('网站不存在');
    return NextResponse.json(result[0]);
  } catch (error) {
    return serverError('WEBSITE_GET', error);
  }
}

export async function PUT(req: Request, { params }: Params) {
  const db = getDb();
  if (!db) return dbUnavailable();

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const id = parseId((await params).id);
  if (!id) return badRequest('网站 ID 不正确');

  try {
    const body = await req.json() as {
      group_id?: string | number;
      name?: string;
      url?: string;
      logo_url?: string;
      logo_type?: string;
      description?: string;
      sort_order?: number;
    };

    const name = body.name?.trim();
    if (!name) return badRequest('网站名称不能为空');

    const url = normalizeUrl(body.url);
    if (!url) return badRequest('请输入有效的网站地址');

    const groupId = Number(body.group_id);

    const result = await db.update(websites).set({
      group_id: Number.isInteger(groupId) && groupId > 0 ? groupId : undefined,
      name,
      url,
      logo_url: body.logo_url?.trim() || null,
      logo_type: body.logo_type || 'default',
      description: body.description?.trim() || null,
      sort_order: Number(body.sort_order) || 0,
    })
      .where(and(eq(websites.id, id), eq(websites.user_id, userId)))
      .returning();

    if (!result.length) return notFound('网站不存在');
    return NextResponse.json(result[0]);
  } catch (error) {
    return serverError('WEBSITE_PUT', error);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const db = getDb();
  if (!db) return dbUnavailable();

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const id = parseId((await params).id);
  if (!id) return badRequest('网站 ID 不正确');

  try {
    await db.delete(websites).where(and(eq(websites.id, id), eq(websites.user_id, userId)));
    return NextResponse.json({ message: '网站已删除' });
  } catch (error) {
    return serverError('WEBSITE_DELETE', error);
  }
}
