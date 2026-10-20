# SoloLink 项目约定

> 2026-10 从 Next.js（OpenNext）重写为 Nuxt 4 + Nitro，旧实现留在 git 历史（commit `1fd8e43` 及之前）。

## 环境与部署

- 生产 Worker：`cloud-nav`（名字沿用旧部署，避免自定义域名迁移），域名 `nav.jiuge.ai`。
- D1 库：`jiugenav`（`54340279-33f5-4f57-98db-c70316233a49`），`migrations_dir = drizzle`，**库名/库 ID 不要改**，改了要重新导入数据。
- 构建部署：`npm run build`（`nuxt build`，Nitro `cloudflare_module` 预设）+ `npm run deploy`（含 wrangler deploy）。产物在 `.output/`。
- 本地开发：`npm run db:migrate:local` 后 `npm run dev`。`nitro-cloudflare-dev` 会把 `wrangler.toml` 的 D1 绑定注入 `nuxt dev`，因此**不要写本地 mock 分支**。
- GitHub Actions `deploy.yml` 在 push `main` 时构建部署，Google Client ID 通过 secret `NUXT_PUBLIC_GOOGLE_CLIENT_ID` 注入。

## 接口约定

- 鉴权只有请求头 `X-User-Id` / `X-Is-Admin`，没有签名校验；密码登录固定映射到 1 号用户（`admin@local`，`isAdmin`）。
- 服务端统一用 `server/utils/http.ts` 的 `requireDb` / `requireUserId` / `fail` / `serverError`，错误响应体是 Nitro 标准结构 + `data.error`，前端 `app/utils/api.ts` 按此解析。
- **DELETE 一律用查询参数传 id**（Workers 上带 body 的 DELETE，`readBody` 会拿到 undefined 并让请求挂起）。
- 前端不 SSR（`ssr: false`），数据只在客户端登录后加载，页面内容不需要服务端渲染。

## D1 / Drizzle 约束（踩过坑，勿改回）

- 迁移历史与 `drizzle/meta/*_snapshot.json` 曾不一致：`0000` 建表漏了 `websites.is_public`，快照里却有，导致 `drizzle-kit generate` 永远报 "No schema changes"。改表结构必须手写 SQL 迁移，并同步 `drizzle/meta/_journal.json` 与新增 snapshot。
- D1 的 `PRAGMA foreign_keys = 1`。**禁止 `DROP TABLE groups` / `users` 重建表**：`websites.group_id` 是 `ON DELETE CASCADE`，会连带删掉全部网站。改列默认值只能改代码写入逻辑或 `UPDATE` 订正数据。
- 时间列一律存 Unix 秒。SQLite 的 `DEFAULT CURRENT_TIMESTAMP` 写入的是文本（`'2026-08-28 09:43:15'`），Drizzle `{ mode: 'timestamp' }` 按秒解析会得到 `null`。因此新插入点必须显式传 `created_at: new Date()`；统计比较用 `Math.floor(Date.now() / 1000)`，不要和 `toISOString()` 字符串比（SQLite 里文本恒大于整数）。
- `websites.created_at` 已改为 `integer DEFAULT (unixepoch())`；`groups`/`users` 的库默认值仍是 `CURRENT_TIMESTAMP`，所以这两张表插入时必须显式写 `created_at`。
- 写入 `last_clicked_at` 这类 timestamp 列必须传 `Date`，传数字会调 `value.getTime()` 直接抛错（Next 版本点击统计 500 的根因）。

## 排查顺序

1. `curl https://nav.jiuge.ai/api/health` 确认 Worker 与 D1 正常。
2. 比对线上表结构与 `server/db/schema.ts`：
   `npx wrangler d1 execute jiugenav --remote --command "SELECT sql FROM sqlite_master WHERE name='websites'"`。
3. 仍无头绪就 `npx wrangler tail cloud-nav --format json` 复现一次，直接看 `console.error('[SCOPE]', error)` 的原文。
