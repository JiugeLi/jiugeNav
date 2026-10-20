// 管理员密码认证（仅服务端）。密码以 SHA-256 存于 admin 表。
import { hashPassword, verifyPassword as verifyPasswordHash } from './password';
import { admin } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getDb } from './api';

/** 校验管理员密码；首次使用时用默认密码初始化 admin 表。 */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const db = getDb();
    if (!db) return false;

    const rows = await db.select().from(admin).limit(1);

    if (rows.length === 0) {
      const defaultHash = await hashPassword('admin123');
      await db.insert(admin).values({ password_hash: defaultHash, updated_at: new Date() });
      return verifyPasswordHash(password, defaultHash);
    }

    return verifyPasswordHash(password, rows[0].password_hash);
  } catch (error) {
    console.error('[AUTH] Password verification failed:', error);
    return false;
  }
}

/** 修改管理员密码。 */
export async function changePassword(newPassword: string): Promise<boolean> {
  try {
    const db = getDb();
    if (!db) return false;

    const password_hash = await hashPassword(newPassword);
    const rows = await db.select().from(admin).limit(1);

    if (rows.length === 0) {
      await db.insert(admin).values({ password_hash, updated_at: new Date() });
    } else {
      await db.update(admin)
        .set({ password_hash, updated_at: new Date() })
        .where(eq(admin.id, rows[0].id));
    }

    return true;
  } catch (error) {
    console.error('[AUTH] Password change failed:', error);
    return false;
  }
}
