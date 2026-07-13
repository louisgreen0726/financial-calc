import {
  createCalculationHistoryEnvelope,
  MAX_HISTORY_IMPORT_BYTES,
  MAX_HISTORY_IMPORT_ITEMS,
  parseStoredCalculationHistory,
  prepareCalculationHistoryImport,
  type CalculationHistoryEnvelope,
  type CalculationHistoryItem,
  type HistoryImportSummary,
} from "@/lib/calculation-history";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/constants";

export const WORKSPACE_BACKUP_KIND = "financial-calc-workspace";
export const WORKSPACE_BACKUP_VERSION = 1 as const;
export const MAX_WORKSPACE_BACKUP_BYTES = MAX_HISTORY_IMPORT_BYTES + 100_000;
export const MAX_WORKSPACE_BACKUP_FAVORITES = MAX_HISTORY_IMPORT_ITEMS;

export type WorkspaceLanguage = "en" | "zh";
export type WorkspaceTheme = "light" | "dark" | "system";

export interface WorkspacePreferences {
  language: WorkspaceLanguage;
  theme: WorkspaceTheme;
  currency: SupportedCurrency;
  sidebarCollapsed: boolean;
}

export interface WorkspaceBackupEnvelope {
  kind: typeof WORKSPACE_BACKUP_KIND;
  version: typeof WORKSPACE_BACKUP_VERSION;
  exportedAt: string;
  history: CalculationHistoryEnvelope;
  favorites: string[];
  preferences: WorkspacePreferences;
}

export interface ParsedWorkspaceBackup {
  backup: WorkspaceBackupEnvelope;
  historyNormalization: HistoryImportSummary;
}

export type WorkspaceBackupError = "invalid" | "unsupported-version" | "too-large" | "too-many-items";

export type WorkspaceBackupParseResult =
  { ok: true; value: ParsedWorkspaceBackup } | { ok: false; error: WorkspaceBackupError };

export interface WorkspaceRestoreSummary extends HistoryImportSummary {
  favoritesAdded: number;
  favoritesTotal: number;
}

export type PreparedWorkspaceRestore =
  | {
      ok: true;
      history: CalculationHistoryEnvelope;
      favorites: string[];
      preferences: WorkspacePreferences;
      summary: WorkspaceRestoreSummary;
    }
  | { ok: false; error: WorkspaceBackupError };

interface CreateWorkspaceBackupOptions {
  history: CalculationHistoryItem[];
  favorites: unknown;
  preferences: WorkspacePreferences;
  now?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => Object.hasOwn(value, key));
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

function getSerializedByteLength(value: unknown): number | null {
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? null : new TextEncoder().encode(serialized).byteLength;
  } catch {
    return null;
  }
}

function isWorkspacePreferences(value: unknown): value is WorkspacePreferences {
  if (!isRecord(value) || !hasExactKeys(value, ["language", "theme", "currency", "sidebarCollapsed"])) {
    return false;
  }

  return (
    (value.language === "en" || value.language === "zh") &&
    (value.theme === "light" || value.theme === "dark" || value.theme === "system") &&
    typeof value.currency === "string" &&
    SUPPORTED_CURRENCIES.includes(value.currency as SupportedCurrency) &&
    typeof value.sidebarCollapsed === "boolean"
  );
}

function isValidFavoriteId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 200;
}

export function normalizeWorkspaceFavoriteIds(value: unknown, validHistoryIds: ReadonlySet<string>): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isValidFavoriteId))].filter((id) => validHistoryIds.has(id));
}

