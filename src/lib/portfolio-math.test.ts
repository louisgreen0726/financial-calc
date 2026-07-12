import { describe, expect, it } from "vitest";

import {
  calculatePortfolioPoint,
  clampEqualCorrelation,
  createSeededRandom,
  getMinimumEqualCorrelation,
  makeDeterministicBaselineWeights,
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

  it("rejects non-integer random-weight dimensions", () => {
    expect(makeRandomWeights(2.5)).toEqual([]);
  });

  it("provides deterministic equal-weight and corner baselines", () => {
    expect(makeDeterministicBaselineWeights(3)).toEqual([
      [1 / 3, 1 / 3, 1 / 3],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
    expect(makeDeterministicBaselineWeights(0)).toEqual([]);
    expect(makeDeterministicBaselineWeights(2.5)).toEqual([]);
  });

  it("generates deterministic random sequences from the same seed", () => {
    const first = createSeededRandom("scenario-a");
    const second = createSeededRandom("scenario-a");
    const third = createSeededRandom("scenario-b");

    const firstSequence = Array.from({ length: 5 }, () => first());
    const secondSequence = Array.from({ length: 5 }, () => second());
    const thirdSequence = Array.from({ length: 5 }, () => third());

    expect(firstSequence).toEqual(secondSequence);
    expect(firstSequence).not.toEqual(thirdSequence);
    expect(firstSequence.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it("makes reproducible random weights when a seeded generator is supplied", () => {
    const firstWeights = makeRandomWeights(4, createSeededRandom("portfolio-demo"));
    const secondWeights = makeRandomWeights(4, createSeededRandom("portfolio-demo"));

    expect(firstWeights).toEqual(secondWeights);
    expect(firstWeights.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8);
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

  it("matches the quadratic covariance reference across deterministic portfolios", () => {
    const assets = Array.from({ length: 20 }, (_, index) => ({
      name: `Asset ${index + 1}`,
      return: 2 + index * 0.75,
      risk: 4 + index * 1.25,
    }));
    const random = createSeededRandom("quadratic-reference");
    const weightMatrix = [
      ...makeDeterministicBaselineWeights(assets.length),
      ...Array.from({ length: 50 }, () => makeRandomWeights(assets.length, random)),
    ];
    const correlations = [getMinimumEqualCorrelation(assets.length), -0.02, 0, 0.2, 0.75, 1];

    for (const correlation of correlations) {
      for (const weights of weightMatrix) {
        let referenceVariance = 0;
        for (let row = 0; row < assets.length; row++) {
          for (let column = 0; column < assets.length; column++) {
            const covariance =
              row === column
                ? assets[row].risk * assets[row].risk
                : correlation * assets[row].risk * assets[column].risk;
            referenceVariance += weights[row] * weights[column] * covariance;
          }
        }

        const point = calculatePortfolioPoint(assets, weights, correlation, 1.5);
        expect(point.risk).toBeCloseTo(Math.sqrt(Math.max(0, referenceVariance)), 10);
      }
    }
  });

  it("rejects malformed assets and weights", () => {
    expect(() => calculatePortfolioPoint([{ name: "A", return: 8, risk: 10 }], [], 0, 2)).toThrow(/matching/);
    expect(() => calculatePortfolioPoint([{ name: "A", return: 8, risk: -1 }], [1], 0, 2)).toThrow(/finite/);
    expect(() =>
      calculatePortfolioPoint(
        [
          { name: "A", return: 8, risk: 10 },
          { name: "B", return: 6, risk: 8 },
        ],
        [1, 1],
        0,
        2
      )
    ).toThrow(/sum to one/);
    expect(() => calculatePortfolioPoint([{ name: "A", return: 8, risk: 10 }], [1], 0, Number.NaN)).toThrow(
      /Risk-free rate/
    );
  });

  it("uses explicit Sharpe semantics for zero-risk portfolios", () => {
    const assets = [
      { name: "A", return: 10, risk: 10 },
      { name: "B", return: 10, risk: 10 },
    ];

    expect(calculatePortfolioPoint(assets, [0.5, 0.5], -1, 2).sharpe).toBeNull();
    expect(calculatePortfolioPoint(assets, [0.5, 0.5], -1, 12).sharpe).toBeNull();
    expect(calculatePortfolioPoint(assets, [0.5, 0.5], -1, 10).sharpe).toBeNull();
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

  it("ignores zero-risk portfolios whose Sharpe ratio is undefined", () => {
    const undefinedPoint = { ret: 2, risk: 0, sharpe: null, weights: [0.5, 0.5] };
    const finitePoint = { ret: 5, risk: 10, sharpe: 0.3, weights: [1, 0] };
    const arbitragePoint = { ret: 8, risk: 0, sharpe: null, weights: [0, 1] };

    expect(summarizePortfolioSimulations([undefinedPoint, finitePoint, arbitragePoint]).optimal).toBe(finitePoint);
  });
});
