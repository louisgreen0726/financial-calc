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
- 支持计算历史、收藏、跨页面恢复、首页 Continue 恢复，以及有边界校验的 JSON 备份导入/导出
- 分享链接为绝对 URL，数组参数采用 JSON 安全编码，并兼容旧版 `|` 分隔格式
- 分享 URL 有长度保护，避免资产组合等复杂状态生成过长链接
- 外部分享状态会在解析前限制长度与数组数量，畸形 `json:` 数组会按失败关闭处理
- 支持自描述、带版本的 CSV / JSON 报告及打印优化的可搜索 PDF 输出；CSV 带 BOM
- 手动 PWA / service worker 接入，注册逻辑支持 base path
- 构建时生成 SHA-256 策略，只允许每份静态 HTML 中实际输出的内联脚本
- 各计算页面加入有限数结果守卫，避免向用户展示 `NaN` 或 `Infinity`
- 依赖 lockfile 已更新到 package.json semver 范围内较新的 minor/patch 版本

## 功能模块

### 核心金融工具

- **TVM**：现值、终值、年金、利率、期数
- **Cash Flow**：NPV、IRR、投资回收期
- **Equity**：CAPM、WACC、DDM
- **Bonds**：债券定价、久期、凸性、收益率曲线、敏感性热力图
- **Portfolio**：可复现的蒙特卡洛风险收益抽样，支持 worker 与客户端回退
- **Options**：支持连续股息收益率、Greeks 与隐含波动率反解的 Black-Scholes-Merton 定价
- **Risk**：VaR、CVaR、分布视图
- **Loans**：等额本息 / 等额本金摊销表，完整表格支持辅助技术读取
- **Macro**：通胀、购买力、实际利率、CPI 调整、PPP 汇率

### 辅助页面

- **History**：历史记录浏览、搜索、收藏、恢复、批量删除、CSV 导出
- **Settings**：语言、主题、显示币种、带 schema 校验的历史备份/恢复与重置
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
- PWA metadata、安装图标、构建生成的 precache 资源与 service worker 缓存支持 `NEXT_PUBLIC_BASE_PATH`
- Monte Carlo 使用 Webpack 正确构建的 Worker，并固定加入等权组合与所有单资产角点基线
- “打印 / 另存为 PDF”会隔离当前报告，并使用浏览器原生分页生成清晰、可搜索的输出
- Recharts tooltip formatter 与自动计算 hook 已适配当前更严格的依赖类型与 lint 规则

## 技术栈

- **框架**：Next.js 16 App Router
- **运行时**：React 19
- **语言**：TypeScript 5
- **样式**：Tailwind CSS 4、shadcn/ui、Radix UI
- **图表与动效**：Recharts、Framer Motion
- **表单与校验**：Zod、React Hook Form 相关工具
- **导出**：原生打印布局、带版本的 JSON 报告、电子表格安全的 CSV helpers
- **测试**：Vitest、Testing Library、jsdom

## 环境要求

