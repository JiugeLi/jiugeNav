import { and, eq } from 'drizzle-orm';
import { groups, websites } from '../../db/schema';

/** 新增网站。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);

  try {
    const body = await readBody<{
      group_id?: string | number;
      name?: string;
      url?: string;
      logo_url?: string;
      logo_type?: string;
      description?: string;
      sort_order?: number;
    }>(event);

    const name = body?.name?.trim();
    const groupId = Number(body?.group_id);
    const url = normalizeUrl(body?.url);

    if (!url) fail(event, 400, '请输入有效的网站地址');
    if (!Number.isInteger(groupId) || groupId <= 0 || !name) fail(event, 400, '网站名称和有效分组为必填项');

    // 分组必须属于当前用户，顺便把外键错误变成可读提示
    const owned = await db.select({ id: groups.id }).from(groups)
      .where(and(eq(groups.id, groupId), eq(groups.user_id, userId)))
      .limit(1);
    if (!owned.length) fail(event, 400, '所选分组不存在，请刷新页面后重试');

    const inserted = await db.insert(websites).values({
      user_id: userId,
      group_id: groupId,
      name,
      url,
      logo_url: body?.logo_url?.trim() || null,
      logo_type: body?.logo_type || 'default',
      description: body?.description?.trim() || null,
      sort_order: Number(body?.sort_order) || 0,
      created_at: new Date(),
    }).returning();

    return inserted[0];
  } catch (error) {
    return serverError(event, 'WEBSITES_POST', error);
  }
});
