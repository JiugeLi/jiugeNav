// 服务端用户账号逻辑：Google 登录时创建/更新用户。
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { GoogleUserInfo } from './google-auth';
import { getDb } from './api';
import type { UserSession } from './session';

export type { UserSession } from './session';

/** Google 登录：不存在则注册，存在则刷新 last_login。 */
export async function loginOrCreateUserWithGoogle(googleInfo: GoogleUserInfo): Promise<UserSession | null> {
  try {
    const db = getDb();
    if (!db) return null;

    const now = new Date();
    const existing = await db.select().from(users).where(eq(users.google_id, googleInfo.id)).limit(1);

    let user = existing[0];
    if (!user) {
      const inserted = await db.insert(users).values({
        email: googleInfo.email,
        name: googleInfo.name,
        avatar: googleInfo.picture,
        google_id: googleInfo.id,
        last_login: now,
        created_at: now,
      }).returning();
      user = inserted[0];
    } else {
      await db.update(users).set({ last_login: now }).where(eq(users.id, user.id));
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isAdmin: false,
    };
  } catch (error) {
    console.error('[AUTH] Login/Create user failed:', error);
    return null;
  }
}
