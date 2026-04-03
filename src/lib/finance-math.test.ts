import { describe, it, expect } from "vitest";
import { Finance } from "@/lib/finance-math";

describe("Finance", () => {
  // === TVM ===
  describe("pv", () => {
    it("calculates present value with positive rate", () => {
      const result = Finance.pv(0.05, 10, 0, 1000);
      expect(result).toBeCloseTo(-613.91, 2);
    });

    it("calculates present value with zero rate", () => {
      const result = Finance.pv(0, 10, 0, 1000);
      expect(result).toBeCloseTo(-1000, 2);
    });

    it("calculates present value with PMT", () => {
      const result = Finance.pv(0.05, 10, -100, 0);
      expect(result).toBeCloseTo(772.17, 2);
    });

    it("returns NaN for invalid inputs", () => {
      expect(Finance.pv(NaN, 10, 0, 1000)).toBeNaN();
      expect(Finance.pv(0.05, NaN, 0, 1000)).toBeNaN();
    });

    it("returns NaN for zero periods", () => {
      expect(Finance.pv(0.05, 0, 0, 1000)).toBeNaN();
    });
  });

  describe("fv", () => {
    it("calculates future value with positive rate", () => {
      const result = Finance.fv(0.05, 10, 0, -1000);
      expect(result).toBeCloseTo(1628.89, 2);
    });

    it("calculates future value with zero rate", () => {
      const result = Finance.fv(0, 10, 0, -1000);
      expect(result).toBeCloseTo(1000, 2);
    });

    it("returns NaN for invalid inputs", () => {
      expect(Finance.fv(NaN, 10, 0, -1000)).toBeNaN();
    });
  });

  describe("pmt", () => {
    it("calculates payment for a loan", () => {
      const result = Finance.pmt(0.05 / 12, 30 * 12, 100000);
      expect(result).toBeCloseTo(-536.82, 1);
    });

    it("returns NaN for zero periods", () => {
      expect(Finance.pmt(0.05, 0, 100000)).toBeNaN();
    });
  });

  describe("nper", () => {
    it("calculates number of periods", () => {
      const result = Finance.nper(0.05, -100, 1000);
      expect(result).toBeCloseTo(14.21, 1);
    });

    it("returns NaN for zero rate and zero PMT", () => {
      expect(Finance.nper(0, 0, 1000)).toBeNaN();
    });
  });

  // === NPV & IRR ===
  describe("npv", () => {
    it("calculates NPV correctly", () => {
      // NPV discounts all flows from period 1: -1000/1.1 + 300/1.21 + 400/1.331 + 500/1.4641
      const result = Finance.npv(0.1, [-1000, 300, 400, 500]);
      expect(result).toBeCloseTo(-19.12, 1);
    });

    it("returns NaN for invalid inputs", () => {
      expect(Finance.npv(NaN, [100])).toBeNaN();
      expect(Finance.npv(0.1, [])).toBeNaN();
    });
  });

  describe("irr", () => {
    it("calculates IRR for positive project", () => {
      const result = Finance.irr([-1000, 300, 400, 500, 200]);
      expect(result).toBeCloseTo(0.15, 1);
    });

    it("returns NaN for insufficient data", () => {
      expect(Finance.irr([100])).toBeNaN();
    });

    it("returns NaN for invalid inputs", () => {
      expect(Finance.irr([])).toBeNaN();
    });
  });

  // === BONDS ===
  describe("bondPrice", () => {
    it("prices a par bond correctly", () => {
      const result = Finance.bondPrice(1000, 0.05, 10, 0.05, 2);
      expect(result).toBeCloseTo(1000, 2);
    });

    it("prices a discount bond correctly", () => {
      const result = Finance.bondPrice(1000, 0.05, 10, 0.06, 2);
      expect(result).toBeLessThan(1000);
    });

    it("prices a premium bond correctly", () => {
      const result = Finance.bondPrice(1000, 0.05, 10, 0.04, 2);
      expect(result).toBeGreaterThan(1000);
    });

    it("returns NaN for invalid inputs", () => {
      expect(Finance.bondPrice(NaN, 0.05, 10, 0.05, 2)).toBeNaN();
    });
  });

  describe("bondDuration", () => {
    it("calculates Macaulay and modified duration", () => {
      const result = Finance.bondDuration(1000, 0.05, 10, 0.05, 2);
      expect(result.macDuration).toBeGreaterThan(0);
      expect(result.modDuration).toBeGreaterThan(0);
      expect(result.modDuration).toBeLessThan(result.macDuration);
    });

    it("returns NaN for invalid inputs", () => {
      const result = Finance.bondDuration(NaN, 0.05, 10, 0.05, 2);
      expect(result.macDuration).toBeNaN();
    });
  });

  describe("bondConvexity", () => {
    it("calculates convexity as positive", () => {
      const result = Finance.bondConvexity(1000, 0.05, 10, 0.05, 2);
      expect(result).toBeGreaterThan(0);
    });
  });

  // === EQUITY ===
  describe("capm", () => {
    it("calculates expected return", () => {
      const result = Finance.capm(0.03, 1.2, 0.1);
      expect(result).toBeCloseTo(0.114, 3);
    });

    it("returns NaN for invalid inputs", () => {
      expect(Finance.capm(NaN, 1.2, 0.1)).toBeNaN();
    });
  });

  describe("wacc", () => {
    it("calculates WACC correctly", () => {
      const result = Finance.wacc(1000000, 500000, 0.12, 0.06, 0.25);
      expect(result).toBeCloseTo(0.095, 2);
    });

    it("returns 0 for zero capital", () => {
      expect(Finance.wacc(0, 0, 0.12, 0.06, 0.25)).toBe(0);
    });
  });

  describe("ddm", () => {
    it("calculates intrinsic value", () => {
      const result = Finance.ddm(2.5, 0.09, 0.04);
      expect(result).toBeCloseTo(50, 1);
    });

    it("returns 0 when growth >= required return", () => {
      expect(Finance.ddm(2.5, 0.04, 0.04)).toBe(0);
      expect(Finance.ddm(2.5, 0.03, 0.04)).toBe(0);
    });
  });

  // === OPTIONS ===
  describe("normCDF", () => {
    it("returns 0.5 for x=0", () => {
      expect(Finance.normCDF(0)).toBeCloseTo(0.5, 5);
    });

    it("returns ~0 for large negative x", () => {
      expect(Finance.normCDF(-10)).toBeCloseTo(0, 5);
    });

    it("returns ~1 for large positive x", () => {
      expect(Finance.normCDF(10)).toBeCloseTo(1, 5);
    });
  });

  describe("normPDF", () => {
    it("returns peak value at x=0", () => {
      expect(Finance.normPDF(0)).toBeCloseTo(0.3989, 3);
    });

    it("returns NaN for invalid input", () => {
      expect(Finance.normPDF(NaN)).toBeNaN();
    });
  });

  describe("normCDFInverse", () => {
    it("returns correct z-scores for common probabilities", () => {
      expect(Finance.normCDFInverse(0.5)).toBeCloseTo(0, 1);
      expect(Finance.normCDFInverse(0.95)).toBeCloseTo(1.64, 1);
      expect(Finance.normCDFInverse(0.975)).toBeCloseTo(1.96, 1);
      expect(Finance.normCDFInverse(0.99)).toBeCloseTo(2.33, 1);
    });

    it("handles extreme probabilities", () => {
      expect(Finance.normCDFInverse(0.0001)).toBeLessThan(-3);
      expect(Finance.normCDFInverse(0.9999)).toBeGreaterThan(3);
    });

    it("returns NaN for probabilities outside (0,1)", () => {
      expect(Finance.normCDFInverse(0)).toBeNaN();
      expect(Finance.normCDFInverse(1)).toBeNaN();
      expect(Finance.normCDFInverse(-0.5)).toBeNaN();
      expect(Finance.normCDFInverse(1.5)).toBeNaN();
      expect(Finance.normCDFInverse(NaN)).toBeNaN();
    });
  });

  describe("blackScholes", () => {
    it("prices ATM call option", () => {
      const result = Finance.blackScholes("call", 100, 100, 1, 0.05, 0.2);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeCloseTo(10.45, 0);
    });

    it("prices ATM put option", () => {
      const result = Finance.blackScholes("put", 100, 100, 1, 0.05, 0.2);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeCloseTo(5.57, 0);
    });

    it("satisfies put-call parity approximately", () => {
      const S = 100,
        K = 100,
        t = 1,
        r = 0.05,
        sigma = 0.2;
      const call = Finance.blackScholes("call", S, K, t, r, sigma);
      const put = Finance.blackScholes("put", S, K, t, r, sigma);
      // C - P ≈ S - K * e^(-rt)
      expect(call - put).toBeCloseTo(S - K * Math.exp(-r * t), 1);
    });

    it("returns intrinsic value at expiry", () => {
      expect(Finance.blackScholes("call", 110, 100, 0, 0.05, 0.2)).toBe(10);
      expect(Finance.blackScholes("put", 90, 100, 0, 0.05, 0.2)).toBe(10);
    });

    it("returns NaN for invalid inputs", () => {
      expect(Finance.blackScholes("call", NaN, 100, 1, 0.05, 0.2)).toBeNaN();
      expect(Finance.blackScholes("call", 100, 100, 1, 0.05, 0)).toBeNaN();
    });
  });

  describe("greeks", () => {
    it("returns all five greeks for call", () => {
      const result = Finance.greeks("call", 100, 100, 1, 0.05, 0.2);
      expect(result.delta).toBeGreaterThan(0);
      expect(result.delta).toBeLessThan(1);
      expect(result.gamma).toBeGreaterThan(0);
      expect(result.vega).toBeGreaterThan(0);
    });

    it("returns all five greeks for put", () => {
      const result = Finance.greeks("put", 100, 100, 1, 0.05, 0.2);
      expect(result.delta).toBeLessThan(0);
      expect(result.delta).toBeGreaterThan(-1);
    });

    it("returns zeros at expiry", () => {
      const result = Finance.greeks("call", 100, 100, 0, 0.05, 0.2);
      expect(result.delta).toBe(0);
      expect(result.gamma).toBe(0);
    });
  });

  // === AMORTIZATION ===
  describe("amortizationSchedule", () => {
    it("generates correct number of periods for CPM", () => {
      const schedule = Finance.amortizationSchedule(100000, 0.05 / 12, 360, "CPM");
      expect(schedule.length).toBe(360);
    });

    it("ends with near-zero balance for CPM", () => {
      const schedule = Finance.amortizationSchedule(100000, 0.05 / 12, 360, "CPM");
      const last = schedule[schedule.length - 1];
      expect(last.balance).toBeCloseTo(0, 0);
    });

    it("generates correct number of periods for CAM", () => {
      const schedule = Finance.amortizationSchedule(100000, 0.05 / 12, 360, "CAM");
      expect(schedule.length).toBe(360);
    });

    it("returns empty array for invalid inputs", () => {
      expect(Finance.amortizationSchedule(-100, 0.05, 360)).toEqual([]);
      expect(Finance.amortizationSchedule(100000, 0.05, 0)).toEqual([]);
    });
  });

  // === EFFECTIVE RATE ===
  describe("effectiveRate", () => {
    it("calculates effective annual rate", () => {
      const result = Finance.effectiveRate(0.12, 12);
      expect(result).toBeCloseTo(0.1268, 3);
    });

    it("returns NaN for invalid inputs", () => {
      expect(Finance.effectiveRate(0.12, 0)).toBeNaN();
    });
  });

  describe("rate", () => {
    it("calculates interest rate for loan", () => {
      const result = Finance.rate(12, 100, -1000, 0);
      expect(result).toBeCloseTo(0.029, 3);
    });
  });

  describe("macro functions", () => {
    describe("inflationRate", () => {
      it("calculates annual inflation rate", () => {
        const result = Finance.inflationRate(100, 150, 10);
        expect(result).toBeCloseTo(0.0414, 3);
      });
    });
    describe("purchasingPower", () => {
      it("calculates future purchasing power", () => {
        const result = Finance.purchasingPower(1000, 0.03, 10);
        expect(result).toBeCloseTo(744.09, 2);
      });
    });
    describe("realInterestRate", () => {
      it("calculates real rate using Fisher equation", () => {
        const result = Finance.realInterestRate(0.05, 0.02);
        expect(result).toBeCloseTo(0.0294, 3);
      });
    });
  });
});
