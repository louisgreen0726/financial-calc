import type { CalculationHistoryItem, HistoryResultFormat } from "@/lib/calculation-history";
import type { CalculatorPageId } from "@/lib/constants";
import { parseOptionalNumber } from "@/lib/input-utils";

export type HistoryComparisonMetric =
  | "tvm:rate"
  | "tvm:nper"
  | "equity:capm"
  | "equity:wacc"
  | "options:implied-volatility:call"
  | "options:implied-volatility:put"
  | "macro:inflation"
  | "macro:real-rate"
  | "macro:ppp";

export type ComparableHistoryResultFormat = Exclude<HistoryResultFormat, "currency">;

export type HistoryComparisonIneligibilityReason =
  "currency-metadata-missing" | "model-metadata-missing" | "legacy-or-unsupported";

export interface CanonicalHistoryInput {
  key: string;
  value: number | string;
}

export type HistoryComparisonEligibility =
  | {
      eligible: true;
      compatibilityKey: HistoryComparisonMetric;
      resultFormat: ComparableHistoryResultFormat;
      canonicalInputs: CanonicalHistoryInput[];
    }
  | {
      eligible: false;
      reason: HistoryComparisonIneligibilityReason;
    };

export type HistoryComparisonDeltaUnit = "percentage-points" | "ratio" | "number" | "periods" | "years";

export interface HistoryComparisonDelta {
  /** Signed difference in absolute display units: comparison minus baseline. */
  value: number;
  unit: HistoryComparisonDeltaUnit;
}

export interface HistoryComparisonPair {
  compatibilityKey: HistoryComparisonMetric;
  resultFormat: ComparableHistoryResultFormat;
  baselineInputs: CanonicalHistoryInput[];
  comparisonInputs: CanonicalHistoryInput[];
  delta: HistoryComparisonDelta;
}

type InputSpec = { key: string; kind: "number" } | { key: string; kind: "enum"; values: readonly string[] };

interface ComparisonContract {
  compatibilityKey: HistoryComparisonMetric;
  page: CalculatorPageId;
  resultFormat: ComparableHistoryResultFormat;
  inputKeys: readonly string[];
  canonicalInputSpecs: readonly InputSpec[];
  matches: (inputs: Record<string, number | string>) => boolean;
}

const TVM_INPUT_KEYS = ["rate", "nper", "pmt", "pv", "fv", "type", "target"] as const;
const OPTIONS_IMPLIED_VOLATILITY_INPUT_KEYS = [
  "spot",
  "strike",
  "time",
  "rate",
  "dividendYield",
  "impliedOptionType",
  "marketPrice",
] as const;

const comparisonContracts: readonly ComparisonContract[] = [
  {
    compatibilityKey: "tvm:rate",
    page: "tvm",
    resultFormat: "percentDecimal",
    inputKeys: TVM_INPUT_KEYS,
    canonicalInputSpecs: [
      { key: "nper", kind: "number" },
      { key: "pmt", kind: "number" },
      { key: "pv", kind: "number" },
      { key: "fv", kind: "number" },
      { key: "type", kind: "enum", values: ["0", "1"] },
    ],
    matches: (inputs) => inputs.target === "rate",
  },
  {
    compatibilityKey: "tvm:nper",
    page: "tvm",
    resultFormat: "periods",
    inputKeys: TVM_INPUT_KEYS,
    canonicalInputSpecs: [
      { key: "rate", kind: "number" },
      { key: "pmt", kind: "number" },
      { key: "pv", kind: "number" },
      { key: "fv", kind: "number" },
      { key: "type", kind: "enum", values: ["0", "1"] },
    ],
    matches: (inputs) => inputs.target === "nper",
  },
  {
    compatibilityKey: "equity:capm",
    page: "equity",
    resultFormat: "percentDecimal",
    inputKeys: ["rf", "beta", "rm"],
    canonicalInputSpecs: [
      { key: "rf", kind: "number" },
      { key: "beta", kind: "number" },
      { key: "rm", kind: "number" },
    ],
    matches: () => true,
  },
  {
    compatibilityKey: "equity:wacc",
    page: "equity",
    resultFormat: "percentDecimal",
    inputKeys: ["equity", "debt", "costEquity", "costDebt", "taxRate"],
    canonicalInputSpecs: [
      { key: "equity", kind: "number" },
      { key: "debt", kind: "number" },
      { key: "costEquity", kind: "number" },
      { key: "costDebt", kind: "number" },
      { key: "taxRate", kind: "number" },
    ],
    matches: () => true,
  },
  {
    compatibilityKey: "options:implied-volatility:call",
    page: "options",
    resultFormat: "percentDecimal",
    inputKeys: OPTIONS_IMPLIED_VOLATILITY_INPUT_KEYS,
    canonicalInputSpecs: [
      { key: "spot", kind: "number" },
      { key: "strike", kind: "number" },
      { key: "time", kind: "number" },
      { key: "rate", kind: "number" },
      { key: "dividendYield", kind: "number" },
      { key: "marketPrice", kind: "number" },
    ],
    matches: (inputs) => inputs.impliedOptionType === "call",
  },
  {
    compatibilityKey: "options:implied-volatility:put",
    page: "options",
    resultFormat: "percentDecimal",
    inputKeys: OPTIONS_IMPLIED_VOLATILITY_INPUT_KEYS,
    canonicalInputSpecs: [
      { key: "spot", kind: "number" },
      { key: "strike", kind: "number" },
      { key: "time", kind: "number" },
      { key: "rate", kind: "number" },
      { key: "dividendYield", kind: "number" },
      { key: "marketPrice", kind: "number" },
    ],
    matches: (inputs) => inputs.impliedOptionType === "put",
  },
  {
    compatibilityKey: "macro:inflation",
    page: "macro",
    resultFormat: "percent",
    inputKeys: ["calculator", "startPrice", "endPrice", "years"],
    canonicalInputSpecs: [
      { key: "startPrice", kind: "number" },
      { key: "endPrice", kind: "number" },
      { key: "years", kind: "number" },
    ],
    matches: (inputs) => inputs.calculator === "inflation",
  },
  {
    compatibilityKey: "macro:real-rate",
    page: "macro",
    resultFormat: "percent",
    inputKeys: ["calculator", "nominalRate", "inflation"],
    canonicalInputSpecs: [
      { key: "nominalRate", kind: "number" },
      { key: "inflation", kind: "number" },
    ],
    matches: (inputs) => inputs.calculator === "realRate",
  },
  {
    compatibilityKey: "macro:ppp",
    page: "macro",
    resultFormat: "ratio",
    inputKeys: ["calculator", "domesticPrice", "foreignPrice"],
    canonicalInputSpecs: [
      { key: "domesticPrice", kind: "number" },
      { key: "foreignPrice", kind: "number" },
    ],
    matches: (inputs) => inputs.calculator === "ppp",
  },
];

