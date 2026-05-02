# Financial Calc

[English](README.md) | 中文

> [!IMPORTANT]
> **本项目完全由 AI（OpenCode）生成。**
> 它应被理解为一个通过 AI 生成与迭代完善的软件项目，而不是由人工逐行手写完成的传统工程。

> [!NOTE]
> 当前代码、文档、移动端体验优化、校验逻辑以及部署相关调整，均来自 OpenCode 中的 AI 驱动式开发流程。
> 如果你计划将该仓库用于正式生产环境，仍应自行完成代码审查、验证测试、安全检查与业务正确性确认。

Financial Calc 是一个基于 Next.js 16、React 19 与 TypeScript 构建的双语金融计算器项目，适合静态部署。

它已经不是一个简单的页面演示，而是一个可实际使用的多模块金融分析应用：具备移动端优先导航、复杂页面渐进展开、计算历史与恢复、导出与分享、以及静态站点下可用的离线 service worker 接入。

## 当前项目进度

目前项目已经具备较完整的产品雏形，重点能力包括：

- 面向桌面端与移动端的响应式计算器体验
- 中英文双语界面
- 关键计算页面的显式校验反馈
- 计算历史记录与跨页面恢复
- CSV / JSON / PDF 导出
- 部分流程支持可分享状态
- 投资组合蒙特卡洛模拟（worker + 客户端回退）
- 适合静态部署的手动 service worker 方案

## AI 生成说明

- 该仓库通过 OpenCode 驱动的 AI 生成与多轮 AI 迭代完成。
- 架构、界面组织、校验流程、文档内容以及大量实现细节，都主要由 AI 生成和修订，而不是完全由人工从零逐步手写。
- 它已经可以作为可运行应用、学习参考与实验基础，但如果要用于严肃生产环境，仍需按正常工程标准继续审查与验证。

## 功能模块

### 核心计算模块

- **TVM**：现值 / 终值 / 年金 / 期数 / 利率
- **Cash Flow**：NPV / IRR / 投资回收期
- **Equity**：CAPM / WACC / DDM
- **Bonds**：债券定价 / 久期 / 凸性 / 收益率曲线 / 敏感性分析
- **Portfolio**：蒙特卡洛有效前沿模拟
- **Options**：Black-Scholes 定价与 Greeks
- **Risk**：VaR / CVaR 分布视图
- **Loans**：等额本息 / 等额本金摊销
- **Macro**：通胀 / 购买力 / 实际利率 / CPI / PPP

### 辅助页面

- **History**：历史记录浏览与恢复
- **Settings**：语言、主题、显示币种与数据管理设置
- **Help**：使用说明与补充信息

## 最近已经完成的改进

- 移动端底部导航与整体 app shell 经过重做，模块可达性更好
- 多个高密度计算页面已支持更合理的移动端渐进展开
- Equity、Bonds、Cash Flow、Portfolio、TVM 等页面的校验与错误反馈更清晰
- Portfolio 的移动端资产编辑体验更完善
- service worker 注册与缓存策略较之前更稳健
- finance 与 service-worker 相关测试已补强

## 技术栈

- **框架**：Next.js 16 App Router（`output: "export"`）
- **UI**：React 19、Tailwind CSS 4、shadcn/ui、Radix UI
- **图表 / 动效**：Recharts、Framer Motion
- **校验 / 表单**：Zod、React Hook Form 相关能力
- **测试**：Vitest、Testing Library、jsdom
- **离线 / 导出**：手动 service worker、html2canvas、jsPDF

## 本地启动

### 环境要求

- Node.js >= 20
- npm

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

## 常用命令

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run test
npm run build
npm run preview
npm run format
npm run format:check
```

## 推荐验证顺序

当前建议的提交前验证顺序为：

```bash
npx tsc --noEmit
npm run test
npm run build
```

如果改动涉及格式化敏感文件，建议额外执行：

```bash
npm run format:check
```

## 构建与部署说明

- `next.config.ts` 使用 `output: "export"`
- 静态路由使用 trailing slash 输出，更适合静态托管环境
- 生产构建结果输出到 `out/`
- 项目目标部署方式是静态站点
- `npm run preview` / `npm start` 会预览构建后的 `out/` 目录；本项目不会使用 `next start` 作为生产启动方式
- 生产环境不依赖服务端 API runtime
- service worker 为手动接入，主要文件为：
  - `public/sw.js`
  - `src/components/service-worker-registration.tsx`
- PWA 当前实际行为以手动接入方案为准；项目已不再安装 `next-pwa`

## 项目结构

```text
financial-calc/
├─ public/                # 静态资源、manifest、service worker
├─ src/
│  ├─ app/                # App Router 路由页面
│  ├─ components/         # 共享 UI 与功能组件
│  ├─ hooks/              # 状态、历史、导出、URL、模拟相关 hooks
│  ├─ lib/                # 金融数学、校验、i18n、存储、工具函数
│  ├─ test/               # 测试初始化与辅助代码
│  └─ workers/            # Monte Carlo worker
├─ README.md
├─ README_zh.md
└─ package.json
```

## 质量说明

- 当前项目已经可以通过 typecheck、test 与 build 验证
- 目前仍有一个已知的非阻塞 lint warning，来源于 `@tanstack/react-virtual`
- 构建过程中仍可能出现 `baseline-browser-mapping` 数据过旧提醒，这属于维护项，而不是功能回归

## License

MIT
