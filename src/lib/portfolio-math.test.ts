import { describe, expect, it } from "vitest";

import {
  calculatePortfolioPoint,
  clampEqualCorrelation,
  getMinimumEqualCorrelation,
  makeRandomWeights,
  summarizePortfolioSimulations,
} from "@/lib/portfolio-math";

describe("portfolio-math", () => {
  it("computes the minimum valid equal-correlation boundary", () => {
    expect(getMinimumEqualCorrelation(1)).toBe(-1);
    expect(getMinimumEqualCorrelation(2)).toBe(-1);
    expect(getMinimumEqualCorrelation(3)).toBeCloseTo(-0.5, 8);
    expect(getMinimumEqualCorrelation(5)).toBeCloseTo(-0.25, 8);
  });

  it("clamps equal correlation to the mathematically valid range", () => {
    expect(clampEqualCorrelation(-0.8, 3)).toBeCloseTo(-0.5, 8);
    expect(clampEqualCorrelation(1.5, 3)).toBe(1);
    expect(clampEqualCorrelation(0.25, 3)).toBe(0.25);
  });

  it("generates normalized non-negative random weights", () => {
    const weights = makeRandomWeights(2, () => 0.5);
    expect(weights).toHaveLength(2);
    expect(weights[0]).toBeCloseTo(0.5, 8);
    expect(weights[1]).toBeCloseTo(0.5, 8);
    expect(weights.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8);
  });

  it("rejects invalid equal-correlation matrices before producing negative variance", () => {
    const assets = [
      { name: "A", return: 8, risk: 10 },
      { name: "B", return: 6, risk: 12 },
      { name: "C", return: 4, risk: 8 },
    ];

    expect(() => calculatePortfolioPoint(assets, [1 / 3, 1 / 3, 1 / 3], -0.8, 2)).toThrow(/Correlation/);

    const boundaryPoint = calculatePortfolioPoint(assets, [1 / 3, 1 / 3, 1 / 3], -0.5, 2);
    expect(boundaryPoint.risk).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(boundaryPoint.sharpe)).toBe(true);
  });

  it("rejects malformed assets and weights", () => {
    expect(() => calculatePortfolioPoint([{ name: "A", return: 8, risk: 10 }], [], 0, 2)).toThrow(/matching/);
    expect(() => calculatePortfolioPoint([{ name: "A", return: 8, risk: -1 }], [1], 0, 2)).toThrow(/finite/);
  });

  it("summarizes optimal and minimum-volatility portfolios", () => {
    const simulations = [
      { ret: 5, risk: 10, sharpe: 0.3, weights: [1, 0] },
      { ret: 7, risk: 8, sharpe: 0.6, weights: [0.5, 0.5] },
      { ret: 4, risk: 6, sharpe: 0.2, weights: [0, 1] },
    ];

    const result = summarizePortfolioSimulations(simulations);
    expect(result.optimal).toBe(simulations[1]);
    expect(result.minVol).toBe(simulations[2]);
    expect(result.simulations).toBe(simulations);
  });

  it("summarizes empty simulations safely", () => {
    expect(summarizePortfolioSimulations([])).toEqual({ simulations: [], optimal: null, minVol: null });
  });
});
