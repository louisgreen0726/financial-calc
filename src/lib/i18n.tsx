"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// --- Types ---
type Language = 'en' | 'zh';

type Translations = {
  common: {
    dashboard: string;
    calculate: string;
    result: string;
    parameters: string;
    solveFor: string;
    loading: string;
    inputs: string;
    chart: string;
    analysis: string;
    year: string;
    initial: string;
    add: string;
    remove: string;
    clear: string;
  };
  nav: {
    core: {
      title: string;
      tvm: { title: string; desc: string; };
      cashFlow: { title: string; desc: string; };
    };
    investing: {
      title: string;
      equity: { title: string; desc: string; };
      portfolio: { title: string; desc: string; };
      bonds: { title: string; desc: string; };
    };
    derivatives: {
      title: string;
      options: { title: string; desc: string; };
      risk: { title: string; desc: string; };
    };
    banking: {
      title: string;
      loans: { title: string; desc: string; };
      macro: { title: string; desc: string; };
    };
  };
  home: {
    title: string;
    subtitle: string;
    openModule: string;
  };
  tvm: {
    title: string;
    subtitle: string;
    fv: string;
    pv: string;
    pmt: string;
    nper: string;
    rate: string;
    annualRate: string;
    periods: string;
    payment: string;
    presentValue: string;
    futureValue: string;
    paymentMode: string;
    end: string;
    begin: string;
    resultDesc: {
      fv: string;
      pv: string;
      pmt: string;
      nper: string;
    };
    emptyState: string;
  };
  cashFlow: {
    title: string;
    subtitle: string;
    inputsTitle: string;
    inputsDesc: string;
    discountRate: string;
    period: string;
    flow: string;
    addPeriod: string;
    npv: string;
    irr: string;
    payback: string;
    visualization: string;
    info: string;
  };
  equity: {
    title: string;
    subtitle: string;
    capm: { tab: string; title: string; desc: string; rf: string; beta: string; rm: string; re: string; prem: string; };
    wacc: { tab: string; title: string; eqVal: string; debtVal: string; costEq: string; costDebt: string; tax: string; result: string; desc: string; };
    ddm: { tab: string; title: string; desc: string; d1: string; req: string; g: string; intrinsic: string; resultDesc: string; };
  };
  bonds: {
    title: string;
    subtitle: string;
    char: string;
    face: string;
    coupon: string;
    ytm: string;
    years: string;
    freq: string;
    freqOpts: { annual: string; semi: string; quart: string; month: string; };
    fairPrice: string;
    discount: string;
    premium: string;
    macDur: string;
    modDur: string;
    convexity: string;
    curve: string;
  };
  portfolio: {
    title: string;
    subtitle: string;
    run: string;
    universe: string;
    universeDesc: string;
    rf: string;
    corr: string;
    asset: string;
    ret: string;
    risk: string;
    add: string;
    frontier: string;
    frontierDesc: string;
    maxSharpe: string;
    minVol: string;
    ratio: string;
    retRisk: string;
    empty: string;
  };
  options: {
    title: string;
    subtitle: string;
    params: string;
    spot: string;
    strike: string;
    time: string;
    rate: string;
    vol: string;
    call: string;
    put: string;
    buy: string;
    sell: string;
    payoff: string;
    intrinsic: string;
  };
  risk: {
    title: string;
    subtitle: string;
    params: string;
    val: string;
    vol: string;
    horizon: string;
    conf: string;
    var: string;
    varDesc: string;
    cvar: string;
    cvarDesc: string;
    dist: string;
    distDesc: string;
  };
  loans: {
    title: string;
    subtitle: string;
    details: string;
    method: string;
    cpm: string;
    cam: string;
    amount: string;
    rate: string;
    term: string;
    monthly: string;
    totalInt: string;
    totalCost: string;
    breakdown: string;
    balance: string;
    schedule: string;
    payment: string;
    principal: string;
    interest: string;
    remBalance: string;
  };
};

