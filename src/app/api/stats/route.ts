import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { websites } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq, count, and, gte, sql } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/get-current-user';

export async function GET(req: Request) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
      return new NextResponse('Database not available', { status: 503 });
    }
    const db = createDb(env.DB);

    // Get current user ID
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate the date for 7 days ago (this week)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = Math.floor(sevenDaysAgo.getTime() / 1000); // Convert to Unix timestamp

    // Get total links count
    const totalLinksResult = await db.select({ count: count() })
      .from(websites)
      .where(eq(websites.user_id, userId));
    const totalLinks = totalLinksResult[0]?.count || 0;

    // Get total click count by summing all click_count values
    const websitesData = await db.select({ click_count: websites.click_count }).from(websites).where(eq(websites.user_id, userId));
    const totalClicks = websitesData.reduce((sum, w) => sum + (w.click_count || 0), 0);

    // Get clicks from this week - sum click_count for websites clicked in last 7 days
    // Use sql for timestamp comparison since fields are stored as integers
    const weeklyWebsites = await db.select({
      click_count: websites.click_count
    })
      .from(websites)
      .where(
        sql`${websites.user_id} = ${userId} AND ${websites.last_clicked_at} >= ${sevenDaysAgoTimestamp}`
      );
    const weeklyClicks = weeklyWebsites.reduce((sum, w) => sum + (w.click_count || 0), 0);

    // Get new links added this week
    const newLinksThisWeekResult = await db.select({ id: websites.id })
      .from(websites)
      .where(
        sql`${websites.user_id} = ${userId} AND ${websites.created_at} >= ${sevenDaysAgoTimestamp}`
      );
    const newLinksThisWeek = newLinksThisWeekResult.length || 0;

    return NextResponse.json({
      totalLinks,
      totalClicks,
      weeklyClicks,
      newLinksThisWeek,
    });
  } catch (error) {
    console.error('[STATS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
