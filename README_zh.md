# Financial Calc

[English](README.md) | 中文

> [!IMPORTANT]
> **本项目由 AI 通过 OpenCode 生成并持续迭代完善。**
> 请把它理解为一个 AI 辅助的软件工程项目：它可运行、已测试、也已经具备较完整功能，但在严肃生产使用前仍应按正常工程标准进行审查。

Financial Calc 是一个基于 Next.js 16、React 19、TypeScript、Tailwind CSS 4、shadcn/ui 与 Radix UI 构建的双语金融分析应用。项目面向静态导出设计，生产构建可以作为纯静态文件托管，不依赖 Node.js 服务端或 API runtime。

它目前已经不只是计算器演示页面，而是一个具备完整 app shell、桌面/移动端导航、历史恢复、分享导出、service worker 支持，以及金融输入与结果可靠性防护的多模块应用。

## 当前状态

- Next.js 静态导出应用，`next.config.ts` 使用 `output: "export"`
- 中英文双语界面
- 桌面端与移动端布局完整，包含底部移动导航与无障碍移动抽屉导航
- 支持计算历史、收藏、跨页面恢复，以及首页 Continue 恢复
- 分享链接为绝对 URL，数组参数采用 JSON 安全编码，并兼容旧版 `|` 分隔格式
- 分享 URL 有长度保护，避免资产组合等复杂状态生成过长链接
- 支持 CSV / JSON / PDF 导出，CSV 带 BOM，便于表格软件识别中文
- 手动 PWA / service worker 接入，注册逻辑支持 base path
- 各计算页面加入有限数结果守卫，避免向用户展示 `NaN` 或 `Infinity`
- 依赖 lockfile 已更新到 package.json semver 范围内较新的 minor/patch 版本

## 功能模块

### 核心金融工具

- **TVM**：现值、终值、年金、利率、期数
- **Cash Flow**：NPV、IRR、投资回收期
- **Equity**：CAPM、WACC、DDM
- **Bonds**：债券定价、久期、凸性、收益率曲线、敏感性热力图
- **Portfolio**：蒙特卡洛有效前沿模拟，支持 worker 与客户端回退
- **Options**：Black-Scholes 定价与 Greeks
- **Risk**：VaR、CVaR、分布视图
- **Loans**：等额本息 / 等额本金摊销表，表格使用虚拟滚动
- **Macro**：通胀、购买力、实际利率、CPI 调整、PPP 汇率

### 辅助页面

- **History**：历史记录浏览、搜索、收藏、恢复、批量删除、CSV 导出
- **Settings**：语言、主题、显示币种、数据管理与重置
- **Help**：使用说明与补充信息

## 已完成的可靠性增强

当前源码已经包含以下加固内容：

- 共享 Zod schema 对利率、期数、资产数量、现金流数量、投资组合规模等做边界限制
- 金融数学函数会拒绝不支持的债券付息频率、无效 DDM 情况、无效 CPI/PPP 输入、过大的摊销期数
- 页面级结果渲染会确认计算结果为有限数，再显示、导出或写入历史
- 历史记录保存结果格式元数据，货币、百分比、期数、比率都能正确显示
- 从历史或分享链接恢复输入时，不会把恢复动作重新记为新的计算历史
- TVM 在切换目标、付款模式或输入时会清理旧结果和旧计算步骤
- 移动端 sidebar 满足 Radix Dialog 的 title/description 要求，点击导航后自动关闭
- PWA metadata、manifest、icon 与 service worker scope 支持 `NEXT_PUBLIC_BASE_PATH`
- Recharts tooltip formatter 与自动计算 hook 已适配当前更严格的依赖类型与 lint 规则

## 技术栈

