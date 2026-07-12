import { describe, expect, it } from "vitest";

import { normalizeRestoredPortfolioCorrelation, normalizeRestoredPortfolioRiskFreeRate } from "@/lib/portfolio-state";

describe("portfolio restore settings", () => {
  it("accepts finite numeric and string values within UI bounds", () => {
    expect(normalizeRestoredPortfolioRiskFreeRate(-10)).toBe(-10);
    expect(normalizeRestoredPortfolioRiskFreeRate("-2.5")).toBe(-2.5);
    expect(normalizeRestoredPortfolioRiskFreeRate(10)).toBe(10);
    expect(normalizeRestoredPortfolioCorrelation("-0.25")).toBe(-0.25);
    expect(normalizeRestoredPortfolioCorrelation(1)).toBe(1);
  });

  it("rejects malformed, non-finite, and out-of-range restored settings", () => {
    for (const value of [-10.01, 10.01, Number.NaN, Number.POSITIVE_INFINITY, "1,2", "not-a-rate", null]) {
      expect(normalizeRestoredPortfolioRiskFreeRate(value)).toBeNull();
    }
    for (const value of [-1.01, 1.01, Number.NaN, Number.NEGATIVE_INFINITY, "0.2%", undefined]) {
      expect(normalizeRestoredPortfolioCorrelation(value)).toBeNull();
    }
  });
});
