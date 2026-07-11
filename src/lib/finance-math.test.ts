import { expect, test } from "vitest";
import { Finance } from "./finance-math";

test("pv handles zero-rate case exactly", () => {
  expect(Finance.pv(0, 10, 100, 500, 0)).toBe(-1500);
});

test("fv handles zero-rate case exactly", () => {
  expect(Finance.fv(0, 10, 100, 500, 0)).toBe(-1500);
});

test("pmt matches a standard mortgage payment benchmark", () => {
  const res = Finance.pmt(0.05 / 12, 12 * 30, 100000, 0, 0);
  expect(res).toBeCloseTo(-536.82, 2);
});

test("TVM helpers remain stable for rates close to zero", () => {
  expect(Finance.pmt(1e-16, 360, -100000)).toBeCloseTo(100000 / 360, 8);
  expect(Finance.pv(1e-16, 360, 100, 0)).toBeCloseTo(-36000, 8);
  expect(Finance.fv(1e-16, 360, 100, 0)).toBeCloseTo(-36000, 8);
});

test("nper and rate are mutually consistent for a typical annuity", () => {
  const rate = 0.01;
  const nper = 24;
  const pmt = 50;
  const pv = 1000;
  const fv = Finance.fv(rate, nper, pmt, pv, 0);

  expect(Finance.nper(rate, pmt, pv, fv, 0)).toBeCloseTo(nper, 6);
  expect(Finance.rate(nper, pmt, pv, fv, 0, rate)).toBeCloseTo(rate, 6);
});

test("TVM helpers reject singular or invalid runtime inputs", () => {
  expect(Number.isNaN(Finance.pv(-1, 10, 100, 0))).toBe(true);
  expect(Number.isNaN(Finance.fv(-1, 10, 100, 1000))).toBe(true);
  expect(Number.isNaN(Finance.pmt(-1, 10, 1000, 0))).toBe(true);
  expect(Number.isNaN(Finance.nper(-1, 100, -1000, 0))).toBe(true);
  expect(Number.isNaN(Finance.rate(0, 100, -1000, 0))).toBe(true);
  expect(Number.isNaN(Finance.pv(0.05, 10, 100, 0, 2 as never))).toBe(true);
  expect(Number.isNaN(Finance.rate(10, 0, 0, 0))).toBe(true);
  expect(Number.isNaN(Finance.rate(1, -100, 0, 100, 0))).toBe(true);
  expect(Number.isNaN(Finance.rate(1, 100, -100, 0, 1))).toBe(true);
});

test("bondPrice matches a premium-bond benchmark", () => {
  const price = Finance.bondPrice(1000, 0.05, 10, 0.04, 2);
  expect(price).toBeCloseTo(1081.76, 2);
});

test("bondPrice handles zero-coupon bonds", () => {
  expect(Finance.bondPrice(1000, 0, 2, 0.05, 1)).toBeCloseTo(907.0295, 4);
});

test("loan amortization schedule pays down to zero balance", () => {
  const schedule = Finance.amortizationSchedule(300000, 0.045 / 12, 30 * 12, "CPM");
  expect(schedule.length).toBe(360);
  expect(schedule.at(-1)?.balance).toBe(0);
});

test("CPM final payments preserve the payment identity for ill-conditioned long loans", () => {
  const schedule = Finance.amortizationSchedule(100000, 0.8 / 12, 50 * 12, "CPM");
  const finalPayment = schedule.at(-1);

  expect(finalPayment).toBeDefined();
  expect(finalPayment?.payment).toBeCloseTo((finalPayment?.principal ?? 0) + (finalPayment?.interest ?? 0), 8);
  expect(schedule.reduce((sum, item) => sum + item.principal, 0)).toBeCloseTo(100000, 6);
  expect(finalPayment?.balance).toBe(0);
});

test("loan amortization supports zero-interest fixed payments", () => {
  const schedule = Finance.amortizationSchedule(1200, 0, 12, "CPM");
  expect(schedule.length).toBe(12);
  expect(schedule[0]?.payment).toBeCloseTo(100, 8);
  expect(schedule[0]?.interest).toBe(0);
  expect(schedule.at(-1)?.balance).toBe(0);
});

test("loan amortization rejects unsupported runtime methods", () => {
  expect(Finance.amortizationSchedule(1200, 0.01, 12, "BAD" as never)).toEqual([]);
});

test("loan amortization rejects fractional periods instead of rounding them", () => {
  expect(Finance.amortizationSchedule(1200, 0.01, 11.6, "CPM")).toEqual([]);
  expect(Finance.amortizationSchedule(1200, 0.01, 12.4, "CAM")).toEqual([]);
});

