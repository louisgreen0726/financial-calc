"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/i18n";
import { Moon, Sun, Monitor, Globe, Trash2, Download, Coins } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CURRENCY_KEY,
  DEFAULT_CURRENCY,
  HISTORY_KEY,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/constants";
import { safeGetItem, safeRemoveItem, safeSetItem } from "@/lib/storage";
import { useTheme } from "@/components/theme-provider";
import { ConfirmDialog } from "@/components/confirm-dialog";

const CURRENCY_NAMES: Record<SupportedCurrency, string> = {
  USD: "US Dollar",
  CNY: "Chinese Yuan",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
};

function isSupportedCurrency(value: string | null): value is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(value as SupportedCurrency);
}

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [currency, setCurrency] = useState<SupportedCurrency>(() => {
    const saved = safeGetItem(CURRENCY_KEY);
    return isSupportedCurrency(saved) ? saved : DEFAULT_CURRENCY;
  });
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const handleSetCurrency = (nextCurrency: SupportedCurrency) => {
    setCurrency(nextCurrency);
    safeSetItem(CURRENCY_KEY, nextCurrency);
    window.dispatchEvent(new CustomEvent("financial-calc-currency-changed", { detail: nextCurrency }));
    toast.success(`${t("settings.currency")}: ${nextCurrency}`);
  };

  const handleClearHistory = () => {
    safeRemoveItem(HISTORY_KEY);
    window.dispatchEvent(new CustomEvent("financial-calc-history-changed"));
    toast.success(t("history.cleared") || "History cleared");
  };

  const handleExportHistory = () => {
    const history = safeGetItem(HISTORY_KEY);
    if (!history) {
      toast.error(t("export.noData") || "No data to export");
      return;
    }
    const blob = new Blob([history], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "calculation-history.json");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t("export.jsonSuccess") || "History exported");
  };

  return (
    <div className="space-y-6 w-full md:max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("settings.title") || "Settings"}</h1>
        <p className="text-muted-foreground mt-2">{t("settings.customizeExperience")}</p>
      </div>

      {/* Appearance */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            {t("settings.appearance")}
          </CardTitle>
          <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p id="settings-theme-label" className="text-sm font-medium leading-none">
              {t("settings.theme")}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-labelledby="settings-theme-label">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className={cn("min-h-11 justify-start gap-2", theme === "light" && "bg-primary")}
              >
                <Sun className="h-4 w-4" />
                {t("settings.light")}
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className={cn("min-h-11 justify-start gap-2", theme === "dark" && "bg-primary")}
              >
                <Moon className="h-4 w-4" />
                {t("settings.dark")}
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className={cn("min-h-11 justify-start gap-2", theme === "system" && "bg-primary")}
              >
                <Monitor className="h-4 w-4" />
                {t("settings.system")}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p id="settings-language-label" className="text-sm font-medium leading-none">
              {t("settings.language")}
            </p>
            <div
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              role="group"
              aria-labelledby="settings-language-label"
            >
              <Button
                variant={language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("en")}
                className={cn("min-h-11 justify-start gap-2", language === "en" && "bg-primary")}
              >
                <Globe className="h-4 w-4" />
                English
              </Button>
              <Button
                variant={language === "zh" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("zh")}
                className={cn("min-h-11 justify-start gap-2", language === "zh" && "bg-primary")}
              >
                <Globe className="h-4 w-4" />
                中文
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <p id="settings-currency-label" className="text-sm font-medium leading-none">
                {t("settings.currency")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t("settings.currencyDesc")}</p>
            </div>
            <div
              className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
              role="group"
              aria-labelledby="settings-currency-label"
            >
              {SUPPORTED_CURRENCIES.map((code) => (
                <Button
                  key={code}
                  variant={currency === code ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSetCurrency(code)}
                  className={cn("min-h-11 justify-start gap-2", currency === code && "bg-primary")}
                >
                  <Coins className="h-4 w-4" />
                  <span className="font-semibold">{code}</span>
                  <span className="truncate text-xs opacity-80">{CURRENCY_NAMES[code]}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("settings.dataManagement")}
          </CardTitle>
          <CardDescription>{t("settings.dataManagementDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="outline" size="sm" onClick={handleExportHistory} className="gap-2">
              <Download className="h-4 w-4" />
              {t("settings.exportHistoryJson")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearDialogOpen(true)}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              {t("settings.clearAllHistory")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>{t("settings.about")}</CardTitle>
          <CardDescription>{t("settings.aboutDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>FinCalc Pro</strong> - {t("settings.title")}
          </p>
          <p>{t("settings.version")}</p>
          <p>{t("settings.description")}</p>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title={t("history.confirmClear") || "Clear all calculation history?"}
        description={t("settings.dataManagementDesc")}
        confirmLabel={t("settings.clearAllHistory")}
        destructive
        onConfirm={handleClearHistory}
      />
    </div>
  );
}
