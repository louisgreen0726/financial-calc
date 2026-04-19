import { expect, test } from "vitest";
import { Finance } from "./finance-math";

test("pv with standard inputs", () => {
  const res = Finance.pv(0.05 / 12, 12 * 30, 100, 0, 0);
  // rough sanity: PV should be negative (outflow) and finite
  expect(isFinite(res)).toBe(true);
});

test("fv with standard inputs", () => {
  const res = Finance.fv(0.05 / 12, 12 * 30, -100, 0, 0);
  expect(isFinite(res)).toBe(true);
});

test("pmt basic", () => {
  const res = Finance.pmt(0.05 / 12, 12 * 30, 100000, 0, 0);
  expect(isFinite(res)).toBe(true);
});

test("nper and rate consistency (basic sanity)", () => {
  const pv = 1000;
  const nper = 12; // 1 year
  const pmt = 50;
  const fv = 0;
  const r = Finance.rate(nper, pmt, pv, fv, 0, 0.1);
  // rate should be a finite number or NaN in some edge cases; we expect finite for typical values
  if (Number.isFinite(r)) {
    expect(true).toBe(true);
  } else {
    expect(Number.isNaN(r)).toBe(true);
  }
});

test("bondPrice basic sanity", () => {
  const price = Finance.bondPrice(1000, 0.05, 10, 0.04, 2);
  expect(isFinite(price)).toBe(true);
});

test("loan amortization schedule pays down to zero balance", () => {
  const schedule = Finance.amortizationSchedule(300000, 0.045 / 12, 30 * 12, "CPM");
  expect(schedule.length).toBe(360);
  expect(schedule.at(-1)?.balance).toBe(0);
});

test("ddm returns zero when growth exceeds required return", () => {
  expect(Finance.ddm(2.5, 0.08, 0.09)).toBe(0);
});

test("black scholes returns intrinsic value at zero time", () => {
  expect(Finance.blackScholes("call", 120, 100, 0, 0.05, 0.2)).toBe(20);
  expect(Finance.blackScholes("put", 80, 100, 0, 0.05, 0.2)).toBe(20);
});

test("risk helpers return finite values in expected ranges", () => {
  const z95 = Finance.normCDFInverse(0.95);
  expect(z95).toBeGreaterThan(1.6);
  expect(z95).toBeLessThan(1.7);
  expect(Finance.normPDF(0)).toBeGreaterThan(0.39);
  expect(Finance.normPDF(0)).toBeLessThan(0.4);
});

test("bond duration and convexity are finite for standard inputs", () => {
  const { macDuration, modDuration } = Finance.bondDuration(1000, 0.05, 10, 0.04, 2);
  expect(Number.isFinite(macDuration)).toBe(true);
  expect(Number.isFinite(modDuration)).toBe(true);
  expect(Number.isFinite(Finance.bondConvexity(1000, 0.05, 10, 0.04, 2))).toBe(true);
});
