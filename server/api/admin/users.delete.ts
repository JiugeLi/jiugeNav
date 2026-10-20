import { eq } from 'drizzle-orm';
import { users } from '../../db/schema';

/** 管理员：删除用户（级联删除其分组与网站）。id 走查询参数，避免 DELETE body。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);
  requireUserId(event);

  const id = Number.parseInt(String(getQuery(event).id ?? ''), 10);
  if (!Number.isFinite(id) || id <= 0) fail(event, 400, '用户 ID 不正确');

  try {
    await db.delete(users).where(eq(users.id, id));
    return { success: true };
  } catch (error) {
    return serverError(event, 'ADMIN_USERS_DELETE', error);
  }
});
