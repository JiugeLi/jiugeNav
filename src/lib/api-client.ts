// 客户端 API 客户端：自动带上身份请求头，并把错误响应转成可读信息。
import { getUserSession } from './session';

const BASE_HEADERS = { 'Content-Type': 'application/json' };

/** 底层请求；需要中断等高级用法时直接用它。 */
export async function apiClient(url: string, options: RequestInit = {}): Promise<Response> {
  const session = getUserSession();

  const headers: Record<string, string> = {
    ...BASE_HEADERS,
    ...(options.headers as Record<string, string> | undefined),
  };

  if (session) {
    headers['X-User-Id'] = session.userId.toString();
    headers['X-Is-Admin'] = session.isAdmin.toString();
  }

  return fetch(url, { ...options, headers });
}

async function readError(response: Response): Promise<never> {
  let message = '';
  try {
    const type = response.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      const body = await response.json() as { error?: string; message?: string };
      message = body.error || body.message || '';
    } else {
      message = await response.text();
    }
  } catch {
    // 读不到就只报状态码
  }
  throw new Error(`API Error ${response.status}${message ? `: ${message}` : ''}`);
}

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const response = await apiClient(url, options);
  if (!response.ok) await readError(response);
  return response.json() as Promise<T>;
}

export const apiGet = <T = any>(url: string, signal?: AbortSignal) =>
  request<T>(url, { method: 'GET', signal });

export const apiPost = <T = any>(url: string, data?: unknown) =>
  request<T>(url, { method: 'POST', body: JSON.stringify(data ?? {}) });

export const apiPut = <T = any>(url: string, data?: unknown) =>
  request<T>(url, { method: 'PUT', body: JSON.stringify(data ?? {}) });

export const apiDelete = <T = any>(url: string) =>
  request<T>(url, { method: 'DELETE' });
