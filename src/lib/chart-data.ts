import { Finance } from "@/lib/finance-math";

export interface RiskDistributionPoint {
  dev: number;
  return: number;
  loss: number;
  prob: number;
  isTail: boolean;
}

export interface OptionPayoffPoint {
  spot: number;
  intrinsicCall: number;
  intrinsicPut: number;
}

export function getRiskDistributionRange(zScore: number): number {
  if (!Number.isFinite(zScore)) return 4;
  return Math.max(4, Math.ceil(Math.abs(zScore)) + 1);
}

export function getRiskTailGradientOffset(zScore: number): number {
  const range = getRiskDistributionRange(zScore);
  const offset = ((range + zScore) / (2 * range)) * 100;
  return Math.max(0, Math.min(100, offset));
}

export function buildRiskDistributionData(
  sigmaHorizon: number,
  portfolioValue: number,
  zScore: number
): RiskDistributionPoint[] {
  if (
    !Number.isFinite(sigmaHorizon) ||
    sigmaHorizon < 0 ||
    !Number.isFinite(portfolioValue) ||
    portfolioValue < 0 ||
    !Number.isFinite(zScore)
  ) {
    return [];
  }

  const range = getRiskDistributionRange(zScore);
  const steps = range * 20;

  return Array.from({ length: steps + 1 }, (_, index) => {
    // Descending deviations produce an ascending numeric loss axis.
    const dev = range - index / 10;
    const periodReturn = dev * sigmaHorizon;
    const loss = -periodReturn * portfolioValue;

    return {
      dev,
      return: periodReturn,
      loss,
      prob: Finance.normPDF(dev),
      isTail: dev < -zScore,
    };
  });
}

export function getOptionPayoffDomain(spot: number, strike: number): [number, number] {
  if (!Number.isFinite(spot) || spot <= 0 || !Number.isFinite(strike) || strike <= 0) {
    return [0, 1];
  }

  const coreMin = Math.min(spot * 0.5, strike);
  const expandedSpot = spot > Number.MAX_VALUE / 1.5 ? Number.MAX_VALUE : spot * 1.5;
  const coreMax = Math.max(expandedSpot, strike);
  const padding = (coreMax - coreMin) * 0.05;

  return [Math.max(0, coreMin - padding), Math.min(Number.MAX_VALUE, coreMax + padding)];
}

export function buildOptionPayoffData(spot: number, strike: number): OptionPayoffPoint[] {
  const domain = getOptionPayoffDomain(spot, strike);
  if (domain[0] === 0 && domain[1] === 1 && (spot <= 0 || strike <= 0 || !Number.isFinite(spot + strike))) {
    return [];
  }

  const [minSpot, maxSpot] = domain;
  const samples = Array.from({ length: 41 }, (_, index) => minSpot + (maxSpot - minSpot) * (index / 40));
  samples.push(spot, strike);

  return [...new Set(samples)]
    .sort((a, b) => a - b)
    .map((sampleSpot) => ({
      spot: sampleSpot,
      intrinsicCall: Math.max(sampleSpot - strike, 0),
      intrinsicPut: Math.max(strike - sampleSpot, 0),
    }));
}
