"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { LANGUAGE_KEY } from "@/lib/constants";
import { safeGetItem, safeSetItem } from "@/lib/storage";

// --- Types ---
type Language = "en" | "zh";

type NestedKeyOf<T, Prefix extends string = ""> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: NestedKeyOf<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>;
    }[keyof T & string];

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
    light: string;
    dark: string;
    system: string;
    toggleMenu: string;
    toggleTheme: string;
    home: string;
    copy: string;
    copied: string;
    copySuccess: string;
    copyError: string;
    more: string;
    notAvailable: string;
    rows: string;
    tvmShort: string;
    portfolioShort: string;
  };
  sidebar: {
    edition: string;
    version: string;
    search: string;
    featured: string;
  };
  nav: {
    core: {
      title: string;
      tvm: { title: string; desc: string };
      cashFlow: { title: string; desc: string };
    };
    investing: {
      title: string;
      equity: { title: string; desc: string };
      portfolio: { title: string; desc: string };
      bonds: { title: string; desc: string };
    };
    derivatives: {
      title: string;
      options: { title: string; desc: string };
      risk: { title: string; desc: string };
    };
    banking: {
      title: string;
      loans: { title: string; desc: string };
      macro: { title: string; desc: string };
    };
    more: {
      title: string;
      history: { desc: string };
      settings: { desc: string };
      help: { desc: string };
    };
  };
  home: {
    title: string;
    subtitle: string;
    openModule: string;
    recentCalculations: string;
    continueTitle: string;
    continueDesc: string;
    directoryTitle: string;
    directoryDesc: string;
    continueAction: string;
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
      rate: string;
    };
    emptyState: string;
    quickPreset: string;
    chooseScenario: string;
    fixValidation: string;
    calculationError: string;
    calculationErrorDesc: string;
    invalidResult: string;
    runtimeError: string;
    stepsTitle: string;
    stepsDesc: string;
    presets: {
      retirement: string;
      loanPayoff: string;
      collegeFund: string;
    };
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
    chartDisclosure: string;
    infoDisclosure: string;
    invalidInputs: string;
  };
  equity: {
    title: string;
    subtitle: string;
    capm: { tab: string; title: string; desc: string; rf: string; beta: string; rm: string; re: string; prem: string };
    wacc: {
      tab: string;
      title: string;
      eqVal: string;
      debtVal: string;
      costEq: string;
      costDebt: string;
      tax: string;
      result: string;
      desc: string;
    };
    ddm: {
      tab: string;
      title: string;
      desc: string;
      d1: string;
      req: string;
      g: string;
      intrinsic: string;
      resultDesc: string;
      growthError: string;
    };
    validation: {
      invalidInputs: string;
      ddmDisclosure: string;
    };
  };
  bonds: {
    title: string;
    subtitle: string;
    // renamed from `char` to `characteristics` for clarity
    characteristics: string;
    face: string;
    coupon: string;
    ytm: string;
    years: string;
    freq: string;
    freqOpts: { annual: string; semi: string; quart: string; month: string };
    fairPrice: string;
    discount: string;
    premium: string;
    macDur: string;
    modDur: string;
    convexity: string;
    curve: string;
    metrics: string;
    priceSensitivity: string;
    validation: {
      invalidInputs: string;
      curveDisclosure: string;
      heatmapDisclosure: string;
      mobileHeatmapTitle: string;
      faceHelp: string;
      couponHelp: string;
      ytmHelp: string;
      yearsHelp: string;
      frequencyHelp: string;
    };
  };
  portfolio: {
    title: string;
    subtitle: string;
    run: string;
    rerun: string;
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
    workflow: {
      settings: string;
      assets: string;
      results: string;
      chart: string;
      runHint: string;
      resultsHint: string;
      chartHint: string;
    };
    validation: {
      invalidInputs: string;
      universeDisclosure: string;
      frontierDisclosure: string;
      assetCardTitle: string;
    };
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
    callPrice: string;
    put: string;
    buy: string;
    sell: string;
    payoff: string;
    intrinsic: string;
    greeks: {
      delta: string;
      gamma: string;
      theta: string;
      vega: string;
      rho: string;
    };
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
    emptySchedule: string;
    errorPositiveAmount: string;
    errorPositiveRate: string;
    errorPositiveYears: string;
    noData: string;
  };
  macro: {
    title: string;
    subtitle: string;
    inflation: {
      tab: string;
      title: string;
      desc: string;
      startPrice: string;
      endPrice: string;
      years: string;
      rate: string;
      error: {
        negativePrice: string;
        invalidYears: string;
      };
    };
    purchasingPower: {
      tab: string;
      title: string;
      desc: string;
      amount: string;
      inflation: string;
      years: string;
      futureValue: string;
      loss: string;
      error: {
        negativeAmount: string;
        invalidYears: string;
      };
    };
    realRate: {
      tab: string;
      title: string;
      desc: string;
      nominal: string;
      inflation: string;
      real: string;
    };
    cpiAdjust: {
      tab: string;
      title: string;
      desc: string;
      amount: string;
      fromCPI: string;
      toCPI: string;
      adjusted: string;
      error: {
        negativeAmount: string;
        zeroCPI: string;
      };
    };
    ppp: {
      tab: string;
      title: string;
      desc: string;
      domestic: string;
      foreign: string;
      rate: string;
      rateDesc: string;
      error: {
        negativePrice: string;
        zeroForeign: string;
      };
    };
  };
  share: {
    title: string;
    copyLink: string;
    copyMarkdown: string;
    copyText: string;
    print: string;
    inputsHeading: string;
    resultsHeading: string;
    parameterLabel: string;
    metricLabel: string;
    valueLabel: string;
  };
  history: {
    title: string;
    clearAll: string;
    restore: string;
    delete: string;
    restored: string;
    cleared: string;
    confirmClear: string;
    search: string;
    noResults: string;
    loading: string;
    noHistory: string;
    noHistoryDesc: string;
    searchPlaceholder: string;
    select: string;
    itemsSelected: string;
    all: string;
    favorites: string;
    itemsDeleted: string;
    recent: string;
  };
  sensitivity: {
    title: string;
    baseValue: string;
    result: string;
    change: string;
    trend: string;
    max: string;
    min: string;
    range: string;
  };
  settings: {
    title: string;
    customizeExperience: string;
    appearance: string;
    appearanceDesc: string;
    theme: string;
    light: string;
    dark: string;
    system: string;
    language: string;
    behavior: string;
    behaviorDesc: string;
    autoCalculate: string;
    autoCalculateDesc: string;
    notifications: string;
    notificationsDesc: string;
    dataManagement: string;
    dataManagementDesc: string;
    exportHistoryJson: string;
    clearAllHistory: string;
    about: string;
    aboutDesc: string;
    version: string;
    description: string;
  };
  help: {
    title: string;
    learnMore: string;
    quickStart: string;
    quickStartDesc: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    availableCalculators: string;
    calculatorsDesc: string;
    faq: string;
    contactSupport: string;
    contactDesc: string;
    github: string;
    tvmCalc: string;
    tvmCalcDesc: string;
    cashFlowCalc: string;
    cashFlowCalcDesc: string;
    stockVal: string;
    stockValDesc: string;
    portfolioOpt: string;
    portfolioOptDesc: string;
    bondsCalc: string;
    bondsCalcDesc: string;
    optionsCalc: string;
    optionsCalcDesc: string;
    riskMetrics: string;
    riskMetricsDesc: string;
    loanCalc: string;
    loanCalcDesc: string;
    faqHistory: string;
    faqHistoryAns: string;
    faqExport: string;
    faqExportAns: string;
    faqTheme: string;
    faqThemeAns: string;
    faqLanguage: string;
    faqLanguageAns: string;
    faqMobile: string;
    faqMobileAns: string;
    faqPrivacy: string;
    faqPrivacyAns: string;
  };
  export: {
    title: string;
    csv: string;
    json: string;
    pdf: string;
    noData: string;
    csvSuccess: string;
    jsonSuccess: string;
    csvError: string;
    jsonError: string;
    pdfSuccess: string;
    pdfError: string;
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
    light: "Light",
    dark: "Dark",
    system: "System",
    toggleMenu: "Toggle Menu",
    toggleTheme: "Toggle Theme",
    home: "Home",
    copy: "Copy",
    copied: "Copied",
    copySuccess: "Copied to clipboard",
    copyError: "Failed to copy",
    more: "More",
    notAvailable: "N/A",
    rows: "rows",
    tvmShort: "TVM",
    portfolioShort: "Portfolio",
  },
  sidebar: {
    edition: "Professional Edition",
    version: "v0.3.0",
    search: "Search calculators...",
    featured: "Featured",
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
    more: {
      title: "More",
      history: { desc: "View calculation history" },
      settings: { desc: "App preferences and data" },
      help: { desc: "Guide and support" },
    },
  },
  home: {
    title: "Professional Financial Calculator",
    subtitle: "Comprehensive financial modeling, valuation, and risk analysis tools.",
    openModule: "Open Module",
    recentCalculations: "Recent Calculations",
    continueTitle: "Continue working",
    continueDesc: "Jump back into the calculator you used most recently.",
    directoryTitle: "All calculators",
    directoryDesc: "Browse the full toolkit when you need a specific model.",
    continueAction: "Continue",
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
      rate: "The interest rate per period.",
    },
    emptyState: "Enter values and press Calculate",
    quickPreset: "Quick preset",
    chooseScenario: "Choose a starting scenario",
    fixValidation: "Please fix the validation errors before calculating.",
    calculationError: "Calculation Error",
    calculationErrorDesc: "Unable to calculate result. Please check your inputs and try again.",
    invalidResult: "Calculation resulted in an invalid value. Please check your inputs.",
    runtimeError: "An error occurred during calculation. Please verify your inputs.",
    stepsTitle: "Calculation steps",
    stepsDesc: "Open the detailed derivation when you want to inspect the formula path.",
    presets: {
      retirement: "Retirement Savings",
      loanPayoff: "Loan Payoff",
      collegeFund: "College Fund",
    },
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
    chartDisclosure: "Open the chart when you need period-by-period detail.",
    infoDisclosure: "Show guidance for reading these results.",
    invalidInputs: "Please enter valid numeric inputs for discount rate and cash flows.",
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
      growthError: "Growth rate must be less than the required return.",
    },
    validation: {
      invalidInputs: "Please correct the highlighted inputs to view a reliable result.",
      ddmDisclosure: "Open to edit dividend growth assumptions on smaller screens.",
    },
  },
  bonds: {
    title: "Bond Valuation",
    subtitle: "Calculate Bond Price, Yield to Maturity, Duration, and Convexity.",
    characteristics: "Bond Parameters",
    face: "Face Value",
    coupon: "Coupon Rate (%)",
    ytm: "Yield to Maturity (%)",
    years: "Years to Maturity",
    freq: "Payment Frequency",
    freqOpts: { annual: "Annual", semi: "Semiannual", quart: "Quarterly", month: "Monthly" },
    fairPrice: "Fair Price",
    discount: "Discount",
    premium: "Premium",
    macDur: "Macaulay Duration",
    modDur: "Modified Duration",
    convexity: "Convexity",
    curve: "Price vs Yield Relationship",
    metrics: "Key Metrics",
    priceSensitivity: "Price Sensitivity",
    validation: {
      invalidInputs: "Please correct the highlighted bond inputs before relying on the outputs.",
      curveDisclosure: "Open the price-yield curve when you want sensitivity detail on smaller screens.",
      heatmapDisclosure: "The heatmap is optional on mobile; open it only when comparing scenarios.",
      mobileHeatmapTitle: "Mobile sensitivity cards",
      faceHelp: "Face value of the bond, the amount paid at maturity.",
      couponHelp: "Annual coupon rate expressed as a percentage of face value.",
      ytmHelp: "Yield to maturity, the expected annualized return if the bond is held to maturity.",
      yearsHelp: "Number of years until the bond matures.",
      frequencyHelp: "Coupon payment frequency per year: 1 = annual, 2 = semiannual, 4 = quarterly, 12 = monthly.",
    },
  },
  portfolio: {
    title: "Portfolio Optimization",
    subtitle: "Modern Portfolio Theory simulation (Markowitz). Discover the Efficient Frontier.",
    run: "Run Monte Carlo",
    rerun: "Run again",
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
    workflow: {
      settings: "Simulation settings",
      assets: "Asset inputs",
      results: "Portfolio results",
      chart: "Frontier chart",
      runHint: "Tune assumptions first, then run the simulation when the asset set looks right.",
      resultsHint: "Review the best portfolios first, then open the chart for deeper comparison.",
      chartHint: "Keep the frontier collapsed on small screens until you need deeper comparison detail.",
    },
    validation: {
      invalidInputs: "Please correct the highlighted asset inputs before running the simulation.",
      universeDisclosure: "Manage assets here. Keep at least two assets with valid risk and return values.",
      frontierDisclosure: "Keep the chart collapsed on phones until you need detailed frontier exploration.",
      assetCardTitle: "Asset details",
    },
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
    callPrice: "Call Price",
    put: "Put Option",
    buy: "Right to Buy",
    sell: "Right to Sell",
    payoff: "Intrinsic Value Payoff",
    intrinsic: "Value at Expiration vs Spot Price",
    greeks: {
      delta: "Delta (Δ)",
      gamma: "Gamma (Γ)",
      theta: "Theta (Θ)",
      vega: "Vega (ν)",
      rho: "Rho (ρ)",
    },
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
    emptySchedule: "Enter valid loan details to generate the amortization schedule.",
    errorPositiveAmount: "Loan amount must be positive",
    errorPositiveRate: "Interest rate cannot be negative",
    errorPositiveYears: "Loan term must be positive",
    noData: "No schedule data available",
  },
  macro: {
    title: "Macroeconomics & FX",
    subtitle: "Inflation calculations, purchasing power parity, and real interest rate analysis.",
    inflation: {
      tab: "Inflation",
      title: "Inflation Rate Calculator",
      desc: "Calculate the compound annual inflation rate based on price changes over time.",
      startPrice: "Initial Price",
      endPrice: "Final Price",
      years: "Years",
      rate: "Annual Inflation Rate",
      error: {
        negativePrice: "Price must be positive",
        invalidYears: "Years must be positive",
      },
    },
    purchasingPower: {
      tab: "Purchasing Power",
      title: "Purchasing Power Calculator",
      desc: "See how inflation erodes the purchasing power of money over time.",
      amount: "Current Amount ($)",
      inflation: "Annual Inflation Rate (%)",
      years: "Years",
      futureValue: "Future Purchasing Power",
      loss: "Value Lost",
      error: {
        negativeAmount: "Amount cannot be negative",
        invalidYears: "Years cannot be negative",
      },
    },
    realRate: {
      tab: "Real Interest Rate",
      title: "Real Interest Rate (Fisher Equation)",
      desc: "Calculate the real return after adjusting for inflation using the Fisher equation.",
      nominal: "Nominal Rate (%)",
      inflation: "Inflation Rate (%)",
      real: "Real Interest Rate",
    },
    cpiAdjust: {
      tab: "CPI Adjustment",
      title: "CPI Inflation Adjustment",
      desc: "Adjust monetary amounts for inflation using Consumer Price Index values.",
      amount: "Amount to Adjust ($)",
      fromCPI: "From CPI",
      toCPI: "To CPI",
      adjusted: "Inflation-Adjusted Amount",
      error: {
        negativeAmount: "Amount cannot be negative",
        zeroCPI: "CPI must be greater than zero",
      },
    },
    ppp: {
      tab: "PPP Exchange Rate",
      title: "Purchasing Power Parity",
      desc: "Calculate the theoretical exchange rate based on relative price levels (Big Mac Index style).",
      domestic: "Domestic Price",
      foreign: "Foreign Price",
      rate: "Implied Exchange Rate",
      rateDesc: "1 unit domestic = ? units foreign",
      error: {
        negativePrice: "Price must be positive",
        zeroForeign: "Foreign price must be greater than zero",
      },
    },
  },
  share: {
    title: "Share Results",
    copyLink: "Copy shareable link",
    copyMarkdown: "Copy as Markdown table",
    copyText: "Copy as plain text",
    print: "Print / Save as PDF",
    inputsHeading: "Inputs",
    resultsHeading: "Results",
    parameterLabel: "Parameter",
    metricLabel: "Metric",
    valueLabel: "Value",
  },
  history: {
    title: "History",
    clearAll: "Clear all",
    restore: "Restore",
    delete: "Delete",
    restored: "Calculation restored",
    cleared: "History cleared",
    confirmClear: "Clear all history?",
    search: "Search history...",
    noResults: "No results found",
    loading: "Loading...",
    noHistory: "No history yet",
    noHistoryDesc: "Your calculation history will appear here once you start using the financial calculators.",
    searchPlaceholder: "Search history...",
    select: "Select",
    itemsSelected: "selected",
    all: "All",
    favorites: "Favorites",
    itemsDeleted: "items deleted",
    recent: "Recent Calculations",
  },
  sensitivity: {
    title: "Sensitivity Analysis",
    baseValue: "Base Case",
    result: "Result",
    change: "Change",
    trend: "Trend",
    max: "Max",
    min: "Min",
    range: "Range",
  },
  settings: {
    title: "Settings",
    customizeExperience: "Customize your experience",
    appearance: "Appearance",
    appearanceDesc: "Customize how the app looks",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    language: "Language / 语言",
    behavior: "Behavior",
    behaviorDesc: "Customize how calculations work",
    autoCalculate: "Auto-calculate",
    autoCalculateDesc: "Automatically recalculate results when inputs change",
    notifications: "Notifications",
    notificationsDesc: "Show toast notifications for actions",
    dataManagement: "Data Management",
    dataManagementDesc: "Manage your calculation history and data",
    exportHistoryJson: "Export History (JSON)",
    clearAllHistory: "Clear All History",
    about: "About",
    aboutDesc: "About FinCalc Pro",
    version: "v0.3.0",
    description:
      "A comprehensive suite of financial calculators including TVM, cash flow analysis, stock valuation, portfolio optimization, bonds, options, risk metrics, loans, and macroeconomics.",
  },
  help: {
    title: "Help & Support",
    learnMore: "Learn how to use FinCalc Pro",
    quickStart: "Quick Start Guide",
    quickStartDesc: "Get started with financial calculations",
    step1Title: "Choose a Calculator",
    step1Desc:
      "Select from TVM (Time Value of Money), Cash Flow, Equity Valuation, Portfolio Optimization, Bonds, Options, Risk Metrics, Loans, or Macroeconomics.",
    step2Title: "Enter Your Parameters",
    step2Desc: "Fill in the required financial parameters like interest rate, periods, cash flows, etc.",
    step3Title: "Calculate & View Results",
    step3Desc: "Click Calculate to see results. Export in CSV, JSON, or PDF formats.",
    availableCalculators: "Available Calculators",
    calculatorsDesc: "Overview of each financial tool",
    faq: "Frequently Asked Questions",
    contactSupport: "Contact & Support",
    contactDesc: "For questions, bug reports, or feature requests, please visit our GitHub repository.",
    github: "github.com/louisgreen0726/financial-calc",
    tvmCalc: "TVM Calculator",
    tvmCalcDesc: "Time Value of Money - Calculate PV, FV, PMT, NPER, and interest rate.",
    cashFlowCalc: "Cash Flow Analysis",
    cashFlowCalcDesc: "NPV, IRR, Payback Period, and ROI calculations for investment projects.",
    stockVal: "Stock Valuation",
    stockValDesc: "DDM (Dividend Discount Model), CAPM, WACC, and financial ratios.",
    portfolioOpt: "Portfolio Optimization",
    portfolioOptDesc: "Monte Carlo simulation for efficient frontier and optimal portfolios.",
    bondsCalc: "Bonds & Fixed Income",
    bondsCalcDesc: "YTM, Duration, Convexity, and bond pricing calculations.",
    optionsCalc: "Options Pricing",
    optionsCalcDesc: "Black-Scholes option pricing with Greeks (Delta, Gamma, Theta, Vega, Rho).",
    riskMetrics: "Risk Metrics",
    riskMetricsDesc: "VaR (Value at Risk) and CVaR (Conditional VaR) calculations.",
    loanCalc: "Loan Calculator",
    loanCalcDesc: "EMI calculation with amortization schedules (CPM and CAM methods).",
    faqHistory: "How does calculation history work?",
    faqHistoryAns:
      "Calculation history is stored locally in your browser. Each time you perform a calculation, it is saved with a timestamp and inputs. You can access history from the bottom navigation on mobile or from the dedicated History page.",
    faqExport: "How do I export my calculations?",
    faqExportAns:
      "Click the Export menu button to export in CSV, JSON, or PDF format. The CSV and JSON options will download your data immediately. PDF export captures the calculation results as a formatted document.",
    faqTheme: "How do I change between light and dark mode?",
    faqThemeAns:
      "Click the theme toggle button in the header. You can choose Light, Dark, or follow your system preference.",
    faqLanguage: "How do I switch languages?",
    faqLanguageAns: "Click the language button in the header to toggle between English and Chinese (中文).",
    faqMobile: "How do I use this on mobile?",
    faqMobileAns:
      "The app is fully responsive. On mobile devices, the bottom navigation keeps quick access focused on Home and History. Open Home to browse the full calculator directory.",
    faqPrivacy: "Is my data stored on servers?",
    faqPrivacyAns:
      "No. All calculation history is stored locally in your browser's localStorage. No data is sent to any server. You can export or clear your history at any time from the Settings page.",
  },
  export: {
    title: "Export",
    csv: "Export CSV",
    json: "Export JSON",
    pdf: "Export PDF",
    noData: "No data to export",
    csvSuccess: "CSV exported successfully",
    jsonSuccess: "JSON exported successfully",
    csvError: "Failed to export CSV",
    jsonError: "Failed to export JSON",
    pdfSuccess: "PDF exported successfully",
    pdfError: "Failed to export PDF",
  },
};

