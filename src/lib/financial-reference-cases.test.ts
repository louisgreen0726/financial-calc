import referenceCases from "@/test/fixtures/financial-reference-cases.json";

import { Finance, type PaymentTiming } from "@/lib/finance-math";

type FinancialFunctionCase = (typeof referenceCases.financialFunctions)[number];

function evaluateFinancialCase(reference: FinancialFunctionCase): number {
  const args = reference.args;
  switch (reference.function) {
    case "pv":
      return Finance.pv(
        args[0] as number,
        args[1] as number,
        args[2] as number,
        args[3] as number,
        args[4] as PaymentTiming
      );
    case "fv":
      return Finance.fv(
        args[0] as number,
        args[1] as number,
        args[2] as number,
        args[3] as number,
        args[4] as PaymentTiming
      );
    case "pmt":
      return Finance.pmt(
        args[0] as number,
        args[1] as number,
        args[2] as number,
        args[3] as number,
        args[4] as PaymentTiming
      );
    case "nper":
      return Finance.nper(
        args[0] as number,
        args[1] as number,
        args[2] as number,
        args[3] as number,
        args[4] as PaymentTiming
      );
    case "rate":
      return Finance.rate(
        args[0] as number,
        args[1] as number,
        args[2] as number,
        args[3] as number,
        args[4] as PaymentTiming
      );
    case "npv":
      return Finance.npv(args[0] as number, args[1] as number[]);
    case "irr":
      return Finance.irr(args[0] as number[]);
    default:
      throw new Error(`Unsupported financial reference function: ${reference.function}`);
  }
}

describe("pinned external financial reference cases", () => {
  it.each([
    [0, 0.5],
    [1, 0.8413447460685429],
    [-1, 0.15865525393145707],
    [6, 0.9999999990134123],
    [-6, 9.865876450376946e-10],
    [8, 0.9999999999999993],
    [-8, 6.22096057427178e-16],
  ])("matches the standard normal CDF at %d", (input, expected) => {
    expect(Math.abs(Finance.normCDF(input) - expected)).toBeLessThanOrEqual(1e-15);
  });

  it.each(referenceCases.financialFunctions)("matches $id", (reference) => {
    const error = Math.abs(evaluateFinancialCase(reference) - reference.expected);
    expect(error, `${reference.id} absolute error`).toBeLessThanOrEqual(reference.tolerance);
  });

  it.each(referenceCases.blackScholesCalls)("matches $id", (reference) => {
    const actual = Finance.blackScholes(
      "call",
      reference.spot,
      reference.strike,
      reference.years,
      reference.riskFreeRate,
      reference.volatility,
      reference.dividendYield
    );
    const error = Math.abs(actual - reference.expected);
    expect(error, `${reference.id} absolute error`).toBeLessThanOrEqual(reference.tolerance);
  });

  it("pins every source to a reviewable commit and license", () => {
    for (const source of Object.values(referenceCases.sources)) {
      expect(source.commit).toMatch(/^[0-9a-f]{40}$/);
      expect(source.license).toMatch(/^(?:BSD-3-Clause|Apache-2\.0)$/);
      expect(source.url).toContain(source.commit);
    }
  });
});
