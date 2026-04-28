/**
 * Professional Financial Math Library
 * Implements standard financial formulas with high precision.
 */

const isValid = (n: number): boolean => Number.isFinite(n) && !Number.isNaN(n);

const solveByBisection = (
  fn: (rate: number) => number,
  lowerBound = -0.999999,
  upperBound = 10,
  eps = 1e-7,
  maxIter = 200
): number => {
  let lower = lowerBound;
  let upper = upperBound;
  let lowerValue = fn(lower);
  let upperValue = fn(upper);

  if (!isValid(lowerValue) || !isValid(upperValue)) return NaN;
  if (Math.abs(lowerValue) < eps) return lower;
  if (Math.abs(upperValue) < eps) return upper;
  if (lowerValue * upperValue > 0) return NaN;

  for (let i = 0; i < maxIter; i++) {
    const midpoint = (lower + upper) / 2;
    const midpointValue = fn(midpoint);

    if (!isValid(midpointValue)) return NaN;
    if (Math.abs(midpointValue) < eps || Math.abs(upper - lower) < eps) return midpoint;

    if (lowerValue * midpointValue <= 0) {
      upper = midpoint;
      upperValue = midpointValue;
    } else {
      lower = midpoint;
      lowerValue = midpointValue;
    }
  }

  return (lower + upper) / 2;
};

const findBracketedRoot = (fn: (rate: number) => number): number => {
  const candidates = [
    -0.999999, -0.95, -0.9, -0.75, -0.5, -0.25, -0.1, -0.01, 0, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10,
  ];
  let previousRate = candidates[0];
  let previousValue = fn(previousRate);

  for (let i = 1; i < candidates.length; i++) {
    const nextRate = candidates[i];
    const nextValue = fn(nextRate);

    if (!isValid(previousValue)) {
      previousRate = nextRate;
      previousValue = nextValue;
      continue;
    }

    if (isValid(nextValue) && previousValue * nextValue <= 0) {
      return solveByBisection(fn, previousRate, nextRate);
    }

    previousRate = nextRate;
    previousValue = nextValue;
  }

  return NaN;
};

