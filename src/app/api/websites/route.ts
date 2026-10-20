import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { groups, websites } from '@/db/schema';
import { NextResponse } from 'next/server';
import { desc, asc, eq, and } from 'drizzle-orm';
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

export async function GET(req: Request) {
  try {
    // 本地开发模式 - 返回空数组
    if (isLocalDev) {
      return NextResponse.json([]);
    }

    const { env } = getCloudflareContext();
    if (!env?.DB) {
       return new NextResponse('Database not available', { status: 503 });
    }
    const db = createDb(env.DB);

    // 获取当前用户 ID
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.select().from(websites)
      .where(eq(websites.user_id, userId))
      .orderBy(
        asc(websites.group_id),
        desc(websites.click_count),
        asc(websites.sort_order)
      );

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[WEBSITES_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 本地开发模式 - 返回模拟数据
    if (isLocalDev) {
      const body = await req.json() as {
        group_id: string;
        name: string;
        url: string;
        logo_url: string;
        logo_type: string;
        description: string;
        username?: string;
        password?: string;
        sort_order: number;
      };
      return NextResponse.json({
        id: Math.floor(Math.random() * 1000),
        user_id: 1,
        group_id: parseInt(body.group_id),
        name: body.name,
        url: body.url,
        logo_url: body.logo_url || null,
        logo_type: body.logo_type || 'default',
        description: body.description || null,
        username: body.username || null,
        password: body.password || null,
        click_count: 0,
        last_clicked_at: null,
        sort_order: body.sort_order || 0,
        created_at: new Date(),
      });
    }

    const { env } = getCloudflareContext();
    const db = createDb(env.DB);

    // 获取当前用户 ID
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
        group_id: string;
        name: string;
        url: string;
        logo_url: string;
        logo_type: string;
        description: string;
        username?: string;
        password?: string;
        sort_order: number;
    };
    const {
      group_id,
      name,
      url,
      logo_url,
      logo_type,
      description,
      username,
      password,
      sort_order,
    } = body;

    const groupId = Number(group_id);
    const trimmedName = name?.trim();
    let normalizedUrl: string;

    try {
      const urlWithProtocol = /^https?:\/\//i.test(url?.trim() || '')
        ? url.trim()
        : `https://${url?.trim() || ''}`;
      const parsedUrl = new URL(urlWithProtocol);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Invalid protocol');
      normalizedUrl = parsedUrl.href;
    } catch {
      return NextResponse.json({ error: '请输入有效的网站地址' }, { status: 400 });
    }

    if (!Number.isInteger(groupId) || groupId <= 0 || !trimmedName) {
      return NextResponse.json({ error: '网站名称和有效分组为必填项' }, { status: 400 });
    }

    // A client-provided group id must belong to the current user. This also turns
    // foreign-key failures into a useful 400 response.
    const group = await db.select({ id: groups.id }).from(groups).where(and(
      eq(groups.id, groupId),
      eq(groups.user_id, userId)
    )).limit(1);
    if (!group.length) {
      return NextResponse.json({ error: '所选分组不存在，请刷新页面后重试' }, { status: 400 });
    }

    const result = await db.insert(websites).values({
        user_id: userId,
        group_id: groupId,
        name: trimmedName,
        url: normalizedUrl,
        logo_url: logo_url?.trim() || null,
        logo_type: logo_type || 'default',
        description: description?.trim() || null,
        username: username?.trim() || null,
        password: password || null,
        sort_order: Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0,
        created_at: new Date(),
    }).returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('[WEBSITES_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