const zh: Translations = {
  common: {
    dashboard: "仪表盘",
    calculate: "开始计算",
    result: "计算结果",
    parameters: "参数配置",
    solveFor: "求解目标",
    loading: "计算中...",
    inputs: "输入参数",
    chart: "图表展示",
    analysis: "深度分析",
    year: "年份",
    initial: "初始值",
    add: "新增",
    remove: "删除",
    clear: "重置",
    light: "浅色",
    dark: "深色",
    system: "跟随系统",
    toggleMenu: "切换菜单",
    toggleTheme: "切换主题",
    home: "首页",
    copy: "复制",
    copied: "已复制",
    copySuccess: "已复制到剪贴板",
    copyError: "复制失败",
    more: "更多",
    notAvailable: "暂无",
    rows: "行",
    tvmShort: "TVM",
    portfolioShort: "组合",
  },
  sidebar: {
    edition: "专业版",
    version: "v0.3.0",
    search: "搜索计算器...",
    featured: "推荐",
  },
  nav: {
    core: {
      title: "核心财务工具",
      tvm: { title: "货币时间价值 (TVM)", desc: "现值、终值、年金及利率计算" },
      cashFlow: { title: "现金流分析", desc: "NPV, IRR 及投资回报分析" },
    },
    investing: {
      title: "投资分析",
      equity: { title: "股票估值模型", desc: "DDM, CAPM, WACC 及财务比率" },
      portfolio: { title: "投资组合优化", desc: "马科维茨模型, 有效前沿, 夏普比率" },
      bonds: { title: "债券与固定收益", desc: "久期, 凸性, 到期收益率 (YTM)" },
    },
    derivatives: {
      title: "衍生品与风险",
      options: { title: "期权定价", desc: "Black-Scholes 模型, 二叉树, 希腊字母" },
      risk: { title: "风险管理", desc: "VaR (在险价值), 蒙特卡洛模拟" },
    },
    banking: {
      title: "银行与宏观",
      loans: { title: "贷款与按揭", desc: "还款计划, 提前还款, 年化利率 (APR)" },
      macro: { title: "宏观经济与外汇", desc: "通胀调整, 购买力平价, 汇率换算" },
    },
    more: {
      title: "更多",
      history: { desc: "查看计算历史" },
      settings: { desc: "应用偏好与数据" },
      help: { desc: "使用指南与支持" },
    },
  },
  home: {
    title: "专业金融计算器",
    subtitle: "全面的金融建模、估值和风险分析工具。",
    openModule: "进入模块",
    recentCalculations: "最近计算记录",
    continueTitle: "继续上次工作",
    continueDesc: "快速回到最近一次使用的计算器。",
    directoryTitle: "全部计算器",
    directoryDesc: "当你需要特定模型时，再浏览完整工具目录。",
    continueAction: "继续",
  },
  tvm: {
    title: "货币时间价值",
    subtitle: "精确计算现值(PV)、终值(FV)、年金(PMT)、利率(Rate)或期数(NPER)。",
    fv: "终值 (FV)",
    pv: "现值 (PV)",
    pmt: "年金/每期支付 (PMT)",
    nper: "期数 (NPER)",
    rate: "利率 (RATE)",
    annualRate: "每期利率 (%)",
    periods: "期数 (N)",
    payment: "每期支付 (PMT)",
    presentValue: "现值 (PV)",
    futureValue: "终值 (FV)",
    paymentMode: "支付时点",
    end: "期末 (普通年金)",
    begin: "期初 (预付年金)",
    resultDesc: {
      fv: "该投资在未来的预期价值。",
      pv: "达成未来目标所需的当前资金。",
      pmt: "每期需支付或收取的金额。",
      nper: "达到目标所需的总期数。",
      rate: "每期的利率。",
    },
    emptyState: "请输入参数并点击开始计算",
    quickPreset: "快速预设",
    chooseScenario: "选择一个起始场景",
    fixValidation: "请先修正校验错误，再执行计算。",
    calculationError: "计算错误",
    calculationErrorDesc: "暂时无法计算结果，请检查输入后重试。",
    invalidResult: "计算结果无效，请检查输入参数后重试。",
    runtimeError: "计算过程中发生错误，请核对输入后重试。",
    stepsTitle: "计算步骤",
    stepsDesc: "需要查看公式推导时，可展开详细步骤。",
    presets: {
      retirement: "退休储蓄",
      loanPayoff: "贷款还清",
      collegeFund: "教育基金",
    },
  },
  cashFlow: {
    title: "现金流分析",
    subtitle: "利用净现值 (NPV) 和内部收益率 (IRR) 评估投资项目的可行性。",
    inputsTitle: "现金流明细",
    inputsDesc: "输入初始投资及后续各期现金流。",
    discountRate: "折现率 (%)",
    period: "期数",
    flow: "现金流量",
    addPeriod: "增加一期",
    npv: "净现值 (NPV)",
    irr: "内部收益率 (IRR)",
    payback: "投资回收期",
    visualization: "现金流图示",
    info: "NPV 将所有未来现金流折现至当前价值。NPV > 0 通常意味着投资获利。IRR 是使 NPV 为 0 的折现率，代表项目的内在回报能力。",
    chartDisclosure: "需要逐期查看现金流时，再展开图表。",
    infoDisclosure: "展开查看这些指标的解读说明。",
    invalidInputs: "请输入有效的折现率与现金流数值。",
  },
  equity: {
    title: "股票估值",
    subtitle: "应用主流金融模型进行股票内在价值与资本成本分析。",
    capm: {
      tab: "CAPM 模型",
      title: "CAPM 参数",
      desc: "资本资产定价模型 - 计算预期回报率",
      rf: "无风险利率 (Rf %)",
      beta: "贝塔系数 (β)",
      rm: "预期市场回报 (Rm %)",
      re: "预期回报率 (Re)",
      prem: "基于市场风险溢价计算",
    },
    wacc: {
      tab: "WACC 计算",
      title: "资本结构",
      eqVal: "股权市值 ($)",
      debtVal: "债务市值 ($)",
      costEq: "股权成本 (%)",
      costDebt: "债务成本 (%)",
      tax: "企业税率 (%)",
      result: "加权平均资本成本 (WACC)",
      desc: "WACC 代表企业的综合融资成本，常作为企业估值的折现率。",
    },
    ddm: {
      tab: "股利折现 (DDM)",
      title: "模型参数",
      desc: "戈登增长模型 (适用于稳定增长企业)",
      d1: "下一期股利 (D1)",
      req: "要求回报率 (%)",
      g: "股利增长率 (%)",
      intrinsic: "内在价值",
      resultDesc: "基于股利永续增长假设推算的每股公允价值。",
      growthError: "增长率必须低于要求回报率。",
    },
    validation: {
      invalidInputs: "请先修正高亮输入项，再查看可信结果。",
      ddmDisclosure: "在较小屏幕上可展开编辑股利增长假设。",
    },
  },
  bonds: {
    title: "债券估值",
    subtitle: "计算债券理论价格、到期收益率(YTM)、久期及凸性。",
    characteristics: "债券参数",
    face: "票面面值",
    coupon: "票息率 (%)",
    ytm: "到期收益率 (%)",
    years: "剩余期限 (年)",
    freq: "付息频率",
    freqOpts: { annual: "每年 (1次)", semi: "每半年 (2次)", quart: "每季度 (4次)", month: "每月 (12次)" },
    fairPrice: "公允价格",
    discount: "折价发行",
    premium: "溢价发行",
    macDur: "麦考利久期",
    modDur: "修正久期",
    convexity: "凸性",
    curve: "价格-收益率曲线",
    metrics: "关键指标",
    priceSensitivity: "价格敏感性分析",
    validation: {
      invalidInputs: "请先修正高亮债券输入，再参考输出结果。",
      curveDisclosure: "在小屏幕上需要查看敏感性细节时，再展开价格-收益率曲线。",
      heatmapDisclosure: "热力图在移动端可按需展开，便于比较不同情景。",
      mobileHeatmapTitle: "移动端敏感性卡片",
      faceHelp: "债券票面面值，即到期时偿还的本金金额。",
      couponHelp: "年票息率，以票面面值百分比表示。",
      ytmHelp: "到期收益率，表示持有至到期的预期年化回报率。",
      yearsHelp: "距离债券到期的剩余年数。",
      frequencyHelp: "每年付息次数：1 = 每年，2 = 每半年，4 = 每季度，12 = 每月。",
    },
  },
  portfolio: {
    title: "投资组合优化",
    subtitle: "基于现代投资组合理论 (MPT) 的蒙特卡洛模拟，寻找有效前沿。",
    run: "执行蒙特卡洛模拟",
    rerun: "重新运行模拟",
    universe: "资产池配置",
    universeDesc: "设定各资产的预期回报率与风险 (标准差)。",
    rf: "无风险利率",
    corr: "相关系数",
    asset: "资产名称",
    ret: "预期回报 (%)",
    risk: "风险/波动率 (%)",
    add: "添加资产",
    frontier: "有效前沿图",
    frontierDesc: "风险 (标准差) vs 预期回报",
    maxSharpe: "最大夏普比率组合",
    minVol: "最小波动率组合",
    ratio: "夏普比率",
    retRisk: "回报 / 风险",
    empty: "请添加至少两个资产并点击执行模拟",
    workflow: {
      settings: "模拟参数",
      assets: "资产输入",
      results: "组合结果",
      chart: "前沿图表",
      runHint: "先调整假设参数，再在资产设置确认后运行模拟。",
      resultsHint: "先查看最优组合摘要，再按需展开图表做更深入比较。",
      chartHint: "在小屏上保持图表折叠，只有需要细看时再展开。",
    },
    validation: {
      invalidInputs: "请先修正高亮资产输入，再运行模拟。",
      universeDisclosure: "在这里管理资产，至少保留两个具有有效风险与回报数据的资产。",
      frontierDisclosure: "手机上默认折叠图表，需要深入查看有效前沿时再展开。",
      assetCardTitle: "资产明细",
    },
  },
  options: {
    title: "期权定价",
    subtitle: "Black-Scholes-Merton (BSM) 模型定价及希腊字母 (Greeks) 分析。",
    params: "期权合约参数",
    spot: "标的现价 (S)",
    strike: "行权价格 (K)",
    time: "剩余期限 (年)",
    rate: "无风险利率 (%)",
    vol: "波动率 (σ %)",
    call: "看涨期权 (Call)",
    callPrice: "看涨期权价格",
    put: "看跌期权 (Put)",
    buy: "买入权利",
    sell: "卖出权利",
    payoff: "到期盈亏图",
    intrinsic: "内在价值分析",
    greeks: {
      delta: "Delta (Δ)",
      gamma: "Gamma (Γ)",
      theta: "Theta (Θ)",
      vega: "Vega (ν)",
      rho: "Rho (ρ)",
    },
  },
  risk: {
    title: "风险管理",
    subtitle: "计算在险价值 (VaR) 与预期亏损 (CVaR/Expected Shortfall)。",
    params: "风险模型参数",
    val: "投资组合总值 ($)",
    vol: "年化波动率 (%)",
    horizon: "时间跨度 (天)",
    conf: "置信水平",
    var: "在险价值 (VaR)",
    varDesc: "最大可能损失 (按置信度)",
    cvar: "条件风险价值 (CVaR)",
    cvarDesc: "超过 VaR 阈值后的平均预期损失",
    dist: "回报分布模拟",
    distDesc: "基于正态分布假设的损益分布",
  },
  loans: {
    title: "贷款与按揭计算器",
    subtitle: "贷款还款计划、摊销表及利息成本分析。",
    details: "贷款信息",
    method: "还款方式",
    cpm: "等额本息 (固定月供)",
    cam: "等额本金 (本金固定)",
    amount: "贷款总额",
    rate: "年化利率 (%)",
    term: "贷款期限 (年)",
    monthly: "首月月供",
    totalInt: "累计支付利息",
    totalCost: "还款总额",
    breakdown: "本息构成",
    balance: "余额递减图",
    schedule: "还款计划表",
    payment: "本期还款",
    principal: "偿还本金",
    interest: "偿还利息",
    remBalance: "剩余本金",
    emptySchedule: "请输入有效的贷款信息以生成还款计划表。",
    errorPositiveAmount: "贷款总额必须为正数",
    errorPositiveRate: "利率不能为负数",
    errorPositiveYears: "贷款期限必须为正数",
    noData: "暂无还款计划数据",
  },
  macro: {
    title: "宏观经济与外汇",
    subtitle: "通胀计算、购买力平价及实际利率分析工具。",
    inflation: {
      tab: "通胀率",
      title: "年均通胀率计算器",
      desc: "基于价格变动计算复合年均通胀率。",
      startPrice: "初始价格",
      endPrice: "最终价格",
      years: "年数",
      rate: "年均通胀率",
      error: {
        negativePrice: "价格必须为正数",
        invalidYears: "年数必须为正数",
      },
    },
    purchasingPower: {
      tab: "购买力",
      title: "购买力计算器",
      desc: "查看通胀如何随时间侵蚀货币购买力。",
      amount: "当前金额 ($)",
      inflation: "年均通胀率 (%)",
      years: "年数",
      futureValue: "未来购买力",
      loss: "价值损失",
      error: {
        negativeAmount: "金额不能为负数",
        invalidYears: "年数不能为负数",
      },
    },
    realRate: {
      tab: "实际利率",
      title: "实际利率 (费雪方程)",
      desc: "使用费雪方程计算通胀调整后的实际回报。",
      nominal: "名义利率 (%)",
      inflation: "通胀率 (%)",
      real: "实际利率",
    },
    cpiAdjust: {
      tab: "CPI调整",
      title: "CPI通胀调整",
      desc: "使用消费者价格指数调整货币金额。",
      amount: "待调整金额 ($)",
      fromCPI: "起始CPI",
      toCPI: "目标CPI",
      adjusted: "通胀调整后金额",
      error: {
        negativeAmount: "金额不能为负数",
        zeroCPI: "CPI必须大于零",
      },
    },
    ppp: {
      tab: "PPP汇率",
      title: "购买力平价",
      desc: "基于相对物价水平计算理论汇率（类似巨无霸指数）。",
      domestic: "本国价格",
      foreign: "外国价格",
      rate: "隐含汇率",
      rateDesc: "1单位本国货币 = ?单位外国货币",
      error: {
        negativePrice: "价格必须为正数",
        zeroForeign: "外国价格必须大于零",
      },
    },
  },
  share: {
    title: "分享结果",
    copyLink: "复制分享链接",
    copyMarkdown: "复制为 Markdown 表格",
    copyText: "复制为纯文本",
    print: "打印 / 另存为 PDF",
    inputsHeading: "输入参数",
    resultsHeading: "结果",
    parameterLabel: "参数",
    metricLabel: "指标",
    valueLabel: "值",
  },
  history: {
    title: "历史记录",
    clearAll: "清除全部",
    restore: "恢复",
    delete: "删除",
    restored: "计算已恢复",
    cleared: "历史已清除",
    confirmClear: "确定清除所有历史记录？",
    search: "搜索历史...",
    noResults: "未找到结果",
    loading: "加载中...",
    noHistory: "暂无历史记录",
    noHistoryDesc: "开始使用计算器后，您的计算历史将显示在这里。",
    searchPlaceholder: "搜索历史记录...",
    select: "选择",
    itemsSelected: "已选择",
    all: "全部",
    favorites: "收藏",
    itemsDeleted: "项已删除",
    recent: "最近计算记录",
  },
  sensitivity: {
    title: "敏感性分析",
    baseValue: "基准情形",
    result: "结果",
    change: "变化",
    trend: "趋势",
    max: "最大值",
    min: "最小值",
    range: "区间",
  },
  settings: {
    title: "设置",
    customizeExperience: "自定义您的体验",
    appearance: "外观",
    appearanceDesc: "自定义应用的外观",
    theme: "主题",
    light: "浅色",
    dark: "深色",
    system: "跟随系统",
    language: "语言 / Language",
    behavior: "行为",
    behaviorDesc: "自定义计算方式",
    autoCalculate: "自动计算",
    autoCalculateDesc: "当输入变化时自动重新计算结果",
    notifications: "通知",
    notificationsDesc: "显示操作通知提示",
    dataManagement: "数据管理",
    dataManagementDesc: "管理您的计算历史和数据",
    exportHistoryJson: "导出历史记录 (JSON)",
    clearAllHistory: "清除所有历史",
    about: "关于",
    aboutDesc: "关于 FinCalc Pro",
    version: "v0.3.0",
    description:
      "全面的金融计算器套件，包括货币时间价值、现金流分析、股票估值、投资组合优化、债券、期权、风险指标、贷款和宏观经济计算工具。",
  },
  help: {
    title: "帮助与支持",
    learnMore: "了解如何使用 FinCalc Pro",
    quickStart: "快速入门指南",
    quickStartDesc: "开始使用金融计算工具",
    step1Title: "选择计算器",
    step1Desc:
      "从货币时间价值 (TVM)、现金流分析、股票估值、投资组合优化、债券、期权、风险指标、贷款或宏观经济计算器中选择。",
    step2Title: "输入您的参数",
    step2Desc: "填写所需的金融参数，如利率、期数、现金流等。",
    step3Title: "计算并查看结果",
    step3Desc: "点击计算查看结果。以 CSV、JSON 或 PDF 格式导出。",
    availableCalculators: "可用计算器",
    calculatorsDesc: "各金融工具概述",
    faq: "常见问题",
    contactSupport: "联系我们",
    contactDesc: "如有问题、错误报告或功能请求，请访问我们的 GitHub 仓库。",
    github: "github.com/louisgreen0726/financial-calc",
    tvmCalc: "货币时间价值计算器",
    tvmCalcDesc: "现值、终值、年金、期数及利率计算。",
    cashFlowCalc: "现金流分析",
    cashFlowCalcDesc: "投资项目的 NPV、IRR、回收期和 ROI 计算。",
    stockVal: "股票估值",
    stockValDesc: "股利折现模型 (DDM)、CAPM、WACC 及财务比率。",
    portfolioOpt: "投资组合优化",
    portfolioOptDesc: "蒙特卡洛模拟有效前沿和最优投资组合。",
    bondsCalc: "债券与固定收益",
    bondsCalcDesc: "YTM、久期、凸性和债券定价计算。",
    optionsCalc: "期权定价",
    optionsCalcDesc: "Black-Scholes 期权定价及希腊字母分析（Delta、Gamma、Theta、Vega、Rho）。",
    riskMetrics: "风险指标",
    riskMetricsDesc: "在险价值 (VaR) 和条件风险价值 (CVaR) 计算。",
    loanCalc: "贷款计算器",
    loanCalcDesc: "等额本息和等额本金还款方式的摊销计划计算。",
    faqHistory: "\u8ba1\u7b97\u5386\u53f2\u5982\u4f55\u5de5\u4f5c\uff1f",
    faqHistoryAns:
      "\u8ba1\u7b97\u5386\u53f2\u5b58\u50a8\u5728\u6d4f\u89c8\u5668\u672c\u5730\u3002\u6bcf\u6b21\u6267\u884c\u8ba1\u7b97\u65f6\uff0c\u90fd\u4f1a\u4fdd\u5b58\u65f6\u95f4\u6233\u548c\u8f93\u5165\u53c2\u6570\u3002\u79fb\u52a8\u7aef\u53ef\u901a\u8fc7\u5e95\u90e8\u5bfc\u822a\u8fdb\u5165\u5386\u53f2\u8bb0\u5f55\uff0c\u4e5f\u53ef\u4ee5\u8bbf\u95ee\u4e13\u7528\u7684\u5386\u53f2\u8bb0\u5f55\u9875\u9762\u3002",
    faqExport: "\u5982\u4f55\u5bfc\u51fa\u6211\u7684\u8ba1\u7b97\u7ed3\u679c\uff1f",
    faqExportAns:
      "\u70b9\u51fb\u5bfc\u51fa\u83dc\u5355\u6309\u94ae\u53ef\u4ee5 CSV\u3001JSON \u6216 PDF \u683c\u5f0f\u5bfc\u51fa\u3002CSV \u548c JSON \u9009\u9879\u4f1a\u7acb\u5373\u4e0b\u8f7d\u60a8\u7684\u6570\u636e\u3002PDF \u5bfc\u51fa\u4f1a\u5c06\u8ba1\u7b97\u7ed3\u679c\u6355\u83b7\u4e3a\u683c\u5f0f\u5316\u6587\u6863\u3002",
    faqTheme: "\u5982\u4f55\u5728\u6d45\u8272\u548c\u6df1\u8272\u6a21\u5f0f\u4e4b\u95f4\u5207\u6362\uff1f",
    faqThemeAns:
      "\u70b9\u51fb\u9876\u90e8\u7684\u4e3b\u9898\u5207\u6362\u6309\u94ae\u3002\u60a8\u53ef\u4ee5\u9009\u62e9\u6d45\u8272\u3001\u6df1\u8272\u6216\u8ddf\u968f\u7cfb\u7edf\u8bbe\u7f6e\u3002",
    faqLanguage: "\u5982\u4f55\u5207\u6362\u8bed\u8a00\uff1f",
    faqLanguageAns:
      "\u70b9\u51fb\u9876\u90e8\u7684\u8bed\u8a00\u6309\u94ae\u53ef\u4ee5\u5728\u82f1\u8bed\u548c\u4e2d\u6587\u4e4b\u95f4\u5207\u6362\u3002",
    faqMobile: "\u5982\u4f55\u5728\u624b\u673a\u4e0a\u4f7f\u7528\uff1f",
    faqMobileAns:
      "\u5e94\u7528\u5b8c\u5168\u54cd\u5e94\u5f0f\u3002\u5728\u79fb\u52a8\u8bbe\u5907\u4e0a\uff0c\u5e95\u90e8\u5bfc\u822a\u4ec5\u4fdd\u7559\u9996\u9875\u548c\u5386\u53f2\u8bb0\u5f55\u4e24\u4e2a\u5e38\u7528\u5165\u53e3\uff1b\u8fdb\u5165\u9996\u9875\u5373\u53ef\u6d4f\u89c8\u5b8c\u6574\u8ba1\u7b97\u5668\u76ee\u5f55\u3002",
    faqPrivacy: "\u6211\u7684\u6570\u636e\u662f\u5426\u5b58\u50a8\u5728\u670d\u52a1\u5668\u4e0a\uff1f",
    faqPrivacyAns:
      "\u4e0d\u4f1a\u3002\u6240\u6709\u8ba1\u7b97\u5386\u53f2\u90fd\u5b58\u50a8\u5728\u6d4f\u89c8\u5668\u672c\u5730\u5b58\u50a8\u4e2d\u3002\u4e0d\u4f1a\u5411\u4efb\u4f55\u670d\u52a1\u5668\u53d1\u9001\u6570\u636e\u3002\u60a8\u53ef\u4ee5\u968f\u65f6\u4ece\u8bbe\u7f6e\u9875\u9762\u5bfc\u51fa\u6216\u6e05\u9664\u5386\u53f2\u8bb0\u5f55\u3002",
  },
  export: {
    title: "导出",
    csv: "导出 CSV",
    json: "导出 JSON",
    pdf: "导出 PDF",
    noData: "没有可导出的数据",
    csvSuccess: "CSV 导出成功",
    jsonSuccess: "JSON 导出成功",
    csvError: "CSV 导出失败",
    jsonError: "JSON 导出失败",
    pdfSuccess: "PDF 导出成功",
    pdfError: "PDF 导出失败",
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
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const saved = safeGetItem(LANGUAGE_KEY);
    if (saved === "en" || saved === "zh") {
      queueMicrotask(() => setLanguage(saved));
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    safeSetItem(LANGUAGE_KEY, lang);
  };

  const currentDictionary = dictionaries[language];

  // Client-side: reflect language on the root HTML element for accessibility and i18n tooling
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  // Helper to get nested values like "nav.core.title"
  const t = (path: string): string => {
    const keys = path.split(".");
    let current: unknown = currentDictionary;
    for (const key of keys) {
      if (typeof current !== "object" || current === null || (current as Record<string, unknown>)[key] === undefined) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`Translation missing for key: ${path} in language: ${language}`);
        }
        return path;
      }
      current = (current as Record<string, unknown>)[key];
    }
    return typeof current === "string" ? current : path;
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
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export type TranslationKey = NestedKeyOf<Translations>;