// Type definitions
export interface AmortizationItem {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface BondDurationResult {
  macDuration: number;
  modDuration: number;
}

export interface GreeksResult {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export type PaymentTiming = 0 | 1;
export type LoanMethod = "CPM" | "CAM";
export type OptionType = "call" | "put";

export const Finance = {
  // === TVM ===
  pv: (rate: number, nper: number, pmt: number, fv: number = 0, type: PaymentTiming = 0): number => {
    if (!isValid(rate) || !isValid(nper) || !isValid(pmt) || !isValid(fv)) return NaN;
    if (nper === 0) return NaN;
    if (rate === 0) return -(fv + pmt * nper);
    const term = Math.pow(1 + rate, nper);
    if (!isFinite(term)) return NaN;
    const pv = -(fv + pmt * (1 + rate * type) * ((term - 1) / rate)) / term;
    return pv;
  },
  fv: (rate: number, nper: number, pmt: number, pv: number, type: PaymentTiming = 0): number => {
    if (!isValid(rate) || !isValid(nper) || !isValid(pmt) || !isValid(pv)) return NaN;
    if (nper === 0) return NaN;
    if (rate === 0) return -(pv + pmt * nper);
    const term = Math.pow(1 + rate, nper);
    if (!isFinite(term)) return NaN;
    const fv = -(pv * term + pmt * (1 + rate * type) * ((term - 1) / rate));
    return fv;
  },
  pmt: (rate: number, nper: number, pv: number, fv: number = 0, type: PaymentTiming = 0): number => {
    if (!isValid(rate) || !isValid(nper) || !isValid(pv) || !isValid(fv)) return NaN;
    if (nper === 0) return NaN;
    if (rate === 0) return -(pv + fv) / nper;
    const term = Math.pow(1 + rate, nper);
    if (!isFinite(term)) return NaN;
    const pmt = -(fv + pv * term) / ((1 + rate * type) * ((term - 1) / rate));
    return pmt;
  },
  nper: (rate: number, pmt: number, pv: number, fv: number = 0, type: PaymentTiming = 0): number => {
    if (!isValid(rate) || !isValid(pmt) || !isValid(pv) || !isValid(fv)) return NaN;
    if (rate === 0) {
      if (pmt === 0) return NaN;
      return -(pv + fv) / pmt;
    }
    const num = pmt * (1 + rate * type) - fv * rate;
    const den = pv * rate + pmt * (1 + rate * type);
    if (den === 0 || num / den <= 0) return NaN;
    const logRatio = Math.log(num / den);
    const logRate = Math.log(1 + rate);
    if (!isFinite(logRatio) || !isFinite(logRate) || logRate === 0) return NaN;
    return logRatio / logRate;
  },
  rate: (
    nper: number,
    pmt: number,
    pv: number,
    fv: number = 0,
    type: PaymentTiming = 0,
    guess: number = 0.1
  ): number => {
    if (!isValid(nper) || !isValid(pmt) || !isValid(pv) || !isValid(fv) || !isValid(guess)) return NaN;
    if (nper === 0) return NaN;

    const cashFlowValue = (candidateRate: number): number => {
      if (candidateRate <= -1) return NaN;
      if (Math.abs(candidateRate) < 1e-10) return pv + pmt * nper + fv;

      const term = Math.pow(1 + candidateRate, nper);
      if (!isFinite(term)) return NaN;

      return pv * term + pmt * (1 + candidateRate * type) * ((term - 1) / candidateRate) + fv;
    };

    const eps = 1e-6;
    const maxIter = 100;
    let rate = guess;

    for (let i = 0; i < maxIter; i++) {
      if (rate <= -1) break;

      const term = Math.pow(1 + rate, nper);
      if (!isFinite(term)) break;

      let derivative: number;
      if (Math.abs(rate) < 1e-10) {
        derivative = pv * nper + (pmt * nper * (nper + 1)) / 2;
      } else {
        const annuityFactor = (term - 1) / rate;
        const dAnnuity = (nper * term * rate - (term - 1)) / (rate * rate);
        derivative = pv * nper * term + pmt * (type * annuityFactor + (1 + rate * type) * dAnnuity);
      }

      if (Math.abs(derivative) < 1e-10) break;

      const newRate = rate - cashFlowValue(rate) / derivative;
      if (!isFinite(newRate)) break;
      if (Math.abs(newRate - rate) < eps) return newRate;
      rate = newRate;
    }

    return findBracketedRoot(cashFlowValue);
  },
  npv: (rate: number, values: number[]): number => {
    if (!isValid(rate) || !Array.isArray(values) || values.length === 0) return NaN;
    if (rate <= -1) return NaN;
    return values.reduce((acc, val, i) => {
      if (!isValid(val)) return acc;
      return acc + val / Math.pow(1 + rate, i);
    }, 0);
  },
  irr: (values: number[], guess: number = 0.1): number => {
    if (!Array.isArray(values) || values.length < 2) return NaN;
    if (!isValid(guess) || values.some((value) => !isValid(value))) return NaN;
    if (!values.some((value) => value < 0) || !values.some((value) => value > 0)) return NaN;

    const npvAtRate = (candidateRate: number): number => {
      if (candidateRate <= -1) return NaN;
      return values.reduce((acc, value, period) => acc + value / Math.pow(1 + candidateRate, period), 0);
    };

    const eps = 1e-6;
    const maxIter = 100;
    let rate = guess;

    for (let i = 0; i < maxIter; i++) {
      if (rate <= -1) break;

      let npv = 0;
      let dNpv = 0;
      for (let period = 0; period < values.length; period++) {
        const term = Math.pow(1 + rate, period);
        if (!isFinite(term) || term === 0) {
          npv = NaN;
          break;
        }
        npv += values[period] / term;
        dNpv -= (period * values[period]) / (term * (1 + rate));
      }

      if (!isValid(npv) || Math.abs(dNpv) < 1e-10 || !isFinite(dNpv)) break;

      const newRate = rate - npv / dNpv;
      if (!isFinite(newRate)) break;
      if (Math.abs(newRate - rate) < eps) return newRate;
      rate = newRate;
    }

    return findBracketedRoot(npvAtRate);
  },
  effectiveRate: (nominalRate: number, periodsPerYear: number): number => {
    if (!isValid(nominalRate) || !isValid(periodsPerYear) || periodsPerYear <= 0) return NaN;
    return Math.pow(1 + nominalRate / periodsPerYear, periodsPerYear) - 1;
  },
  amortizationSchedule: (
    principal: number,
    rate: number,
    nper: number,
    method: LoanMethod = "CPM"
  ): AmortizationItem[] => {
    if (!isValid(principal) || !isValid(rate) || !isValid(nper)) return [];
    if (principal <= 0 || nper <= 0) return [];
    const schedule: AmortizationItem[] = [];
    let balance = principal;
    const cpmPmt = method === "CPM" ? Finance.pmt(rate, nper, -principal) : 0;
    const fixedPrincipal = method === "CAM" ? principal / nper : 0;
    for (let i = 1; i <= nper; i++) {
      const interest = balance * rate;
      let payment = 0;
      let princip = 0;
      if (method === "CPM") {
        payment = cpmPmt;
        princip = payment - interest;
      } else {
        princip = fixedPrincipal;
        payment = princip + interest;
      }
      if (i === nper && Math.abs(balance - princip) > 0.01) {
        if (method === "CPM") princip = balance;
        if (method === "CAM") {
          princip = balance;
          payment = princip + interest;
        }
      }
      balance -= princip;
      if (balance < 0) balance = 0;
      schedule.push({ period: i, payment, principal: princip, interest, balance });
    }
    return schedule;
  },

  // === BONDS ===
  bondPrice: (
    faceValue: number,
    couponRate: number,
    yearsToMaturity: number,
    ytm: number,
    frequency: number = 2
  ): number => {
    if (
      !isValid(faceValue) ||
      !isValid(couponRate) ||
      !isValid(yearsToMaturity) ||
      !isValid(ytm) ||
      !isValid(frequency)
    )
      return NaN;
    if (frequency <= 0 || yearsToMaturity <= 0) return NaN;
    const periods = yearsToMaturity * frequency;
    const coupon = (faceValue * couponRate) / frequency;
    const r = ytm / frequency;
    if (r === -1) return NaN;
    let pvCoupons = 0;
    for (let i = 1; i <= periods; i++) {
      pvCoupons += coupon / Math.pow(1 + r, i);
    }
    const pvFace = faceValue / Math.pow(1 + r, periods);
    return pvCoupons + pvFace;
  },
  bondDuration: (
    faceValue: number,
    couponRate: number,
    yearsToMaturity: number,
    ytm: number,
    frequency: number = 2
  ): BondDurationResult => {
    if (
      !isValid(faceValue) ||
      !isValid(couponRate) ||
      !isValid(yearsToMaturity) ||
      !isValid(ytm) ||
      !isValid(frequency)
    )
      return { macDuration: NaN, modDuration: NaN };
    if (frequency <= 0 || yearsToMaturity <= 0) return { macDuration: NaN, modDuration: NaN };
    const periods = yearsToMaturity * frequency;
    const coupon = (faceValue * couponRate) / frequency;
    const r = ytm / frequency;
    const price = Finance.bondPrice(faceValue, couponRate, yearsToMaturity, ytm, frequency);
    if (!isValid(price) || price === 0) return { macDuration: NaN, modDuration: NaN };
    let weightedTime = 0;
    for (let i = 1; i <= periods; i++) {
      const cf = coupon;
      const pvCf = cf / Math.pow(1 + r, i);
      weightedTime += (i * pvCf) / frequency;
    }
    const pvFace = faceValue / Math.pow(1 + r, periods);
    weightedTime += (periods * pvFace) / frequency;
    const macDuration = weightedTime / price;
    const modDuration = macDuration / (1 + r);
    return { macDuration, modDuration };
  },
  bondConvexity: (
    faceValue: number,
    couponRate: number,
    yearsToMaturity: number,
    ytm: number,
    frequency: number = 2
  ): number => {
    if (
      !isValid(faceValue) ||
      !isValid(couponRate) ||
      !isValid(yearsToMaturity) ||
      !isValid(ytm) ||
      !isValid(frequency)
    )
      return NaN;
    if (frequency <= 0 || yearsToMaturity <= 0) return NaN;
    const periods = yearsToMaturity * frequency;
    const coupon = (faceValue * couponRate) / frequency;
    const r = ytm / frequency;
    const price = Finance.bondPrice(faceValue, couponRate, yearsToMaturity, ytm, frequency);
    if (!isValid(price) || price === 0) return NaN;
    let sum = 0;
    for (let i = 1; i <= periods; i++) {
      const t = i;
      const cf = coupon;
      sum += (cf * t * (t + 1)) / Math.pow(1 + r, t + 2);
    }
    sum += (faceValue * periods * (periods + 1)) / Math.pow(1 + r, periods + 2);
    return sum / (price * Math.pow(frequency, 2));
  },

  // === EQUITY ===
  capm: (rf: number, beta: number, rm: number): number => {
    if (!isValid(rf) || !isValid(beta) || !isValid(rm)) return NaN;
    return rf + beta * (rm - rf);
  },
  wacc: (equityValue: number, debtValue: number, costEquity: number, costDebt: number, taxRate: number): number => {
    if (!isValid(equityValue) || !isValid(debtValue) || !isValid(costEquity) || !isValid(costDebt) || !isValid(taxRate))
      return NaN;
    const v = equityValue + debtValue;
    if (v === 0) return 0;
    return (equityValue / v) * costEquity + (debtValue / v) * costDebt * (1 - taxRate);
  },
  ddm: (d1: number, r: number, g: number): number => {
    if (!isValid(d1) || !isValid(r) || !isValid(g)) return NaN;
    if (r <= g) return 0;
    return d1 / (r - g);
  },

  // === OPTIONS (DERIVATIVES) ===

  // Normal Distribution CDF
  normCDF: (x: number): number => {
    if (!isValid(x)) return NaN;
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  },

  // Normal Distribution PDF
  normPDF: (x: number): number => {
    if (!isValid(x)) return NaN;
    return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
  },

  /**
   * Inverse Normal CDF (Quantile Function) — Beasley-Springer-Moro algorithm.
   * Returns z such that normCDF(z) ≈ p. Accuracy ~1e-9.
   * @param p Probability in (0, 1)
   */
  normCDFInverse: (p: number): number => {
    if (!isValid(p) || p <= 0 || p >= 1) return NaN;
    const sign = p < 0.5 ? -1 : 1;
    let t = p < 0.5 ? p : 1 - p;
    t = Math.sqrt(-2.0 * Math.log(t));
    const c0 = 2.515517,
      c1 = 0.802853,
      c2 = 0.010328;
    const d1 = 1.432788,
      d2 = 0.189269,
      d3 = 0.001308;
    const z = t - (c0 + c1 * t + c2 * t * t) / (1.0 + d1 * t + d2 * t * t + d3 * t * t * t);
    return sign * z;
  },

  /**
   * Black-Scholes Formula
   * @param type "call" or "put"
   * @param S Spot Price
   * @param K Strike Price
   * @param t Time to Maturity (Years)
   * @param r Risk-Free Rate
   * @param sigma Volatility
   */
  blackScholes: (type: OptionType, S: number, K: number, t: number, r: number, sigma: number): number => {
    if (!isValid(S) || !isValid(K) || !isValid(t) || !isValid(r) || !isValid(sigma)) return NaN;
    if (S <= 0 || K <= 0 || sigma <= 0) return NaN;
    if (t <= 0) {
      return type === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
    }
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * t) / (sigma * Math.sqrt(t));
    const d2 = d1 - sigma * Math.sqrt(t);

    if (type === "call") {
      return S * Finance.normCDF(d1) - K * Math.exp(-r * t) * Finance.normCDF(d2);
    } else {
      return K * Math.exp(-r * t) * Finance.normCDF(-d2) - S * Finance.normCDF(-d1);
    }
  },

