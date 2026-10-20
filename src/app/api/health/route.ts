import { getDb, dbUnavailable, serverError } from '@/lib/api';
import { groups, websites } from '@/db/schema';
import { NextResponse } from 'next/server';

/** 健康检查：服务状态 + D1 连通性。 */
export async function GET() {
  const db = getDb();

  if (!db) {
    return NextResponse.json({ status: 'degraded', database: 'unavailable' }, { status: 503 });
  }

  try {
    const [groupCount, websiteCount] = await Promise.all([
      db.select().from(groups).limit(1),
      db.select().from(websites).limit(1),
    ]);

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      hasData: groupCount.length > 0 || websiteCount.length > 0,
    });
  } catch (error) {
    return serverError('HEALTH_GET', error);
  }
}
