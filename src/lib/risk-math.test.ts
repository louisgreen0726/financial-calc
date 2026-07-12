import { calculateDeterministicStressScenarios, calculateParametricNormalRisk } from "@/lib/risk-math";

// NIST standard normal critical values:
// https://www.itl.nist.gov/div898/handbook/eda/section3/eda3671.htm
// Expected-shortfall values apply phi(z) / (1 - confidence) to those normal quantiles.
describe("parametric normal VaR and expected shortfall", () => {
  it.each([
    {
      confidence: 0.95,
      zScore: 1.6448536269514722,
      valueAtRisk: 2072.320780960097,
      conditionalValueAtRisk: 2598.773864196423,
    },
    {
      confidence: 0.99,
      zScore: 2.3263478740408408,
      valueAtRisk: 2930.922827493275,
      conditionalValueAtRisk: 3357.854294165669,
    },
  ])("matches the $confidence one-day normal tail reference", (reference) => {
    const result = calculateParametricNormalRisk({
      portfolioValue: 100_000,
      annualVolatility: 0.2,
      confidence: reference.confidence,
      horizonDays: 1,
    });

    expect(result).not.toBeNull();
    expect(Math.abs((result?.zScore ?? 0) - reference.zScore)).toBeLessThan(2e-9);
    expect(Math.abs((result?.valueAtRisk ?? 0) - reference.valueAtRisk)).toBeLessThan(0.00001);
    expect(Math.abs((result?.conditionalValueAtRisk ?? 0) - reference.conditionalValueAtRisk)).toBeLessThan(0.00001);
    expect(result?.conditionalValueAtRisk).toBeGreaterThan(result?.valueAtRisk ?? Infinity);
  });

  it("uses square-root-of-time scaling and preserves fractional/amount identities", () => {
    const oneDay = calculateParametricNormalRisk({
      portfolioValue: 2_000_000,
      annualVolatility: 0.3,
      confidence: 0.975,
      horizonDays: 1,
    });
    const twentyFiveDays = calculateParametricNormalRisk({
      portfolioValue: 2_000_000,
      annualVolatility: 0.3,
      confidence: 0.975,
      horizonDays: 25,
    });

    expect(twentyFiveDays?.horizonVolatility).toBeCloseTo((oneDay?.horizonVolatility ?? 0) * 5, 14);
    expect(twentyFiveDays?.valueAtRisk).toBeCloseTo((oneDay?.valueAtRisk ?? 0) * 5, 8);
    expect(twentyFiveDays?.conditionalValueAtRisk).toBeCloseTo((oneDay?.conditionalValueAtRisk ?? 0) * 5, 8);
    expect(twentyFiveDays?.valueAtRisk).toBeCloseTo((twentyFiveDays?.valueAtRiskFraction ?? 0) * 2_000_000, 8);
  });

  it("returns zero loss metrics for zero volatility", () => {
    expect(
      calculateParametricNormalRisk({
        portfolioValue: 10_000,
        annualVolatility: 0,
        confidence: 0.95,
        horizonDays: 10,
      })
    ).toMatchObject({
      valueAtRisk: 0,
      valueAtRiskFraction: 0,
      conditionalValueAtRisk: 0,
      conditionalValueAtRiskFraction: 0,
      horizonVolatility: 0,
    });
  });

  it.each([
    { portfolioValue: 0, annualVolatility: 0.2, confidence: 0.95, horizonDays: 1 },
    { portfolioValue: 100, annualVolatility: -0.1, confidence: 0.95, horizonDays: 1 },
    { portfolioValue: 100, annualVolatility: 0.2, confidence: 0.5, horizonDays: 1 },
    { portfolioValue: 100, annualVolatility: 0.2, confidence: 1, horizonDays: 1 },
    { portfolioValue: 100, annualVolatility: 0.2, confidence: 0.95, horizonDays: 1.5 },
    { portfolioValue: 100, annualVolatility: 0.2, confidence: 0.95, horizonDays: 1, tradingDaysPerYear: 0 },
  ])("rejects an invalid model domain: $input", (input) => {
    expect(calculateParametricNormalRisk(input)).toBeNull();
  });
});

describe("deterministic portfolio stress scenarios", () => {
  it("applies fixed proportional shocks and compares their losses with VaR", () => {
    expect(calculateDeterministicStressScenarios(100_000, 2_500)).toEqual([
      {
        id: "moderate",
        shockFraction: -0.05,
        loss: 5_000,
        stressedValue: 95_000,
        lossToValueAtRisk: 2,
      },
      {
        id: "severe",
        shockFraction: -0.1,
        loss: 10_000,
        stressedValue: 90_000,
        lossToValueAtRisk: 4,
      },
      {
        id: "extreme",
        shockFraction: -0.2,
        loss: 20_000,
        stressedValue: 80_000,
        lossToValueAtRisk: 8,
      },
    ]);
  });

  it("keeps zero-VaR comparisons undefined while preserving scenario losses", () => {
    const scenarios = calculateDeterministicStressScenarios(40_000, 0);

    expect(scenarios?.map((scenario) => scenario.lossToValueAtRisk)).toEqual([null, null, null]);
    expect(scenarios?.map((scenario) => scenario.loss)).toEqual([2_000, 4_000, 8_000]);
  });

  it("does not expose an infinite multiple for a subnormal positive VaR", () => {
    expect(calculateDeterministicStressScenarios(40_000, Number.MIN_VALUE)?.[0].lossToValueAtRisk).toBeNull();
  });

  it.each([
    { portfolioValue: 0, valueAtRisk: 10 },
    { portfolioValue: Number.NaN, valueAtRisk: 10 },
    { portfolioValue: 1_000, valueAtRisk: -1 },
    { portfolioValue: 1_000, valueAtRisk: Number.POSITIVE_INFINITY },
  ])("rejects an invalid stress domain: $portfolioValue / $valueAtRisk", ({ portfolioValue, valueAtRisk }) => {
    expect(calculateDeterministicStressScenarios(portfolioValue, valueAtRisk)).toBeNull();
  });
});