test("loan amortization rejects negative rates and overflowing rows", () => {
  expect(Finance.amortizationSchedule(1200, -0.01, 12, "CAM")).toEqual([]);
  expect(Finance.amortizationSchedule(Number.MAX_VALUE, Number.MAX_VALUE, 2, "CAM")).toEqual([]);
});

test("CAM amortization keeps principal constant until the final rounding period", () => {
  const schedule = Finance.amortizationSchedule(1200, 0.01, 12, "CAM");
  expect(schedule[0]?.principal).toBeCloseTo(100, 8);
  expect(schedule[10]?.principal).toBeCloseTo(100, 8);
  expect(schedule.at(-1)?.balance).toBe(0);
});

test("ddm rejects growth at or above required return", () => {
  expect(Number.isNaN(Finance.ddm(2.5, 0.08, 0.09))).toBe(true);
  expect(Number.isNaN(Finance.ddm(2.5, 0.08, 0.08))).toBe(true);
});

test("ddm returns the expected intrinsic value for a stable-growth case", () => {
  expect(Finance.ddm(2.5, 0.08, 0.03)).toBeCloseTo(50, 8);
  expect(Finance.ddm(0, 0.08, 0.03)).toBe(0);
});

test("finite inputs never leak overflow values from CAPM or macro helpers", () => {
  expect(Number.isNaN(Finance.capm(Number.MAX_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE))).toBe(true);
  expect(Number.isNaN(Finance.inflationRate(Number.MIN_VALUE, Number.MAX_VALUE, 1))).toBe(true);
  expect(Number.isNaN(Finance.purchasingPower(Number.MAX_VALUE, -0.9999999999999999, 100))).toBe(true);
  expect(Number.isNaN(Finance.cpiAdjust(Number.MAX_VALUE, Number.MIN_VALUE, Number.MAX_VALUE))).toBe(true);
  expect(Number.isNaN(Finance.exchangeRatePPP(Number.MIN_VALUE, Number.MAX_VALUE))).toBe(true);
});

test("PPP exchange rate matches the displayed foreign-per-domestic unit direction", () => {
  expect(Finance.exchangeRatePPP(5.81, 650)).toBeCloseTo(111.8760757, 7);
});

test("black scholes returns intrinsic value at zero time", () => {
  expect(Finance.blackScholes("call", 120, 100, 0, 0.05, 0.2)).toBe(20);
  expect(Finance.blackScholes("put", 80, 100, 0, 0.05, 0.2)).toBe(20);
});

test("black scholes matches a standard benchmark at one year", () => {
  expect(Finance.blackScholes("call", 100, 100, 1, 0.05, 0.2)).toBeCloseTo(10.4506, 4);
  expect(Finance.blackScholes("put", 100, 100, 1, 0.05, 0.2)).toBeCloseTo(5.5735, 4);
});

test("option helpers return unavailable values when finite inputs overflow", () => {
  expect(Number.isNaN(Finance.blackScholes("put", 1, Number.MAX_VALUE, 100, -0.99, 0))).toBe(true);
  expect(Object.values(Finance.greeks("put", 1, Number.MAX_VALUE, 100, -0.99, 0)).every(Number.isNaN)).toBe(true);
});

test("risk helpers return finite values in expected ranges", () => {
  const z95 = Finance.normCDFInverse(0.95);
  expect(z95).toBeCloseTo(1.64485, 3);
  expect(Finance.normPDF(0)).toBeGreaterThan(0.39);
  expect(Finance.normPDF(0)).toBeLessThan(0.4);
});

test("bond duration and convexity are finite for standard inputs", () => {
  const { macDuration, modDuration } = Finance.bondDuration(1000, 0.05, 10, 0.04, 2);
  expect(Number.isFinite(macDuration)).toBe(true);
  expect(Number.isFinite(modDuration)).toBe(true);
  expect(Number.isFinite(Finance.bondConvexity(1000, 0.05, 10, 0.04, 2))).toBe(true);
});

test("bond helpers reject structurally invalid inputs", () => {
  expect(Number.isNaN(Finance.bondPrice(0, 0.05, 10, 0.04, 2))).toBe(true);
  expect(Number.isNaN(Finance.bondPrice(1000, -0.05, 10, 0.04, 2))).toBe(true);
  expect(Number.isNaN(Finance.bondPrice(1000, 0.05, 10, -2, 2))).toBe(true);
  expect(Number.isNaN(Finance.bondPrice(1000, 0.05, 10, 0.04, 3))).toBe(true);
  expect(Number.isNaN(Finance.bondPrice(1000, 0.05, 10.25, 0.04, 2))).toBe(true);
  expect(Number.isNaN(Finance.bondDuration(1000, 0.05, 10, -2, 2).macDuration)).toBe(true);
  expect(Number.isNaN(Finance.bondConvexity(1000, 0.05, 10, -2, 2))).toBe(true);
  expect(Number.isNaN(Finance.bondPrice(1000, 0.05, 100, -0.99999, 1))).toBe(true);
  expect(Number.isNaN(Finance.bondDuration(1000, 0.05, 100, -0.99999, 1).macDuration)).toBe(true);
  expect(Number.isNaN(Finance.bondConvexity(1000, 0.05, 100, -0.99999, 1))).toBe(true);
});

