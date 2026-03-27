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
