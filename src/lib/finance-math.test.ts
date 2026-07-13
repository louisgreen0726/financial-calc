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

test("black scholes prices continuous dividends and preserves put-call parity", () => {
  const spot = 100;
  const strike = 100;
  const time = 1;
  const rate = 0.05;
  const volatility = 0.2;
  const dividendYield = 0.02;
  const call = Finance.blackScholes("call", spot, strike, time, rate, volatility, dividendYield);
  const put = Finance.blackScholes("put", spot, strike, time, rate, volatility, dividendYield);

  expect(call).toBeCloseTo(9.227, 3);
  expect(put).toBeCloseTo(6.3301, 3);
  expect(call - put).toBeCloseTo(spot * Math.exp(-dividendYield * time) - strike * Math.exp(-rate * time), 10);
  expect(call).toBeLessThan(Finance.blackScholes("call", spot, strike, time, rate, volatility));
  expect(put).toBeGreaterThan(Finance.blackScholes("put", spot, strike, time, rate, volatility));
});

test("dividend-aware Greeks match standard benchmarks", () => {
  const call = Finance.greeks("call", 100, 100, 1, 0.05, 0.2, 0.02);
  const put = Finance.greeks("put", 100, 100, 1, 0.05, 0.2, 0.02);

  expect(call.delta).toBeCloseTo(0.58685, 4);
  expect(put.delta).toBeCloseTo(-0.39335, 4);
  expect(call.gamma).toBeCloseTo(0.01895, 4);
  expect(put.gamma).toBeCloseTo(call.gamma, 12);
  expect(call.vega).toBeCloseTo(0.37901, 4);
  expect(put.vega).toBeCloseTo(call.vega, 12);
  expect(call.theta).toBeCloseTo(-0.01394, 4);
  expect(put.theta).toBeCloseTo(-0.00628, 4);
  expect(call.rho).toBeCloseTo(0.49458, 4);
  expect(put.rho).toBeCloseTo(-0.45665, 4);
});

test("implied volatility round-trips call and put prices with continuous dividends", () => {
  const contracts = [
    { type: "call" as const, S: 100, K: 100, t: 1, r: 0.05, sigma: 0.2, q: 0 },
    { type: "put" as const, S: 85, K: 100, t: 2, r: 0.03, sigma: 0.35, q: 0.02 },
    { type: "call" as const, S: 150, K: 90, t: 0.25, r: -0.01, sigma: 0.6, q: 0.04 },
  ];

  for (const contract of contracts) {
    const marketPrice = Finance.blackScholes(
      contract.type,
      contract.S,
      contract.K,
      contract.t,
      contract.r,
      contract.sigma,
      contract.q
    );
    expect(
      Finance.impliedVolatility(contract.type, contract.S, contract.K, contract.t, contract.r, marketPrice, contract.q)
    ).toBeCloseTo(contract.sigma, 8);
  }
});

test("implied volatility handles its zero-volatility boundary", () => {
  const discountedSpot = 120 * Math.exp(-0.02);
  const discountedStrike = 100 * Math.exp(-0.05);
  const lowerCallBound = discountedSpot - discountedStrike;

  expect(Finance.impliedVolatility("call", 120, 100, 1, 0.05, lowerCallBound, 0.02)).toBe(0);
});

test("implied volatility rejects impossible prices and unsupported inputs", () => {
  expect(Number.isNaN(Finance.impliedVolatility("call", 100, 100, 1, 0.05, 101))).toBe(true);
  expect(Number.isNaN(Finance.impliedVolatility("put", 100, 100, 1, 0.05, 100))).toBe(true);
  expect(Number.isNaN(Finance.impliedVolatility("call", 100, 100, 0, 0.05, 10))).toBe(true);
  expect(Number.isNaN(Finance.impliedVolatility("straddle" as never, 100, 100, 1, 0.05, 10))).toBe(true);

  const priceAboveSupportedVolatility = Finance.blackScholes("call", 100, 100, 1, 0.05, 5) + 0.01;
  expect(Number.isNaN(Finance.impliedVolatility("call", 100, 100, 1, 0.05, priceAboveSupportedVolatility))).toBe(true);
});

