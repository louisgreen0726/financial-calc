import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
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
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, error: "Please enter a valid number" };
  }
  if (!isFinite(num)) {
    return { valid: false, error: "Number is too large or too small" };
  }
  return { valid: true, value: num };
}

export function validatePositive(value: string): { valid: boolean; value?: number; error?: string } {
  const result = validateNumber(value);
  if (!result.valid) return result;
  if (result.value! <= 0) {
    return { valid: false, error: "Value must be greater than 0" };
  }
  return result;
}

export function validateNonNegative(value: string): { valid: boolean; value?: number; error?: string } {
  const result = validateNumber(value);
  if (!result.valid) return result;
  if (result.value! < 0) {
    return { valid: false, error: "Value cannot be negative" };
  }
  return result;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
