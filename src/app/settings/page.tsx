"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/i18n";
import { Moon, Sun, Monitor, Globe, Trash2, Download, Coins, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CURRENCY_CHANGED_EVENT,
  CURRENCY_KEY,
  DEFAULT_CURRENCY,
  FAVORITES_CLEAR_GENERATION_KEY,
  FAVORITES_CHANGED_EVENT,
  FAVORITES_KEY,
  HISTORY_CHANGED_EVENT,
  HISTORY_CLEAR_GENERATION_KEY,
  HISTORY_KEY,
  LANGUAGE_KEY,
  SIDEBAR_COLLAPSED_KEY,
  SIDEBAR_PREFERENCE_CHANGED_EVENT,
  SUPPORTED_CURRENCIES,
  THEME_KEY,
  type SupportedCurrency,
} from "@/lib/constants";
import {
  isLocalStorageEventForKey,
  safeGetItem,
  safeGetJSON,
  safeRemoveItem,
  safeSetItem,
  safeSetJSON,
} from "@/lib/storage";
import { nextStorageGeneration, withStorageKeyLock } from "@/lib/storage-coordinator";
import { useTheme } from "@/components/theme-provider";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useExport } from "@/hooks/use-export";
import {
  createCalculationHistoryEnvelope,
  MAX_HISTORY_IMPORT_BYTES,
  parseStoredCalculationHistory,
  prepareCalculationHistoryImport,
  type HistoryImportSummary,
} from "@/lib/calculation-history";
import {
  createWorkspaceBackup,
  MAX_WORKSPACE_BACKUP_BYTES,
  normalizeWorkspaceFavoriteIds,
  parseWorkspaceBackup,
  prepareWorkspaceBackupRestore,
  type ParsedWorkspaceBackup,
  type WorkspaceBackupError,
  type WorkspaceRestoreSummary,
} from "@/lib/workspace-backup";

interface PendingHistoryImport {
  source: unknown;
  summary: HistoryImportSummary;
}

interface PendingWorkspaceImport {
  parsed: ParsedWorkspaceBackup;
  summary: WorkspaceRestoreSummary;
}

