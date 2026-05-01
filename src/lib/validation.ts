import { z } from "zod";

export const TVMInputSchema = z.object({
  rate: z.number().finite(),
  nper: z.number().finite().positive("Periods must be positive"),
  pmt: z.number().finite(),
  pv: z.number().finite(),
  fv: z.number().finite().default(0),
  type: z.union([z.literal(0), z.literal(1)]).default(0),
});

export const BondInputSchema = z.object({
  faceValue: z.number().finite().positive("Face value must be positive"),
  couponRate: z.number().finite().min(0),
  yearsToMaturity: z.number().finite().positive("Years must be positive"),
  ytm: z.number().finite(),
  frequency: z.number().finite().positive("Frequency must be positive"),
});

export const EquityCAPMSchema = z.object({
  rf: z.number().finite(),
  beta: z.number().finite(),
  rm: z.number().finite(),
});

export const EquityWACCSchema = z.object({
  equityValue: z.number().finite().min(0),
  debtValue: z.number().finite().min(0),
  costEquity: z.number().finite(),
  costDebt: z.number().finite(),
  taxRate: z.number().finite().min(0).max(1),
});

export const EquityDDMSchema = z
  .object({
    d1: z.number().finite().min(0, "Dividend must be non-negative"),
    r: z.number().finite(),
    g: z.number().finite(),
  })
  .refine((data) => data.r > data.g, {
    message: "Required return must be greater than growth rate",
    path: ["r"],
  });

export const OptionsInputSchema = z.object({
  S: z.number().finite().positive("Spot price must be positive"),
  K: z.number().finite().positive("Strike price must be positive"),
  t: z.number().finite().positive("Time to maturity must be positive"),
  r: z.number().finite(),
  sigma: z.number().finite().positive("Volatility must be positive"),
});

export const CashFlowSchema = z.object({
  rate: z.number().finite().gt(-100, "Discount rate must be greater than -100%"),
  flows: z.array(z.number().finite()).min(1, "At least one cash flow required"),
});

export const LoanInputSchema = z.object({
  amount: z.number().finite().positive("Loan amount must be positive"),
  rate: z.number().finite().min(0, "Rate must be non-negative"),
  years: z.number().finite().positive("Term must be positive"),
  method: z.enum(["CPM", "CAM"]),
});

export const RiskInputSchema = z.object({
  value: z.number().finite().positive("Portfolio value must be positive"),
  volatility: z.number().finite().min(0),
  confidence: z.number().finite().gt(0).lt(1),
  days: z.number().finite().positive("Horizon must be positive"),
});

export const PortfolioAssetSchema = z.object({
  name: z.string().min(1),
  return: z.number().finite(),
  risk: z.number().finite().min(0),
});

export const PortfolioInputSchema = z.object({
  rf: z.number().finite().min(0).max(100),
  correlation: z.number().finite().min(-1).max(1),
  assets: z.array(PortfolioAssetSchema).min(2, "At least two assets are required"),
});