- Node.js >= 20.19.0
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
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run test:e2e:pwa
npm run build
npm run bundle:check
npm audit
```

当前代码通过上述完整验证，并针对 PWA 注册、分享链接、Worker 并发与导出安全提供了专项覆盖。

## 推荐提交前检查

提交或推送前建议运行：

```bash
npm run format:check
npm run typecheck
npm run lint
npm run test
npm run build
npm audit
```

可以用一条命令执行完整的本地质量门禁：

```bash
npm run verify
```

GitHub Actions 会把同等覆盖拆分为并行的质量、浏览器以及 root/base-path 生产矩阵，并额外审计生产依赖中的
高危漏洞。每个生产矩阵只构建一次，然后针对同一份产物校验 precache manifest、HTML 内部引用、PWA
metadata、静态宿主头、路由体积预算，以及 PWA 安装、离线与更新流程。浏览器任务失败时会保留 7 天的截图和
trace 诊断产物。本地首次运行 `npm run test:e2e` 前，需要执行
`npx playwright install chromium` 安装浏览器。

运行生产 PWA 工作流：

```bash
npm run test:e2e:pwa
npm run test:e2e:pwa:base-path
```

项目同时配置了 Husky pre-commit hook，会通过 `lint-staged` 处理 staged 的源码文件。
翻译键受 TypeScript 约束；Vitest 目录门禁会检查中英文键一致、文案非空、字面量查询可解析，并确保每个用户
路由都有完整导航文案。

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
- 开发与生产构建固定使用 Webpack，确保 TypeScript Monte Carlo Worker 被输出为浏览器可执行 JavaScript
- Next 构建完成后会为每份 HTML 注入基于 hash 的脚本 CSP，再扫描 `out/` 并生成
  `out/precache-manifest.js`；不要在构建后手工修改 HTML 或 manifest，否则脚本 hash 会失效
- `npm run static:check` 校验现有导出；`npm run test:static` 重新构建并校验 `/calc` base-path 导出
- 生产环境不使用 `next start`
- 生产环境不假设服务端 API routes 或 Node runtime
- 静态路由使用 trailing slash
- service worker 注册逻辑位于 `src/components/service-worker-registration.tsx`
- service worker 文件为 `public/sw.js`
- manifest、PNG 安装图标与开发用 precache 占位文件位于 `public/`
- `NEXT_PUBLIC_BASE_PATH` 已被 metadata、导航与 service worker 注册逻辑支持
- 使用 base path 部署时，应以 `NEXT_PUBLIC_BASE_PATH=/calc` 构建，并让静态宿主将 `/calc/` 映射到同一份导出的 `out/` 目录；导出文件仍位于 `out/` 根目录，不要再额外嵌套一层 `calc/` 目录
- base-path 宿主执行 clean URL 重定向时必须保留 `/calc`；如果把 `/calc/options/index.html` 等 precache 请求重定向到根路径，service worker 将无法安装
- `public/_headers` 为支持 Netlify/Cloudflare Pages 格式的宿主提供安全头与缓存策略
- 不读取 `_headers` 的静态宿主必须在自己的配置中映射同等的 CSP、Referrer、nosniff、frame、permissions 与缓存策略
- 每份 HTML 还包含构建生成的 `script-src` meta 策略及精确 SHA-256 hash；它会与宿主 header 策略叠加，
  即使宿主存在 `_headers` 匹配或单行长度限制也能约束脚本
- React 图表和组件仍需要内联 style 属性，因此宿主 CSP 保留样式兼容例外；该例外不会放宽脚本执行
- 使用 base path 部署时，需要给宿主配置中的 `/_next/static/*`、`/sw.js`、`/precache-manifest.js`、`/manifest.json` 规则增加对应前缀
- HTML、`sw.js` 与 precache manifest 必须重新验证；带哈希的 `/_next/static/*` 资源应按 immutable 缓存一年

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
- `src/lib/risk-math.ts`：纯参数化正态 VaR 与预期损失计算引擎
- `src/test/fixtures/financial-reference-cases.json`：固定版本的 NumPy Financial 与 OpenGamma Strata 参考向量
- `src/lib/validation.ts`：共享 Zod 校验 schema 与输入上限
- `src/lib/history-format.ts`：按单位/类型格式化历史结果
- `src/lib/url-state-utils.ts`：URL 状态序列化与绝对分享链接工具
- `src/hooks/use-calculation-history.ts`：持久化计算历史模型
- `src/hooks/use-shareable-url.ts`：分享链接恢复与构建流程
- `src/components/service-worker-registration.tsx`：浏览器端 service worker 注册
- `public/sw.js`：静态导出场景下使用的 service worker
- `scripts/generate-precache-manifest.mjs`：构建后静态资源与路由清单生成器
- `scripts/generate-static-csp.mjs`：逐文档内联脚本 hash 策略生成与校验器
- `scripts/check-static-export.mjs`：静态导出、precache、base path、manifest 与宿主头校验器
- `public/_headers`：静态宿主安全头与缓存策略模板
- 应用内帮助页以中英文说明计算期次、利率/统计假设、可复算示例与模型限制

## 依赖说明

依赖已经在 package.json 的 semver 范围内更新到较新的 minor/patch 版本。`npm outdated` 中剩余的新版本主要是 major 升级或被 package.json 明确固定的版本，应作为单独迁移任务处理，而不是常规维护中直接硬切。

执行干净的 `npm ci` 后，npm 仍可能把少量 `@emnapi` / `@napi-rs` / `@tybys` WASM helper 包标记为 extraneous；它们来自 native/WASM 工具链的 peer/optional helper 链。当前 `npm audit`、typecheck、lint、test、build 均为通过状态。

## AI 生成说明

- 该仓库通过 OpenCode 驱动的 AI 生成与多轮 AI 辅助迭代完成。
- 架构、界面组织、校验流程、文档、测试与可靠性修复都包含 AI 辅助生成和修订。
- 项目适合作为可运行应用、学习参考与实验基础；如果用于生产环境，仍需独立代码审查、安全审查与金融业务正确性验证。

## License

MIT
