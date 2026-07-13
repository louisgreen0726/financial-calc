import { parseOptionalNumber } from "@/lib/input-utils";
import { MAX_CASH_FLOWS } from "@/lib/constants";

export function serializeCashFlowHistory(flows: readonly string[]): string {
  return JSON.stringify(flows);
}

function parseJsonFlows(serializedFlows: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(serializedFlows);
    if (!Array.isArray(parsed)) return null;

    const values = parsed.map((value) =>
      typeof value === "string" || typeof value === "number" ? String(value) : null
    );
    return values.every((value): value is string => value !== null) ? values.slice(0, MAX_CASH_FLOWS) : null;
  } catch {
    return null;
  }
}

function isStrictLegacyNumber(value: string): boolean {
  const normalized = value.trim().replace(/[\s_]/g, "");
  const groupedNumber = /^[+-]?(?:(?:\d{1,3}(?:,\d{3})+)|\d+)(?:\.\d*)?(?:e[+-]?\d+)?$/i;
  return groupedNumber.test(normalized) && parseOptionalNumber(value) !== null;
}

const GROUPED_FIRST_PART = /^[+-]?\d{1,3}$/;
const GROUPED_CONTINUATION_PART = /^\d{3}$/;
const GROUPED_TERMINAL_PART = /^\d{3}(?:\.\d*)?(?:e[+-]?\d+)?$/i;

interface LegacyParseBudget {
  exhausted: boolean;
  maxSteps: number;
  steps: number;
}

function joinLegacyParts(parts: readonly string[], start: number, end: number) {
  return parts.slice(start, end).join(",").trim();
}

function findLongestLegacyTokenEnd(parts: readonly string[], start: number, budget: LegacyParseBudget): number | null {
  const firstPart = parts[start].trim();
  let bestEnd = isStrictLegacyNumber(firstPart) ? start + 1 : null;
  const groupedFirstPart = parts[start].trimStart();
  if (!GROUPED_FIRST_PART.test(groupedFirstPart)) {
    return bestEnd;
  }

  let magnitude = Math.abs(Number(groupedFirstPart));
  for (let cursor = start + 1; cursor < parts.length; cursor += 1) {
    budget.steps += 1;
    if (budget.steps > budget.maxSteps) {
      budget.exhausted = true;
      return null;
    }

    const part = parts[cursor];
    if (GROUPED_CONTINUATION_PART.test(part)) {
      magnitude = magnitude * 1000 + Number(part);
      if (Number.isFinite(magnitude)) {
        bestEnd = cursor + 1;
      }
      continue;
    }

    // A decimal or exponent can make a long grouped mantissa finite, so
    // validate that one terminal candidate even after an intermediate overflow.
    if (GROUPED_TERMINAL_PART.test(part.trimEnd())) {
      const terminalEnd = cursor + 1;
      if (isStrictLegacyNumber(joinLegacyParts(parts, start, terminalEnd))) {
        bestEnd = terminalEnd;
      }
    }
    break;
  }

  return bestEnd;
}

function parseLegacyCommaSeparatedFlows(serializedFlows: string): string[] {
  const parts = serializedFlows.split(",");
  const flows: string[] = [];
  const budget: LegacyParseBudget = {
    exhausted: false,
    // MAX_CASH_FLOWS is a constant, so work remains linear in the stored input size.
    maxSteps: Math.max(1, parts.length) * (MAX_CASH_FLOWS + 1),
    steps: 0,
  };

  let start = 0;
  while (start < parts.length) {
    const end = findLongestLegacyTokenEnd(parts, start, budget);
    if (end === null || budget.exhausted) {
      return [];
    }

    const flow = joinLegacyParts(parts, start, end);
    if (!isStrictLegacyNumber(flow)) {
      return [];
    }
    if (flows.length < MAX_CASH_FLOWS) {
      flows.push(flow);
    }
    start = end;
  }

  return flows;
}

/**
 * Reads at most MAX_CASH_FLOWS current JSON or legacy comma-delimited values.
 * Legacy records preserve grouped thousands such as `1,000` when they form one numeric token.
 */
export function parseCashFlowHistory(serializedFlows: unknown): string[] {
  if (typeof serializedFlows !== "string") return [];

  const trimmedFlows = serializedFlows.trim();
  const jsonFlows = parseJsonFlows(trimmedFlows);
  if (jsonFlows) return jsonFlows;
  if (trimmedFlows.startsWith("[") || trimmedFlows.startsWith("{")) return [];

  return parseLegacyCommaSeparatedFlows(trimmedFlows);
}
