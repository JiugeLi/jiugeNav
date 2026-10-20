import { eq } from 'drizzle-orm';
import { groups, websites } from '../../db/schema';

interface ImportPayload {
  groups: Array<{ id?: number; name: string; icon: string; sort_order: number }>;
  websites: Array<{
    group_id: number; name: string; url: string;
    logo_url: string; logo_type: string; description: string; sort_order: number;
  }>;
}

/** 从 JSON 备份导入；mode=replace 时先清空当前用户数据。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);

  try {
    const body = await readBody<{ data?: ImportPayload; mode?: 'merge' | 'replace' }>(event);
    const data = body?.data;
    if (!data?.groups || !data?.websites) fail(event, 400, '导入数据格式不正确');

    if (body?.mode === 'replace') {
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

      const newId = inserted[0]?.id;
      if (group.id && newId) groupIdMap[group.id] = newId;
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

    return { message: '导入成功' };
  } catch (error) {
    return serverError(event, 'GROUPS_IMPORT', error);
  }
});
