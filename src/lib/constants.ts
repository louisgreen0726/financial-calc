/**
 * Application constants
 */

// Time constants
export const MONTHS_PER_YEAR = 12;
export const TRADING_DAYS_PER_YEAR = 252;
export const WEEKS_PER_YEAR = 52;
export const QUARTERS_PER_YEAR = 4;
export const DAYS_PER_YEAR = 365;

// Bond frequencies
export const SEMIANNUAL_FREQUENCY = 2;
export const QUARTERLY_FREQUENCY = 4;
export const MONTHLY_FREQUENCY = 12;
export const ANNUAL_FREQUENCY = 1;

// Chart constants
export const CHART_DEFAULT_HEIGHT = 300;
export const CHART_ANIMATION_DURATION = 500;
export const CHART_MAX_POINTS = 100;

// Calculation limits
export const MAX_PERIODS = 600; // 50 years monthly
export const MAX_DISPLAY_ROWS = 100;
export const MAX_ITERATIONS = 1000; // For iterative calculations

// Validation limits
export const MAX_INTEREST_RATE = 100; // 100%
export const MIN_INTEREST_RATE = -100; // -100%
export const MAX_YEARS = 100;
export const MAX_VOLATILITY = 500; // 500%

// Display formats
export const CURRENCY_LOCALE = "en-US";
export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_DECIMAL_PLACES = 2;
export const PERCENTAGE_DECIMAL_PLACES = 2;

// LocalStorage keys
export const STORAGE_PREFIX = "financial-calc-";
export const HISTORY_KEY = `${STORAGE_PREFIX}history`;
export const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;
export const DRAFTS_KEY = `${STORAGE_PREFIX}drafts`;
export const PENDING_RESTORE_KEY = `${STORAGE_PREFIX}pending-restore`;
export const LANGUAGE_KEY = `${STORAGE_PREFIX}language`;

// URL parameters
export const URL_PARAM_PREFIX = "fc_";

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  CALCULATE: { key: "Enter", ctrlKey: false, description: "Calculate result" },
  CLEAR: { key: "Escape", ctrlKey: false, description: "Clear all inputs" },
  COPY: { key: "c", ctrlKey: true, description: "Copy result to clipboard" },
  RESET: { key: "r", ctrlKey: true, description: "Reset to defaults" },
  HELP: { key: "?", ctrlKey: false, description: "Show keyboard shortcuts" },
  SAVE: { key: "s", ctrlKey: true, description: "Save calculation" },
} as const;

// History limits
export const MAX_HISTORY_ITEMS = 50;
export const HISTORY_EXPIRY_DAYS = 30;

// Page default values
export const TVM_DEFAULTS = {
  rate: "5",
  nper: "10",
  pmt: "0",
  pv: "-1000",
  fv: "0",
  type: "0" as const,
};

export const EQUITY_DEFAULTS = {
  capm: { rf: "3.5", beta: "1.2", rm: "10" },
  wacc: { equity: "1000000", debt: "500000", costEquity: "12", costDebt: "6", taxRate: "25" },
  ddm: { div: "2.5", growth: "4", reqReturn: "9" },
};

export const BOND_DEFAULTS = {
  faceValue: "1000",
  couponRate: "5",
  years: "10",
  ytm: "4",
  frequency: "2",
};

export const MACRO_DEFAULTS = {
  inflation: { startPrice: "100", endPrice: "150", years: "10" },
  purchasingPower: { amount: "100000", rate: "3", years: "20" },
  realInterest: { nominalRate: "5", inflationRate: "2" },
  cpi: { amount: "1000", fromCPI: "100", toCPI: "125" },
  ppp: { domesticPrice: "5.81", foreignPrice: "650" },
};

export const LOAN_DEFAULTS = {
  principal: "100000",
  annualRate: "5",
  years: "30",
};

export const PORTFOLIO_DEFAULTS = {
  riskFreeRate: 3.0,
  correlation: 0.2,
  simulations: 2000,
};

export const RISK_DEFAULTS = {
  stdDevRange: { min: -4, max: 4, step: 0.1 },
};