export function parseWorkspaceBackup(
  value: unknown,
  options: { byteLength?: number; now?: number } = {}
): WorkspaceBackupParseResult {
  const measuredBytes = getSerializedByteLength(value);
  if (
    measuredBytes === null ||
    (options.now !== undefined && !Number.isFinite(options.now)) ||
    (options.byteLength !== undefined && (!Number.isSafeInteger(options.byteLength) || options.byteLength < 0))
  ) {
    return { ok: false, error: "invalid" };
  }
  if (Math.max(measuredBytes, options.byteLength ?? 0) > MAX_WORKSPACE_BACKUP_BYTES) {
    return { ok: false, error: "too-large" };
  }
  if (!isRecord(value)) {
    return { ok: false, error: "invalid" };
  }
  if (
    typeof value.version === "number" &&
    Number.isInteger(value.version) &&
    value.version !== WORKSPACE_BACKUP_VERSION
  ) {
    return { ok: false, error: "unsupported-version" };
  }
  if (
    !hasExactKeys(value, ["kind", "version", "exportedAt", "history", "favorites", "preferences"]) ||
    value.kind !== WORKSPACE_BACKUP_KIND ||
    value.version !== WORKSPACE_BACKUP_VERSION ||
    !isIsoTimestamp(value.exportedAt) ||
    !isWorkspacePreferences(value.preferences)
  ) {
    return { ok: false, error: "invalid" };
  }
  if (!isRecord(value.history)) {
    return { ok: false, error: "invalid" };
  }
  if (
    typeof value.history.version === "number" &&
    Number.isInteger(value.history.version) &&
    value.history.version !== 1
  ) {
    return { ok: false, error: "unsupported-version" };
  }
  if (!hasExactKeys(value.history, ["version", "items"]) || !Array.isArray(value.history.items)) {
    return { ok: false, error: "invalid" };
  }
  if (!Array.isArray(value.favorites) || value.favorites.length > MAX_WORKSPACE_BACKUP_FAVORITES) {
    return {
      ok: false,
      error: Array.isArray(value.favorites) ? "too-many-items" : "invalid",
    };
  }
  if (!value.favorites.every(isValidFavoriteId)) {
    return { ok: false, error: "invalid" };
  }

  const preparedHistory = prepareCalculationHistoryImport(value.history, [], options.now);
  if (!preparedHistory.ok) {
    return {
      ok: false,
      error: preparedHistory.error === "too-many-items" ? "too-many-items" : preparedHistory.error,
    };
  }

  const history = createCalculationHistoryEnvelope(preparedHistory.items);
  const historyIds = new Set(history.items.map((item) => item.id));
  const favorites = normalizeWorkspaceFavoriteIds(value.favorites, historyIds);
  return {
    ok: true,
    value: {
      backup: {
        kind: WORKSPACE_BACKUP_KIND,
        version: WORKSPACE_BACKUP_VERSION,
        exportedAt: value.exportedAt,
        history,
        favorites,
        preferences: value.preferences,
      },
      historyNormalization: preparedHistory.summary,
    },
  };
}

export function createWorkspaceBackup({
  history,
  favorites,
  preferences,
  now = Date.now(),
}: CreateWorkspaceBackupOptions): WorkspaceBackupEnvelope {
  const normalizedHistory = parseStoredCalculationHistory(createCalculationHistoryEnvelope(history), now).items;
  const historyIds = new Set(normalizedHistory.map((item) => item.id));
  const candidate: WorkspaceBackupEnvelope = {
    kind: WORKSPACE_BACKUP_KIND,
    version: WORKSPACE_BACKUP_VERSION,
    exportedAt: new Date(now).toISOString(),
    history: createCalculationHistoryEnvelope(normalizedHistory),
    favorites: normalizeWorkspaceFavoriteIds(favorites, historyIds),
    preferences,
  };
  const parsed = parseWorkspaceBackup(candidate, { now });
  if (!parsed.ok) {
    throw new Error(`Workspace backup could not be created: ${parsed.error}`);
  }
  return parsed.value.backup;
}

export function prepareWorkspaceBackupRestore(
  parsed: ParsedWorkspaceBackup,
  currentHistory: CalculationHistoryItem[],
  currentFavorites: unknown,
  now = Date.now()
): PreparedWorkspaceRestore {
  const preparedHistory = prepareCalculationHistoryImport(parsed.backup.history, currentHistory, now);
  if (!preparedHistory.ok) {
    return {
      ok: false,
      error: preparedHistory.error === "too-many-items" ? "too-many-items" : preparedHistory.error,
    };
  }

  const finalHistoryIds = new Set(preparedHistory.items.map((item) => item.id));
  const existingFavorites = normalizeWorkspaceFavoriteIds(currentFavorites, finalHistoryIds);
  const requestedFavorites = new Set([...existingFavorites, ...parsed.backup.favorites]);
  const favorites = preparedHistory.items.map((item) => item.id).filter((id) => requestedFavorites.has(id));
  const existingFavoriteSet = new Set(existingFavorites);
  const favoritesAdded = favorites.filter((id) => !existingFavoriteSet.has(id)).length;

  return {
    ok: true,
    history: createCalculationHistoryEnvelope(preparedHistory.items),
    favorites,
    preferences: parsed.backup.preferences,
    summary: {
      ...preparedHistory.summary,
      duplicates: preparedHistory.summary.duplicates + parsed.historyNormalization.duplicates,
      skipped: preparedHistory.summary.skipped + parsed.historyNormalization.skipped,
      favoritesAdded,
      favoritesTotal: favorites.length,
    },
  };
}
