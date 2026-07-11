import { parseOptionalNumber } from "@/lib/input-utils";

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
    return values.every((value): value is string => value !== null) ? values : null;
  } catch {
    return null;
  }
}

function isStrictLegacyNumber(value: string): boolean {
  const normalized = value.trim().replace(/[\s_]/g, "");
  const groupedNumber = /^[+-]?(?:(?:\d{1,3}(?:,\d{3})+)|\d+)(?:\.\d*)?(?:e[+-]?\d+)?$/i;
  return groupedNumber.test(normalized) && parseOptionalNumber(value) !== null;
}

function parseLegacyCommaSeparatedFlows(serializedFlows: string): string[] {
  const parts = serializedFlows.split(",");
  const memo = new Map<number, string[] | null>();

  const parseFrom = (start: number): string[] | null => {
    const cached = memo.get(start);
    if (cached !== undefined) return cached;
    if (start === parts.length) return [];

    let best: string[] | null = null;
    for (let end = start + 1; end <= parts.length; end += 1) {
      const candidate = parts.slice(start, end).join(",").trim();
      if (!isStrictLegacyNumber(candidate)) continue;

      const remaining = parseFrom(end);
      if (!remaining) continue;

      const next = [candidate, ...remaining];
      // A legacy comma record is ambiguous, so preserve valid thousands groups
      // instead of silently splitting one amount into several smaller amounts.
      if (!best || next.length < best.length) {
        best = next;
      }
    }

    memo.set(start, best);
    return best;
  };

  return parseFrom(0) ?? [];
}

/**
 * Reads current JSON history values and legacy comma-delimited records.
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
