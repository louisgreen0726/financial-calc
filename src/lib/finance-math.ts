/**
 * Professional Financial Math Library
 * Implements standard financial formulas with high precision.
 */

import {
  ANNUAL_FREQUENCY,
  MAX_PERIODS,
  MONTHLY_FREQUENCY,
  QUARTERLY_FREQUENCY,
  SEMIANNUAL_FREQUENCY,
} from "./constants";

const isValid = (n: number): boolean => Number.isFinite(n) && !Number.isNaN(n);
const isSupportedBondFrequency = (frequency: number) =>
  [ANNUAL_FREQUENCY, SEMIANNUAL_FREQUENCY, QUARTERLY_FREQUENCY, MONTHLY_FREQUENCY].includes(frequency);
const isSupportedPaymentTiming = (type: number) => type === 0 || type === 1;
const isSupportedLoanMethod = (method: string) => method === "CPM" || method === "CAM";
const isSupportedOptionType = (type: string) => type === "call" || type === "put";
const toWholePeriods = (years: number, frequency: number) => {
  const periods = years * frequency;
  return Number.isInteger(periods) ? periods : NaN;
};

const neumaierSum = (values: number[]): number => {
  let sum = 0;
  let compensation = 0;

  for (const value of values) {
    const next = sum + value;
    compensation += Math.abs(sum) >= Math.abs(value) ? sum - next + value : value - next + sum;
    sum = next;
  }

  return sum + compensation;
};

const getTvmFactors = (rate: number, nper: number): { term: number; annuityFactor: number } | null => {
  if (rate === 0) return { term: 1, annuityFactor: nper };

  const exponent = nper * Math.log1p(rate);
  const term = Math.exp(exponent);
  const annuityFactor = Math.expm1(exponent) / rate;

  return isValid(term) && isValid(annuityFactor) ? { term, annuityFactor } : null;
};

interface RootEvaluation {
  value: number;
  scale: number;
}

const normalizeTerms = (terms: number[]): RootEvaluation | null => {
  if (terms.some((term) => !isValid(term))) return null;

  const scale = Math.max(...terms.map(Math.abs), Number.MIN_VALUE);
  const value = neumaierSum(terms.map((term) => term / scale));
  return isValid(value) ? { value, scale } : null;
};

