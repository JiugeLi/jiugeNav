// 统一的前端请求封装：自动带身份头，错误转成可读异常。
import { readSession } from './session';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiRequest<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const session = readSession();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session) {
    headers['X-User-Id'] = String(session.userId);
    headers['X-Is-Admin'] = String(session.isAdmin);
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as
      | { error?: string; statusMessage?: string; message?: string; data?: { error?: string } }
      | null;

    const message = payload?.data?.error || payload?.statusMessage || payload?.error || payload?.message;
    throw new Error(message || `请求失败（${response.status}）`);
  }

  return response.status === 204 ? (null as T) : response.json() as Promise<T>;
}

export const apiGet = <T = any>(url: string, signal?: AbortSignal) =>
  apiRequest<T>(url, { signal });

export const apiPost = <T = any>(url: string, body?: unknown) =>
  apiRequest<T>(url, { method: 'POST', body });

export const apiPut = <T = any>(url: string, body?: unknown) =>
  apiRequest<T>(url, { method: 'PUT', body });

export const apiDelete = <T = any>(url: string, body?: unknown) =>
  apiRequest<T>(url, { method: 'DELETE', body });
