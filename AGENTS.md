# SoloLink 项目约定

> 2026-10 从 Next.js（OpenNext）重写为 Nuxt 4 + Nitro，旧实现留在 git 历史（commit `1fd8e43` 及之前）。

## 环境与部署

- 生产 Worker：`sololink`，域名 `sololink.jiuge.ai`（`nav.jiuge.ai` 同时绑定为别名，别再部署回旧名 `cloud-nav`）。
- D1 库：`sololink`（`fa6a11cf-06e4-4acb-a6f1-0b93eca38e31`），`migrations_dir = drizzle`。旧库 `jiugenav` 已于 2026-10-20 迁移并删除，备份在 `/.backup/jiugenav-full-20261020-124744.sql`。
- 仓库：`https://github.com/JiugeLi/sololink`（原 `jiugeNav`）。
- 本地 D1 与线上库相互独立：`npm run db:migrate:local` 只建空库（同一个 D1 名 `sololink`，miniflare 存在 `.wrangler/state`），本地看不到线上数据是正常的。
- 构建部署：`npm run build`（`nuxt build`，Nitro `cloudflare_module` 预设）+ `npm run deploy`（含 wrangler deploy）。产物在 `.output/`。
- 本地开发：`npm run db:migrate:local` 后 `npm run dev`。`nitro-cloudflare-dev` 会把 `wrangler.toml` 的 D1 绑定注入 `nuxt dev`，因此**不要写本地 mock 分支**。
- GitHub Actions `deploy.yml` 在 push `main` 时只做 typecheck + build 校验（仓库没配 Cloudflare API Token，CI 不能部署）；上线用本机 `npm run deploy`。
- `npm ci` 在 Linux 上会因为 Windows 生成的 lockfile 可选依赖不一致而失败，CI 固定用 `npm install`。

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

1. `curl https://sololink.jiuge.ai/api/health` 确认 Worker 与 D1 正常。
2. 比对线上表结构与 `server/db/schema.ts`：
   `npx wrangler d1 execute sololink --remote --command "SELECT sql FROM sqlite_master WHERE name='websites'"`。
3. 仍无头绪就 `npx wrangler tail sololink --format json` 复现一次，直接看 `console.error('[SCOPE]', error)` 的原文。