  /**
   * Option Greeks
   */
  greeks: (type: OptionType, S: number, K: number, t: number, r: number, sigma: number): GreeksResult => {
    const zero: GreeksResult = { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
    if (!isValid(S) || !isValid(K) || !isValid(t) || !isValid(r) || !isValid(sigma)) return zero;
    if (t <= 0 || S <= 0 || K <= 0 || sigma <= 0) return zero;

    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * t) / (sigma * Math.sqrt(t));
    const d2 = d1 - sigma * Math.sqrt(t);
    const nd1 = Finance.normPDF(d1);
    const Nd1 = Finance.normCDF(d1);
    const Nd2 = Finance.normCDF(d2);
    const N_d2 = Finance.normCDF(-d2);

    let delta: number, theta: number, rho: number;
    const gamma = nd1 / (S * sigma * Math.sqrt(t));
    const vega = (S * Math.sqrt(t) * nd1) / 100;

    if (type === "call") {
      delta = Nd1;
      theta = (-(S * nd1 * sigma) / (2 * Math.sqrt(t)) - r * K * Math.exp(-r * t) * Nd2) / 365;
      rho = (K * t * Math.exp(-r * t) * Nd2) / 100;
    } else {
      delta = Nd1 - 1;
      theta = (-(S * nd1 * sigma) / (2 * Math.sqrt(t)) + r * K * Math.exp(-r * t) * N_d2) / 365;
      rho = (-K * t * Math.exp(-r * t) * N_d2) / 100;
    }

    return { delta, gamma, theta, vega, rho };
  },

