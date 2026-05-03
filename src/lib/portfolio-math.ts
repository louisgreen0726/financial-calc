export interface PortfolioAssetInput {
  id?: number;
  name: string;
  return: number;
  risk: number;
}

export interface PortfolioPoint {
  ret: number;
  risk: number;
  sharpe: number;
  weights: number[];
}

export interface PortfolioSimulationResult {
  simulations: PortfolioPoint[];
  optimal: PortfolioPoint | null;
  minVol: PortfolioPoint | null;
}

export function createSeededRandom(seed: string | number): () => number {
  const seedText = String(seed || "financial-calc");
  let hash = 2166136261;

  for (let index = 0; index < seedText.length; index++) {
    hash ^= seedText.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  let state = hash >>> 0 || 1;

  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function getMinimumEqualCorrelation(assetCount: number): number {
  if (!Number.isFinite(assetCount) || assetCount <= 1) {
    return -1;
  }

  return -1 / (Math.floor(assetCount) - 1);
}

export function clampEqualCorrelation(correlation: number, assetCount: number): number {
  const minCorrelation = getMinimumEqualCorrelation(assetCount);
  return Math.min(1, Math.max(minCorrelation, correlation));
}

export function isValidEqualCorrelation(correlation: number, assetCount: number): boolean {
  return Number.isFinite(correlation) && correlation >= getMinimumEqualCorrelation(assetCount) && correlation <= 1;
}

export function makeRandomWeights(assetCount: number, random: () => number = Math.random): number[] {
  if (!Number.isFinite(assetCount) || assetCount <= 0) {
    return [];
  }

  const raw = Array.from({ length: assetCount }, () => -Math.log(Math.max(random(), 1e-15)));
  const sum = raw.reduce((acc, value) => acc + value, 0) || 1;
  return raw.map((weight) => weight / sum);
}

export function calculatePortfolioPoint(
  assets: PortfolioAssetInput[],
  weights: number[],
  correlation: number,
  riskFreeRate: number
): PortfolioPoint {
  if (assets.length === 0 || weights.length !== assets.length) {
    throw new Error("Assets and weights must be non-empty arrays with matching lengths.");
  }

  if (
    assets.some((asset) => !Number.isFinite(asset.return) || !Number.isFinite(asset.risk) || asset.risk < 0) ||
    weights.some((weight) => !Number.isFinite(weight) || weight < 0)
  ) {
    throw new Error("Portfolio assets and weights must contain finite non-negative risk and weight values.");
  }

  if (!isValidEqualCorrelation(correlation, assets.length)) {
    throw new Error("Correlation is outside the valid range for this asset count.");
  }

  const ret = weights.reduce((acc, weight, index) => acc + weight * assets[index].return, 0);
  let variance = 0;

  for (let a = 0; a < assets.length; a++) {
    for (let b = 0; b < assets.length; b++) {
      const covariance = a === b ? assets[a].risk * assets[a].risk : correlation * assets[a].risk * assets[b].risk;
      variance += weights[a] * weights[b] * covariance;
    }
  }

  if (variance < -1e-8) {
    throw new Error("Portfolio covariance matrix produced negative variance.");
  }

  const risk = Math.sqrt(Math.max(0, variance));
  const sharpe = risk > 0 ? (ret - riskFreeRate) / risk : 0;

  return { ret, risk, sharpe, weights };
}

export function summarizePortfolioSimulations(simulations: PortfolioPoint[]): PortfolioSimulationResult {
  let optimal: PortfolioPoint | null = null;
  let bestSharpe = -Infinity;

  for (const point of simulations) {
    if (point.sharpe > bestSharpe) {
      bestSharpe = point.sharpe;
      optimal = point;
    }
  }

  const minVol = simulations.reduce<PortfolioPoint | null>(
    (min, point) => ((min?.risk ?? Infinity) < point.risk ? min : point),
    simulations[0] ?? null
  );

  return { simulations, optimal, minVol };
}