test("wacc rejects impossible capital structures and tax rates", () => {
  expect(Number.isNaN(Finance.wacc(0, 0, 0.1, 0.05, 0.25))).toBe(true);
  expect(Number.isNaN(Finance.wacc(-1, 1, 0.1, 0.05, 0.25))).toBe(true);
  expect(Number.isNaN(Finance.wacc(1, 1, 0.1, 0.05, 1.5))).toBe(true);
});

test("wacc avoids overflow when capital values share an extreme scale", () => {
  expect(Finance.wacc(1e308, 1e308, 0.1, 0.05, 0.2)).toBeCloseTo(0.07, 12);
});

test("black scholes supports deterministic zero-volatility pricing", () => {
  expect(Finance.blackScholes("call", 105, 100, 1, 0, 0)).toBe(5);
  expect(Finance.blackScholes("put", 95, 100, 1, 0, 0)).toBe(5);
});

test("black scholes supports discounted deterministic zero-volatility pricing", () => {
  expect(Finance.blackScholes("call", 105, 100, 1, 0.05, 0)).toBeCloseTo(9.8771, 4);
  expect(Finance.blackScholes("put", 95, 100, 1, 0.05, 0)).toBeCloseTo(0.1229, 4);
});

test("option helpers reject unsupported runtime option types", () => {
  expect(Number.isNaN(Finance.blackScholes("straddle" as never, 100, 100, 1, 0.05, 0.2))).toBe(true);
  expect(Object.values(Finance.greeks("straddle" as never, 100, 100, 1, 0.05, 0.2)).every(Number.isNaN)).toBe(true);
});

test("greeks expose undefined expiry sensitivities as NaN", () => {
  expect(Object.values(Finance.greeks("call", 120, 100, 0, 0.05, 0.2)).every(Number.isNaN)).toBe(true);
  expect(Object.values(Finance.greeks("put", 80, 100, 0, 0.05, 0.2)).every(Number.isNaN)).toBe(true);
});

test("greeks implement deterministic zero-volatility boundaries away from the strike", () => {
  const discountedStrike = 100 * Math.exp(-0.05);
  const call = Finance.greeks("call", 105, 100, 1, 0.05, 0);
  const put = Finance.greeks("put", 95, 100, 1, 0.05, 0);

  expect(call.delta).toBe(1);
  expect(call.gamma).toBe(0);
  expect(call.vega).toBe(0);
  expect(call.theta).toBeCloseTo((-0.05 * discountedStrike) / 365, 12);
  expect(call.rho).toBeCloseTo(discountedStrike / 100, 12);
  expect(put.delta).toBe(-1);
  expect(put.gamma).toBe(0);
  expect(put.vega).toBe(0);
  expect(put.theta).toBeCloseTo((0.05 * discountedStrike) / 365, 12);
  expect(put.rho).toBeCloseTo(-discountedStrike / 100, 12);
});

test("macro helpers reject singular negative inflation cases", () => {
  expect(Number.isNaN(Finance.purchasingPower(100, -1, 10))).toBe(true);
  expect(Number.isNaN(Finance.realInterestRate(0.05, -1))).toBe(true);
  expect(Number.isNaN(Finance.cpiAdjust(100, -1, 120))).toBe(true);
  expect(Number.isNaN(Finance.exchangeRatePPP(0, 120))).toBe(true);
  expect(Number.isNaN(Finance.realInterestRate(-1, 0.02))).toBe(true);
});

test("irr rejects cash flows without a sign change", () => {
  expect(Number.isNaN(Finance.irr([100, 200, 300]))).toBe(true);
  expect(Number.isNaN(Finance.irr([-100, -50, -25]))).toBe(true);
});

test("irr handles a break-even one-period project", () => {
  expect(Finance.irr([-100, 100])).toBeCloseTo(0, 6);
});

test("npv treats the first cash flow as period zero", () => {
  expect(Finance.npv(0.1, [-10000, 3000, 4000, 5000, 6000])).toBeCloseTo(3887.7126, 4);
});

test("npv rejects rates at or below -100 percent", () => {
  expect(Number.isNaN(Finance.npv(-1, [-100, 110]))).toBe(true);
});

