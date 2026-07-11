import { CALCULATOR_PAGE_IDS, HISTORY_EXPIRY_DAYS, MAX_HISTORY_ITEMS, type CalculatorPageId } from "@/lib/constants";

export type HistoryResultFormat = "currency" | "percent" | "percentDecimal" | "number" | "ratio" | "periods" | "years";

export interface CalculationHistoryItem {
  id: string;
  page: CalculatorPageId;
  inputs: Record<string, number | string>;
  result: number;
  timestamp: number;
  label?: string;
  resultFormat?: HistoryResultFormat;
  resultUnit?: string;
}

export interface CalculationHistoryEnvelope {
  version: 1;
  items: CalculationHistoryItem[];
}

export interface ParsedCalculationHistory {
  items: CalculationHistoryItem[];
  needsWriteBack: boolean;
  unsupportedVersion: boolean;
}

const HISTORY_SCHEMA_VERSION = 1 as const;
const MAX_INPUT_KEYS = 100;
const MAX_INPUT_STRING_LENGTH = 20_000;
const MAX_LABEL_LENGTH = 500;
const MAX_RESULT_UNIT_LENGTH = 100;
const MAX_FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1000;
const RESULT_FORMATS = new Set<HistoryResultFormat>([
  "currency",
  "percent",
  "percentDecimal",
  "number",
  "ratio",
  "periods",
  "years",
]);
const PAGE_IDS = new Set<string>(CALCULATOR_PAGE_IDS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseInputs(value: unknown): Record<string, number | string> | null {
  if (!isRecord(value)) {
    return null;
  }

  const entries = Object.entries(value);
  if (entries.length > MAX_INPUT_KEYS) {
    return null;
  }

  const parsedEntries: Array<[string, number | string]> = [];
  for (const [key, inputValue] of entries) {
    if (key.length === 0 || key.length > 100) {
      return null;
    }

    if (typeof inputValue === "number") {
      if (!Number.isFinite(inputValue)) {
        return null;
      }
      parsedEntries.push([key, inputValue]);
      continue;
    }

    if (typeof inputValue === "string" && inputValue.length <= MAX_INPUT_STRING_LENGTH) {
      parsedEntries.push([key, inputValue]);
      continue;
    }

    return null;
  }

  return Object.fromEntries(parsedEntries);
}

function parseHistoryItem(value: unknown): CalculationHistoryItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const { id, page, result, timestamp } = value;
  const inputs = parseInputs(value.inputs);
  if (
    typeof id !== "string" ||
    id.length === 0 ||
    id.length > 200 ||
    typeof page !== "string" ||
    !PAGE_IDS.has(page) ||
    !inputs ||
    typeof result !== "number" ||
    !Number.isFinite(result) ||
    typeof timestamp !== "number" ||
    !Number.isFinite(timestamp) ||
    timestamp <= 0
  ) {
    return null;
  }

  if (value.label !== undefined && (typeof value.label !== "string" || value.label.length > MAX_LABEL_LENGTH)) {
    return null;
  }
  if (
    value.resultFormat !== undefined &&
    (typeof value.resultFormat !== "string" || !RESULT_FORMATS.has(value.resultFormat as HistoryResultFormat))
  ) {
    return null;
  }
  if (
    value.resultUnit !== undefined &&
    (typeof value.resultUnit !== "string" || value.resultUnit.length > MAX_RESULT_UNIT_LENGTH)
  ) {
    return null;
  }

  return {
    id,
    page: page as CalculatorPageId,
    inputs,
    result,
    timestamp,
    ...(typeof value.label === "string" ? { label: value.label } : {}),
    ...(typeof value.resultFormat === "string" ? { resultFormat: value.resultFormat as HistoryResultFormat } : {}),
    ...(typeof value.resultUnit === "string" ? { resultUnit: value.resultUnit } : {}),
  };
}

export function createCalculationHistoryEnvelope(items: CalculationHistoryItem[]): CalculationHistoryEnvelope {
  return { version: HISTORY_SCHEMA_VERSION, items };
}

export function parseStoredCalculationHistory(value: unknown, now = Date.now()): ParsedCalculationHistory {
  const unsupportedVersion =
    isRecord(value) &&
    typeof value.version === "number" &&
    Number.isInteger(value.version) &&
    value.version !== HISTORY_SCHEMA_VERSION;

  if (unsupportedVersion) {
    return { items: [], needsWriteBack: false, unsupportedVersion: true };
  }

  const isCurrentEnvelope = isRecord(value) && value.version === HISTORY_SCHEMA_VERSION && Array.isArray(value.items);
  let source: unknown[] = [];
  if (Array.isArray(value)) {
    source = value;
  } else if (isRecord(value) && value.version === HISTORY_SCHEMA_VERSION && Array.isArray(value.items)) {
    source = value.items;
  }
  const expiryMs = HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const itemsById = new Map<string, CalculationHistoryItem>();

  for (const candidate of source) {
    const item = parseHistoryItem(candidate);
    if (!item || item.timestamp > now + MAX_FUTURE_CLOCK_SKEW_MS || now - item.timestamp >= expiryMs) {
      continue;
    }

    const existing = itemsById.get(item.id);
    if (!existing || item.timestamp > existing.timestamp) {
      itemsById.set(item.id, item);
    }
  }

  const pageCounts = new Map<CalculatorPageId, number>();
  const items = [...itemsById.values()]
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter((item) => {
      const pageCount = pageCounts.get(item.page) ?? 0;
      if (pageCount >= MAX_HISTORY_ITEMS) {
        return false;
      }

      pageCounts.set(item.page, pageCount + 1);
      return true;
    });

  let sourceMatchesItems = source.length === items.length;
  if (sourceMatchesItems) {
    sourceMatchesItems = items.every((item, index) => {
      const sourceItem = parseHistoryItem(source[index]);
      return sourceItem?.id === item.id && sourceItem.timestamp === item.timestamp;
    });
  }

  return {
    items,
    needsWriteBack: !isCurrentEnvelope || !sourceMatchesItems,
    unsupportedVersion: false,
  };
}