test("black scholes respects no-arbitrage bounds for numerically extreme contracts", () => {
  const spot = 10;
  const strike = 1_000_000;
  const time = 10;
  const rate = -0.99;
  const volatility = 1;
  const discountedStrike = strike * Math.exp(-rate * time);
  const call = Finance.blackScholes("call", spot, strike, time, rate, volatility);
  const put = Finance.blackScholes("put", spot, strike, time, rate, volatility);

  expect(call).toBeGreaterThanOrEqual(0);
  expect(call).toBeLessThanOrEqual(spot);
  expect(put).toBeGreaterThanOrEqual(discountedStrike - spot);
  expect(put).toBeLessThanOrEqual(discountedStrike);
});

test("black scholes remains finite when spot-to-strike ratios underflow or overflow", () => {
  const contracts = [
    { spot: Number.MIN_VALUE, strike: 1e300, expectedCall: 0, expectedPut: 1e300 },
    { spot: 1e300, strike: Number.MIN_VALUE, expectedCall: 1e300, expectedPut: 0 },
  ];

  for (const { spot, strike, expectedCall, expectedPut } of contracts) {
    const call = Finance.blackScholes("call", spot, strike, 1, 0, 0.2);
    const put = Finance.blackScholes("put", spot, strike, 1, 0, 0.2);
    const callGreeks = Finance.greeks("call", spot, strike, 1, 0, 0.2);
    const putGreeks = Finance.greeks("put", spot, strike, 1, 0, 0.2);

    expect(call).toBe(expectedCall);
    expect(put).toBe(expectedPut);
    expect(call - put).toBe(spot - strike);
    expect(Object.values(callGreeks).every(Number.isFinite)).toBe(true);
    expect(Object.values(putGreeks).every(Number.isFinite)).toBe(true);
    expect(callGreeks.gamma).toBe(0);
    expect(putGreeks.gamma).toBe(0);
  }
});