- **框架**：Next.js 16 App Router
- **运行时**：React 19
- **语言**：TypeScript 5
- **样式**：Tailwind CSS 4、shadcn/ui、Radix UI
- **图表与动效**：Recharts、Framer Motion
- **表单与校验**：Zod、React Hook Form 相关工具
- **大列表/表格**：`@tanstack/react-virtual`
- **导出**：html2canvas、jsPDF、CSV/JSON helpers
- **测试**：Vitest、Testing Library、jsdom

## 环境要求

- Node.js >= 20
- npm

仓库内包含 `.nvmrc`，用于指示目标 Node 主版本。

## 安装依赖

```bash
npm install
```

如果需要按 lockfile 做干净安装：

```bash
npm ci
```

## 本地开发

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

## 验证命令

```bash
npm run format:check
npx tsc --noEmit
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

当前代码已经通过上述完整验证。Vitest 当前覆盖 16 个测试文件，共 124 个测试。

## 推荐提交前检查

提交或推送前建议运行：

```bash
npm run format:check
npx tsc --noEmit
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

项目同时配置了 Husky pre-commit hook，会通过 `lint-staged` 处理 staged 的源码文件。

## 构建与部署

```bash
npm run build
```

生产构建输出目录：

```text
out/
```

预览静态导出结果：

```bash
npm run preview
```

部署说明：

- `next.config.ts` 使用 `output: "export"`
- 生产环境不使用 `next start`
- 生产环境不假设服务端 API routes 或 Node runtime
- 静态路由使用 trailing slash
- service worker 注册逻辑位于 `src/components/service-worker-registration.tsx`
- service worker 文件为 `public/sw.js`
- manifest 与图标位于 `public/`
- `NEXT_PUBLIC_BASE_PATH` 已被 metadata 与 service worker 注册逻辑支持

## 项目结构

```text
financial-calc/
├─ public/                # 静态资源、manifest、service worker
├─ src/
│  ├─ app/                # App Router 页面
│  ├─ components/         # 共享 UI、布局、结果、历史、导出组件
│  ├─ hooks/              # 历史、URL 状态、导出、模拟、计算相关 hooks
│  ├─ lib/                # 金融数学、校验、i18n、存储、URL/历史工具
│  ├─ test/               # Vitest 初始化
│  └─ workers/            # Monte Carlo worker
├─ README.md
├─ README_zh.md
├─ package.json
└─ package-lock.json
```

## 重要源码文件

- `src/lib/finance-math.ts`：共享金融计算引擎
- `src/lib/validation.ts`：共享 Zod 校验 schema 与输入上限
- `src/lib/history-format.ts`：按单位/类型格式化历史结果
- `src/lib/url-state-utils.ts`：URL 状态序列化与绝对分享链接工具
- `src/hooks/use-calculation-history.ts`：持久化计算历史模型
- `src/hooks/use-shareable-url.ts`：分享链接恢复与构建流程
- `src/components/service-worker-registration.tsx`：浏览器端 service worker 注册
- `public/sw.js`：静态导出场景下使用的 service worker

## 依赖说明

依赖已经在 package.json 的 semver 范围内更新到较新的 minor/patch 版本。`npm outdated` 中剩余的新版本主要是 major 升级或被 package.json 明确固定的版本，应作为单独迁移任务处理，而不是常规维护中直接硬切。

执行干净的 `npm ci` 后，npm 仍可能把少量 `@emnapi` / `@napi-rs` / `@tybys` WASM helper 包标记为 extraneous；它们来自 native/WASM 工具链的 peer/optional helper 链。当前 `npm audit --omit=dev`、typecheck、lint、test、build 均为通过状态。

## AI 生成说明

- 该仓库通过 OpenCode 驱动的 AI 生成与多轮 AI 辅助迭代完成。
- 架构、界面组织、校验流程、文档、测试与可靠性修复都包含 AI 辅助生成和修订。
- 项目适合作为可运行应用、学习参考与实验基础；如果用于生产环境，仍需独立代码审查、安全审查与金融业务正确性验证。

## License

MIT
