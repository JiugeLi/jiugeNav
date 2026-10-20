// 客户端会话：只依赖 localStorage，可被任意组件安全引用。
export interface UserSession {
  userId: number;
  email: string;
  name: string | null;
  avatar: string | null;
  isAdmin: boolean;
}

export const SESSION_KEY = 'sololink_user_session';
// 兼容旧版（jiugeNav）会话，升级后不用重新登录
const LEGACY_SESSION_KEY = 'jiugenav_user_session';

export function readSession(): UserSession | null {
  if (!import.meta.client) return null;

  const raw = localStorage.getItem(SESSION_KEY) ?? localStorage.getItem(LEGACY_SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as UserSession;
    localStorage.setItem(SESSION_KEY, raw);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    return session;
  } catch {
    return null;
  }
}

export function writeSession(session: UserSession): void {
  if (!import.meta.client) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function removeSession(): void {
  if (!import.meta.client) return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEGACY_SESSION_KEY);
}
