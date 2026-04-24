# Mediterranean Relay 前端搭建计划

## Context

项目目录只有 `HTML原型页.html`（Browse 页 Tailwind CDN 版）与 `产品设计说明书.md`，尚未初始化前端工程。目标：按照产品 PRD 与视觉 DNA（软浮雕 + 地中海 70s 复古 + 未来主义），从零搭建一套可运行的 React SPA，覆盖启动、浏览、详情、收藏、交易、上架六大核心页面，使用 Mock 数据驱动，为后端对接和真机联调做准备。

关键约束：
- 移动端优先（`viewport-fit=cover`、安全区）
- 严格遵循 PRD 色谱与阴影规范（严禁过重黑色阴影）
- 所有可点击元素具备「按下/浮起」物理反馈
- 导航栏磨砂玻璃需 60fps

---

## 技术栈

| 维度 | 选型 | 理由 |
|---|---|---|
| 构建 | Vite 5 + React 18 + TypeScript | 快、热更、类型安全 |
| 样式 | Tailwind CSS v3（本地 postcss，非 CDN） | 延续原型类名风格，支持主题扩展 |
| 路由 | react-router-dom v6 | 6 页面 SPA 切换 |
| 动画 | framer-motion | 非线性转场 / 阻尼感滚动 / 3D 翻转 |
| 字体 | Google Fonts `Playfair Display` + `Inter` | 与原型一致 |
| 图标 | lucide-react | 与原型 SVG 风格接近的 stroke 图标 |
| 状态 | React Context + useReducer（轻量） | 购物车/收藏夹等本地状态 |

不引入 Redux / shadcn / Next.js，避免过度工程化。

---

## 项目结构

```
mediterranean-relay/
├─ index.html                       # Vite 入口，含 viewport-fit、字体预加载
├─ package.json
├─ tailwind.config.ts               # 颜色/阴影/字体 token
├─ postcss.config.js
├─ tsconfig.json
├─ vite.config.ts
└─ src/
   ├─ main.tsx                      # ReactDOM + Router
   ├─ App.tsx                       # 路由壳 + 底部导航容器
   ├─ index.css                     # CSS 变量 + neumo 工具类 + 颗粒噪点
   ├─ theme/
   │  └─ tokens.ts                  # 导出色值/阴影常量（与 tailwind.config 同步）
   ├─ components/
   │  ├─ Neumo.tsx                  # <Outset/> <Inset/> 封装软浮雕
   │  ├─ AlbumCard.tsx              # 网格卡片
   │  ├─ BottomNav.tsx              # 磨砂底栏（Home/Browse/Profile）
   │  ├─ RelaySlider.tsx            # 年代/稀缺度拨盘（带阻尼）
   │  ├─ PageTransition.tsx         # framer-motion 机械面板转场包装
   │  ├─ FloatingAction.tsx         # 右下 + 按钮
   │  └─ HapticTap.tsx              # 统一 active:scale-95 + navigator.vibrate(15)
   ├─ pages/
   │  ├─ Splash.tsx                 # 零件拼装动画 → 自动跳转 Browse
   │  ├─ Browse.tsx                 # 原型组件化迁移
   │  ├─ Detail.tsx                 # 3D 翻转 + 真空管电平表 + 磨损图纸
   │  ├─ Vault.tsx                  # 抽屉/书架式收藏
   │  ├─ Trade.tsx                  # 合同盖章交互
   │  └─ Linking.tsx                # 上架：矩阵码扫描 + 视觉校准
   ├─ data/
   │  └─ albums.ts                  # 20+ 条专辑 mock（封面用 Unsplash 复用原型 URL）
   └─ hooks/
      └─ useHaptic.ts               # 触觉反馈封装
```

---

## 设计 Token 映射 (tailwind.config.ts)

```ts
theme: {
  extend: {
    colors: {
      paper: '#E8E4D9',       // 基础背景
      ink:   '#1A4B9E',       // 主交互色
      silver:'#C7C2B5',       // 金属装饰
    },
    fontFamily: {
      serif: ['"Playfair Display"', 'serif'],
      sans:  ['Inter', 'sans-serif'],
    },
    boxShadow: {
      'neumo':        '5px 5px 12px rgba(0,0,0,0.07), -5px -5px 12px rgba(255,255,255,0.85)',
      'neumo-inset':  'inset 3px 3px 8px rgba(0,0,0,0.07), inset -3px -3px 8px rgba(255,255,255,0.85)',
      'neumo-sm':     '3px 3px 6px rgba(0,0,0,0.06), -3px -3px 6px rgba(255,255,255,0.8)',
    },
  },
}
```

`index.css` 注入 PRD 中的 CSS 变量、`body::after` 颗粒噪点、`.pb-safe/.pt-safe` 安全区、`.no-scrollbar`，与原型一致。

---

## 各页面实现要点

### 1. Splash (`/`)
- 全屏 `paper` 背景 + framer-motion orchestrated sequence：唱针、唱片、机臂三段 0.4s 依次 scale+rotate 入场
- 2.4s 后 `navigate('/browse', { replace: true })`
- 提供 `prefers-reduced-motion` 兜底（直接淡入）