// --- Dictionaries ---
const en: Translations = {
  common: {
    dashboard: "Dashboard",
    calculate: "Calculate",
    result: "Result",
    parameters: "Parameters",
    solveFor: "Solve For",
    loading: "Loading...",
    inputs: "Inputs",
    chart: "Chart",
    analysis: "Analysis",
    year: "Year",
    initial: "Initial",
    add: "Add",
    remove: "Remove",
    clear: "Clear",
  },
  nav: {
    core: {
      title: "Core Financials",
      tvm: { title: "TVM Calculator", desc: "Time Value of Money (PV, FV, PMT, Rate)" },
      cashFlow: { title: "Cash Flow Analysis", desc: "NPV, IRR, Payback, ROI" },
    },
    investing: {
      title: "Investing",
      equity: { title: "Stock Valuation", desc: "DDM, CAPM, WACC, Ratios" },
      portfolio: { title: "Portfolio Optimization", desc: "Markowitz, Efficient Frontier, Sharpe" },
      bonds: { title: "Bonds & Fixed Income", desc: "Duration, Convexity, YTM, Pricing" },
    },
    derivatives: {
      title: "Derivatives & Risk",
      options: { title: "Options Pricing", desc: "Black-Scholes, Binomial, Greeks" },
      risk: { title: "Risk Management", desc: "VaR, Monte Carlo Simulation" },
    },
    banking: {
      title: "Banking & Macro",
      loans: { title: "Loans & Mortgages", desc: "Amortization, Prepayment, APR" },
      macro: { title: "Macro & FX", desc: "Inflation, Purchasing Power, FX" },
    },
  },
  home: {
    title: "Financial Command Center",
    subtitle: "Professional-grade financial modeling, valuation, and risk analysis tools.",
    openModule: "Open Module",
  },
  tvm: {
    title: "Time Value of Money",
    subtitle: "Calculate Present Value, Future Value, Payments, Rates, or Periods.",
    fv: "Future Value (FV)",
    pv: "Present Value (PV)",
    pmt: "Payment (PMT)",
    nper: "Periods (NPER)",
    rate: "Rate (RATE)",
    annualRate: "Rate per Period (%)",
    periods: "Periods (N)",
    payment: "Payment (PMT)",
    presentValue: "Present Value (PV)",
    futureValue: "Future Value (FV)",
    paymentMode: "Payment Mode",
    end: "End (Ordinary Annuity)",
    begin: "Begin (Annuity Due)",
    resultDesc: {
      fv: "The future value of your investment.",
      pv: "The present value needed to reach the goal.",
      pmt: "Recurring payment required per period.",
      nper: "Number of periods required.",
    },
    emptyState: "Enter values and press Calculate",
  },
  cashFlow: {
    title: "Cash Flow Analysis",
    subtitle: "Analyze investments using Net Present Value (NPV) and Internal Rate of Return (IRR).",
    inputsTitle: "Cash Flow Inputs",
    inputsDesc: "Define initial investment and subsequent returns.",
    discountRate: "Discount Rate (%)",
    period: "Period",
    flow: "Cash Flow",
    addPeriod: "Add Period",
    npv: "Net Present Value",
    irr: "Internal Rate of Return",
    payback: "Payback Period",
    visualization: "Cash Flow Visualization",
    info: "NPV compares the present value of all cash inflows with outflows. A positive NPV generally indicates a profitable investment. IRR is the break-even discount rate.",
  },
  equity: {
    title: "Equity Valuation",
    subtitle: "Model stock prices and cost of capital using standard financial frameworks.",
    capm: {
      tab: "CAPM",
      title: "CAPM Inputs",
      desc: "Capital Asset Pricing Model",
      rf: "Risk-Free Rate (Rf %)",
      beta: "Beta (β)",
      rm: "Expected Market Return (Rm %)",
      re: "Expected Return (Re)",
      prem: "Based on market risk premium",
    },
    wacc: {
      tab: "WACC",
      title: "Capital Structure",
      eqVal: "Equity Value ($)",
      debtVal: "Debt Value ($)",
      costEq: "Cost of Equity (%)",
      costDebt: "Cost of Debt (%)",
      tax: "Corporate Tax Rate (%)",
      result: "WACC",
      desc: "Weighted Average Cost of Capital. Used as the discount rate for firm valuation.",
    },
    ddm: {
      tab: "Valuation (DDM)",
      title: "Dividend Discount Inputs",
      desc: "Gordon Growth Model (Stable Growth)",
      d1: "Next Year Dividend (D1)",
      req: "Required Rate of Return (%)",
      g: "Growth Rate (%)",
      intrinsic: "Intrinsic Value",
      resultDesc: "Fair price based on dividend growth perpetuity.",
    },
  },
  bonds: {
    title: "Bond Valuation",
    subtitle: "Calculate Bond Price, Yield to Maturity, Duration, and Convexity.",
    char: "Bond Characteristics",
    face: "Face Value",
    coupon: "Coupon Rate (%)",
    ytm: "Yield to Maturity (%)",
    years: "Years to Maturity",
    freq: "Payment Frequency",
    freqOpts: { annual: "Annual", semi: "Semiannual", quart: "Quarterly", month: "Monthly" },
    fairPrice: "Fair Price",
    discount: "Discount",
    premium: "Premium",
    macDur: "Mac Duration",
    modDur: "Mod Duration",
    convexity: "Convexity",
    curve: "Price vs Yield Relationship",
  },
  portfolio: {
    title: "Portfolio Optimization",
    subtitle: "Modern Portfolio Theory simulation (Markowitz). Discover the Efficient Frontier.",
    run: "Run Monte Carlo",
    universe: "Asset Universe",
    universeDesc: "Define assets with Expected Return & Risk (Std Dev).",
    rf: "Risk-Free Rate",
    corr: "Correlation",
    asset: "Asset",
    ret: "Ret (%)",
    risk: "Risk (%)",
    add: "Add Asset",
    frontier: "Efficient Frontier",
    frontierDesc: "Risk (Standard Deviation) vs Return",
    maxSharpe: "Max Sharpe Portfolio",
    minVol: "Min Volatility Portfolio",
    ratio: "Ratio",
    retRisk: "Return / Risk",
    empty: "Add assets and click Run Monte Carlo",
  },
  options: {
    title: "Options Pricing",
    subtitle: "Black-Scholes-Merton model for European options. Includes Greeks analysis.",
    params: "Option Parameters",
    spot: "Spot Price (S)",
    strike: "Strike Price (K)",
    time: "Time to Maturity (Years)",
    rate: "Risk-Free Rate (%)",
    vol: "Volatility (σ %)",
    call: "Call Option",
    put: "Put Option",
    buy: "Right to Buy",
    sell: "Right to Sell",
    payoff: "Intrinsic Value Payoff",
    intrinsic: "Value at Expiration vs Spot Price",
  },
  risk: {
    title: "Risk Management",
    subtitle: "Value at Risk (VaR) and Expected Shortfall (CVaR) calculator.",
    params: "Risk Parameters",
    val: "Portfolio Value ($)",
    vol: "Annual Volatility (%)",
    horizon: "Time Horizon (Days)",
    conf: "Confidence Level",
    var: "Value at Risk (VaR)",
    varDesc: "% of portfolio",
    cvar: "Conditional VaR (CVaR)",
    cvarDesc: "Expected loss beyond VaR cutoff",
    dist: "Return Distribution",
    distDesc: "Normal distribution of potential portfolio returns",
  },
  loans: {
    title: "Loan & Mortgage Calculator",
    subtitle: "Calculate payments, amortization schedules, and total interest costs.",
    details: "Loan Details",
    method: "Loan Method",
    cpm: "Fixed Payment",
    cam: "Fixed Principal",
    amount: "Loan Amount",
    rate: "Annual Rate (%)",
    term: "Term (Years)",
    monthly: "Monthly Payment",
    totalInt: "Total Interest",
    totalCost: "Total Cost",
    breakdown: "Cost Breakdown",
    balance: "Balance Projection",
    schedule: "Amortization Schedule",
    payment: "Payment",
    principal: "Principal",
    interest: "Interest",
    remBalance: "Balance",
  },
};