  // === MACROECONOMICS ===
  inflationRate: (startPrice: number, endPrice: number, years: number): number => {
    if (!isValid(startPrice) || !isValid(endPrice) || !isValid(years)) return NaN;
    if (startPrice <= 0 || endPrice <= 0 || years <= 0) return NaN;
    return Math.pow(endPrice / startPrice, 1 / years) - 1;
  },
  purchasingPower: (currentAmount: number, inflationRate: number, years: number): number => {
    if (!isValid(currentAmount) || !isValid(inflationRate) || !isValid(years)) return NaN;
    if (years < 0) return NaN;
    return currentAmount / Math.pow(1 + inflationRate, years);
  },
  realInterestRate: (nominalRate: number, inflationRate: number): number => {
    if (!isValid(nominalRate) || !isValid(inflationRate)) return NaN;
    return (1 + nominalRate) / (1 + inflationRate) - 1;
  },
  cpiAdjust: (amount: number, fromCPI: number, toCPI: number): number => {
    if (!isValid(amount) || !isValid(fromCPI) || !isValid(toCPI)) return NaN;
    if (fromCPI === 0) return NaN;
    return amount * (toCPI / fromCPI);
  },
  exchangeRatePPP: (domesticPrice: number, foreignPrice: number): number => {
    if (!isValid(domesticPrice) || !isValid(foreignPrice)) return NaN;
    if (foreignPrice === 0) return NaN;
    return domesticPrice / foreignPrice;
  },

