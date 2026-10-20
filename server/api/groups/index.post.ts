import { groups } from '../../db/schema';

/** 新建分组。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  const userId = requireUserId(event);

  try {
    const body = await readBody<{ name?: string; icon?: string; sort_order?: number }>(event);
    const name = body?.name?.trim();
    if (!name) fail(event, 400, '分组名称不能为空');

    const inserted = await db.insert(groups).values({
      user_id: userId,
      name,
      icon: body?.icon || '📁',
      sort_order: Number(body?.sort_order) || 0,
      created_at: new Date(),
    }).returning();

    return inserted[0];
  } catch (error) {
    return serverError(event, 'GROUPS_POST', error);
  }
});