const solveByBisection = (
  fn: (rate: number) => number,
  lowerBound: number,
  upperBound: number,
  valueTolerance = 1e-12,
  rateTolerance = 1e-12,
  maxIter = 200
): number => {
  let lower = lowerBound;
  let upper = upperBound;
  let lowerValue = fn(lower);
  let upperValue = fn(upper);

  if (!isValid(lowerValue) || !isValid(upperValue)) return NaN;
  if (Math.abs(lowerValue) < valueTolerance) return lower;
  if (Math.abs(upperValue) < valueTolerance) return upper;
  if (lowerValue * upperValue > 0) return NaN;

  for (let i = 0; i < maxIter; i++) {
    const midpoint = (lower + upper) / 2;
    const midpointValue = fn(midpoint);

    if (!isValid(midpointValue)) return NaN;
    if (
      Math.abs(midpointValue) < valueTolerance ||
      Math.abs(upper - lower) <= rateTolerance * Math.max(1, Math.abs(midpoint))
    ) {
      return midpoint;
    }

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

  for (let rate = 20; rate <= 1_000_000; rate *= 2) candidates.push(rate);
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
    if (!isValid(rate) || !isValid(nper) || !isValid(pmt) || !isValid(fv) || !isSupportedPaymentTiming(type))
      return NaN;
    if (nper <= 0 || rate <= -1) return NaN;
    if (rate === 0) return -(fv + pmt * nper);
    const factors = getTvmFactors(rate, nper);
    if (!factors || factors.term === 0) return NaN;
    const pv = -(fv + pmt * (1 + rate * type) * factors.annuityFactor) / factors.term;
    return isValid(pv) ? pv : NaN;
  },
  fv: (rate: number, nper: number, pmt: number, pv: number, type: PaymentTiming = 0): number => {
    if (!isValid(rate) || !isValid(nper) || !isValid(pmt) || !isValid(pv) || !isSupportedPaymentTiming(type))
      return NaN;
    if (nper <= 0 || rate <= -1) return NaN;
    if (rate === 0) return -(pv + pmt * nper);
    const factors = getTvmFactors(rate, nper);
    if (!factors) return NaN;
    const fv = -(pv * factors.term + pmt * (1 + rate * type) * factors.annuityFactor);
    return isValid(fv) ? fv : NaN;
  },
  pmt: (rate: number, nper: number, pv: number, fv: number = 0, type: PaymentTiming = 0): number => {
    if (!isValid(rate) || !isValid(nper) || !isValid(pv) || !isValid(fv) || !isSupportedPaymentTiming(type)) return NaN;
    if (nper <= 0 || rate <= -1) return NaN;
    if (rate === 0) return -(pv + fv) / nper;
    const factors = getTvmFactors(rate, nper);
    if (!factors || factors.annuityFactor === 0) return NaN;
    const pmt = -(fv + pv * factors.term) / ((1 + rate * type) * factors.annuityFactor);
    return isValid(pmt) ? pmt : NaN;
  },
  nper: (rate: number, pmt: number, pv: number, fv: number = 0, type: PaymentTiming = 0): number => {
    if (!isValid(rate) || !isValid(pmt) || !isValid(pv) || !isValid(fv) || !isSupportedPaymentTiming(type)) return NaN;
    if (rate <= -1) return NaN;
    if (rate === 0) {
      if (pmt === 0) return NaN;
      return -(pv + fv) / pmt;
    }
    const num = pmt * (1 + rate * type) - fv * rate;
    const den = pv * rate + pmt * (1 + rate * type);
    if (den === 0 || num / den <= 0) return NaN;
    const logRatio = Math.log(Math.abs(num) / Math.abs(den));
    const logRate = Math.log1p(rate);
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
    if (
      !isValid(nper) ||
      !isValid(pmt) ||
      !isValid(pv) ||
      !isValid(fv) ||
      !isValid(guess) ||
      !isSupportedPaymentTiming(type)
    )
      return NaN;
    if (nper <= 0) return NaN;

    const isIndeterminate =
      nper === 1
        ? type === 0
          ? pv === 0 && pmt + fv === 0
          : pv + pmt === 0 && fv === 0
        : pv === 0 && pmt === 0 && fv === 0;
    if (isIndeterminate) return NaN;

    const evaluateCashFlow = (candidateRate: number): RootEvaluation | null => {
      if (candidateRate <= -1) return null;
      const factors = getTvmFactors(candidateRate, nper);
      if (!factors) return null;

      return normalizeTerms([pv * factors.term, pmt * (1 + candidateRate * type) * factors.annuityFactor, fv]);
    };

    const cashFlowValue = (candidateRate: number): number => evaluateCashFlow(candidateRate)?.value ?? NaN;

    const valueTolerance = 1e-12;
    const rateTolerance = 1e-12;
    const maxIter = 100;
    let rate = guess;

    for (let i = 0; i < maxIter; i++) {
      if (rate <= -1) break;

      const factors = getTvmFactors(rate, nper);
      const evaluation = evaluateCashFlow(rate);
      if (!factors || !evaluation) break;
      if (Math.abs(evaluation.value) < valueTolerance) return rate;

      let annuityDerivative: number;
      if (Math.abs(rate) < 1e-7) {
        const firstOrder = (nper * (nper - 1)) / 2;
        const secondOrder = (nper * (nper - 1) * (nper - 2)) / 3;
        annuityDerivative = firstOrder + secondOrder * rate;
      } else {
        const termDerivative = (nper * factors.term) / (1 + rate);
        annuityDerivative = (termDerivative - factors.annuityFactor) / rate;
      }

      const termDerivative = (nper * factors.term) / (1 + rate);
      const derivative =
        pv * termDerivative + pmt * (type * factors.annuityFactor + (1 + rate * type) * annuityDerivative);
      const normalizedDerivative = derivative / evaluation.scale;
      if (!isValid(normalizedDerivative) || Math.abs(normalizedDerivative) < Number.EPSILON) break;

      const newRate = rate - evaluation.value / normalizedDerivative;
      if (!isFinite(newRate)) break;
      if (Math.abs(newRate - rate) <= rateTolerance * Math.max(1, Math.abs(newRate))) {
        const nextEvaluation = evaluateCashFlow(newRate);
        if (nextEvaluation && Math.abs(nextEvaluation.value) < valueTolerance) return newRate;
        break;
      }
      rate = newRate;
    }

    return findBracketedRoot(cashFlowValue);
  },
  npv: (rate: number, values: number[]): number => {
    if (!isValid(rate) || !Array.isArray(values) || values.length === 0) return NaN;
    if (rate <= -1) return NaN;
    if (values.some((value) => !isValid(value))) return NaN;
    const logRate = Math.log1p(rate);
    const discountedValues = values.map((value, period) => {
      const discountFactor = Math.exp(logRate * period);
      if (discountFactor === Infinity) return 0;
      return discountFactor === 0 ? NaN : value / discountFactor;
    });
    if (discountedValues.some((value) => !isValid(value))) return NaN;
    const result = neumaierSum(discountedValues);
    return isValid(result) ? result : NaN;
  },
  paybackPeriod: (values: number[]): number => {
    if (!Array.isArray(values) || values.length === 0 || values.some((value) => !isValid(value))) return NaN;

    const scale = values.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
    if (scale === 0) return 0;

    let cumulative = 0;
    for (let i = 0; i < values.length; i++) {
      const normalizedValue = values[i] / scale;
      cumulative += normalizedValue;
      if (cumulative >= 0) {
        if (i === 0) return 0;

        const previousCumulative = cumulative - normalizedValue;
        if (normalizedValue === 0) return i;
        return i - 1 + -previousCumulative / normalizedValue;
      }
    }

    return NaN;
  },
  cashFlowSignChanges: (values: number[]): number => {
    if (!Array.isArray(values) || values.length === 0 || values.some((value) => !isValid(value))) return NaN;

    let changes = 0;
    let previousSign = 0;

    for (const value of values) {
      if (value === 0) continue;
      const sign = Math.sign(value);
      if (previousSign !== 0 && sign !== previousSign) changes++;
      previousSign = sign;
    }

    return changes;
  },
  irr: (values: number[], guess: number = 0.1): number => {
    if (!Array.isArray(values) || values.length < 2) return NaN;
    if (!isValid(guess) || values.some((value) => !isValid(value))) return NaN;
    if (!values.some((value) => value < 0) || !values.some((value) => value > 0)) return NaN;

    const evaluateNpv = (candidateRate: number): RootEvaluation | null => {
      if (candidateRate <= -1) return null;
      const logRate = Math.log1p(candidateRate);
      const terms = values.map((value, period) => {
        const discountFactor = Math.exp(logRate * period);
        if (discountFactor === Infinity) return 0;
        return discountFactor === 0 ? NaN : value / discountFactor;
      });
      return normalizeTerms(terms);
    };

    const npvAtRate = (candidateRate: number): number => evaluateNpv(candidateRate)?.value ?? NaN;

    const valueTolerance = 1e-12;
    const rateTolerance = 1e-12;
    const maxIter = 100;
    let rate = guess;

    for (let i = 0; i < maxIter; i++) {
      if (rate <= -1) break;

      const evaluation = evaluateNpv(rate);
      if (!evaluation) break;
      if (Math.abs(evaluation.value) < valueTolerance) return rate;

      const derivativeTerms: number[] = [];
      for (let period = 0; period < values.length; period++) {
        const discountFactor = Math.exp(Math.log1p(rate) * period);
        derivativeTerms.push(
          discountFactor === Infinity ? 0 : -(period * values[period]) / (discountFactor * (1 + rate))
        );
      }

      const dNpv = neumaierSum(derivativeTerms) / evaluation.scale;
      if (!isValid(dNpv) || Math.abs(dNpv) < Number.EPSILON) break;

      const newRate = rate - evaluation.value / dNpv;
      if (!isFinite(newRate)) break;
      if (Math.abs(newRate - rate) <= rateTolerance * Math.max(1, Math.abs(newRate))) {
        const nextEvaluation = evaluateNpv(newRate);
        if (nextEvaluation && Math.abs(nextEvaluation.value) < valueTolerance) return newRate;
        break;
      }
      rate = newRate;
    }

    return findBracketedRoot(npvAtRate);
  },
  effectiveRate: (nominalRate: number, periodsPerYear: number): number => {
    if (!isValid(nominalRate) || !isValid(periodsPerYear) || periodsPerYear <= 0) return NaN;
    const periodicRate = nominalRate / periodsPerYear;
    if (periodicRate <= -1) return NaN;
    const result = Math.expm1(periodsPerYear * Math.log1p(periodicRate));
    return isValid(result) ? result : NaN;
  },
  amortizationSchedule: (
    principal: number,
    rate: number,
    nper: number,
    method: LoanMethod = "CPM"
  ): AmortizationItem[] => {
    if (!isValid(principal) || !isValid(rate) || !isValid(nper)) return [];
    if (principal <= 0 || rate < 0 || nper <= 0 || !Number.isInteger(nper) || !isSupportedLoanMethod(method)) return [];
    const periods = nper;
    if (periods > MAX_PERIODS) return [];
    const schedule: AmortizationItem[] = [];
    let balance = principal;
    const cpmPmt = method === "CPM" ? Finance.pmt(rate, periods, -principal) : 0;
    const fixedPrincipal = method === "CAM" ? principal / periods : 0;
    if (method === "CPM" && !isValid(cpmPmt)) return [];
    for (let i = 1; i <= periods; i++) {
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
      if (i === periods) {
        princip = balance;
        payment = princip + interest;
      }
      if (![payment, princip, interest].every(isValid)) return [];
      balance -= princip;
      if (!isValid(balance)) return [];
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
    if (faceValue <= 0 || couponRate < 0 || !isSupportedBondFrequency(frequency) || yearsToMaturity <= 0) return NaN;
    const periods = toWholePeriods(yearsToMaturity, frequency);
    if (!isValid(periods) || periods <= 0 || periods > MAX_PERIODS) return NaN;
    const coupon = (faceValue * couponRate) / frequency;
    const r = ytm / frequency;
    if (r <= -1) return NaN;
    let pvCoupons = 0;
    for (let i = 1; i <= periods; i++) {
      const pvCoupon = coupon / Math.pow(1 + r, i);
      if (!isValid(pvCoupon)) return NaN;
      pvCoupons += pvCoupon;
    }
    const pvFace = faceValue / Math.pow(1 + r, periods);
    const price = pvCoupons + pvFace;
    return isValid(pvFace) && isValid(price) ? price : NaN;
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
    if (
      faceValue <= 0 ||
      couponRate < 0 ||
      !isSupportedBondFrequency(frequency) ||
      yearsToMaturity <= 0 ||
      ytm / frequency <= -1
    ) {
      return { macDuration: NaN, modDuration: NaN };
    }
    const periods = toWholePeriods(yearsToMaturity, frequency);
    if (!isValid(periods) || periods <= 0 || periods > MAX_PERIODS) return { macDuration: NaN, modDuration: NaN };
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
    return isValid(macDuration) && isValid(modDuration)
      ? { macDuration, modDuration }
      : { macDuration: NaN, modDuration: NaN };
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
    if (
      faceValue <= 0 ||
      couponRate < 0 ||
      !isSupportedBondFrequency(frequency) ||
      yearsToMaturity <= 0 ||
      ytm / frequency <= -1
    ) {
      return NaN;
    }
    const periods = toWholePeriods(yearsToMaturity, frequency);
    if (!isValid(periods) || periods <= 0 || periods > MAX_PERIODS) return NaN;
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
    const convexity = sum / (price * Math.pow(frequency, 2));
    return isValid(convexity) ? convexity : NaN;
  },

  // === EQUITY ===
  capm: (rf: number, beta: number, rm: number): number => {
    if (!isValid(rf) || !isValid(beta) || !isValid(rm)) return NaN;
    const result = rf + beta * (rm - rf);
    return isValid(result) ? result : NaN;
  },
  wacc: (equityValue: number, debtValue: number, costEquity: number, costDebt: number, taxRate: number): number => {
    if (!isValid(equityValue) || !isValid(debtValue) || !isValid(costEquity) || !isValid(costDebt) || !isValid(taxRate))
      return NaN;
    if (equityValue < 0 || debtValue < 0 || taxRate < 0 || taxRate > 1) return NaN;
    const scale = Math.max(equityValue, debtValue);
    if (scale <= 0) return NaN;
    const scaledEquity = equityValue / scale;
    const scaledDebt = debtValue / scale;
    const scaledTotal = scaledEquity + scaledDebt;
    const result = (scaledEquity / scaledTotal) * costEquity + (scaledDebt / scaledTotal) * costDebt * (1 - taxRate);
    return isValid(result) ? result : NaN;
  },
  ddm: (d1: number, r: number, g: number): number => {
    if (!isValid(d1) || !isValid(r) || !isValid(g)) return NaN;
    if (d1 < 0 || r <= -1 || g <= -1 || r <= g) return NaN;
    const result = d1 / (r - g);
    return isValid(result) ? result : NaN;
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
   * Inverse Normal CDF (Quantile Function) using Peter Acklam's rational approximation.
   * Returns z such that normCDF(z) is approximately p with absolute error around 1e-9.
   * @param p Probability in (0, 1)
   */
  normCDFInverse: (p: number): number => {
    if (!isValid(p) || p <= 0 || p >= 1) return NaN;

    const a = [
      -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1,
      2.506628277459239,
    ];
    const b = [
      -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1,
    ];
    const c = [
      -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968,
      2.938163982698783,
    ];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    const lowerTail = 0.02425;
    const upperTail = 1 - lowerTail;

    if (p < lowerTail) {
      const q = Math.sqrt(-2 * Math.log(p));
      return (
        (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
      );
    }

    if (p > upperTail) {
      const q = Math.sqrt(-2 * Math.log1p(-p));
      return -(
        (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
      );
    }

    const q = p - 0.5;
    const r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
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
    if (!isSupportedOptionType(type)) return NaN;
    if (S <= 0 || K <= 0 || t < 0 || sigma < 0) return NaN;
    if (t <= 0) {
      return type === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
    }
    if (sigma === 0) {
      const discountedStrike = K * Math.exp(-r * t);
      if (!isValid(discountedStrike)) return NaN;
      const deterministicPrice =
        type === "call" ? Math.max(S - discountedStrike, 0) : Math.max(discountedStrike - S, 0);
      return isValid(deterministicPrice) ? deterministicPrice : NaN;
    }
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * t) / (sigma * Math.sqrt(t));
    const d2 = d1 - sigma * Math.sqrt(t);

    const price =
      type === "call"
        ? S * Finance.normCDF(d1) - K * Math.exp(-r * t) * Finance.normCDF(d2)
        : K * Math.exp(-r * t) * Finance.normCDF(-d2) - S * Finance.normCDF(-d1);
    return isValid(price) ? price : NaN;
  },

  /**
   * Option Greeks
   */
  greeks: (type: OptionType, S: number, K: number, t: number, r: number, sigma: number): GreeksResult => {
    const undefinedGreeks: GreeksResult = { delta: NaN, gamma: NaN, theta: NaN, vega: NaN, rho: NaN };
    if (!isValid(S) || !isValid(K) || !isValid(t) || !isValid(r) || !isValid(sigma)) return undefinedGreeks;
    if (!isSupportedOptionType(type)) return undefinedGreeks;
    if (t <= 0 || S <= 0 || K <= 0 || sigma < 0) return undefinedGreeks;

    if (sigma === 0) {
      const discountedStrike = K * Math.exp(-r * t);
      if (!isValid(discountedStrike) || S === discountedStrike) return undefinedGreeks;

      const deterministicTheta = (r * discountedStrike) / 365;
      const deterministicRho = (t * discountedStrike) / 100;
      if (!isValid(deterministicTheta) || !isValid(deterministicRho)) return undefinedGreeks;
      if (type === "call") {
        return S > discountedStrike
          ? { delta: 1, gamma: 0, theta: -deterministicTheta, vega: 0, rho: deterministicRho }
          : { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
      }

      return S < discountedStrike
        ? { delta: -1, gamma: 0, theta: deterministicTheta, vega: 0, rho: -deterministicRho }
        : { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
    }

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

    const result = { delta, gamma, theta, vega, rho };
    return Object.values(result).every(isValid) ? result : undefinedGreeks;
  },

  // === MACROECONOMICS ===
  inflationRate: (startPrice: number, endPrice: number, years: number): number => {
    if (!isValid(startPrice) || !isValid(endPrice) || !isValid(years)) return NaN;
    if (startPrice <= 0 || endPrice <= 0 || years <= 0) return NaN;
    const result = Math.pow(endPrice / startPrice, 1 / years) - 1;
    return isValid(result) ? result : NaN;
  },
  purchasingPower: (currentAmount: number, inflationRate: number, years: number): number => {
    if (!isValid(currentAmount) || !isValid(inflationRate) || !isValid(years)) return NaN;
    if (years < 0) return NaN;
    if (1 + inflationRate <= 0) return NaN;
    const result = currentAmount / Math.pow(1 + inflationRate, years);
    return isValid(result) ? result : NaN;
  },
  realInterestRate: (nominalRate: number, inflationRate: number): number => {
    if (!isValid(nominalRate) || !isValid(inflationRate)) return NaN;
    if (nominalRate <= -1 || inflationRate <= -1) return NaN;
    const result = (1 + nominalRate) / (1 + inflationRate) - 1;
    return isValid(result) ? result : NaN;
  },
  cpiAdjust: (amount: number, fromCPI: number, toCPI: number): number => {
    if (!isValid(amount) || !isValid(fromCPI) || !isValid(toCPI)) return NaN;
    if (amount < 0 || fromCPI <= 0 || toCPI <= 0) return NaN;
    const result = amount * (toCPI / fromCPI);
    return isValid(result) ? result : NaN;
  },
  exchangeRatePPP: (domesticPrice: number, foreignPrice: number): number => {
    if (!isValid(domesticPrice) || !isValid(foreignPrice)) return NaN;
    if (domesticPrice <= 0 || foreignPrice <= 0) return NaN;
    // Units of foreign currency required to buy one unit of domestic currency.
    const result = foreignPrice / domesticPrice;
    return isValid(result) ? result : NaN;
  },

  // === ADDITIONAL FINANCIAL FUNCTIONS ===
  compoundInterest: (principal: number, rate: number, nper: number, compoundsPerYear: number = 1): number => {
    if (!isValid(principal) || !isValid(rate) || !isValid(nper) || !isValid(compoundsPerYear)) return NaN;
    if (principal < 0 || nper < 0 || compoundsPerYear <= 0) return NaN;
    const totalCompounds = nper * compoundsPerYear;
    const periodicRate = rate / compoundsPerYear;
    if (periodicRate <= -1) return NaN;
    const result = principal * Math.exp(totalCompounds * Math.log1p(periodicRate));
    return isValid(result) ? result : NaN;
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
    if (nper <= 0 || rate <= -1 || growthRate < -1) return NaN;
    if (Math.abs(rate - growthRate) < 1e-10) {
      return (pmt * nper) / (1 + rate);
    }
    const numerator = 1 - Math.pow((1 + growthRate) / (1 + rate), nper);
    const denominator = rate - growthRate;
    const result = (pmt * numerator) / denominator;
    return isValid(result) ? result : NaN;
  },
};
