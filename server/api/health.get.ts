import { groups } from '../db/schema';

/** 健康检查：服务状态 + D1 连通性。 */
export default defineEventHandler(async (event) => {
  const db = getDb(event);
  if (!db) return { status: 'degraded', database: 'unavailable', timestamp: new Date().toISOString() };

  try {
    await db.select().from(groups).limit(1);
    return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
  } catch (error) {
    return serverError(event, 'HEALTH_GET', error);
  }
});
