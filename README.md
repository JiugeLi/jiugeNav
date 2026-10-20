# SoloLink

可自定义分组与图标、带点击统计和链接体检的个人书签导航。部署在 **Cloudflare Workers**，数据存 **Cloudflare D1**。

线上：<https://nav.jiuge.ai>

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Nuxt 4（Vue 3，`ssr: false` 纯客户端渲染） |
| 服务端 | Nitro（`cloudflare_module` 预设）→ Cloudflare Workers |
| 数据库 | Cloudflare D1 + Drizzle ORM（`drizzle/` 迁移） |
| 样式 | Tailwind CSS（`@nuxtjs/tailwindcss`） |
| 图标 | lucide-vue-next |

## 功能

- 分组与网站增删改查，图标可选 emoji，网站图标自动抓取
- 「智能识别」：输入网址后抓取标题 / 描述 / favicon
- 点击统计：总链接、总点击、本周点击、本周新增
- 链接体检：分批并发检测失效链接，可批量清理
- 数据导出 / 导入（JSON 备份，支持 merge / replace）
- 登录：管理员密码（默认 `admin123`）+ 可选 Google 登录
- 管理后台 `/admin`：用户、链接、点击量总览与用户删除

## 本地开发

```bash
npm install
npm run db:migrate:local   # 初始化本地 D1（wrangler 本地库）
npm run dev                # http://localhost:3000
```

`nitro-cloudflare-dev` 会把 `wrangler.toml` 里的 D1 绑定注入 `nuxt dev`，
所以本地直接读写真实结构与 D1 API，没有 mock 分支。

## 部署

```bash
npm run deploy             # nuxt build + wrangler deploy
```

- 生产 Worker：`cloud-nav`，域名 `nav.jiuge.ai`，D1 库 `jiugenav`
- 数据库迁移：`npm run db:migrate:prod`（等价 `wrangler d1 migrations apply jiugenav --remote`）
- Google 登录：配置 `NUXT_PUBLIC_GOOGLE_CLIENT_ID`（`wrangler.toml` 的 `[vars]` 或 GitHub Secrets）
- CI：`.github/workflows/deploy.yml`，push `main` 自动构建部署

## 目录结构

```
app/
  pages/index.vue        导航主页（分组、搜索、统计、卡片）
  pages/admin.vue        管理后台
  components/            弹窗、卡片等组件
  composables/useStore.ts 全局数据与操作
  utils/                 api 请求封装、会话、类型
server/
  api/                   REST 接口（见下）
  db/schema.ts           Drizzle 表结构
  utils/                 db / 鉴权 / 错误响应
drizzle/                 SQL 迁移（D1 唯一事实来源）
```

## API

所有接口都从请求头 `X-User-Id` 取当前用户（密码登录固定为 1 号管理员）。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 服务与 D1 连通性 |
| GET | `/api/stats` | 当前用户统计 |
| GET/POST | `/api/groups` | 分组列表 / 新建 |
| PUT/DELETE | `/api/groups/:id` | 修改 / 删除分组 |
| GET | `/api/groups/export` | 导出备份 |
| POST | `/api/groups/import` | 导入备份（`mode: merge \| replace`） |
| GET/POST | `/api/websites` | 网站列表 / 新建 |
| GET/PUT/DELETE | `/api/websites/:id` | 详情 / 修改 / 删除 |
| POST | `/api/websites/:id/click` | 记录点击 |
| POST | `/api/websites/analyze` | 抓取标题/描述/图标 |
| GET | `/api/websites/check?batch=n` | 分批体检 |
| DELETE | `/api/websites/check?ids=1,2` | 批量删除失效链接 |
| POST | `/api/auth/verify` | 管理员密码校验 |
| POST | `/api/auth/change-password` | 修改管理员密码 |
| POST | `/api/auth/google` | Google 登录 |
| GET | `/api/admin/stats` \| `/api/admin/users` | 管理后台数据 |
| DELETE | `/api/admin/users?id=1` | 删除用户 |

> DELETE 接口一律用查询参数传 id，避免 Workers 上带 body 的 DELETE 读不到 `readBody`。

## 数据模型

`users` / `groups` / `websites` / `admin`，时间列统一存 **Unix 秒**。
迁移历史与线上库漂移的坑（`websites.is_public` 缺失、`created_at` 文本时间）见 `AGENTS.md`。

## License

MIT
