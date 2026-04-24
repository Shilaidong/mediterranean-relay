# Mediterranean Relay

Mediterranean Relay 现已从原本的 Vite 原型切换为 `Next.js App Router + Supabase + Vercel` 的可上线骨架。旧原型已移动到 `legacy-src/` 作为视觉参考，主应用迁移到新的 `app/` 路由结构。

## 当前能力

- 邮箱密码注册登录
- 市场浏览与详情页
- AI 辅助上架流程
- 积分钱包式购买交易
- 个人资产与积分流水
- 社区公开阅读与登录发帖

## 技术栈

- Next.js 16 App Router
- React 19
- Tailwind CSS v3
- Supabase Auth / Database / Storage
- framer-motion
- Vercel

## 本地运行

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

复制 `.env.example` 为 `.env.local`，填入你新建的 Supabase 项目配置。

3. 初始化新库

在新的 Supabase 项目 SQL Editor 中依次执行：

```sql
-- 先执行
\i supabase/schema.sql

-- 再执行
\i supabase/seed.sql
```

如果你是直接在 Supabase Web SQL Editor 里粘贴执行，就按顺序分别粘贴两个文件内容。

4. 启动开发环境

```bash
npm run dev
```

默认地址：

- [http://localhost:3000](http://localhost:3000)

## 关键目录

```text
app/                  Next.js 页面与 API route
components/           新的 UI 组件
lib/                  Supabase 客户端、映射和工具函数
providers/            AuthProvider
supabase/schema.sql   全新数据库结构、RLS、RPC、Storage policy
supabase/seed.sql     新种子数据
legacy-src/           旧原型代码，仅作参考
```

## 必需环境变量

见 `.env.example`：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 新 Supabase 设计

- `profiles`
- `catalog_releases`
- `inventory_items`
- `market_listings`
- `orders`
- `wallet_ledger`
- `posts`

交易通过数据库 RPC `purchase_listing(...)` 完成；上架通过 `create_listing(...)` 完成。

## 部署

直接部署到 Vercel。只需在项目环境变量中填入同一套 Supabase 配置即可。

## Supabase 接入

更完整的新库接入步骤见：

- [SUPABASE_SETUP.md](/Users/shi/projects/mediterranean-relay/SUPABASE_SETUP.md)

完成后可用这个健康检查接口确认项目是否已真正连接到新库：

- [http://localhost:3000/api/health](http://localhost:3000/api/health)
