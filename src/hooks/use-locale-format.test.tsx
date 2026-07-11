import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useLocaleFormat } from "@/hooks/use-locale-format";
import { LanguageProvider, useLanguage } from "@/lib/i18n";
import { CURRENCY_CHANGED_EVENT, CURRENCY_KEY } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

function CurrencyProbe() {
  const { formatCurrencyLocale } = useLocaleFormat();
  return <output>{formatCurrencyLocale(1234.5)}</output>;
}

function GenericCurrencyProbe() {
  useLanguage();
  return <output>{formatCurrency(1234.5)}</output>;
}

describe("useLocaleFormat", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.finCalcHydrated;
  });

  it("hydrates from persisted currency and reacts to same-tab currency changes", async () => {
    window.localStorage.setItem(CURRENCY_KEY, "EUR");
    render(
      <LanguageProvider>
        <CurrencyProbe />
      </LanguageProvider>
    );

    expect(
      await screen.findByText(new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(1234.5))
    ).toBeInTheDocument();

    act(() => {
      window.localStorage.setItem(CURRENCY_KEY, "GBP");
      window.dispatchEvent(new CustomEvent(CURRENCY_CHANGED_EVENT));
    });

    expect(
      screen.getByText(new Intl.NumberFormat("en-US", { style: "currency", currency: "GBP" }).format(1234.5))
    ).toBeInTheDocument();
  });

  it("rerenders generic formatters after the persisted settings boundary hydrates", async () => {
    window.localStorage.setItem(CURRENCY_KEY, "EUR");
    render(
      <LanguageProvider>
        <GenericCurrencyProbe />
      </LanguageProvider>
    );

    const expected = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      currencyDisplay: "narrowSymbol",
    }).format(1234.5);
    expect(await screen.findByText(expected)).toBeInTheDocument();

    window.localStorage.setItem(CURRENCY_KEY, "GBP");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: CURRENCY_KEY }));
    });
    const updated = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "GBP",
      currencyDisplay: "narrowSymbol",
    }).format(1234.5);
    expect(await screen.findByText(updated)).toBeInTheDocument();
  });
});