### 2. Browse (`/browse`)
- 直接将 `HTML原型页.html` 的 DOM 结构拆为：`<Header/>`、`<RelaySlider/>`、`<AlbumGrid/>`、`<FloatingAction/>`、`<BottomNav/>`
- 网格用 `albums.ts` 映射；每张卡片点击 → `/detail/:id`，使用 framer-motion `layoutId={\`cover-${id}\`}` 实现到详情页的共享元素过渡（机械面板感）
- 顶部拨盘 `RelaySlider` 支持拖拽，百分比驱动列表过滤

### 3. Detail (`/detail/:id`)
- 顶部返回按钮 neumo-inset 圆形
- 专辑封面 `motion.div` + `rotateY` 拖拽手势 → 3D 翻转查看背面（简化版：正反两面图片）
- 中段虚拟真空管电平表：两根 SVG 柱随 `Audio` 播放 `audioContext.analyser` 动态变化；无真实音频时播放静音 buffer 做视觉演示
- 底部「磨损报告」：SVG 技术图纸风格示意图 + 圆点热区 hover 显示瑕疵说明
- 立即购买按钮 → `/trade/:id`

### 4. Vault (`/vault`)
- 抽屉式：多个 neumo-inset 水平滚动「抽屉」，每抽屉内垂直瀑布流专辑
- 下拉刷新：framer-motion 弹簧动画 + `useHaptic()` 15ms 振动

### 5. Trade (`/trade/:id`)
- 背景纸质纹理；顶部合同式排版（Playfair italic 大标题「Bill of Sale」）
- 「盖章」按钮长按 300ms 触发：红色印章 SVG `scale(1.4) → 1` + rotate(-8deg) 落下动画，成功后显示成交凭证
- 完成 → 返回 Vault

### 6. Linking (`/linking`)
- 步骤 1：扫描矩阵码（相机占位框 + 扫描光带动画）
- 步骤 2：AI 匹配结果卡片，显示历史成交价区间
- 步骤 3：上传照片 → 「正在进行视觉校准…」loading，应用 sepia + multiply 滤镜把用户照片自动融入 paper 色调
- 步骤指示器放顶部（3 个 neumo 圆点）

---

## 全局交互规范实现

| 规范 | 实现 |
|---|---|
| 按下反馈 | 统一 `HapticTap` 组件：`active:scale-95 transition-transform duration-200` + `navigator.vibrate(15)`（仅 Android） |
| 非线性转场 | `PageTransition` 包装：进入 `clip-path` 从中心向四周展开，退出反之，模拟机械快门 |
| 阻尼滚动 | `RelaySlider` 使用 framer-motion `useDragControls` + `dragTransition={{ bounceStiffness: 200, bounceDamping: 20 }}` |
| 磨砂底栏 | `backdrop-blur-xl bg-paper/80 border-t border-white/20`；在真机 Safari 需 `-webkit-backdrop-filter` |
| 安全区 | 根容器 `pt-safe pb-safe`；导航栏 `padding-bottom: env(safe-area-inset-bottom)` |

---

## 关键文件清单（新建）

- `package.json`、`vite.config.ts`、`tsconfig.json`、`tailwind.config.ts`、`postcss.config.js`、`index.html`
- `src/main.tsx`、`src/App.tsx`、`src/index.css`
- `src/theme/tokens.ts`
- `src/components/` 下 7 个组件
- `src/pages/` 下 6 个页面
- `src/data/albums.ts`
- `src/hooks/useHaptic.ts`

原型文件 `HTML原型页.html` 保留作为设计参考，不删除。

---

## 不做的事

- 不接后端、不做登录鉴权
- 不写单元测试（纯视觉交互层，Mock 数据）
- 不引入 i18n 框架（首版纯中文 + 英文装饰字）
- 不做真实音频文件的打包，只做可视化演示

---

## 验收方式

1. `npm install && npm run dev` 本地启动，默认 `http://localhost:5173`
2. Chrome DevTools 切换到 iPhone 14 Pro 模拟器验证：
   - Splash → Browse 自动跳转 ≤ 3s
   - Browse 卡片点击过渡到 Detail，共享元素动画流畅
   - Detail 封面可拖拽 3D 翻转
   - Vault 下拉刷新有弹簧回弹
   - Trade 长按盖章有印章落下动画
   - Linking 三步走完成
   - 底部磨砂导航切换三个主 tab
3. Lighthouse Mobile Performance ≥ 85，关注 `backdrop-filter` 导致的滚动掉帧
4. `prefers-reduced-motion: reduce` 下所有动画降级为 opacity fade

---

## 后续迭代占位（本轮不做）

- 真实音频试听（Web Audio API + CDN 片段）
- 真实矩阵码扫描（`BarcodeDetector` API）
- 后端对接层（抽象 `src/services/api.ts`）
- PWA 离线缓存
- Lottie 机械零件动画（替换 framer-motion 的 Splash 版本）
