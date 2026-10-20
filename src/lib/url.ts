/** 规范化网址：补协议、校验合法性，非法则返回 null。 */
export function normalizeUrl(input: string | undefined): string | null {
  const raw = input?.trim();
  if (!raw) return null;

  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}
