import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { websites } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq, sql, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/get-current-user';

// 本地开发模式标志
let isLocalDev = false;

// 检查是否在本地开发环境
try {
  const { env } = getCloudflareContext();
  if (!env?.DB) {
    isLocalDev = true;
  }
} catch (e) {
  isLocalDev = true;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 本地开发模式 - 返回成功但不实际操作数据库
    if (isLocalDev) {
      return NextResponse.json({ message: 'Local dev mode - no database operation' });
    }

    const { id } = await params;
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);

    // 获取当前用户 ID
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return new NextResponse('Website ID is required', { status: 400 });
    }

    const currentTime = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    const result = await db.update(websites)
        .set({
            click_count: sql`${websites.click_count} + 1`,
            last_clicked_at: currentTime as any,
        })
        .where(and(
          eq(websites.id, parseInt(id)),
          eq(websites.user_id, userId)
        ))
        .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('[WEBSITE_CLICK]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
