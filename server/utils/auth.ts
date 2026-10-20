// 管理员密码（SHA-256）与 Google 登录的用户落库逻辑。
import { eq } from 'drizzle-orm';
import { admin, users } from '../db/schema';
import type { Db } from './db';

export interface UserSession {
  userId: number;
  email: string;
  name: string | null;
  avatar: string | null;
  isAdmin: boolean;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
}

const DEFAULT_ADMIN_PASSWORD = 'admin123';

export async function hashPassword(password: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** 校验管理员密码；admin 表为空时用默认密码初始化。 */
export async function verifyAdminPassword(db: Db, password: string): Promise<boolean> {
  const rows = await db.select().from(admin).limit(1);

  if (rows.length === 0) {
    const hash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
    await db.insert(admin).values({ password_hash: hash, updated_at: new Date() });
    return hash === (await hashPassword(password));
  }

  const stored = rows[0]?.password_hash;
  return !!stored && stored === (await hashPassword(password));
}

/** 修改管理员密码。 */
export async function changeAdminPassword(db: Db, newPassword: string): Promise<void> {
  const password_hash = await hashPassword(newPassword);
  const rows = await db.select().from(admin).limit(1);

  if (rows.length === 0) {
    await db.insert(admin).values({ password_hash, updated_at: new Date() });
  } else {
    await db.update(admin).set({ password_hash, updated_at: new Date() }).where(eq(admin.id, rows[0]!.id));
  }
}

/** 校验 Google ID Token（tokeninfo 端点）。 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) return null;

    const data = await response.json() as {
      sub: string;
      email: string;
      name: string;
      picture: string;
      email_verified: string;
    };

    if (data.email_verified !== 'true') return null;

    return { id: data.sub, email: data.email, name: data.name, picture: data.picture };
  } catch (error) {
    console.error('[AUTH] Google token verification failed:', error);
    return null;
  }
}

/** Google 登录：不存在则注册，存在则刷新 last_login。 */
export async function loginOrCreateUserWithGoogle(db: Db, googleInfo: GoogleUserInfo): Promise<UserSession> {
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
    if (!user) throw new Error('创建用户失败');
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
}
