/**
 * Professional Financial Math Library
 * Implements standard financial formulas with high precision.
 */

import {
  ANNUAL_FREQUENCY,
  MAX_PERIODS,
  MAX_VOLATILITY,
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
const optionLogMoneyness = (spot: number, strike: number) => Math.log(spot) - Math.log(strike);
const toWholePeriods = (years: number, frequency: number) => {
  const periods = years * frequency;
  return Number.isInteger(periods) ? periods : NaN;
};

const countSignChanges = (values: number[]): number => {
  let changes = 0;
  let previousSign = 0;

  for (const value of values) {
    if (value === 0) continue;
    const sign = Math.sign(value);
    if (previousSign !== 0 && sign !== previousSign) changes++;
    previousSign = sign;
  }

  return changes;
};

const signOfFiniteSum = (left: number, right: number): number => {
  const leftSign = Math.sign(left);
  const rightSign = Math.sign(right);
  if (leftSign === 0) return rightSign;
  if (rightSign === 0 || leftSign === rightSign) return leftSign;

  const leftMagnitude = Math.abs(left);
  const rightMagnitude = Math.abs(right);
  if (leftMagnitude === rightMagnitude) return 0;
  return leftMagnitude > rightMagnitude ? leftSign : rightSign;
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

  const scale = terms.reduce((maximum, term) => Math.max(maximum, Math.abs(term)), Number.MIN_VALUE);
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

const standardNormalCdf = (value: number): number => {
  if (value === 0) return 0.5;
  const z = Math.abs(value);
  if (z > 37) return value > 0 ? 1 : 0;

  const density = Math.exp((-z * z) / 2);
  let tail: number;
  if (z < 7.07106781186547) {
    let numerator = 0.0352624965998911 * z + 0.700383064443688;
    numerator = numerator * z + 6.37396220353165;
    numerator = numerator * z + 33.912866078383;
    numerator = numerator * z + 112.079291497871;
    numerator = numerator * z + 221.213596169931;
    numerator = numerator * z + 220.206867912376;

    let denominator = 0.0883883476483184 * z + 1.75566716318264;
    denominator = denominator * z + 16.064177579207;
    denominator = denominator * z + 86.7807322029461;
    denominator = denominator * z + 296.564248779674;
    denominator = denominator * z + 637.333633378831;
    denominator = denominator * z + 793.826512519948;
    denominator = denominator * z + 440.413735824752;
    tail = (density * numerator) / denominator;
  } else {
    tail = density / (z + 1 / (z + 2 / (z + 3 / (z + 4 / (z + 0.65))))) / 2.5066282746310002;
  }

  return value > 0 ? 1 - tail : tail;
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
    const inputScale = Math.max(Math.abs(fv), Math.abs(pmt), Number.MIN_VALUE);
    if (rate === 0) {
      const normalizedPv = neumaierSum([fv / inputScale, (pmt / inputScale) * nper]);
      const pv = -normalizedPv * inputScale;
      return isValid(pv) ? pv : NaN;
    }
    const factors = getTvmFactors(rate, nper);
    if (!factors || factors.term === 0) return NaN;
    const normalizedPv = neumaierSum([
      (fv / inputScale) * (1 / factors.term),
      (pmt / inputScale) * (1 + rate * type) * (factors.annuityFactor / factors.term),
    ]);
    const pv = -normalizedPv * inputScale;
    return isValid(pv) ? pv : NaN;
  },
  fv: (rate: number, nper: number, pmt: number, pv: number, type: PaymentTiming = 0): number => {
    if (!isValid(rate) || !isValid(nper) || !isValid(pmt) || !isValid(pv) || !isSupportedPaymentTiming(type))
      return NaN;
    if (nper <= 0 || rate <= -1) return NaN;
    const inputScale = Math.max(Math.abs(pv), Math.abs(pmt), Number.MIN_VALUE);
    if (rate === 0) {
      const normalizedFv = neumaierSum([pv / inputScale, (pmt / inputScale) * nper]);
      const fv = -normalizedFv * inputScale;
      return isValid(fv) ? fv : NaN;
    }
    const factors = getTvmFactors(rate, nper);
    if (!factors) return NaN;
    const normalizedFv = neumaierSum([
      (pv / inputScale) * factors.term,
      (pmt / inputScale) * (1 + rate * type) * factors.annuityFactor,
    ]);
    const fv = -normalizedFv * inputScale;
    return isValid(fv) ? fv : NaN;
  },
  pmt: (rate: number, nper: number, pv: number, fv: number = 0, type: PaymentTiming = 0): number => {
    if (!isValid(rate) || !isValid(nper) || !isValid(pv) || !isValid(fv) || !isSupportedPaymentTiming(type)) return NaN;
    if (nper <= 0 || rate <= -1) return NaN;
    const inputScale = Math.max(Math.abs(pv), Math.abs(fv), Number.MIN_VALUE);
    if (rate === 0) {
      const normalizedPayment = neumaierSum([pv / inputScale, fv / inputScale]) / nper;
      const pmt = -normalizedPayment * inputScale;
      return isValid(pmt) ? pmt : NaN;
    }
    const factors = getTvmFactors(rate, nper);
    if (!factors || factors.annuityFactor === 0) return NaN;
    const paymentAdjustment = 1 + rate * type;
    const normalizedPayment = neumaierSum([
      ((pv / inputScale) * (factors.term / factors.annuityFactor)) / paymentAdjustment,
      ((fv / inputScale) * (1 / factors.annuityFactor)) / paymentAdjustment,
    ]);
    const pmt = -normalizedPayment * inputScale;
    return isValid(pmt) ? pmt : NaN;
  },
  nper: (rate: number, pmt: number, pv: number, fv: number = 0, type: PaymentTiming = 0): number => {
    if (!isValid(rate) || !isValid(pmt) || !isValid(pv) || !isValid(fv) || !isSupportedPaymentTiming(type)) return NaN;
    if (rate <= -1) return NaN;
    const inputScale = Math.max(Math.abs(pmt), Math.abs(pv), Math.abs(fv), Number.MIN_VALUE);
    const scaledPmt = pmt / inputScale;
    const scaledPv = pv / inputScale;
    const scaledFv = fv / inputScale;
    if (rate === 0) {
      if (scaledPmt === 0) return NaN;
      const result = -neumaierSum([scaledPv, scaledFv]) / scaledPmt;
      return isValid(result) ? result : NaN;
    }
    const adjustedPayment = scaledPmt * (1 + rate * type);
    const num = neumaierSum([adjustedPayment, -scaledFv * rate]);
    const den = neumaierSum([scaledPv * rate, adjustedPayment]);
    if (num === 0 || den === 0 || Math.sign(num) !== Math.sign(den)) return NaN;
    const logRatio = Math.log(Math.abs(num)) - Math.log(Math.abs(den));
    const logRate = Math.log1p(rate);
    if (!isFinite(logRatio) || !isFinite(logRate) || logRate === 0) return NaN;
    const result = logRatio / logRate;
    return isValid(result) ? result : NaN;
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

    const inputScale = Math.max(Math.abs(pv), Math.abs(pmt), Math.abs(fv), Number.MIN_VALUE);
    const scaledPv = pv / inputScale;
    const scaledPmt = pmt / inputScale;
    const scaledFv = fv / inputScale;

    const evaluateCashFlow = (candidateRate: number): RootEvaluation | null => {
      if (candidateRate <= -1) return null;
      const factors = getTvmFactors(candidateRate, nper);
      if (!factors) return null;

      return normalizeTerms([
        scaledPv * factors.term,
        scaledPmt * (1 + candidateRate * type) * factors.annuityFactor,
        scaledFv,
      ]);
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
        scaledPv * termDerivative + scaledPmt * (type * factors.annuityFactor + (1 + rate * type) * annuityDerivative);
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
      if (value === 0) return 0;
      const discountFactor = Math.exp(logRate * period);
      if (discountFactor === Infinity) return 0;
      return discountFactor === 0 ? NaN : value / discountFactor;
    });
    if (discountedValues.some((value) => !isValid(value))) return NaN;
    const evaluation = normalizeTerms(discountedValues);
    if (!evaluation) return NaN;
    const result = evaluation.value * evaluation.scale;
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

    return countSignChanges(values);
  },
  rateSignChanges: (nper: number, pmt: number, pv: number, fv: number = 0, type: PaymentTiming = 0): number => {
    if (
      ![nper, pmt, pv, fv].every(isValid) ||
      !Number.isInteger(nper) ||
      nper <= 0 ||
      !isSupportedPaymentTiming(type)
    ) {
      return NaN;
    }

    // Descartes sign changes for the RATE polynomial in x = 1 + rate.
    const coefficients =
      type === 0
        ? nper === 1
          ? [Math.sign(pv), signOfFiniteSum(pmt, fv)]
          : [Math.sign(pv), Math.sign(pmt), signOfFiniteSum(pmt, fv)]
        : nper === 1
          ? [signOfFiniteSum(pv, pmt), Math.sign(fv)]
          : [signOfFiniteSum(pv, pmt), Math.sign(pmt), Math.sign(fv)];
    return countSignChanges(coefficients);
  },
  irr: (values: number[], guess: number = 0.1): number => {
    if (!Array.isArray(values) || values.length < 2) return NaN;
    if (!isValid(guess) || values.some((value) => !isValid(value))) return NaN;
    if (!values.some((value) => value < 0) || !values.some((value) => value > 0)) return NaN;

    const evaluateNpv = (candidateRate: number): RootEvaluation | null => {
      if (candidateRate <= -1) return null;
      const logRate = Math.log1p(candidateRate);
      const terms = values.map((value, period) => {
        if (value === 0) return 0;
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
        if (values[period] === 0) {
          derivativeTerms.push(0);
          continue;
        }
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
    return standardNormalCdf(x);
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
   * @param dividendYield Continuously compounded dividend yield
   */
  blackScholes: (
    type: OptionType,
    S: number,
    K: number,
    t: number,
    r: number,
    sigma: number,
    dividendYield: number = 0
  ): number => {
    if (!isValid(S) || !isValid(K) || !isValid(t) || !isValid(r) || !isValid(sigma) || !isValid(dividendYield))
      return NaN;
    if (!isSupportedOptionType(type)) return NaN;
    if (S <= 0 || K <= 0 || t < 0 || sigma < 0) return NaN;
    if (t <= 0) {
      return type === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
    }
    const spotDiscountFactor = Math.exp(-dividendYield * t);
    const strikeDiscountFactor = Math.exp(-r * t);
    const discountedSpot = S * spotDiscountFactor;
    const discountedStrike = K * strikeDiscountFactor;
    if (![spotDiscountFactor, strikeDiscountFactor, discountedSpot, discountedStrike].every(isValid)) return NaN;

    if (sigma === 0) {
      const deterministicPrice =
        type === "call"
          ? Math.max(discountedSpot - discountedStrike, 0)
          : Math.max(discountedStrike - discountedSpot, 0);
      return isValid(deterministicPrice) ? deterministicPrice : NaN;
    }
    const d1 = (optionLogMoneyness(S, K) + (r - dividendYield + 0.5 * sigma * sigma) * t) / (sigma * Math.sqrt(t));
    const d2 = d1 - sigma * Math.sqrt(t);

    const rawPrice =
      type === "call"
        ? discountedSpot * Finance.normCDF(d1) - discountedStrike * Finance.normCDF(d2)
        : discountedStrike * Finance.normCDF(-d2) - discountedSpot * Finance.normCDF(-d1);
    const lowerBound =
      type === "call" ? Math.max(0, discountedSpot - discountedStrike) : Math.max(0, discountedStrike - discountedSpot);
    const upperBound = type === "call" ? discountedSpot : discountedStrike;
    const price = Math.min(upperBound, Math.max(lowerBound, rawPrice));
    return isValid(price) ? price : NaN;
  },

  impliedVolatility: (
    type: OptionType,
    S: number,
    K: number,
    t: number,
    r: number,
    marketPrice: number,
    dividendYield: number = 0
  ): number => {
    if (
      !isSupportedOptionType(type) ||
      ![S, K, t, r, marketPrice, dividendYield].every(isValid) ||
      S <= 0 ||
      K <= 0 ||
      t <= 0 ||
      marketPrice < 0
    ) {
      return NaN;
    }

    const discountedSpot = S * Math.exp(-dividendYield * t);
    const discountedStrike = K * Math.exp(-r * t);
    if (![discountedSpot, discountedStrike].every(isValid)) return NaN;

    const lowerBound =
      type === "call" ? Math.max(0, discountedSpot - discountedStrike) : Math.max(0, discountedStrike - discountedSpot);
    const upperBound = type === "call" ? discountedSpot : discountedStrike;
    const priceScale = Math.max(Math.abs(marketPrice), Math.abs(upperBound), Number.MIN_VALUE);
    const normalizedMarketPrice = marketPrice / priceScale;
    const normalizedLowerBound = lowerBound / priceScale;
    const normalizedUpperBound = upperBound / priceScale;
    const priceTolerance = 1e-10;
    if (
      normalizedMarketPrice < normalizedLowerBound - priceTolerance ||
      normalizedMarketPrice > normalizedUpperBound + priceTolerance
    )
      return NaN;
    if (Math.abs(normalizedMarketPrice - normalizedLowerBound) <= priceTolerance) return 0;

    const maxVolatility = MAX_VOLATILITY / 100;
    const maxPrice = Finance.blackScholes(type, S, K, t, r, maxVolatility, dividendYield);
    if (!isValid(maxPrice)) return NaN;
    const normalizedMaxPrice = maxPrice / priceScale;
    if (normalizedMarketPrice > normalizedMaxPrice + priceTolerance) return NaN;
    if (Math.abs(normalizedMarketPrice - normalizedMaxPrice) <= priceTolerance) return maxVolatility;

    let lowerVolatility = 0;
    let upperVolatility = maxVolatility;
    for (let iteration = 0; iteration < 200; iteration++) {
      const midpoint = (lowerVolatility + upperVolatility) / 2;
      const midpointPrice = Finance.blackScholes(type, S, K, t, r, midpoint, dividendYield);
      if (!isValid(midpointPrice)) return NaN;
      const normalizedMidpointPrice = midpointPrice / priceScale;

      if (
        Math.abs(normalizedMidpointPrice - normalizedMarketPrice) <= priceTolerance ||
        upperVolatility - lowerVolatility <= 1e-12
      ) {
        return midpoint;
      }

      if (normalizedMidpointPrice < normalizedMarketPrice) {
        lowerVolatility = midpoint;
      } else {
        upperVolatility = midpoint;
      }
    }

    return (lowerVolatility + upperVolatility) / 2;
  },

  /**
   * Option Greeks
   */
  greeks: (
    type: OptionType,
    S: number,
    K: number,
    t: number,
    r: number,
    sigma: number,
    dividendYield: number = 0
  ): GreeksResult => {
    const undefinedGreeks: GreeksResult = { delta: NaN, gamma: NaN, theta: NaN, vega: NaN, rho: NaN };
    if (!isValid(S) || !isValid(K) || !isValid(t) || !isValid(r) || !isValid(sigma) || !isValid(dividendYield))
      return undefinedGreeks;
    if (!isSupportedOptionType(type)) return undefinedGreeks;
    if (t <= 0 || S <= 0 || K <= 0 || sigma < 0) return undefinedGreeks;

    const spotDiscountFactor = Math.exp(-dividendYield * t);
    const strikeDiscountFactor = Math.exp(-r * t);
    const discountedSpot = S * spotDiscountFactor;
    const discountedStrike = K * strikeDiscountFactor;
    if (![spotDiscountFactor, strikeDiscountFactor, discountedSpot, discountedStrike].every(isValid)) {
      return undefinedGreeks;
    }

    if (sigma === 0) {
      if (discountedSpot === discountedStrike) return undefinedGreeks;

      const callTheta = (dividendYield * discountedSpot - r * discountedStrike) / 365;
      const deterministicRho = (t * discountedStrike) / 100;
      if (!isValid(callTheta) || !isValid(deterministicRho)) return undefinedGreeks;
      if (type === "call") {
        return discountedSpot > discountedStrike
          ? { delta: spotDiscountFactor, gamma: 0, theta: callTheta, vega: 0, rho: deterministicRho }
          : { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
      }

      return discountedSpot < discountedStrike
        ? { delta: -spotDiscountFactor, gamma: 0, theta: -callTheta, vega: 0, rho: -deterministicRho }
        : { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
    }

    const d1 = (optionLogMoneyness(S, K) + (r - dividendYield + 0.5 * sigma * sigma) * t) / (sigma * Math.sqrt(t));
    const d2 = d1 - sigma * Math.sqrt(t);
    const nd1 = Finance.normPDF(d1);
    const Nd1 = Finance.normCDF(d1);
    const Nd2 = Finance.normCDF(d2);
    const N_d1 = Finance.normCDF(-d1);
    const N_d2 = Finance.normCDF(-d2);

    let delta: number, theta: number, rho: number;
    const logGamma =
      -dividendYield * t -
      0.5 * d1 * d1 -
      0.5 * Math.log(2 * Math.PI) -
      Math.log(S) -
      Math.log(sigma) -
      0.5 * Math.log(t);
    const gamma = Math.exp(logGamma);
    const vega = (discountedSpot * Math.sqrt(t) * nd1) / 100;
    const diffusionTheta = -(discountedSpot * nd1 * sigma) / (2 * Math.sqrt(t));

    if (type === "call") {
      delta = spotDiscountFactor * Nd1;
      theta = (diffusionTheta + dividendYield * discountedSpot * Nd1 - r * discountedStrike * Nd2) / 365;
      rho = (t * discountedStrike * Nd2) / 100;
    } else {
      delta = -spotDiscountFactor * N_d1;
      theta = (diffusionTheta - dividendYield * discountedSpot * N_d1 + r * discountedStrike * N_d2) / 365;
      rho = (-t * discountedStrike * N_d2) / 100;
    }

    const result = { delta, gamma, theta, vega, rho };
    return Object.values(result).every(isValid) ? result : undefinedGreeks;
  },

  // === MACROECONOMICS ===
  inflationRate: (startPrice: number, endPrice: number, years: number): number => {
    if (!isValid(startPrice) || !isValid(endPrice) || !isValid(years)) return NaN;
    if (startPrice <= 0 || endPrice <= 0 || years <= 0) return NaN;
    const relativeChange = (endPrice - startPrice) / startPrice;
    const totalLogChange =
      Number.isFinite(relativeChange) && relativeChange > -1
        ? Math.log1p(relativeChange)
        : Math.log(endPrice) - Math.log(startPrice);
    const result = Math.expm1(totalLogChange / years);
    return isValid(result) ? result : NaN;
  },
  purchasingPower: (currentAmount: number, inflationRate: number, years: number): number => {
    if (!isValid(currentAmount) || !isValid(inflationRate) || !isValid(years)) return NaN;
    if (years < 0) return NaN;
    if (1 + inflationRate <= 0) return NaN;
    const growthFactor = Math.pow(1 + inflationRate, years);
    const directResult = currentAmount / growthFactor;
    if (isValid(directResult) && (directResult !== 0 || currentAmount === 0)) return directResult;
    if (currentAmount === 0) return 0;

    const logMagnitude = Math.log(Math.abs(currentAmount)) - years * Math.log1p(inflationRate);
    const result = Math.sign(currentAmount) * Math.exp(logMagnitude);
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
    if (amount === 0) return 0;

    const directResult = amount * (toCPI / fromCPI);
    if (isValid(directResult) && directResult !== 0) return directResult;

    const reorderedResult = (amount / fromCPI) * toCPI;
    if (isValid(reorderedResult) && reorderedResult !== 0) return reorderedResult;

    const result = Math.exp(Math.log(amount) + Math.log(toCPI) - Math.log(fromCPI));
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