  // === ADDITIONAL FINANCIAL FUNCTIONS ===
  compoundInterest: (principal: number, rate: number, nper: number, compoundsPerYear: number = 1): number => {
    if (!isValid(principal) || !isValid(rate) || !isValid(nper) || !isValid(compoundsPerYear)) return NaN;
    if (principal < 0 || nper < 0 || compoundsPerYear <= 0) return NaN;
    const totalCompounds = nper * compoundsPerYear;
    const periodicRate = rate / compoundsPerYear;
    return principal * Math.pow(1 + periodicRate, totalCompounds);
  },
  annuityDuePV: (rate: number, nper: number, pmt: number, fv: number = 0): number => {
    if (!isValid(rate) || !isValid(nper) || !isValid(pmt) || !isValid(fv)) return NaN;
    if (nper === 0) return NaN;
    return Finance.pv(rate, nper, pmt, fv, 1);
  },
  annuityDueFV: (rate: number, nper: number, pmt: number, pv: number = 0): number => {
    if (!isValid(rate) || !isValid(nper) || !isValid(pmt) || !isValid(pv)) return NaN;
    if (nper === 0) return NaN;
    return Finance.fv(rate, nper, pmt, pv, 1);
  },
  growingAnnuityPV: (rate: number, nper: number, pmt: number, growthRate: number): number => {
    if (!isValid(rate) || !isValid(nper) || !isValid(pmt) || !isValid(growthRate)) return NaN;
    if (nper === 0) return NaN;
    if (Math.abs(rate - growthRate) < 1e-10) {
      return (pmt * nper) / (1 + rate);
    }
    const numerator = 1 - Math.pow((1 + growthRate) / (1 + rate), nper);
    const denominator = rate - growthRate;
    return (pmt * numerator) / denominator;
  },
};
