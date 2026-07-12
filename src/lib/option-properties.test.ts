import { describe, expect, it } from "vitest";

import { Finance } from "@/lib/finance-math";

interface Contract {
  S: number;
  K: number;
  t: number;
  r: number;
  sigma: number;
  q: number;
}

const contractMatrix: Contract[] = [
  { S: 100, K: 100, t: 1, r: 0.05, sigma: 0.2, q: 0.02 },
  { S: 80, K: 100, t: 2, r: 0.03, sigma: 0.35, q: 0.01 },
  { S: 130, K: 100, t: 0.5, r: -0.02, sigma: 0.55, q: 0.04 },
  { S: 95, K: 110, t: 5, r: 0.08, sigma: 0.8, q: 0.12 },
  { S: 150, K: 75, t: 3, r: -0.1, sigma: 1.2, q: -0.02 },
  { S: 50, K: 120, t: 10, r: 0.2, sigma: 1.8, q: 0.15 },
  { S: 1_000, K: 850, t: 0.1, r: 0.01, sigma: 0.45, q: 0 },
  { S: 0.5, K: 0.75, t: 1.5, r: 0.04, sigma: 0.25, q: 0.02 },
  { S: 100, K: 100, t: 30, r: 0.01, sigma: 0.05, q: 0.03 },
  { S: 100, K: 100, t: 0.01, r: 0, sigma: 2.5, q: 0 },
];

function tolerance(...values: number[]) {
  return 1e-8 * Math.max(1, ...values.map(Math.abs));
}

function expectApproximately(actual: number, expected: number, multiplier = 1) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(multiplier * tolerance(actual, expected));
}

