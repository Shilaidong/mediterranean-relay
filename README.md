# 地中海中继站 · Mediterranean Relay

顶级二手黑胶数字拍卖行的移动端前端原型。软浮雕 + 地中海 70s 复古 + 未来主义交互。

## 技术栈

- Vite 5 + React 18 + TypeScript
- Tailwind CSS v3（自定义 `paper` / `ink` / `silver` / neumo 阴影）
- framer-motion（3D 翻转、盖章动画、阻尼拨盘、下拉刷新）
- react-router-dom v6
- lucide-react 图标

## 启动

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # 产出到 dist/
npm run preview # 本地预览构建结果
```

建议在 Chrome DevTools 切换 iPhone 14 Pro 模拟器体验。

## 页面

| 路由 | 页面 | 亮点 |
|---|---|---|
| `/` | Splash 启动页 | 零件拼装动画，2.4s 后跳转 Browse |
| `/browse` | Browse 档案库 | 软浮雕卡片 · 稀缺度拨盘 · 共享元素过渡 |
| `/detail/:id` | 机械展台 | 封面拖拽 3D 翻转 · 真空管 VU 表 · 磨损图纸热区 |
| `/vault` | 个人收藏箱 | 抽屉式横向滚动 · 下拉刷新弹簧回弹 |
| `/trade/:id` | 交易合同 | 长按 300ms 落章完成 · 印章落地动画 |
| `/linking` | 上架流程 | 矩阵码扫描 → AI 价格匹配 → 视觉校准上传 |
| `/profile` | 收藏家档案 | 基础资料、统计、设置入口 |

## 目录结构

```
src/
├─ App.tsx           路由 + 转场 + 底部导航壳
├─ main.tsx          入口
├─ index.css         全局 CSS 变量、颗粒噪点、安全区
├─ components/       AlbumCard · BottomNav · FloatingAction · HapticTap · RelaySlider
├─ pages/            Splash · Browse · Detail · Vault · Trade · Linking · Profile
├─ data/albums.ts    专辑 Mock 数据
└─ hooks/useHaptic.ts  15ms 触觉反馈
```

## 设计 Token

| 用途 | 色值 |
|---|---|
| 基础背景 | `#E8E4D9` (paper) |
| 主交互 | `#1A4B9E` (ink) |
| 金属装饰 | `#C7C2B5` (silver) |
| 印章 | `#B23A3A` (stamp) |

阴影统一使用 `shadow-neumo` / `shadow-neumo-inset`，严禁追加黑色粗重阴影。

## 无障碍

- `prefers-reduced-motion: reduce` 下所有动画降级为即时淡入
- 触控元素均 ≥ 44×44 pt
- 触觉反馈仅在支持 `navigator.vibrate` 的设备生效

## 原型参考

`HTML原型页.html` 保留作为视觉对照，不参与构建。