test("npv rejects invalid cash-flow values instead of silently skipping them", () => {
  expect(Number.isNaN(Finance.npv(0.1, [-100, Number.NaN, 50]))).toBe(true);
});

test("npv uses compensated summation for offsetting large cash flows", () => {
  expect(Finance.npv(0, [1e16, 1, -1e16])).toBe(1);
});

test("paybackPeriod handles period-zero payback and unrecovered projects", () => {
  expect(Finance.paybackPeriod([100, 50])).toBe(0);
  expect(Finance.paybackPeriod([-100, 60, 60])).toBeCloseTo(1.6667, 4);
  expect(Number.isNaN(Finance.paybackPeriod([-100, 10, 10]))).toBe(true);
  expect(Finance.paybackPeriod([-Number.MAX_VALUE, -Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE])).toBe(3);
});

test("cash-flow sign changes ignore zero flows and identify ambiguous IRR patterns", () => {
  expect(Finance.cashFlowSignChanges([-100, 0, 60, 60])).toBe(1);
  expect(Finance.cashFlowSignChanges([-100, 230, -132])).toBe(2);
  expect(Finance.cashFlowSignChanges([0, 0, 0])).toBe(0);
  expect(Number.isNaN(Finance.cashFlowSignChanges([]))).toBe(true);
  expect(Number.isNaN(Finance.cashFlowSignChanges([-100, Number.NaN, 120]))).toBe(true);
});

test("irr falls back to a bracketed solver when the initial guess is poor", () => {
  expect(Finance.irr([-1000, 300, 420, 680], 9)).toBeCloseTo(0.1634, 4);
});

test("irr convergence is invariant to the cash-flow scale", () => {
  expect(Finance.irr([-1e-12, 2e-12])).toBeCloseTo(1, 10);
});

test("rate falls back to a bracketed solver when the initial guess is poor", () => {
  const result = Finance.rate(36, -300, 9000, 0, 0, 9);
  expect(result).toBeCloseTo(0.0102075, 6);
});

test("rate solves valid roots above one thousand percent", () => {
  expect(Finance.rate(1, 0, -100, 1200)).toBeCloseTo(11, 10);
});

test("rate round-trips ordinary and due annuities with the corrected derivative", () => {
  for (const type of [0, 1] as const) {
    const futureValue = Finance.fv(0.035, 48, -125, -5000, type);
    expect(Finance.rate(48, -125, -5000, futureValue, type)).toBeCloseTo(0.035, 10);
  }
});

test("effective and compound rates reject non-positive periodic growth factors", () => {
  expect(Number.isNaN(Finance.effectiveRate(-3, 2))).toBe(true);
  expect(Number.isNaN(Finance.compoundInterest(100, -3, 2, 2))).toBe(true);
  expect(Finance.effectiveRate(0.12, 12)).toBeCloseTo(Math.pow(1.01, 12) - 1, 12);
  expect(Finance.compoundInterest(100, 0.12, 2, 12)).toBeCloseTo(100 * Math.pow(1.01, 24), 10);
});

test("ddm rejects non-positive gross return and growth factors", () => {
  expect(Number.isNaN(Finance.ddm(2, -1.5, -2))).toBe(true);
  expect(Number.isNaN(Finance.ddm(2, 0.05, -1))).toBe(true);
});

test("inverse normal CDF matches reference quantiles across the distribution", () => {
  expect(Finance.normCDFInverse(0.5)).toBeCloseTo(0, 12);
  expect(Finance.normCDFInverse(0.95)).toBeCloseTo(1.6448536269514722, 8);
  expect(Finance.normCDFInverse(0.99)).toBeCloseTo(2.3263478740408408, 8);
  expect(Finance.normCDFInverse(0.999999)).toBeCloseTo(4.753424308822899, 7);
  expect(Finance.normCDFInverse(0.000001)).toBeCloseTo(-4.753424308822899, 7);
});

test("annuity due helpers match explicit begin-period TVM calls", () => {
  expect(Finance.annuityDuePV(0.01, 24, 50, 1000)).toBeCloseTo(Finance.pv(0.01, 24, 50, 1000, 1), 8);
  expect(Finance.annuityDueFV(0.01, 24, 50, 1000)).toBeCloseTo(Finance.fv(0.01, 24, 50, 1000, 1), 8);
});

test("growing annuity rejects singular discount rates and non-positive periods", () => {
  expect(Number.isNaN(Finance.growingAnnuityPV(-1, 10, 100, -1))).toBe(true);
  expect(Number.isNaN(Finance.growingAnnuityPV(0.05, 0, 100, 0.02))).toBe(true);
  expect(Number.isNaN(Finance.growingAnnuityPV(0.05, -1, 100, 0.02))).toBe(true);
});
