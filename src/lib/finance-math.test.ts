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

test("nper and rate are mutually consistent for a typical annuity", () => {
  const rate = 0.01;
  const nper = 24;
  const pmt = 50;
  const pv = 1000;
  const fv = Finance.fv(rate, nper, pmt, pv, 0);

  expect(Finance.nper(rate, pmt, pv, fv, 0)).toBeCloseTo(nper, 6);
  expect(Finance.rate(nper, pmt, pv, fv, 0, rate)).toBeCloseTo(rate, 6);
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

test("loan amortization supports zero-interest fixed payments", () => {
  const schedule = Finance.amortizationSchedule(1200, 0, 12, "CPM");
  expect(schedule.length).toBe(12);
  expect(schedule[0]?.payment).toBeCloseTo(100, 8);
  expect(schedule[0]?.interest).toBe(0);
  expect(schedule.at(-1)?.balance).toBe(0);
});

test("CAM amortization keeps principal constant until the final rounding period", () => {
  const schedule = Finance.amortizationSchedule(1200, 0.01, 12, "CAM");
  expect(schedule[0]?.principal).toBeCloseTo(100, 8);
  expect(schedule[10]?.principal).toBeCloseTo(100, 8);
  expect(schedule.at(-1)?.balance).toBe(0);
});

test("ddm returns zero when growth exceeds required return", () => {
  expect(Finance.ddm(2.5, 0.08, 0.09)).toBe(0);
});

test("ddm returns the expected intrinsic value for a stable-growth case", () => {
  expect(Finance.ddm(2.5, 0.08, 0.03)).toBeCloseTo(50, 8);
});

test("black scholes returns intrinsic value at zero time", () => {
  expect(Finance.blackScholes("call", 120, 100, 0, 0.05, 0.2)).toBe(20);
  expect(Finance.blackScholes("put", 80, 100, 0, 0.05, 0.2)).toBe(20);
});

test("black scholes matches a standard benchmark at one year", () => {
  expect(Finance.blackScholes("call", 100, 100, 1, 0.05, 0.2)).toBeCloseTo(10.4506, 4);
  expect(Finance.blackScholes("put", 100, 100, 1, 0.05, 0.2)).toBeCloseTo(5.5735, 4);
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
  expect(Number.isNaN(Finance.bondDuration(1000, 0.05, 10, -2, 2).macDuration)).toBe(true);
  expect(Number.isNaN(Finance.bondConvexity(1000, 0.05, 10, -2, 2))).toBe(true);
});

test("wacc rejects impossible capital structures and tax rates", () => {
  expect(Number.isNaN(Finance.wacc(0, 0, 0.1, 0.05, 0.25))).toBe(true);
  expect(Number.isNaN(Finance.wacc(-1, 1, 0.1, 0.05, 0.25))).toBe(true);
  expect(Number.isNaN(Finance.wacc(1, 1, 0.1, 0.05, 1.5))).toBe(true);
});

test("black scholes supports deterministic zero-volatility pricing", () => {
  expect(Finance.blackScholes("call", 105, 100, 1, 0, 0)).toBe(5);
  expect(Finance.blackScholes("put", 95, 100, 1, 0, 0)).toBe(5);
});

test("black scholes supports discounted deterministic zero-volatility pricing", () => {
  expect(Finance.blackScholes("call", 105, 100, 1, 0.05, 0)).toBeCloseTo(9.8771, 4);
  expect(Finance.blackScholes("put", 95, 100, 1, 0.05, 0)).toBeCloseTo(0.1229, 4);
});

test("macro helpers reject singular negative inflation cases", () => {
  expect(Number.isNaN(Finance.purchasingPower(100, -1, 10))).toBe(true);
  expect(Number.isNaN(Finance.realInterestRate(0.05, -1))).toBe(true);
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

test("irr falls back to a bracketed solver when the initial guess is poor", () => {
  expect(Finance.irr([-1000, 300, 420, 680], 9)).toBeCloseTo(0.1634, 4);
});

test("rate falls back to a bracketed solver when the initial guess is poor", () => {
  const result = Finance.rate(36, -300, 9000, 0, 0, 9);
  expect(result).toBeCloseTo(0.0102075, 6);
});

test("annuity due helpers match explicit begin-period TVM calls", () => {
  expect(Finance.annuityDuePV(0.01, 24, 50, 1000)).toBeCloseTo(Finance.pv(0.01, 24, 50, 1000, 1), 8);
  expect(Finance.annuityDueFV(0.01, 24, 50, 1000)).toBeCloseTo(Finance.fv(0.01, 24, 50, 1000, 1), 8);
});
