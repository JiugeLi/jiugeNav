import { getDb, getUserId, unauthorized, dbUnavailable, badRequest, serverError } from '@/lib/api';
import { groups, websites } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

interface ImportPayload {
  groups: Array<{ id?: number; name: string; icon: string; sort_order: number }>;
  websites: Array<{
    group_id: number; name: string; url: string;
    logo_url: string; logo_type: string; description: string; sort_order: number;
  }>;
}

/** 从 JSON 备份导入；mode=replace 时先清空当前用户数据。 */
export async function POST(req: Request) {
  const db = getDb();
  if (!db) return dbUnavailable();

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  try {
    const body = await req.json() as { data?: ImportPayload; mode?: 'merge' | 'replace' };
    const data = body.data;
    if (!data?.groups || !data?.websites) return badRequest('导入数据格式不正确');

    if (body.mode === 'replace') {
      await db.delete(websites).where(eq(websites.user_id, userId));
      await db.delete(groups).where(eq(groups.user_id, userId));
    }

    const now = new Date();
    const groupIdMap: Record<number, number> = {};

    for (const group of data.groups) {
      const inserted = await db.insert(groups).values({
        user_id: userId,
        name: group.name,
        icon: group.icon,
        sort_order: group.sort_order,
        created_at: now,
      }).returning();

      if (group.id) groupIdMap[group.id] = inserted[0].id;
    }

    for (const site of data.websites) {
      const groupId = groupIdMap[site.group_id];
      if (!groupId) continue;

      await db.insert(websites).values({
        user_id: userId,
        group_id: groupId,
        name: site.name,
        url: site.url,
        logo_url: site.logo_url,
        logo_type: site.logo_type,
        description: site.description,
        sort_order: site.sort_order,
        created_at: now,
      });
    }

    return NextResponse.json({ message: '导入成功' });
  } catch (error) {
    return serverError('GROUPS_IMPORT', error);
  }
}
