/**
 * Environment-aware logging utility
 * Suppresses debug/info in production, allows runtime level control
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

let currentLevel: LogLevel = process.env.NODE_ENV === "production" ? "warn" : "debug";

/**
 * Set the minimum log level. Messages below this level will be suppressed.
 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel];
}

export const logger = {
  debug: (...args: unknown[]): void => {
    if (shouldLog("debug")) console.debug(...args);
  },
  info: (...args: unknown[]): void => {
    if (shouldLog("info")) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    if (shouldLog("warn")) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    if (shouldLog("error")) console.error(...args);
  },
};
