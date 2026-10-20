/** 抓取目标站点，提取标题 / 描述 / 图标，用于「智能识别」。 */

function firstMatch(html: string, patterns: string[]): string {
  for (const pattern of patterns) {
    const match = html.match(new RegExp(pattern, 'i'));
    if (match?.[1]) {
      return match[1]
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    }
  }
  return '';
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

export default defineEventHandler(async (event) => {
  requireUserId(event);

  try {
    const body = await readBody<{ url?: string }>(event);
    const input = body?.url?.trim();
    if (!input) fail(event, 400, '请填写网址');

    const targetUrl = /^https?:\/\//i.test(input!) ? input! : `https://${input}`;
    const urlObj = new URL(targetUrl);

    const meta = {
      title: '',
      description: '',
      // 优先用站点自身的 favicon：Google 的 favicon 服务对私有/小站常返回 404
      logoUrl: `${urlObj.origin}/favicon.ico`,
      url: targetUrl,
    };

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });
      const html = await response.text();

      meta.title = firstMatch(html, [
        '<title[^>]*>([^<]+)</title>',
        '<meta\s+property="og:title"\s+content="([^"]+)"',
        '<meta\s+name="twitter:title"\s+content="([^"]+)"',
      ]);

      meta.description = firstMatch(html, [
        '<meta\s+name="description"\s+content="([^"]+)"',
        '<meta\s+property="og:description"\s+content="([^"]+)"',
        '<meta\s+name="twitter:description"\s+content="([^"]+)"',
      ]);

      const icon = firstMatch(html, [
        '<link\s+rel="icon"[^>]+href="([^"]+)"',
        '<link\s+rel="shortcut icon"[^>]+href="([^"]+)"',
        '<link\s+rel="apple-touch-icon"[^>]+href="([^"]+)"',
      ]);
      if (icon) meta.logoUrl = resolveUrl(icon, targetUrl);
    } catch (fetchError) {
      // 抓取失败也返回基础信息，前端仍可手动填写
      console.error('[ANALYZE_FETCH]', fetchError);
    }

    return meta;
  } catch (error) {
    return serverError(event, 'ANALYZE_URL', error);
  }
});
