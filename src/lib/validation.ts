import { z } from "zod";
import {
  ANNUAL_FREQUENCY,
  MAX_CASH_FLOWS,
  MAX_INTEREST_RATE,
  MAX_PERIODS,
  MAX_PORTFOLIO_ASSETS,
  MAX_PORTFOLIO_RISK_FREE_RATE,
  MAX_VOLATILITY,
  MAX_YEARS,
  MIN_INTEREST_RATE,
  MIN_PORTFOLIO_RISK_FREE_RATE,
  MONTHS_PER_YEAR,
  MONTHLY_FREQUENCY,
  QUARTERLY_FREQUENCY,
  SEMIANNUAL_FREQUENCY,
  TRADING_DAYS_PER_YEAR,
} from "@/lib/constants";

export const TVMInputSchema = z.object({
  rate: z.number().finite().gt(MIN_INTEREST_RATE).max(MAX_INTEREST_RATE),
  nper: z.number().finite().positive("Periods must be positive"),
  pmt: z.number().finite(),
  pv: z.number().finite(),
  fv: z.number().finite().default(0),
  type: z.union([z.literal(0), z.literal(1)]).default(0),
});

export const BondInputSchema = z
  .object({
    faceValue: z.number().finite().positive("Face value must be positive"),
    couponRate: z
      .number()
      .finite()
      .min(0, "Coupon rate must be non-negative")
      .max(MAX_INTEREST_RATE, `Coupon rate must be no more than ${MAX_INTEREST_RATE}%`),
    yearsToMaturity: z.number().finite().positive("Years must be positive").max(MAX_YEARS),
    ytm: z
      .number()
      .finite()
      .gt(MIN_INTEREST_RATE, "Yield must be greater than -100%")
      .max(MAX_INTEREST_RATE, `Yield must be no more than ${MAX_INTEREST_RATE}%`),
    frequency: z.union([
      z.literal(ANNUAL_FREQUENCY),
      z.literal(SEMIANNUAL_FREQUENCY),
      z.literal(QUARTERLY_FREQUENCY),
      z.literal(MONTHLY_FREQUENCY),
    ]),
  })
  .refine((data) => data.ytm / 100 / data.frequency > -1, {
    message: "Yield per period must be greater than -100%",
    path: ["ytm"],
  })
  .refine((data) => Number.isInteger(data.yearsToMaturity * data.frequency), {
    message: "Years and payment frequency must produce whole coupon periods",
    path: ["yearsToMaturity"],
  })
  .refine((data) => data.yearsToMaturity * data.frequency <= MAX_PERIODS, {
    message: `Bond periods must be no more than ${MAX_PERIODS}`,
    path: ["yearsToMaturity"],
  });

export const EquityCAPMSchema = z.object({
  rf: z.number().finite(),
  beta: z.number().finite(),
  rm: z.number().finite(),
});

export const EquityWACCSchema = z
  .object({
    equityValue: z.number().finite().min(0),
    debtValue: z.number().finite().min(0),
    costEquity: z
      .number()
      .finite()
      .gt(MIN_INTEREST_RATE / 100)
      .max(MAX_INTEREST_RATE / 100),
    costDebt: z
      .number()
      .finite()
      .min(0)
      .max(MAX_INTEREST_RATE / 100),
    taxRate: z.number().finite().min(0).max(1),
  })
  .refine((data) => data.equityValue + data.debtValue > 0, {
    message: "Total capital must be greater than zero",
    path: ["equityValue"],
  });

export const EquityDDMSchema = z
  .object({
    d1: z.number().finite().min(0, "Dividend must be non-negative"),
    r: z.number().finite().gt(-1, "Required return must be greater than -100%"),
    g: z.number().finite().gt(-1, "Growth rate must be greater than -100%"),
  })
  .refine((data) => data.r > data.g, {
    message: "Required return must be greater than growth rate",
    path: ["r"],
  });

export const OptionsInputSchema = z.object({
  S: z.number().finite().positive("Spot price must be positive"),
  K: z.number().finite().positive("Strike price must be positive"),
  t: z.number().finite().min(0, "Time to maturity cannot be negative").max(MAX_YEARS),
  r: z
    .number()
    .finite()
    .gt(MIN_INTEREST_RATE / 100)
    .max(MAX_INTEREST_RATE / 100),
  q: z
    .number()
    .finite()
    .gt(MIN_INTEREST_RATE / 100)
    .max(MAX_INTEREST_RATE / 100)
    .default(0),
  sigma: z
    .number()
    .finite()
    .min(0, "Volatility cannot be negative")
    .max(MAX_VOLATILITY / 100),
});

export const ImpliedVolatilityInputSchema = OptionsInputSchema.omit({ sigma: true })
  .extend({
    type: z.enum(["call", "put"]),
    marketPrice: z.number().finite().min(0, "Market price cannot be negative"),
  })
  .refine((data) => data.t > 0, {
    message: "Time to maturity must be positive for implied volatility",
    path: ["t"],
  });

export const CashFlowSchema = z.object({
  rate: z.number().finite().gt(-100, "Discount rate must be greater than -100%"),
  flows: z
    .array(z.number().finite())
    .min(1, "At least one cash flow required")
    .max(MAX_CASH_FLOWS, `No more than ${MAX_CASH_FLOWS} cash flows are supported`),
});

export const LoanInputSchema = z
  .object({
    amount: z.number().finite().positive("Loan amount must be positive"),
    rate: z.number().finite().min(0, "Rate must be non-negative").max(MAX_INTEREST_RATE),
    years: z
      .number()
      .finite()
      .positive("Term must be positive")
      .max(MAX_PERIODS / MONTHS_PER_YEAR),
    method: z.enum(["CPM", "CAM"]),
  })
  .refine((data) => Number.isInteger(data.years * MONTHS_PER_YEAR), {
    message: "Term must resolve to a whole number of months",
    path: ["years"],
  });

export const RiskInputSchema = z.object({
  value: z.number().finite().positive("Portfolio value must be positive").max(1_000_000_000_000),
  volatility: z.number().finite().min(0).max(MAX_VOLATILITY),
  confidence: z.number().finite().gt(0.5).lt(1),
  days: z
    .number()
    .finite()
    .int("Horizon must be a whole number of trading days")
    .positive("Horizon must be positive")
    .max(MAX_YEARS * TRADING_DAYS_PER_YEAR),
});

export const PortfolioAssetSchema = z.object({
  name: z.string().min(1),
  return: z.number().finite().min(MIN_INTEREST_RATE).max(MAX_INTEREST_RATE),
  risk: z.number().finite().min(0).max(MAX_VOLATILITY),
});

export const PortfolioInputSchema = z.object({
  rf: z.number().finite().min(MIN_PORTFOLIO_RISK_FREE_RATE).max(MAX_PORTFOLIO_RISK_FREE_RATE),
  correlation: z.number().finite().min(-1).max(1),
  assets: z
    .array(PortfolioAssetSchema)
    .min(2, "At least two assets are required")
    .max(MAX_PORTFOLIO_ASSETS, `No more than ${MAX_PORTFOLIO_ASSETS} assets are supported`),
});
