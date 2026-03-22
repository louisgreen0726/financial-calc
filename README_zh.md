# 金融指挥中心

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![在线演示](https://img.shields.io/badge/在线演示-Cloudflare_Pages-orange?style=flat-square&logo=cloudflarepages)](https://financial-calc.pages.dev/)
[![Tests](https://img.shields.io/badge/Tests-53+-success?style=flat-square&logo=vitest)](.)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

**🌐 语言 / Language**: [中文](#金融指挥中心) | [English](README.md)

**专业级金融建模、估值与风险分析平台**

一个全面的双语（中文/英文）金融计算器 Web 应用程序，包含 10 个专业模块和 35+ 金融公式。采用现代 Web 技术构建，实现精确计算、高性能和卓越的用户体验。

---

## 功能特性

### 10 个计算器模块

#### 1. 货币时间价值 (TVM)
- 现值 (PV)、终值 (FV)、年金 (PMT)、利率和期数计算
- 普通年金和先付年金支持
- 实时参数验证

#### 2. 现金流分析
- 净现值 (NPV) 计算
- 内部收益率 (IRR)
- 投资回收期分析
- 交互式现金流可视化

#### 3. 股票估值
- **CAPM** (资本资产定价模型): 预期收益计算
- **WACC** (加权平均资本成本): 综合资本成本分析
- **DDM** (股利贴现模型): 稳定增长公司的戈登增长模型

#### 4. 投资组合优化
- 现代投资组合理论 (MPT) 实现
- 蒙特卡洛模拟有效前沿
- 夏普比率优化
- 最大夏普比率和最小波动率投资组合识别

#### 5. 债券与固定收益
- 债券价格估值（公允价格、折价/溢价检测）
- 到期收益率 (YTM) 计算
- 麦考利久期和修正久期
- 凸性分析
- 价格-收益率曲线可视化
- 多种付息频率（年付、半年付、季付、月付）

#### 6. 期权定价
- 欧式期权的 Black-Scholes-Merton (BSM) 模型
- 看涨和看跌期权定价
- 完整的希腊字母分析:
  - Delta (Δ): 价格敏感度
  - Gamma (Γ): Delta 敏感度
  - Theta (Θ): 时间衰减
  - Vega (ν): 波动率敏感度
  - Rho (ρ): 利率敏感度
- 收益图可视化

#### 7. 风险管理
- 风险价值 (VaR) 计算
- 条件风险价值 (CVaR) / 预期损失
- 蒙特卡洛模拟支持
- 收益分布可视化

#### 8. 贷款与按揭
- 两种还款方式:
  - **CPM** (等额本息): 固定月供
  - **CAM** (等额本金): 固定本金还款
- 完整分期还款表
- 总利息和成本明细
- 余额预测图表

#### 9. 宏观经济与外汇
- **通胀率**: 复合年均通胀计算
- **购买力**: 通胀对货币价值的影响
- **实际利率**: 费雪方程实现
- **CPI 调整**: 基于消费者价格指数的调整
- **PPP 汇率**: 购买力平价计算

#### 10. 衍生品与风险
- 高级风险指标
- 蒙特卡洛模拟能力

---

## 技术栈

### 核心框架
- **Next.js 16** - 带 App Router 的 React 框架
- **React 19** - 最新特性的 UI 库
- **TypeScript 5** - 严格模式的类型安全开发

### 样式与 UI
- **Tailwind CSS 4** - 原子化 CSS 框架
- **Shadcn/ui** - 现代、无障碍的 UI 组件
- **Framer Motion** - 流畅的动画和过渡
- **Lucide React** - 精美的图标库

### 计算与图表
- **Math.js** - 高级数学运算
- **Recharts** - 响应式图表库

### 表单处理与验证
- **React Hook Form** - 高性能表单管理
- **Zod** - TypeScript 优先的模式验证

### 开发工具
- **ESLint** - 代码检查，使用 Next.js 配置
- **Prettier** - 代码格式化
- **Vitest** - 单元测试框架
- **Husky** - 质量控制 Git 钩子

---

## 快速开始

### 环境要求
- Node.js >= 20
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/louisgreen0726/financial-calc.git
cd financial-calc

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

### 生产构建

```bash
# 创建生产构建
npm run build

# 启动生产服务器
npm start
```

---

## 项目结构

```
financial-calc/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── layout.tsx          # 根布局（带提供者）
│   │   ├── globals.css         # 全局样式 + 主题变量
│   │   ├── page.tsx            # 首页 / 仪表板
│   │   ├── tvm/                # TVM 计算器
│   │   ├── cash-flow/          # 现金流分析
│   │   ├── equity/             # 股票估值
│   │   ├── bonds/              # 债券计算器
│   │   ├── portfolio/          # 投资组合优化
│   │   ├── options/            # 期权定价
│   │   ├── risk/               # 风险管理
│   │   ├── loans/              # 贷款计算器
│   │   └── macro/              # 宏观经济
│   ├── components/
│   │   ├── ui/                 # Shadcn UI 组件（自动生成）
│   │   └── layout/             # 应用布局组件
│   │       ├── app-layout.tsx
│   │       ├── sidebar.tsx
│   │       └── header.tsx
│   └── lib/
│       ├── finance-math.ts     # 核心金融公式 (35+)
│       ├── finance-math.test.ts # 单元测试 (53+)
│       ├── i18n.tsx            # 国际化（中/英）
│       ├── nav-config.ts       # 导航配置
│       ├── utils.ts            # 工具函数
│       └── validation.ts       # Zod 验证模式
├── public/                     # 静态资源
├── package.json
├── next.config.ts              # Next.js 配置（静态导出）
├── tsconfig.json               # TypeScript 配置
├── vitest.config.ts            # Vitest 配置
├── eslint.config.mjs           # ESLint 配置
└── README.md                   # 本文档
```

---

## 可用 API / 函数

### 核心金融库 (`finance-math.ts`)

#### 货币时间价值
```typescript
Finance.pv(rate, nper, pmt, fv?, type?)        // 现值
Finance.fv(rate, nper, pmt, pv, type?)        // 终值
Finance.pmt(rate, nper, pv, fv?, type?)       // 年金
Finance.nper(rate, pmt, pv, fv?, type?)       // 期数
Finance.rate(nper, pmt, pv, fv?, type?, guess?) // 利率
```

#### 现金流分析
```typescript
Finance.npv(rate, values)                     // 净现值
Finance.irr(values, guess?)                   // 内部收益率
Finance.effectiveRate(nominalRate, periodsPerYear) // 实际年利率
```

#### 债券计算
```typescript
Finance.bondPrice(faceValue, couponRate, years, ytm, frequency?) // 债券价格
Finance.bondDuration(faceValue, couponRate, years, ytm, frequency?) // 久期
Finance.bondYield(price, faceValue, couponRate, years, frequency?) // 到期收益率
Finance.bondConvexity(faceValue, couponRate, years, ytm, frequency?) // 凸性
```

#### 期权定价 (Black-Scholes)
```typescript
Finance.blackScholes(S, K, T, r, sigma, type) // 期权价格
Finance.greeks(S, K, T, r, sigma, type)       // 所有希腊字母 (Delta, Gamma, Theta, Vega, Rho)
```

#### 投资组合理论
```typescript
Finance.portfolioReturn(weights, returns)     // 加权组合收益
Finance.portfolioRisk(weights, covMatrix)     // 组合标准差
Finance.sharpeRatio(portfolioReturn, rf, portfolioRisk) // 夏普比率
```

#### 风险管理
```typescript
Finance.variance(values)                      // 统计方差
Finance.stdDev(values)                        // 标准差
Finance.correlation(x, y)                     // 皮尔逊相关系数
```

#### 贷款计算
```typescript
Finance.amortizationSchedule(principal, rate, nper, method?) // 分期还款表
Finance.totalInterest(schedule)               // 总利息支付
Finance.remainingBalance(schedule, period)    // 某期余额
```

#### 股票估值
```typescript
Finance.capm(rf, beta, rm)                    // CAPM 预期收益
Finance.wacc(equityValue, debtValue, costEquity, costDebt, taxRate) // WACC
Finance.ddm(d1, requiredReturn, growthRate)   // 股利贴现模型
```

#### 宏观经济
```typescript
Finance.inflationRate(startPrice, endPrice, years)      // 通胀率
Finance.purchasingPower(amount, inflationRate, years)   // 未来购买力
Finance.realInterestRate(nominalRate, inflationRate)    // 实际利率 (费雪)
Finance.cpiAdjustment(amount, fromCPI, toCPI)           // CPI 调整
Finance.pppExchangeRate(domesticPrice, foreignPrice)    // PPP 汇率
```

### 工具函数 (`utils.ts`)

```typescript
formatCurrency(value, currency?)              // 格式化为货币
formatNumber(value, decimals?, prefix?)       // 格式化为数字
formatPercent(value, decimals?)               // 格式化为百分比
debounce(fn, wait)                            // 防抖函数
validateNumber(value)                         // 数字验证
validatePositive(value)                       // 正数验证
validateNonNegative(value)                    // 非负数验证
clamp(value, min, max)                        // 数值限制
cn(...inputs)                                 // 条件类名 (clsx + tailwind-merge)
```

### 国际化 (`i18n.tsx`)

```typescript
const { t, language, setLanguage } = useLanguage()
t("nav.core.title")                           // 访问翻译
t("tvm.fv")                                   // 支持嵌套键
```

**支持语言**: 中文 (`zh`), 英文 (`en`)

---

## 测试

本项目包含所有金融计算的全面单元测试。

### 运行测试

```bash
# 运行所有测试一次
npm run test

# 以监视模式运行测试
npm run test:watch

# 运行特定测试文件
npx vitest run src/lib/finance-math.test.ts

# 运行匹配模式的测试
npx vitest run -t "pv function"
```

### 测试覆盖

- **53+ 单元测试** 覆盖所有金融公式
- **边界情况处理**（零利率、负值、NaN 输入）
- **精度验证**（通常保留 2 位小数）
- **错误处理**（无效输入、边界条件）

### 测试示例

```typescript
import { describe, it, expect } from "vitest"
import { Finance } from "@/lib/finance-math"

describe("Finance", () => {
  describe("pv", () => {
    it("计算正值利率的现值", () => {
      const result = Finance.pv(0.05, 10, 0, 1000)
      expect(result).toBeCloseTo(-613.91, 2)
    })
  })
})
```

---

## 开发命令

```bash
# 开发
npm run dev              # 启动开发服务器 (localhost:3000)
npm run build            # 生产构建（静态导出到 out/）
npm run start            # 启动生产服务器

# 代码质量
npm run lint             # 运行 ESLint
npm run format           # 使用 Prettier 格式化
npm run format:check     # 检查格式
npx tsc --noEmit         # 类型检查而不输出

# 测试
npm run test             # 运行所有测试
npm run test:watch       # 以监视模式运行测试

# Git 钩子
npm run prepare          # 安装 Husky 钩子
```

---

## 核心特性

### 双语支持 (中文/English)
- 完整的 UI 本地化
- 所有金融术语翻译
- 语言偏好保存在 localStorage
- 无缝语言切换

### 实时验证
- 使用 Zod 模式进行输入验证
- 双语错误消息
- 无效输入的视觉反馈
- 边界条件检查

### 性能优化
- 快速加载的静态站点导出
- 蒙特卡洛计算的 Web Workers
- 使用 `useMemo` 的记忆化计算
- 使用 React 19 的优化重渲染

### 现代 UI/UX
- 使用 next-themes 的深色/浅色主题支持
- 适应所有屏幕尺寸的响应式设计
- 使用 Framer Motion 的流畅动画
- 无障碍组件（ARIA 标签、键盘导航）
- 专业的配色方案（翠绿色主色）

### 类型安全
- 严格的 TypeScript 配置
- 无 `any` 类型
- 全面的类型定义
- 使用 Zod 进行运行时验证

---

## 浏览器兼容性

- Chrome/Edge（最新 2 个版本）
- Firefox（最新 2 个版本）
- Safari（最新 2 个版本）
- 移动端浏览器（iOS Safari、Chrome Mobile）

---

## 作者

**Created by: Antigravity × OpenCode**

本项目在 [Google Antigravity](https://antigravity.google) 的帮助下构建。

---

## 许可证

本项目基于 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

---

## 致谢

### 库与工具
- [Next.js](https://nextjs.org/) - React 框架
- [React](https://react.dev/) - UI 库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Math.js](https://mathjs.org/) - 数学库
- [Recharts](https://recharts.org/) - 图表库
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [Lucide](https://lucide.dev/) - 图标库
- [Vitest](https://vitest.dev/) - 测试框架
- [Zod](https://zod.dev/) - 模式验证

### 金融参考
- 学术金融文献中的标准金融公式
- Black-Scholes 模型实现
- 现代投资组合理论（马科维茨）
- 资本资产定价模型 (CAPM)

### 特别感谢
- 维护这些优秀库的开源社区
- 金融数学教科书和学术资源
- 帮助改进应用程序的贡献者和测试者

---

## 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

请确保您的代码遵循现有风格并通过所有测试。

---

## 支持

如有问题、疑问或功能请求，请在 GitHub 仓库上提交 issue。

---

<p align="center">
  <strong>金融指挥中心</strong><br>
  专业级金融建模，化繁为简。
</p>

<p align="center">
  <a href="http://localhost:3000">立即开始 →</a>
</p>