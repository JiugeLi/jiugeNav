import { and, eq } from 'drizzle-orm';
import { websites } from '../../../db/schema';

/** 更新网站。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);
  const id = parseId(event);

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
    if (!name) fail(event, 400, '网站名称不能为空');

    const url = normalizeUrl(body?.url);
    if (!url) fail(event, 400, '请输入有效的网站地址');

    const groupId = Number(body?.group_id);

    const updated = await db.update(websites).set({
      group_id: Number.isInteger(groupId) && groupId > 0 ? groupId : undefined,
      name,
      url,
      logo_url: body?.logo_url?.trim() || null,
      logo_type: body?.logo_type || 'default',
      description: body?.description?.trim() || null,
      sort_order: Number(body?.sort_order) || 0,
    })
      .where(and(eq(websites.id, id), eq(websites.user_id, userId)))
      .returning();

    if (!updated.length) fail(event, 404, '网站不存在');
    return updated[0];
  } catch (error) {
    return serverError(event, 'WEBSITE_PUT', error);
  }
});
