"use client";

import { useSyncExternalStore } from "react";
import { useLanguage } from "@/lib/i18n";
import { CURRENCY_CHANGED_EVENT, CURRENCY_KEY, DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/lib/constants";
import { safeGetItem } from "@/lib/storage";

function getCurrencySnapshot() {
  const storedCurrency = safeGetItem(CURRENCY_KEY);
  return SUPPORTED_CURRENCIES.includes(storedCurrency as (typeof SUPPORTED_CURRENCIES)[number])
    ? storedCurrency!
    : DEFAULT_CURRENCY;
}

function subscribeToCurrency(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === CURRENCY_KEY) onStoreChange();
  };

  window.addEventListener(CURRENCY_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CURRENCY_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

// Simple hook to provide locale-aware formatting helpers based on current language
export function useLocaleFormat() {
  const { language } = useLanguage();

  const locale = language === "zh" ? "zh-CN" : "en-US";
  const currency = useSyncExternalStore(subscribeToCurrency, getCurrencySnapshot, () => DEFAULT_CURRENCY);

  function formatCurrencyLocale(value: number, locOverride?: string) {
    const loc = locOverride ?? locale;
    return new Intl.NumberFormat(loc, { style: "currency", currency }).format(value);
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
