import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLocaleFormat } from "@/hooks/use-locale-format";
import { LanguageProvider, useLanguage } from "@/lib/i18n";
import { CURRENCY_CHANGED_EVENT, CURRENCY_KEY, LANGUAGE_KEY } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

function CurrencyProbe() {
  const { formatCurrencyLocale } = useLocaleFormat();
  return <output data-testid="locale-currency">{formatCurrencyLocale(1234.5)}</output>;
}

function GenericCurrencyProbe() {
  useLanguage();
  return <output data-testid="generic-currency">{formatCurrency(1234.5)}</output>;
}

function LanguageProbe() {
  const { language } = useLanguage();
  return <output data-testid="language">{language}</output>;
}

describe("useLocaleFormat", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.finCalcHydrated;
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("removes invalid persisted language and currency values", async () => {
    window.localStorage.setItem(LANGUAGE_KEY, "fr");
    window.localStorage.setItem(CURRENCY_KEY, "BTC");
    render(
      <LanguageProvider>
        <LanguageProbe />
        <CurrencyProbe />
      </LanguageProvider>
    );

    expect(await screen.findByText("en")).toBeInTheDocument();
    expect(
      await screen.findByText(new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(1234.5))
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(LANGUAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(CURRENCY_KEY)).toBeNull();
  });

  it("replaces invalid locale preferences when removal is blocked and accepts later updates", async () => {
    window.localStorage.setItem(LANGUAGE_KEY, "fr");
    window.localStorage.setItem(CURRENCY_KEY, "BTC");
    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function removeItem(this: Storage, key) {
      if (key === LANGUAGE_KEY || key === CURRENCY_KEY) {
        throw new DOMException("Removal blocked", "SecurityError");
      }
      return originalRemoveItem.call(this, key);
    });
    render(
      <LanguageProvider>
        <LanguageProbe />
        <CurrencyProbe />
      </LanguageProvider>
    );

    expect(await screen.findByText("en")).toBeInTheDocument();
    expect(
      await screen.findByText(new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(1234.5))
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(window.localStorage.getItem(LANGUAGE_KEY)).toBe("en");
      expect(window.localStorage.getItem(CURRENCY_KEY)).toBe("USD");
    });

    act(() => {
      window.localStorage.setItem(LANGUAGE_KEY, "zh");
      window.localStorage.setItem(CURRENCY_KEY, "EUR");
      window.dispatchEvent(new StorageEvent("storage", { key: LANGUAGE_KEY, newValue: "zh" }));
      window.dispatchEvent(new StorageEvent("storage", { key: CURRENCY_KEY, newValue: "EUR" }));
    });
    expect(screen.getByText("zh")).toBeInTheDocument();
    expect(
      screen.getByText(new Intl.NumberFormat("zh-CN", { style: "currency", currency: "EUR" }).format(1234.5))
    ).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: LANGUAGE_KEY, newValue: "fr" }));
      window.dispatchEvent(new StorageEvent("storage", { key: CURRENCY_KEY, newValue: "BTC" }));
    });
    expect(screen.getByText("zh")).toBeInTheDocument();
    expect(
      screen.getByText(new Intl.NumberFormat("zh-CN", { style: "currency", currency: "EUR" }).format(1234.5))
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(LANGUAGE_KEY)).toBe("zh");
    expect(window.localStorage.getItem(CURRENCY_KEY)).toBe("EUR");

    act(() => {
      window.localStorage.setItem(LANGUAGE_KEY, "fr");
      window.localStorage.setItem(CURRENCY_KEY, "BTC");
      window.dispatchEvent(new StorageEvent("storage", { key: LANGUAGE_KEY, newValue: "fr" }));
      window.dispatchEvent(new StorageEvent("storage", { key: CURRENCY_KEY, newValue: "BTC" }));
    });
    expect(screen.getByText("en")).toBeInTheDocument();
    expect(
      screen.getByText(new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(1234.5))
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(LANGUAGE_KEY)).toBe("en");
    expect(window.localStorage.getItem(CURRENCY_KEY)).toBe("USD");
  });

  it("keeps safe locale fallbacks when removal and replacement are both blocked", async () => {
    window.localStorage.setItem(LANGUAGE_KEY, "fr");
    window.localStorage.setItem(CURRENCY_KEY, "BTC");
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("Removal blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Write blocked", "SecurityError");
    });
    render(
      <LanguageProvider>
        <LanguageProbe />
        <CurrencyProbe />
      </LanguageProvider>
    );

    expect(await screen.findByText("en")).toBeInTheDocument();
    expect(
      await screen.findByText(new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(1234.5))
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(LANGUAGE_KEY)).toBe("fr");
    expect(window.localStorage.getItem(CURRENCY_KEY)).toBe("BTC");
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

  it("follows language changes made in another tab", async () => {
    render(
      <LanguageProvider>
        <LanguageProbe />
      </LanguageProvider>
    );

    expect(await screen.findByText("en")).toBeInTheDocument();
    window.localStorage.setItem(LANGUAGE_KEY, "zh");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: LANGUAGE_KEY, newValue: "zh" }));
    });

    expect(screen.getByText("zh")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("zh");
  });

  it("returns language and currency formatters to defaults after another tab clears localStorage", async () => {
    window.localStorage.setItem(LANGUAGE_KEY, "zh");
    window.localStorage.setItem(CURRENCY_KEY, "EUR");
    render(
      <LanguageProvider>
        <LanguageProbe />
        <CurrencyProbe />
        <GenericCurrencyProbe />
      </LanguageProvider>
    );
    const eur = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "EUR" }).format(1234.5);
    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("zh");
      expect(screen.getByTestId("locale-currency")).toHaveTextContent(eur);
    });

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: window.sessionStorage }));
    });
    expect(screen.getByTestId("language")).toHaveTextContent("zh");
    expect(screen.getByTestId("locale-currency")).toHaveTextContent(eur);

    window.localStorage.clear();
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: window.localStorage }));
    });

    const localeUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(1234.5);
    const genericUsd = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      currencyDisplay: "narrowSymbol",
    }).format(1234.5);
    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("en");
      expect(screen.getByTestId("locale-currency")).toHaveTextContent(localeUsd);
      expect(screen.getByTestId("generic-currency")).toHaveTextContent(genericUsd);
    });
  });
});
