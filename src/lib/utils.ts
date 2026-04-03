import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Locale-aware currency formatting
export function formatCurrency(value: number, locale?: string) {
  // Determine locale if not provided
  const determinedLocale =
    locale || (typeof window !== "undefined" ? (localStorage.getItem("app-language") ?? "en") : "en");
  const enLocale = determinedLocale === "zh" ? "zh-CN" : "en-US";
  const currency = determinedLocale === "zh" ? "CNY" : "USD";
  return new Intl.NumberFormat(enLocale, {
    style: "currency",
    currency,
  }).format(value);
}

// Locale-aware number formatting
export function formatNumber(value: number, maximumFractionDigits = 2, locale?: string) {
  const determinedLocale =
    locale || (typeof window !== "undefined" ? (localStorage.getItem("app-language") ?? "en") : "en");
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
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, error: "Please enter a valid number" };
  }
  if (!isFinite(num)) {
    return { valid: false, error: "Number is too large" };
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
