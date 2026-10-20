# jiugeNav 项目约定

## 环境与部署

- 生产 Worker：`cloud-nav`，域名 `nav.jiuge.ai`，D1 数据库 `jiugenav`（`54340279-33f5-4f57-98db-c70316233a49`），`migrations_dir = drizzle`。
- 部署：`npm run deploy`（`opennextjs-cloudflare build` + `wrangler deploy`）。GitHub Actions `deploy.yml` 另有流水线。
- 数据库迁移：`npx wrangler d1 migrations apply jiugenav --remote`；`migrations list --remote` 核对已应用清单。dev 库 `jiugenav-dev` 已不存在，只需维护生产库。
- 接口身份只靠请求头 `X-User-Id` / `X-Is-Admin`，没有签名校验；curl 调试直接带这两个头。
- 接口 500 时响应体只有 `Internal Error`，真实错误用 `npx wrangler tail cloud-nav --format json` 抓取（日志里 `console.error('[XXX]', error)` 会带堆栈）。

## D1 / Drizzle 约束（踩过坑，勿改回）

- 迁移历史与 `drizzle/meta/*_snapshot.json` 曾不一致：`0000` 建表漏了 `websites.is_public`，快照里却有，导致 `drizzle-kit generate` 永远报 "No schema changes"。改表结构必须手写 SQL 迁移，并同步 `drizzle/meta/_journal.json` 与新增 snapshot，不能依赖自动生成。
- D1 的 `PRAGMA foreign_keys = 1`。**禁止用 `DROP TABLE groups` / `users` 重建表**：`websites.group_id` 是 `ON DELETE CASCADE`，会把全部网站一起删掉。改列默认值只能改代码写入逻辑或 `UPDATE` 订正数据。
- 时间列一律存 Unix 秒。SQLite 的 `DEFAULT CURRENT_TIMESTAMP` 写入的是文本（`'2026-08-28 09:43:15'`），Drizzle `{ mode: 'timestamp' }` 按秒解析会得到 `null`。因此：新插入点必须显式传 `created_at: new Date()`；统计比较用 `Math.floor(Date.now() / 1000)`，不要和 `toISOString()` 字符串比（SQLite 里文本恒大于整数）。
- `websites.created_at` 已改为 `integer DEFAULT (unixepoch())`，`groups`/`users` 的库默认值仍是 `CURRENT_TIMESTAMP`，所以这两张表插入时必须显式写 `created_at`。

## 排查顺序

1. 先 `GET /api/test-db` 确认 D1 连通。
2. 再比对线上表结构与 `src/db/schema.ts`：`npx wrangler d1 execute jiugenav --remote --command "SELECT sql FROM sqlite_master WHERE name='websites'"`。
3. 仍无头绪就 `wrangler tail` 复现一次，直接看 D1 报错原文。
