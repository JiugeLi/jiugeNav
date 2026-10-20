// 客户端会话存储（只依赖 localStorage，可以被客户端组件安全引用）。

export interface UserSession {
  userId: number;
  email: string;
  name: string | null;
  avatar: string | null;
  isAdmin: boolean;
}

export const USER_SESSION_KEY = 'sololink_user_session';
// 旧版本（jiugeNav）用过的 key，读取时兼容，避免升级后被迫重新登录
const LEGACY_SESSION_KEY = 'jiugenav_user_session';

export function saveUserSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
}

export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null;

  const data = localStorage.getItem(USER_SESSION_KEY) ?? localStorage.getItem(LEGACY_SESSION_KEY);
  if (!data) return null;

  try {
    const session = JSON.parse(data) as UserSession;
    localStorage.setItem(USER_SESSION_KEY, data);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    return session;
  } catch {
    return null;
  }
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_SESSION_KEY);
  localStorage.removeItem(LEGACY_SESSION_KEY);
}
