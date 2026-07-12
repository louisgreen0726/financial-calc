import { TRADING_DAYS_PER_YEAR } from "@/lib/constants";
import { Finance } from "@/lib/finance-math";

export interface ParametricNormalRiskInput {
  portfolioValue: number;
  annualVolatility: number;
  confidence: number;
  horizonDays: number;
  tradingDaysPerYear?: number;
}

export interface ParametricNormalRiskMetrics {
  valueAtRisk: number;
  valueAtRiskFraction: number;
  conditionalValueAtRisk: number;
  conditionalValueAtRiskFraction: number;
  horizonVolatility: number;
  zScore: number;
  expectedShortfallFactor: number;
}

export const DETERMINISTIC_STRESS_SCENARIOS = [
  { id: "moderate", shockFraction: -0.05 },
  { id: "severe", shockFraction: -0.1 },
  { id: "extreme", shockFraction: -0.2 },
] as const;

export type DeterministicStressScenarioId = (typeof DETERMINISTIC_STRESS_SCENARIOS)[number]["id"];

export interface DeterministicStressResult {
  id: DeterministicStressScenarioId;
  shockFraction: number;
  loss: number;
  stressedValue: number;
  lossToValueAtRisk: number | null;
}

export function calculateParametricNormalRisk({
  portfolioValue,
  annualVolatility,
  confidence,
  horizonDays,
  tradingDaysPerYear = TRADING_DAYS_PER_YEAR,
}: ParametricNormalRiskInput): ParametricNormalRiskMetrics | null {
  if (
    ![portfolioValue, annualVolatility, confidence, horizonDays, tradingDaysPerYear].every(Number.isFinite) ||
    portfolioValue <= 0 ||
    annualVolatility < 0 ||
    confidence <= 0.5 ||
    confidence >= 1 ||
    !Number.isInteger(horizonDays) ||
    horizonDays <= 0 ||
    !Number.isInteger(tradingDaysPerYear) ||
    tradingDaysPerYear <= 0
  ) {
    return null;
  }

  const horizonVolatility = annualVolatility * Math.sqrt(horizonDays / tradingDaysPerYear);
  const zScore = Finance.normCDFInverse(confidence);
  const tailProbability = 1 - confidence;
  const expectedShortfallFactor = Finance.normPDF(zScore) / tailProbability;
  const valueAtRiskFraction = zScore * horizonVolatility;
  const conditionalValueAtRiskFraction = expectedShortfallFactor * horizonVolatility;
  const valueAtRisk = portfolioValue * valueAtRiskFraction;
  const conditionalValueAtRisk = portfolioValue * conditionalValueAtRiskFraction;
  const metrics = {
    valueAtRisk,
    valueAtRiskFraction,
    conditionalValueAtRisk,
    conditionalValueAtRiskFraction,
    horizonVolatility,
    zScore,
    expectedShortfallFactor,
  };

  return Object.values(metrics).every(Number.isFinite) ? metrics : null;
}

export function calculateDeterministicStressScenarios(
  portfolioValue: number,
  valueAtRisk: number
): DeterministicStressResult[] | null {
  if (!Number.isFinite(portfolioValue) || portfolioValue <= 0 || !Number.isFinite(valueAtRisk) || valueAtRisk < 0) {
    return null;
  }

  return DETERMINISTIC_STRESS_SCENARIOS.map(({ id, shockFraction }) => {
    const loss = -portfolioValue * shockFraction;
    const lossToValueAtRisk = valueAtRisk > 0 ? loss / valueAtRisk : null;
    return {
      id,
      shockFraction,
      loss,
      stressedValue: portfolioValue - loss,
      lossToValueAtRisk: lossToValueAtRisk !== null && Number.isFinite(lossToValueAtRisk) ? lossToValueAtRisk : null,
    };
  });
}
