# Financial Calc

[English](README.md) | 中文

一个基于 Next.js 16、React 19 和 TypeScript 的双语金融计算器项目。

项目包含货币时间价值、现金流分析、股票估值、债券、投资组合模拟、期权定价、风险指标、贷款与宏观 / 外汇等常用金融工具。

## 项目亮点

- 9 个核心计算模块
- 中英文双语界面
- 适合静态部署的 Next.js 应用
- 计算历史记录与恢复
- 支持 CSV / JSON / PDF 导出
- 部分页面支持 URL 状态分享
- 使用 Vitest 进行单元与交互测试

## 功能模块

- TVM：现值 / 终值 / 年金 / 期数 / 利率
- Cash Flow：NPV / IRR / 投资回收期
- Equity：CAPM / WACC / DDM
- Bonds：债券定价 / 久期 / 凸性 / 收益率曲线
- Portfolio：蒙特卡洛有效前沿模拟
- Options：Black-Scholes 与 Greeks
- Risk：VaR / CVaR 分布视图
- Loans：等额本息 / 等额本金摊销
- Macro：通胀 / 购买力 / 实际利率 / CPI / PPP

## 技术栈

- Next.js 16（App Router，静态导出）
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui
- Recharts
- Framer Motion
- Vitest + Testing Library

## 本地启动

环境要求：

- Node.js >= 20
- npm

安装并启动：

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run test
npx tsc --noEmit
npm run format
```

## 构建说明

- `next.config.ts` 使用 `output: "export"`
- 生产构建结果输出到 `out/`
- 项目适合部署为静态站点
- PWA 相关逻辑通过 `public/sw.js` 与 `src/components/service-worker-registration.tsx` 手动接入

## 项目结构

```text
financial-calc/
├─ public/                # 静态资源与 service worker
├─ src/
│  ├─ app/                # App Router 页面
│  ├─ components/         # UI 与共享组件
│  ├─ hooks/              # 自定义 hooks
│  ├─ lib/                # 数学逻辑、存储、i18n、工具函数
│  └─ workers/            # Monte Carlo worker
├─ README.md
├─ README_zh.md
└─ package.json
```

## 提交前建议验证

```bash
npx tsc --noEmit
npm run test
npm run build
```

## License

MIT