function isSupportedCurrency(value: string | null): value is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(value as SupportedCurrency);
}

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { exportToJSON: exportHistoryToJSON } = useExport({ filename: "calculation-history" });
  const { exportToJSON: exportWorkspaceToJSON } = useExport({ filename: "financial-calc-workspace", jsonSpace: 0 });
  const [currency, setCurrency] = useState<SupportedCurrency>(DEFAULT_CURRENCY);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingHistoryImport | null>(null);
  const [workspaceImportDialogOpen, setWorkspaceImportDialogOpen] = useState(false);
  const [pendingWorkspaceImport, setPendingWorkspaceImport] = useState<PendingWorkspaceImport | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const workspaceImportInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncCurrency = () => {
      const saved = safeGetItem(CURRENCY_KEY);
      setCurrency(isSupportedCurrency(saved) ? saved : DEFAULT_CURRENCY);
    };
    const handleStorage = (event: StorageEvent) => {
      if (isLocalStorageEventForKey(event, CURRENCY_KEY)) syncCurrency();
    };

    queueMicrotask(syncCurrency);
    window.addEventListener(CURRENCY_CHANGED_EVENT, syncCurrency);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(CURRENCY_CHANGED_EVENT, syncCurrency);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleSetCurrency = (nextCurrency: SupportedCurrency) => {
    const persisted = safeSetItem(CURRENCY_KEY, nextCurrency);
    if (persisted) {
      setCurrency(nextCurrency);
      window.dispatchEvent(new CustomEvent(CURRENCY_CHANGED_EVENT, { detail: nextCurrency }));
      toast.success(`${t("settings.currency")}: ${nextCurrency}`);
    } else {
      toast.error(t("common.storageOperationFailed"));
    }
  };

  const handleSetTheme = (nextTheme: "light" | "dark" | "system") => {
    if (!setTheme(nextTheme)) {
      toast.error(t("common.changeNotPersisted"));
    }
  };

  const handleSetLanguage = (nextLanguage: "en" | "zh") => {
    if (!setLanguage(nextLanguage)) {
      toast.error(t("common.changeNotPersisted"));
    }
  };

  const handleClearHistory = async () => {
    try {
      const [historyCleared, favoritesCleared] = await Promise.all([
        withStorageKeyLock(HISTORY_KEY, () => {
          const nextGeneration = nextStorageGeneration(safeGetItem(HISTORY_CLEAR_GENERATION_KEY));
          return safeSetItem(HISTORY_CLEAR_GENERATION_KEY, String(nextGeneration)) && safeRemoveItem(HISTORY_KEY);
        }),
        withStorageKeyLock(FAVORITES_KEY, () => {
          const nextGeneration = nextStorageGeneration(safeGetItem(FAVORITES_CLEAR_GENERATION_KEY));
          return safeSetItem(FAVORITES_CLEAR_GENERATION_KEY, String(nextGeneration)) && safeRemoveItem(FAVORITES_KEY);
        }),
      ]);
      window.dispatchEvent(new CustomEvent(HISTORY_CHANGED_EVENT));
      window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
      if (historyCleared && favoritesCleared) {
        toast.success(t("history.cleared"));
      } else {
        toast.error(t("common.storageOperationFailed"));
      }
    } catch {
      toast.error(t("common.storageOperationFailed"));
    }
  };

  const handleExportHistory = () => {
    const stored = safeGetJSON<unknown>(HISTORY_KEY, null);
    if (stored === null) {
      toast.error(t("export.noData"));
      return;
    }
    const history = parseStoredCalculationHistory(stored);
    if (history.unsupportedVersion) {
      toast.error(t("settings.importHistoryUnsupported"));
      return;
    }
    exportHistoryToJSON(createCalculationHistoryEnvelope(history.items));
  };

  const handleExportWorkspace = () => {
    const history = parseStoredCalculationHistory(safeGetJSON<unknown>(HISTORY_KEY, []));
    if (history.unsupportedVersion) {
      toast.error(t("settings.importWorkspaceUnsupported"));
      return;
    }

    try {
      const sidebarPreference = safeGetJSON<unknown>(SIDEBAR_COLLAPSED_KEY, false);
      const storedLanguage = safeGetItem(LANGUAGE_KEY);
      const storedTheme = safeGetItem(THEME_KEY);
      const storedCurrency = safeGetItem(CURRENCY_KEY);
      const backup = createWorkspaceBackup({
        history: history.items,
        favorites: safeGetJSON<unknown>(FAVORITES_KEY, []),
        preferences: {
          language: storedLanguage === "en" || storedLanguage === "zh" ? storedLanguage : language,
          theme: storedTheme === "light" || storedTheme === "dark" || storedTheme === "system" ? storedTheme : theme,
          currency: isSupportedCurrency(storedCurrency) ? storedCurrency : currency,
          sidebarCollapsed: typeof sidebarPreference === "boolean" ? sidebarPreference : false,
        },
      });
      exportWorkspaceToJSON(backup);
    } catch {
      toast.error(t("settings.exportWorkspaceError"));
    }
  };

  const getImportErrorMessage = (error: "invalid" | "unsupported-version" | "too-many-items") => {
    if (error === "unsupported-version") return t("settings.importHistoryUnsupported");
    if (error === "too-many-items") return t("settings.importHistoryTooLarge");
    return t("settings.importHistoryInvalid");
  };

  const getWorkspaceImportErrorMessage = (error: WorkspaceBackupError) => {
    if (error === "unsupported-version") return t("settings.importWorkspaceUnsupported");
    if (error === "too-large") return t("settings.importWorkspaceTooLarge");
    if (error === "too-many-items") return t("settings.importWorkspaceTooManyItems");
    return t("settings.importWorkspaceInvalid");
  };

  const formatImportSummary = (summary: HistoryImportSummary) =>
    [
      `${summary.added} ${t("settings.historyItemsAdded")}`,
      `${summary.updated} ${t("settings.historyItemsUpdated")}`,
      `${summary.duplicates} ${t("settings.historyItemsDuplicate")}`,
      `${summary.skipped} ${t("settings.historyItemsSkipped")}`,
      `${summary.total} ${t("settings.historyItemsTotal")}`,
    ].join(" · ");

  const formatWorkspaceImportSummary = (summary: WorkspaceRestoreSummary) =>
    [
      formatImportSummary(summary),
      `${summary.favoritesAdded} ${t("settings.workspaceFavoritesAdded")}`,
      `${summary.favoritesTotal} ${t("settings.workspaceFavoritesTotal")}`,
      t("settings.workspacePreferencesReplace"),
    ].join(" · ");

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (file.size > MAX_HISTORY_IMPORT_BYTES) {
      toast.error(t("settings.importHistoryTooLarge"));
      return;
    }

    try {
      const source = JSON.parse(await file.text()) as unknown;
      const current = parseStoredCalculationHistory(safeGetJSON<unknown>(HISTORY_KEY, []));
      if (current.unsupportedVersion) {
        toast.error(t("settings.importHistoryUnsupported"));
        return;
      }
      const prepared = prepareCalculationHistoryImport(source, current.items);
      if (!prepared.ok) {
        toast.error(getImportErrorMessage(prepared.error));
        return;
      }
      if (prepared.summary.added + prepared.summary.updated === 0) {
        toast.info(t("settings.importHistoryNoChanges"));
        return;
      }

      setPendingImport({ source, summary: prepared.summary });
      setImportDialogOpen(true);
    } catch {
      toast.error(t("settings.importHistoryInvalid"));
    }
  };

  const handleWorkspaceImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (file.size > MAX_WORKSPACE_BACKUP_BYTES) {
      toast.error(t("settings.importWorkspaceTooLarge"));
      return;
    }

    try {
      const source = JSON.parse(await file.text()) as unknown;
      const parsed = parseWorkspaceBackup(source, { byteLength: file.size });
      if (!parsed.ok) {
        toast.error(getWorkspaceImportErrorMessage(parsed.error));
        return;
      }
      const current = parseStoredCalculationHistory(safeGetJSON<unknown>(HISTORY_KEY, []));
      if (current.unsupportedVersion) {
        toast.error(t("settings.importHistoryUnsupported"));
        return;
      }
      const prepared = prepareWorkspaceBackupRestore(
        parsed.value,
        current.items,
        safeGetJSON<unknown>(FAVORITES_KEY, [])
      );
      if (!prepared.ok) {
        toast.error(getWorkspaceImportErrorMessage(prepared.error));
        return;
      }

      setPendingWorkspaceImport({ parsed: parsed.value, summary: prepared.summary });
      setWorkspaceImportDialogOpen(true);
    } catch {
      toast.error(t("settings.importWorkspaceInvalid"));
    }
  };

  const handleImportHistory = async () => {
    const source = pendingImport?.source;
    if (source === undefined) return;

    try {
      const outcome = await withStorageKeyLock(HISTORY_KEY, () => {
        const current = parseStoredCalculationHistory(safeGetJSON<unknown>(HISTORY_KEY, []));
        if (current.unsupportedVersion) {
          return { ok: false as const, error: "unsupported-version" as const };
        }
        const prepared = prepareCalculationHistoryImport(source, current.items);
        if (!prepared.ok) return prepared;
        if (prepared.summary.added + prepared.summary.updated === 0) return prepared;
        if (!safeSetJSON(HISTORY_KEY, createCalculationHistoryEnvelope(prepared.items))) {
          return { ok: false as const, error: "storage" as const };
        }
        return prepared;
      });

      if (!outcome.ok) {
        toast.error(
          outcome.error === "storage" ? t("common.storageOperationFailed") : getImportErrorMessage(outcome.error)
        );
      } else if (outcome.summary.added + outcome.summary.updated === 0) {
        toast.info(t("settings.importHistoryNoChanges"));
      } else {
        window.dispatchEvent(new CustomEvent(HISTORY_CHANGED_EVENT));
        toast.success(`${t("settings.importHistorySuccess")}: ${formatImportSummary(outcome.summary)}`);
      }
    } catch {
      toast.error(t("common.storageOperationFailed"));
    }
  };

  const handleImportWorkspace = async () => {
    const parsed = pendingWorkspaceImport?.parsed;
    if (!parsed) return;

    const failedSections: string[] = [];

    try {
      const historyOutcome = await withStorageKeyLock(HISTORY_KEY, () => {
        const current = parseStoredCalculationHistory(safeGetJSON<unknown>(HISTORY_KEY, []));
        if (current.unsupportedVersion) {
          return { ok: false as const };
        }
        const prepared = prepareWorkspaceBackupRestore(parsed, current.items, safeGetJSON<unknown>(FAVORITES_KEY, []));
        if (!prepared.ok || !safeSetJSON(HISTORY_KEY, prepared.history)) {
          return { ok: false as const };
        }
        return { ok: true as const };
      });
      if (historyOutcome.ok) {
        window.dispatchEvent(new CustomEvent(HISTORY_CHANGED_EVENT));
      } else {
        failedSections.push(t("history.title"));
      }
    } catch {
      failedSections.push(t("history.title"));
    }

    try {
      const favoritesPersisted = await withStorageKeyLock(FAVORITES_KEY, () => {
        const currentHistory = parseStoredCalculationHistory(safeGetJSON<unknown>(HISTORY_KEY, []));
        if (currentHistory.unsupportedVersion) return false;
        const finalHistoryIds = new Set(currentHistory.items.map((item) => item.id));
        const storedFavorites = safeGetJSON<unknown>(FAVORITES_KEY, []);
        const requested = [...(Array.isArray(storedFavorites) ? storedFavorites : []), ...parsed.backup.favorites];
        return safeSetJSON(FAVORITES_KEY, normalizeWorkspaceFavoriteIds(requested, finalHistoryIds));
      });
      if (favoritesPersisted) {
        window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
      } else {
        failedSections.push(t("history.favorites"));
      }
    } catch {
      failedSections.push(t("history.favorites"));
    }

    const { preferences } = parsed.backup;
    try {
      if (!setLanguage(preferences.language)) failedSections.push(t("settings.language"));
    } catch {
      failedSections.push(t("settings.language"));
    }
    try {
      if (!setTheme(preferences.theme)) failedSections.push(t("settings.theme"));
    } catch {
      failedSections.push(t("settings.theme"));
    }

    try {
      if (!safeSetItem(CURRENCY_KEY, preferences.currency)) throw new Error("Currency could not be persisted");
      setCurrency(preferences.currency);
      window.dispatchEvent(new CustomEvent(CURRENCY_CHANGED_EVENT, { detail: preferences.currency }));
    } catch {
      failedSections.push(t("settings.currency"));
    }

    try {
      if (!safeSetJSON(SIDEBAR_COLLAPSED_KEY, preferences.sidebarCollapsed)) {
        throw new Error("Sidebar preference could not be persisted");
      }
      window.dispatchEvent(new CustomEvent(SIDEBAR_PREFERENCE_CHANGED_EVENT));
    } catch {
      failedSections.push(t("settings.sidebarPreference"));
    }

    if (failedSections.length === 0) {
      toast.success(t("settings.importWorkspaceSuccess"));
    } else {
      toast.error(`${t("settings.importWorkspacePartial")}: ${failedSections.join(", ")}`);
    }
  };

  return (
    <div className="page-stack w-full max-w-4xl" data-tone="neutral">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("settings.title")}</h1>
          <p className="page-description">{t("settings.customizeExperience")}</p>
        </div>
      </div>

      {/* Appearance */}
      <Card>
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
                type="button"
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSetTheme("light")}
                aria-pressed={theme === "light"}
                className={cn("min-h-11 justify-start gap-2", theme === "light" && "bg-primary")}
              >
                <Sun className="h-4 w-4" />
                {t("settings.light")}
              </Button>
              <Button
                type="button"
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSetTheme("dark")}
                aria-pressed={theme === "dark"}
                className={cn("min-h-11 justify-start gap-2", theme === "dark" && "bg-primary")}
              >
                <Moon className="h-4 w-4" />
                {t("settings.dark")}
              </Button>
              <Button
                type="button"
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSetTheme("system")}
                aria-pressed={theme === "system"}
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
                type="button"
                variant={language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSetLanguage("en")}
                aria-pressed={language === "en"}
                className={cn("min-h-11 justify-start gap-2", language === "en" && "bg-primary")}
              >
                <Globe className="h-4 w-4" />
                English
              </Button>
              <Button
                type="button"
                variant={language === "zh" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSetLanguage("zh")}
                aria-pressed={language === "zh"}
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
                  type="button"
                  variant={currency === code ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSetCurrency(code)}
                  aria-pressed={currency === code}
                  className={cn("min-h-11 min-w-0 justify-start gap-2", currency === code && "bg-primary")}
                >
                  <Coins className="h-4 w-4 shrink-0" />
                  <span className="shrink-0 font-semibold">{code}</span>
                  <span className="min-w-0 truncate text-xs">{t(`settings.currencyNames.${code}`)}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("settings.dataManagement")}
          </CardTitle>
          <CardDescription>{t("settings.dataManagementDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-label={t("settings.importHistoryFile")}
            onChange={handleImportFile}
          />
          <input
            ref={workspaceImportInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-label={t("settings.importWorkspaceFile")}
            onChange={handleWorkspaceImportFile}
          />
          <div className="space-y-3">
            <p id="settings-history-data-label" className="text-sm font-medium leading-none">
              {t("settings.historyData")}
            </p>
            <div
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
              role="group"
              aria-labelledby="settings-history-data-label"
            >
              <Button variant="outline" size="sm" onClick={handleExportHistory} className="gap-2">
                <Download className="h-4 w-4" />
                {t("settings.exportHistoryJson")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => importInputRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" />
                {t("settings.importHistoryJson")}
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
          </div>
          <Separator />
          <div className="space-y-3">
            <p id="settings-workspace-data-label" className="text-sm font-medium leading-none">
              {t("settings.workspaceData")}
            </p>
            <div
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              role="group"
              aria-labelledby="settings-workspace-data-label"
            >
              <Button variant="outline" size="sm" onClick={handleExportWorkspace} className="gap-2">
                <Download className="h-4 w-4" />
                {t("settings.exportWorkspaceJson")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => workspaceImportInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {t("settings.importWorkspaceJson")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card variant="subtle">
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
        title={t("history.confirmClear")}
        description={t("settings.dataManagementDesc")}
        confirmLabel={t("settings.clearAllHistory")}
        destructive
        onConfirm={handleClearHistory}
      />
      <ConfirmDialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open);
          if (!open) setPendingImport(null);
        }}
        title={t("settings.importHistoryConfirmTitle")}
        description={pendingImport ? formatImportSummary(pendingImport.summary) : undefined}
        confirmLabel={t("settings.importHistoryConfirm")}
        onConfirm={() => void handleImportHistory()}
      />
      <ConfirmDialog
        open={workspaceImportDialogOpen}
        onOpenChange={(open) => {
          setWorkspaceImportDialogOpen(open);
          if (!open) setPendingWorkspaceImport(null);
        }}
        title={t("settings.importWorkspaceConfirmTitle")}
        description={pendingWorkspaceImport ? formatWorkspaceImportSummary(pendingWorkspaceImport.summary) : undefined}
        confirmLabel={t("settings.importWorkspaceConfirm")}
        onConfirm={() => void handleImportWorkspace()}
      />
    </div>
  );
}
