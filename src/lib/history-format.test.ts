import { describe, expect, it } from "vitest";

import { formatHistoryResult } from "@/lib/history-format";
import type { CalculationHistoryItem } from "@/hooks/use-calculation-history";

function item(overrides: Partial<CalculationHistoryItem>): CalculationHistoryItem {
  return {
    id: "id",
    page: "tvm",
    inputs: {},
    result: 0,
    timestamp: 1,
    ...overrides,
  };
}

describe("formatHistoryResult", () => {
  it("uses explicit result metadata for percentages and periods", () => {
    expect(formatHistoryResult(item({ result: 0.075, resultFormat: "percentDecimal" }))).toBe("7.5%");
    expect(formatHistoryResult(item({ result: 12, resultFormat: "periods" }))).toBe("12 periods");
  });

  it("infers ratio formatting for portfolio history", () => {
    expect(formatHistoryResult(item({ page: "portfolio", result: 1.23456 }))).toBe("1.2346");
  });

  it("does not render invalid stored values as currency", () => {
    expect(formatHistoryResult(item({ result: Number.NaN }))).toBe("N/A");
  });
});
