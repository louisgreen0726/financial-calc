/**
 * Professional Financial Math Library
 * Implements standard financial formulas with high precision.
 */

export const Finance = {
    // === TVM ===
    pv: (rate: number, nper: number, pmt: number, fv: number = 0, type: 0 | 1 = 0): number => {
        if (rate === 0) return -(fv + pmt * nper);
        const pv = -(fv + pmt * (1 + rate * type) * ((Math.pow(1 + rate, nper) - 1) / rate)) / Math.pow(1 + rate, nper);
        return pv;
    },
    fv: (rate: number, nper: number, pmt: number, pv: number, type: 0 | 1 = 0): number => {
        if (rate === 0) return -(pv + pmt * nper);
        const term = Math.pow(1 + rate, nper);
        const fv = -(pv * term + pmt * (1 + rate * type) * ((term - 1) / rate));
        return fv;
    },
    pmt: (rate: number, nper: number, pv: number, fv: number = 0, type: 0 | 1 = 0): number => {
        if (rate === 0) return -(pv + fv) / nper;
        const term = Math.pow(1 + rate, nper);
        const pmt = -(fv + pv * term) / ((1 + rate * type) * ((term - 1) / rate));
        return pmt;
    },
    nper: (rate: number, pmt: number, pv: number, fv: number = 0, type: 0 | 1 = 0): number => {
        if (rate === 0) return -(pv + fv) / pmt;
        const num = pmt * (1 + rate * type) - fv * rate;
        const den = pv * rate + pmt * (1 + rate * type);
        return Math.log(num / den) / Math.log(1 + rate);
    },
    npv: (rate: number, values: number[]): number => {
        return values.reduce((acc, val, i) => acc + val / Math.pow(1 + rate, i + 1), 0);
    },
    irr: (values: number[], guess: number = 0.1): number => {
        const eps = 1e-6;
        const maxIter = 1000;
        let rate = guess;
        for (let i = 0; i < maxIter; i++) {
            let npv = 0;
            let dNpv = 0;
            for (let j = 0; j < values.length; j++) {
                const term = Math.pow(1 + rate, j);
                npv += values[j] / term;
                dNpv -= (j * values[j]) / (term * (1 + rate));
            }
            const newRate = rate - npv / dNpv;
            if (Math.abs(newRate - rate) < eps) return newRate;
            rate = newRate;
        }
        return rate;
    },
    effectiveRate: (nominalRate: number, periodsPerYear: number): number => {
        return Math.pow(1 + nominalRate / periodsPerYear, periodsPerYear) - 1;
    },
    amortizationSchedule: (principal: number, rate: number, nper: number, method: "CPM" | "CAM" = "CPM") => {
        const schedule = [];
        let balance = principal;
        const cpmPmt = method === "CPM" ? Finance.pmt(rate, nper, -principal) : 0;
        const fixedPrincipal = method === "CAM" ? principal / nper : 0;
        for (let i = 1; i <= nper; i++) {
            const interest = balance * rate;
            let payment = 0;
            let princip = 0;
            if (method === "CPM") { payment = cpmPmt; princip = payment - interest; }
            else { princip = fixedPrincipal; payment = princip + interest; }
            if (i === nper && Math.abs(balance - princip) > 0.01) {
                if (method === "CPM") princip = balance;
                if (method === "CAM") { princip = balance; payment = princip + interest; }
            }
            balance -= princip;
            if (balance < 0) balance = 0;
            schedule.push({ period: i, payment, principal: princip, interest, balance });
        }
        return schedule;
    },

    // === BONDS ===
    bondPrice: (faceValue: number, couponRate: number, yearsToMaturity: number, ytm: number, frequency: number = 2) => {
        const periods = yearsToMaturity * frequency;
        const coupon = (faceValue * couponRate) / frequency;
        const r = ytm / frequency;
        let pvCoupons = 0;
        for (let i = 1; i <= periods; i++) { pvCoupons += coupon / Math.pow(1 + r, i); }
        const pvFace = faceValue / Math.pow(1 + r, periods);
        return pvCoupons + pvFace;
    },
    bondDuration: (faceValue: number, couponRate: number, yearsToMaturity: number, ytm: number, frequency: number = 2) => {
        const periods = yearsToMaturity * frequency;
        const coupon = (faceValue * couponRate) / frequency;
        const r = ytm / frequency;
        const price = Finance.bondPrice(faceValue, couponRate, yearsToMaturity, ytm, frequency);
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
    bondConvexity: (faceValue: number, couponRate: number, yearsToMaturity: number, ytm: number, frequency: number = 2) => {
        const periods = yearsToMaturity * frequency;
        const coupon = (faceValue * couponRate) / frequency;
        const r = ytm / frequency;
        const price = Finance.bondPrice(faceValue, couponRate, yearsToMaturity, ytm, frequency);
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
        return rf + beta * (rm - rf);
    },
    wacc: (equityValue: number, debtValue: number, costEquity: number, costDebt: number, taxRate: number): number => {
        const v = equityValue + debtValue;
        if (v === 0) return 0;
        return (equityValue / v) * costEquity + (debtValue / v) * costDebt * (1 - taxRate);
    },
    ddm: (d1: number, r: number, g: number): number => {
        if (r <= g) return 0;
        return d1 / (r - g);
    },

    // === OPTIONS (DERIVATIVES) ===

    // Normal Distribution CDF
    normCDF: (x: number): number => {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2.0);
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return 0.5 * (1.0 + sign * y);
    },

    // Normal Distribution PDF
    normPDF: (x: number): number => {
        return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
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
    blackScholes: (type: "call" | "put", S: number, K: number, t: number, r: number, sigma: number) => {
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
    greeks: (type: "call" | "put", S: number, K: number, t: number, r: number, sigma: number) => {
        if (t <= 0) return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };

        const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * t) / (sigma * Math.sqrt(t));
        const d2 = d1 - sigma * Math.sqrt(t);
        const nd1 = Finance.normPDF(d1);
        const Nd1 = Finance.normCDF(d1);
        const Nd2 = Finance.normCDF(d2);
        const N_d1 = Finance.normCDF(-d1);
        const N_d2 = Finance.normCDF(-d2);

        let delta, theta, rho;
        const gamma = nd1 / (S * sigma * Math.sqrt(t));
        const vega = S * Math.sqrt(t) * nd1 / 100; // Typically scaled per 1% vol change

        if (type === "call") {
            delta = Nd1;
            theta = (- (S * nd1 * sigma) / (2 * Math.sqrt(t)) - r * K * Math.exp(-r * t) * Nd2) / 365;
            rho = (K * t * Math.exp(-r * t) * Nd2) / 100;
        } else {
            delta = Nd1 - 1;
            theta = (- (S * nd1 * sigma) / (2 * Math.sqrt(t)) + r * K * Math.exp(-r * t) * N_d2) / 365;
            rho = (-K * t * Math.exp(-r * t) * N_d2) / 100;
        }

        return { delta, gamma, theta, vega, rho };
    }
};
