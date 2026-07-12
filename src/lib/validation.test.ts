import { describe, expect, it } from "vitest";

import {
  BondInputSchema,
  EquityDDMSchema,
  EquityWACCSchema,
  ImpliedVolatilityInputSchema,
  LoanInputSchema,
  OptionsInputSchema,
  RiskInputSchema,
  TVMInputSchema,
} from "@/lib/validation";

describe("shared validation schemas", () => {
  it("accepts supported negative TVM rates and rejects the -100 percent singularity", () => {
    const base = { nper: 10, pmt: 0, pv: 1000, fv: 0, type: 0 as const };

    expect(TVMInputSchema.safeParse({ ...base, rate: -2 }).success).toBe(true);
    expect(TVMInputSchema.safeParse({ ...base, rate: -100 }).success).toBe(false);
    expect(TVMInputSchema.safeParse({ ...base, rate: 100.01 }).success).toBe(false);
  });
  it("allows option maturity and volatility at zero because the pricing engine supports them", () => {
    const parsed = OptionsInputSchema.safeParse({ S: 100, K: 100, t: 0, r: 0.05, sigma: 0 });

    expect(parsed.success).toBe(true);
    expect(parsed.data?.q).toBe(0);
  });

  it("rejects negative option maturity and volatility", () => {
    expect(OptionsInputSchema.safeParse({ S: 100, K: 100, t: -1, r: 0.05, sigma: 0.2 }).success).toBe(false);
    expect(OptionsInputSchema.safeParse({ S: 100, K: 100, t: 1, r: 0.05, sigma: -0.2 }).success).toBe(false);
  });

  it("bounds continuous dividend yields while preserving legacy option inputs", () => {
    const base = { S: 100, K: 100, t: 1, r: 0.05, sigma: 0.2 };

    expect(OptionsInputSchema.safeParse({ ...base, q: 0.02 }).success).toBe(true);
    expect(OptionsInputSchema.safeParse({ ...base, q: -1 }).success).toBe(false);
    expect(OptionsInputSchema.safeParse({ ...base, q: 1.01 }).success).toBe(false);
  });

  it("validates the implied-volatility market workflow independently of model volatility", () => {
    const base = { S: 100, K: 100, t: 1, r: 0.05, q: 0.02, type: "call" as const, marketPrice: 9.23 };

    expect(ImpliedVolatilityInputSchema.safeParse(base).success).toBe(true);
    expect(ImpliedVolatilityInputSchema.safeParse({ ...base, marketPrice: -1 }).success).toBe(false);
    expect(ImpliedVolatilityInputSchema.safeParse({ ...base, t: 0 }).success).toBe(false);
    expect(ImpliedVolatilityInputSchema.safeParse({ ...base, type: "straddle" }).success).toBe(false);
  });

  it("rejects WACC inputs with no invested capital", () => {
    expect(
      EquityWACCSchema.safeParse({
        equityValue: 0,
        debtValue: 0,
        costEquity: 0.1,
        costDebt: 0.05,
        taxRate: 0.25,
      }).success
    ).toBe(false);
  });

  it("accepts bond rates as percent inputs from the page", () => {
    expect(
      BondInputSchema.safeParse({
        faceValue: 1000,
        couponRate: 5,
        yearsToMaturity: 10,
        ytm: 4,
        frequency: 2,
      }).success
    ).toBe(true);
  });

  it("rejects unsupported bond frequencies and fractional coupon periods", () => {
    expect(
      BondInputSchema.safeParse({
        faceValue: 1000,
        couponRate: 5,
        yearsToMaturity: 10,
        ytm: 4,
        frequency: 3,
      }).success
    ).toBe(false);
    expect(
      BondInputSchema.safeParse({
        faceValue: 1000,
        couponRate: 5,
        yearsToMaturity: 10.25,
        ytm: 4,
        frequency: 2,
      }).success
    ).toBe(false);
  });

  it("rejects bond rates outside the supported percent range", () => {
    expect(
      BondInputSchema.safeParse({
        faceValue: 1000,
        couponRate: 101,
        yearsToMaturity: 10,
        ytm: 4,
        frequency: 2,
      }).success
    ).toBe(false);

    expect(
      BondInputSchema.safeParse({
        faceValue: 1000,
        couponRate: 5,
        yearsToMaturity: 10,
        ytm: -100,
        frequency: 2,
      }).success
    ).toBe(false);
  });

  it("caps loan terms to the amortization schedule limit", () => {
    expect(LoanInputSchema.safeParse({ amount: 1000, rate: 5, years: 51, method: "CPM" }).success).toBe(false);
  });

  it("requires loan terms to resolve to a whole number of months", () => {
    expect(LoanInputSchema.safeParse({ amount: 1000, rate: 5, years: 1.1, method: "CPM" }).success).toBe(false);
    expect(LoanInputSchema.safeParse({ amount: 1000, rate: 5, years: 1.25, method: "CPM" }).success).toBe(true);
  });

  it("requires risk horizons to use whole trading days and meaningful confidence levels", () => {
    const base = { value: 100000, volatility: 15, confidence: 0.95, days: 10 };

    expect(RiskInputSchema.safeParse(base).success).toBe(true);
    expect(RiskInputSchema.safeParse({ ...base, confidence: 0.5 }).success).toBe(false);
    expect(RiskInputSchema.safeParse({ ...base, days: 1.5 }).success).toBe(false);
    expect(RiskInputSchema.safeParse({ ...base, days: 100 * 252 + 1 }).success).toBe(false);
  });

  it("rejects DDM rates with non-positive gross factors", () => {
    expect(EquityDDMSchema.safeParse({ d1: 2, r: 0.08, g: 0.03 }).success).toBe(true);
    expect(EquityDDMSchema.safeParse({ d1: 2, r: -1.5, g: -2 }).success).toBe(false);
    expect(EquityDDMSchema.safeParse({ d1: 2, r: 0.08, g: -1 }).success).toBe(false);
  });
});
