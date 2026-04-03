"use client";

import { useLanguage } from "@/lib/i18n";

// Simple hook to provide locale-aware formatting helpers based on current language
export function useLocaleFormat() {
  const { language } = useLanguage();

  const locale = language === "zh" ? "zh-CN" : "en-US";
  const currency = language === "zh" ? "CNY" : "USD";

  function formatCurrencyLocale(value: number, locOverride?: string) {
    const loc = locOverride ?? locale;
    const curr = loc.startsWith("zh") ? "CNY" : currency;
    return new Intl.NumberFormat(loc, { style: "currency", currency: curr }).format(value);
  }

  function formatNumberLocale(value: number, maximumFractionDigits = 2, locOverride?: string) {
    const loc = locOverride ?? locale;
    return new Intl.NumberFormat(loc, { maximumFractionDigits }).format(value);
  }

  return {
    formatCurrencyLocale,
    formatNumberLocale,
  };
}