const zh: Translations = {
  common: {
    dashboard: "仪表盘",
    calculate: "计算",
    result: "计算结果",
    parameters: "参数设置",
    solveFor: "求解目标",
    loading: "加载中...",
    inputs: "输入参数",
    chart: "图表",
    analysis: "分析",
    year: "年份",
    initial: "初始",
    add: "添加",
    remove: "移除",
    clear: "清除",
  },
  nav: {
    core: {
      title: "核心财务",
      tvm: { title: "货币时间价值 (TVM)", desc: "现值, 终值, 年金, 利率" },
      cashFlow: { title: "现金流分析", desc: "NPV, IRR, 投资回报率" },
    },
    investing: {
      title: "投资分析",
      equity: { title: "股票估值", desc: "DDM, CAPM, WACC, 财务比率" },
      portfolio: { title: "投资组合优化", desc: "马科维茨模型, 有效前沿, 夏普比率" },
      bonds: { title: "债券与固定收益", desc: "久期, 凸性, 到期收益率, 定价" },
    },
    derivatives: {
      title: "衍生品与风险",
      options: { title: "期权定价", desc: "Black-Scholes, 二叉树, 希腊字母" },
      risk: { title: "风险管理", desc: "VaR, 蒙特卡洛模拟" },
    },
    banking: {
      title: "银行与宏观",
      loans: { title: "贷款与抵押", desc: "摊销, 提前还款, 年化利率" },
      macro: { title: "宏观与外汇", desc: "通胀, 购买力平价, 汇率" },
    },
  },
  home: {
    title: "金融指挥中心",
    subtitle: "专业级金融建模、估值与风险分析工具。",
    openModule: "打开模块",
  },
  tvm: {
    title: "货币时间价值",
    subtitle: "计算现值、终值、年金、利率或期数。",
    fv: "终值 (FV)",
    pv: "现值 (PV)",
    pmt: "年金 (PMT)",
    nper: "期数 (NPER)",
    rate: "利率 (RATE)",
    annualRate: "期间利率 (%)",
    periods: "期数 (N)",
    payment: "年金/支付额 (PMT)",
    presentValue: "现值 (PV)",
    futureValue: "终值 (FV)",
    paymentMode: "支付模式",
    end: "期末 (普通年金)",
    begin: "期初 (预付年金)",
    resultDesc: {
      fv: "您投资的未来价值。",
      pv: "达到目标所需的现值。",
      pmt: "每期所需的经常性支付。",
      nper: "所需期数。",
    },
    emptyState: "输入数值并点击计算",
  },
  cashFlow: {
    title: "现金流分析",
    subtitle: "使用净现值 (NPV) 和内部收益率 (IRR) 分析投资。",
    inputsTitle: "现金流输入",
    inputsDesc: "定义初始投资及后续回报。",
    discountRate: "折现率 (%)",
    period: "期间",
    flow: "现金流",
    addPeriod: "增加期间",
    npv: "净现值 (NPV)",
    irr: "内部收益率 (IRR)",
    payback: "投资回收期",
    visualization: "现金流可视化",
    info: "NPV 比较所有现金流入与流出的现值。正的 NPV 通常表示投资获利。IRR 是盈亏平衡的折现率。",
  },
  equity: {
    title: "股票估值",
    subtitle: "使用标准金融框架模拟股票价格和资本成本。",
    capm: {
      tab: "CAPM",
      title: "CAPM 输入",
      desc: "资本资产定价模型",
      rf: "无风险利率 (Rf %)",
      beta: "贝塔系数 (β)",
      rm: "预期市场回报 (Rm %)",
      re: "预期回报率 (Re)",
      prem: "基于市场风险溢价",
    },
    wacc: {
      tab: "WACC",
      title: "资本结构",
      eqVal: "股权价值 ($)",
      debtVal: "债务价值 ($)",
      costEq: "股权成本 (%)",
      costDebt: "债务成本 (%)",
      tax: "企业税率 (%)",
      result: "WACC",
      desc: "加权平均资本成本。用作企业估值的折现率。",
    },
    ddm: {
      tab: "估值 (DDM)",
      title: "股利折现输入",
      desc: "戈登增长模型 (稳定增长)",
      d1: "明年股利 (D1)",
      req: "要求回报率 (%)",
      g: "增长率 (%)",
      intrinsic: "内在价值",
      resultDesc: "基于股利永续增长的公平价格。",
    },
  },
  bonds: {
    title: "债券估值",
    subtitle: "计算债券价格、到期收益率、久期和凸性。",
    char: "债券特征",
    face: "面值",
    coupon: "票息率 (%)",
    ytm: "到期收益率 (%)",
    years: "剩余年限",
    freq: "支付频率",
    freqOpts: { annual: "每年", semi: "每半年", quart: "每季度", month: "每月" },
    fairPrice: "公平价格",
    discount: "折价",
    premium: "溢价",
    macDur: "麦考利久期",
    modDur: "修正久期",
    convexity: "凸性",
    curve: "价格与收益率关系",
  },
  portfolio: {
    title: "投资组合优化",
    subtitle: "现代投资组合理论模拟 (Markowitz)。发现有效前沿。",
    run: "运行蒙特卡洛模拟",
    universe: "资产池",
    universeDesc: "定义资产的预期回报和风险 (标准差)。",
    rf: "无风险利率",
    corr: "相关性",
    asset: "资产",
    ret: "回报 (%)",
    risk: "风险 (%)",
    add: "添加资产",
    frontier: "有效前沿",
    frontierDesc: "风险 (标准差) vs 回报",
    maxSharpe: "最大夏普比率组合",
    minVol: "最小波动率组合",
    ratio: "比率",
    retRisk: "回报 / 风险",
    empty: "添加资产并点击运行蒙特卡洛模拟",
  },
  options: {
    title: "期权定价",
    subtitle: "用于欧式期权的 Black-Scholes-Merton 模型。包含希腊字母分析。",
    params: "期权参数",
    spot: "标的价格 (S)",
    strike: "行权价格 (K)",
    time: "到期时间 (年)",
    rate: "无风险利率 (%)",
    vol: "波动率 (σ %)",
    call: "看涨期权",
    put: "看跌期权",
    buy: "买入权",
    sell: "卖出权",
    payoff: "内在价值盈亏",
    intrinsic: "到期价值 vs 标的价格",
  },
  risk: {
    title: "风险管理",
    subtitle: "在险价值 (VaR) 和预期亏损 (CVaR) 计算器。",
    params: "风险参数",
    val: "投资组合价值 ($)",
    vol: "年化波动率 (%)",
    horizon: "时间范围 (天)",
    conf: "置信水平",
    var: "在险价值 (VaR)",
    varDesc: "占投资组合百分比",
    cvar: "条件 VaR (CVaR)",
    cvarDesc: "超过 VaR 阈值的预期损失",
    dist: "回报分布",
    distDesc: "潜在投资组合回报的正态分布",
  },
  loans: {
    title: "贷款与抵押计算器",
    subtitle: "计算还款、摊销表和总利息成本。",
    details: "贷款详情",
    method: "还款方式",
    cpm: "等额本息",
    cam: "等额本金",
    amount: "贷款金额",
    rate: "年利率 (%)",
    term: "期限 (年)",
    monthly: "月供",
    totalInt: "总利息",
    totalCost: "总成本",
    breakdown: "成本明细",
    balance: "余额预测",
    schedule: "摊销时间表",
    payment: "还款额",
    principal: "本金",
    interest: "利息",
    remBalance: "剩余本金",
  },
};

const dictionaries = { en, zh };

// --- Context ---

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('app-language') as Language;
    if (saved && (saved === 'en' || saved === 'zh')) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
  };

  const currentDictionary = dictionaries[language];

  // Helper to get nested values like "nav.core.title"
  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = currentDictionary;
    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation missing for key: ${path} in language: ${language}`);
        return path;
      }
      current = current[key];
    }
    return typeof current === 'string' ? current : path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, translations: currentDictionary }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}