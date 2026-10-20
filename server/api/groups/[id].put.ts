import { and, eq } from 'drizzle-orm';
import { groups } from '../../db/schema';

/** 更新分组（只能改自己的）。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);
  const id = parseId(event);

  try {
    const body = await readBody<{ name?: string; icon?: string; sort_order?: number }>(event);
    const name = body?.name?.trim();
    if (!name) fail(event, 400, '分组名称不能为空');

    const updated = await db.update(groups)
      .set({ name, icon: body?.icon, sort_order: Number(body?.sort_order) || 0 })
      .where(and(eq(groups.id, id), eq(groups.user_id, userId)))
      .returning();

    if (!updated.length) fail(event, 404, '分组不存在');
    return updated[0];
  } catch (error) {
    return serverError(event, 'GROUP_PUT', error);
  }
});