describe("option pricing property matrix", () => {
  it.each(contractMatrix)("preserves parity and no-arbitrage bounds for %#", (contract) => {
    const { S, K, t, r, sigma, q } = contract;
    const discountedSpot = S * Math.exp(-q * t);
    const discountedStrike = K * Math.exp(-r * t);
    const call = Finance.blackScholes("call", S, K, t, r, sigma, q);
    const put = Finance.blackScholes("put", S, K, t, r, sigma, q);
    const epsilon = tolerance(discountedSpot, discountedStrike, call, put);

    expect(Number.isFinite(call)).toBe(true);
    expect(Number.isFinite(put)).toBe(true);
    expect(call).toBeGreaterThanOrEqual(Math.max(0, discountedSpot - discountedStrike) - epsilon);
    expect(call).toBeLessThanOrEqual(discountedSpot + epsilon);
    expect(put).toBeGreaterThanOrEqual(Math.max(0, discountedStrike - discountedSpot) - epsilon);
    expect(put).toBeLessThanOrEqual(discountedStrike + epsilon);
    expectApproximately(call - put, discountedSpot - discountedStrike);
  });

  it.each(contractMatrix)("is monotone in spot and volatility for %#", (contract) => {
    const { S, K, t, r, sigma, q } = contract;
    const higherSpot = S * 1.01;
    const higherVolatility = Math.min(5, sigma + 0.01);

    const call = Finance.blackScholes("call", S, K, t, r, sigma, q);
    const put = Finance.blackScholes("put", S, K, t, r, sigma, q);
    expect(Finance.blackScholes("call", higherSpot, K, t, r, sigma, q)).toBeGreaterThanOrEqual(call);
    expect(Finance.blackScholes("put", higherSpot, K, t, r, sigma, q)).toBeLessThanOrEqual(put);
    expect(Finance.blackScholes("call", S, K, t, r, higherVolatility, q)).toBeGreaterThanOrEqual(call);
    expect(Finance.blackScholes("put", S, K, t, r, higherVolatility, q)).toBeGreaterThanOrEqual(put);
  });

  it.each(contractMatrix)("is homogeneous in spot and strike for %#", (contract) => {
    const scale = 7.3;
    for (const type of ["call", "put"] as const) {
      const base = Finance.blackScholes(
        type,
        contract.S,
        contract.K,
        contract.t,
        contract.r,
        contract.sigma,
        contract.q
      );
      const scaled = Finance.blackScholes(
        type,
        contract.S * scale,
        contract.K * scale,
        contract.t,
        contract.r,
        contract.sigma,
        contract.q
      );
      expectApproximately(scaled, base * scale);
    }
  });

  it.each(contractMatrix)("preserves call-put Greek identities for %#", (contract) => {
    const { S, K, t, r, sigma, q } = contract;
    const discountedSpot = S * Math.exp(-q * t);
    const discountedStrike = K * Math.exp(-r * t);
    const call = Finance.greeks("call", S, K, t, r, sigma, q);
    const put = Finance.greeks("put", S, K, t, r, sigma, q);

    expect(Object.values(call).every(Number.isFinite)).toBe(true);
    expect(Object.values(put).every(Number.isFinite)).toBe(true);
    expect(call.gamma).toBeGreaterThanOrEqual(0);
    expect(call.vega).toBeGreaterThanOrEqual(0);
    expect(call.delta).toBeGreaterThanOrEqual(0);
    expect(call.delta).toBeLessThanOrEqual(Math.exp(-q * t));
    expect(put.delta).toBeLessThanOrEqual(0);
    expect(put.delta).toBeGreaterThanOrEqual(-Math.exp(-q * t));
    expect(call.rho).toBeGreaterThanOrEqual(0);
    expect(put.rho).toBeLessThanOrEqual(0);
    expectApproximately(call.delta - put.delta, Math.exp(-q * t));
    expectApproximately(call.gamma, put.gamma);
    expectApproximately(call.vega, put.vega);
    expectApproximately(call.theta - put.theta, (q * discountedSpot - r * discountedStrike) / 365);
    expectApproximately(call.rho - put.rho, (t * discountedStrike) / 100);
  });

  it.each(contractMatrix)("round-trips implied volatility for %#", (contract) => {
    for (const type of ["call", "put"] as const) {
      const price = Finance.blackScholes(
        type,
        contract.S,
        contract.K,
        contract.t,
        contract.r,
        contract.sigma,
        contract.q
      );
      const implied = Finance.impliedVolatility(
        type,
        contract.S,
        contract.K,
        contract.t,
        contract.r,
        price,
        contract.q
      );
      expect(implied).toBeCloseTo(contract.sigma, 7);
    }
  });

  it.each(contractMatrix.slice(0, 4))("matches finite-difference Greeks for %#", (contract) => {
    const { S, K, t, r, sigma, q } = contract;
    const spotBump = S * 1e-4;
    const rateBump = 1e-5;
    const volatilityBump = 1e-5;
    const day = 1 / 365;

    for (const type of ["call", "put"] as const) {
      const price = (spot = S, time = t, rate = r, volatility = sigma) =>
        Finance.blackScholes(type, spot, K, time, rate, volatility, q);
      const base = price();
      const greeks = Finance.greeks(type, S, K, t, r, sigma, q);
      const numericDelta = (price(S + spotBump) - price(S - spotBump)) / (2 * spotBump);
      const numericGamma = (price(S + spotBump) - 2 * base + price(S - spotBump)) / (spotBump * spotBump);
      const numericVega =
        (price(S, t, r, sigma + volatilityBump) - price(S, t, r, sigma - volatilityBump)) / (2 * volatilityBump * 100);
      const numericRho = (price(S, t, r + rateBump) - price(S, t, r - rateBump)) / (2 * rateBump * 100);
      const numericTheta = (price(S, t - day) - price(S, t + day)) / 2;

      expect(greeks.delta).toBeCloseTo(numericDelta, 4);
      expect(greeks.gamma).toBeCloseTo(numericGamma, 4);
      expect(greeks.vega).toBeCloseTo(numericVega, 4);
      expect(greeks.rho).toBeCloseTo(numericRho, 4);
      expect(greeks.theta).toBeCloseTo(numericTheta, 4);
    }
  });

  it("solves both supported volatility boundaries exactly", () => {
    for (const type of ["call", "put"] as const) {
      const lowerPrice = Finance.blackScholes(type, 100, 95, 2, 0.03, 0, 0.01);
      const upperPrice = Finance.blackScholes(type, 100, 95, 2, 0.03, 5, 0.01);
      expect(Finance.impliedVolatility(type, 100, 95, 2, 0.03, lowerPrice, 0.01)).toBe(0);
      expect(Finance.impliedVolatility(type, 100, 95, 2, 0.03, upperPrice, 0.01)).toBe(5);
    }
  });
});