test("option gamma remains accurate across the subnormal-density transition", () => {
  const spot = Number.MIN_VALUE;
  const strike = 1e-320;
  const gamma = Finance.greeks("call", spot, strike, 1, 0, 0.2).gamma;
  const putGamma = Finance.greeks("put", spot, strike, 1, 0, 0.2).gamma;
  const scale = 2;
  const scaledGamma = Finance.greeks("call", spot * scale, strike * scale, 1, 0, 0.2).gamma;

  expect(gamma).toBeCloseTo(4.332662143e10, 0);
  expect(putGamma).toBe(gamma);
  expect((scaledGamma * scale) / gamma).toBeCloseTo(1, 10);
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

test("zero-volatility option pricing and Greeks include continuous dividends", () => {
  const discountedSpot = 105 * Math.exp(-0.02);
  const discountedStrike = 100 * Math.exp(-0.05);
  const call = Finance.blackScholes("call", 105, 100, 1, 0.05, 0, 0.02);
  const greeks = Finance.greeks("call", 105, 100, 1, 0.05, 0, 0.02);

  expect(call).toBeCloseTo(discountedSpot - discountedStrike, 12);
  expect(greeks.delta).toBeCloseTo(Math.exp(-0.02), 12);
  expect(greeks.theta).toBeCloseTo((0.02 * discountedSpot - 0.05 * discountedStrike) / 365, 12);
  expect(greeks.rho).toBeCloseTo(discountedStrike / 100, 12);
});

test("option helpers reject unsupported runtime option types", () => {
  expect(Number.isNaN(Finance.blackScholes("straddle" as never, 100, 100, 1, 0.05, 0.2))).toBe(true);
  expect(Object.values(Finance.greeks("straddle" as never, 100, 100, 1, 0.05, 0.2)).every(Number.isNaN)).toBe(true);
});

test("option helpers reject non-finite dividend yields", () => {
  expect(Number.isNaN(Finance.blackScholes("call", 100, 100, 1, 0.05, 0.2, Number.NaN))).toBe(true);
  expect(
    Object.values(Finance.greeks("call", 100, 100, 1, 0.05, 0.2, Number.POSITIVE_INFINITY)).every(Number.isNaN)
  ).toBe(true);
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

test("npv ignores exact zero tails without hiding nonzero overflow", () => {
  const nearSingularRate = -0.9999999999999999;

  expect(Finance.npv(nearSingularRate, [-100, ...Array(119).fill(0)])).toBe(-100);
  expect(Finance.npv(nearSingularRate, [-100, ...Array(119).fill(-0)])).toBe(-100);
  expect(Finance.npv(nearSingularRate, Array(120).fill(0))).toBe(0);
  expect(Finance.npv(Number.MAX_VALUE, [100, ...Array(119).fill(0)])).toBe(100);
  for (const nonzeroTail of [1, -1]) {
    expect(Number.isNaN(Finance.npv(nearSingularRate, [0, ...Array(20).fill(0), nonzeroTail]))).toBe(true);
  }
});

test("irr is invariant to appended exact zero cash flows", () => {
  const baseCashFlows = [-100, 0.1];
  const baseIrr = Finance.irr(baseCashFlows);

  expect(baseIrr).toBeCloseTo(-0.999, 10);
  expect(Finance.irr([...baseCashFlows, ...Array(118).fill(0)])).toBeCloseTo(baseIrr, 12);
  expect(Finance.irr([...baseCashFlows, ...Array(118).fill(-0)])).toBeCloseTo(baseIrr, 12);
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

test("rate sign changes identify ordinary and due cash-flow patterns with multiple possible roots", () => {
  expect(Finance.rateSignChanges(2, -225, 100, 351, 0)).toBe(2);
  expect(Finance.rateSignChanges(2, -225, 325, 126, 1)).toBe(2);
  expect(Finance.rateSignChanges(2, -190, 100, 278, 0)).toBe(2);
  expect(Finance.rateSignChanges(60, -466.08, 25000, 0, 0)).toBe(1);
});

test("rate sign changes compress one-period and zero coefficients without creating false reversals", () => {
  expect(Finance.rateSignChanges(1, -225, 100, 351, 0)).toBe(0);
  expect(Finance.rateSignChanges(1, -225, 325, 126, 1)).toBe(0);
  expect(Finance.rateSignChanges(2, 0, 100, -100, 0)).toBe(1);
  expect(Finance.rateSignChanges(2, -100, 100, 50, 1)).toBe(1);
  expect(Finance.rateSignChanges(2, 0, 0, 0, 0)).toBe(0);
});

test("rate sign changes reject invalid runtime inputs", () => {
  for (const nper of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    expect(Number.isNaN(Finance.rateSignChanges(nper, -100, 100, 0))).toBe(true);
  }
  expect(Number.isNaN(Finance.rateSignChanges(2, Number.NaN, 100, 0))).toBe(true);
  expect(Number.isNaN(Finance.rateSignChanges(2, -100, Number.POSITIVE_INFINITY, 0))).toBe(true);
  expect(Number.isNaN(Finance.rateSignChanges(2, -100, 100, Number.NEGATIVE_INFINITY))).toBe(true);
  expect(Number.isNaN(Finance.rateSignChanges(2, -100, 100, 0, 2 as never))).toBe(true);
  expect(Number.isNaN(Finance.rateSignChanges(2, Number.MAX_VALUE, -1, Number.MAX_VALUE, 0))).toBe(true);
  expect(Number.isNaN(Finance.rateSignChanges(2, Number.MAX_VALUE, Number.MAX_VALUE, -1, 1))).toBe(true);
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

test.each([
  {
    label: "ordinary annuity with two positive roots",
    nper: 2,
    pmt: -225,
    pv: 100,
    fv: 351,
    type: 0 as const,
    guesses: [0.04, 0.21],
    expectedRoots: [0.05, 0.2],
    defaultRoot: 0.05,
  },
  {
    label: "annuity due with two positive roots",
    nper: 2,
    pmt: -225,
    pv: 325,
    fv: 126,
    type: 1 as const,
    guesses: [0.04, 0.21],
    expectedRoots: [0.05, 0.2],
    defaultRoot: 0.05,
  },
  {
    label: "ordinary annuity with negative and positive roots",
    nper: 2,
    pmt: -190,
    pv: 100,
    fv: 278,
    type: 0 as const,
    guesses: [-0.2, 0.1],
    expectedRoots: [-0.2, 0.1],
    defaultRoot: 0.1,
  },
])(
  "rate follows the initial guess across $label",
  ({ nper, pmt, pv, fv, type, guesses, expectedRoots, defaultRoot }) => {
    const roots = guesses.map((guess) => Finance.rate(nper, pmt, pv, fv, type, guess));

    expect(roots[0]).toBeCloseTo(expectedRoots[0], 8);
    expect(roots[1]).toBeCloseTo(expectedRoots[1], 8);
    expect(Finance.rate(nper, pmt, pv, fv, type)).toBeCloseTo(defaultRoot, 8);
    expect(Math.abs(roots[0] - roots[1])).toBeGreaterThan(0.01);
    for (const root of roots) {
      expect(root).toBeGreaterThan(-1);
      expect(Finance.fv(root, nper, pmt, pv, type)).toBeCloseTo(fv, 8);
    }
  }
);

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
