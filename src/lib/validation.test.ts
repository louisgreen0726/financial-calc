import { describe, expect, it } from "vitest";

import { BondInputSchema, EquityWACCSchema, LoanInputSchema, OptionsInputSchema } from "@/lib/validation";

describe("shared validation schemas", () => {
  it("allows option maturity and volatility at zero because the pricing engine supports them", () => {
    const parsed = OptionsInputSchema.safeParse({ S: 100, K: 100, t: 0, r: 0.05, sigma: 0 });

    expect(parsed.success).toBe(true);
  });

  it("rejects negative option maturity and volatility", () => {
    expect(OptionsInputSchema.safeParse({ S: 100, K: 100, t: -1, r: 0.05, sigma: 0.2 }).success).toBe(false);
    expect(OptionsInputSchema.safeParse({ S: 100, K: 100, t: 1, r: 0.05, sigma: -0.2 }).success).toBe(false);
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

  it("rejects unsupported bond frequencies and fractional coupon periods", () => {
    expect(
      BondInputSchema.safeParse({
        faceValue: 1000,
        couponRate: 0.05,
        yearsToMaturity: 10,
        ytm: 0.04,
        frequency: 3,
      }).success
    ).toBe(false);
    expect(
      BondInputSchema.safeParse({
        faceValue: 1000,
        couponRate: 0.05,
        yearsToMaturity: 10.25,
        ytm: 0.04,
        frequency: 2,
      }).success
    ).toBe(false);
  });

  it("caps loan terms to the amortization schedule limit", () => {
    expect(LoanInputSchema.safeParse({ amount: 1000, rate: 5, years: 51, method: "CPM" }).success).toBe(false);
  });
});
