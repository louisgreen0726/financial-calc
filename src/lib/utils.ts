import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY_KEY, DEFAULT_CURRENCY, LANGUAGE_KEY, SUPPORTED_CURRENCIES } from "@/lib/constants";
import { parseOptionalNumber } from "@/lib/input-utils";
import { safeGetItem } from "@/lib/storage";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function canReadPersistedFormatSettings() {
  return typeof document !== "undefined" && document.documentElement.dataset.finCalcHydrated === "true";
}

// Locale-aware currency formatting
export function formatCurrency(value: number, locale?: string) {
  const canReadPersistedSettings = canReadPersistedFormatSettings();
  // Determine locale if not provided
  const determinedLocale = locale || (canReadPersistedSettings ? safeGetItem(LANGUAGE_KEY) : null) || "en";
  const enLocale = determinedLocale === "zh" ? "zh-CN" : "en-US";
  const storedCurrency = canReadPersistedSettings ? safeGetItem(CURRENCY_KEY) : null;
  const currency = SUPPORTED_CURRENCIES.includes(storedCurrency as (typeof SUPPORTED_CURRENCIES)[number])
    ? storedCurrency!
    : DEFAULT_CURRENCY;
  return new Intl.NumberFormat(enLocale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(value);
}

// Locale-aware number formatting
export function formatNumber(value: number, maximumFractionDigits = 2, locale?: string) {
  const determinedLocale = locale || (canReadPersistedFormatSettings() ? safeGetItem(LANGUAGE_KEY) : null) || "en";
  const enLocale = determinedLocale === "zh" ? "zh-CN" : "en-US";
  return new Intl.NumberFormat(enLocale, {
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function validateNumber(value: string): { valid: boolean; value?: number; error?: string } {
  // Treat empty input as a required field
  if (typeof value === "string" && value.trim() === "") {
    return { valid: false, error: "Required" };
  }
  const num = parseOptionalNumber(value);
  if (num === null) {
    return { valid: false, error: "Please enter a valid number" };
  }
  return { valid: true, value: num };
}

export function validatePositive(value: string): { valid: boolean; value?: number; error?: string } {
  const result = validateNumber(value);
  if (!result.valid) return result;
  if (result.value! <= 0) {
    return { valid: false, error: "Must be greater than 0" };
  }
  return result;
}

export function validateNonNegative(value: string): { valid: boolean; value?: number; error?: string } {
  const result = validateNumber(value);
  if (!result.valid) return result;
  if (result.value! < 0) {
    return { valid: false, error: "Cannot be negative" };
  }
  return result;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