function hasExactInputKeys(inputs: Record<string, number | string>, expectedKeys: readonly string[]) {
  const actualKeys = Object.keys(inputs).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  return (
    actualKeys.length === sortedExpectedKeys.length &&
    actualKeys.every((key, index) => key === sortedExpectedKeys[index])
  );
}

function canonicalizeInput(value: number | string, spec: InputSpec): number | string | null {
  if (spec.kind === "number") {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    return parseOptionalNumber(value);
  }

  const normalized = String(value);
  return spec.values.includes(normalized) ? normalized : null;
}

function canonicalizeInputs(inputs: Record<string, number | string>, specs: readonly InputSpec[]) {
  const canonicalInputs: CanonicalHistoryInput[] = [];

  for (const spec of specs) {
    const value = canonicalizeInput(inputs[spec.key], spec);
    if (value === null) {
      return null;
    }
    canonicalInputs.push({ key: spec.key, value });
  }

  return canonicalInputs;
}

function findComparisonContract(item: CalculationHistoryItem) {
  return comparisonContracts.find(
    (contract) =>
      contract.page === item.page && hasExactInputKeys(item.inputs, contract.inputKeys) && contract.matches(item.inputs)
  );
}

export function getHistoryComparisonEligibility(item: CalculationHistoryItem): HistoryComparisonEligibility {
  if (!Number.isFinite(item.result) || item.resultFormat === undefined || item.resultUnit !== undefined) {
    return { eligible: false, reason: "legacy-or-unsupported" };
  }

  const contract = findComparisonContract(item);
  if (contract) {
    if (item.resultFormat !== contract.resultFormat) {
      return { eligible: false, reason: "legacy-or-unsupported" };
    }

    const canonicalInputs = canonicalizeInputs(item.inputs, contract.canonicalInputSpecs);
    return canonicalInputs
      ? {
          eligible: true,
          compatibilityKey: contract.compatibilityKey,
          resultFormat: contract.resultFormat,
          canonicalInputs,
        }
      : { eligible: false, reason: "legacy-or-unsupported" };
  }

  if (item.page === "portfolio") {
    return { eligible: false, reason: "model-metadata-missing" };
  }

  if (item.resultFormat === "currency") {
    return { eligible: false, reason: "currency-metadata-missing" };
  }

  return { eligible: false, reason: "legacy-or-unsupported" };
}

export function createHistoryComparisonDelta(
  baselineResult: number,
  comparisonResult: number,
  resultFormat: HistoryResultFormat
): HistoryComparisonDelta | null {
  if (!Number.isFinite(baselineResult) || !Number.isFinite(comparisonResult) || resultFormat === "currency") {
    return null;
  }

  const rawDelta = comparisonResult - baselineResult;
  const normalizedDelta = Object.is(rawDelta, -0) ? 0 : rawDelta;

  switch (resultFormat) {
    case "percentDecimal":
      return { value: normalizedDelta * 100, unit: "percentage-points" };
    case "percent":
      return { value: normalizedDelta, unit: "percentage-points" };
    case "ratio":
      return { value: normalizedDelta, unit: "ratio" };
    case "number":
      return { value: normalizedDelta, unit: "number" };
    case "periods":
      return { value: normalizedDelta, unit: "periods" };
    case "years":
      return { value: normalizedDelta, unit: "years" };
  }
}

export function createHistoryComparisonPair(
  baseline: CalculationHistoryItem,
  comparison: CalculationHistoryItem
): HistoryComparisonPair | null {
  if (baseline.id === comparison.id) {
    return null;
  }

  const baselineEligibility = getHistoryComparisonEligibility(baseline);
  const comparisonEligibility = getHistoryComparisonEligibility(comparison);
  if (
    !baselineEligibility.eligible ||
    !comparisonEligibility.eligible ||
    baselineEligibility.compatibilityKey !== comparisonEligibility.compatibilityKey ||
    baselineEligibility.resultFormat !== comparisonEligibility.resultFormat
  ) {
    return null;
  }

  const delta = createHistoryComparisonDelta(baseline.result, comparison.result, baselineEligibility.resultFormat);
  if (!delta) {
    return null;
  }

  return {
    compatibilityKey: baselineEligibility.compatibilityKey,
    resultFormat: baselineEligibility.resultFormat,
    baselineInputs: baselineEligibility.canonicalInputs,
    comparisonInputs: comparisonEligibility.canonicalInputs,
    delta,
  };
}

export function areHistoryItemsComparable(
  baseline: CalculationHistoryItem,
  comparison: CalculationHistoryItem
): boolean {
  return createHistoryComparisonPair(baseline, comparison) !== null;
}
