import {
  MAX_INTEREST_RATE,
  MAX_PORTFOLIO_ASSETS,
  MAX_PORTFOLIO_RISK_FREE_RATE,
  MAX_VOLATILITY,
  MIN_INTEREST_RATE,
  MIN_PORTFOLIO_RISK_FREE_RATE,
} from "@/lib/constants";
import { parseOptionalNumber } from "@/lib/input-utils";
import { sanitizeInput } from "@/lib/sanitize";

export const PORTFOLIO_DEFAULT_ASSET_NAME_KEYS = [
  "portfolio.defaultAssets.usTech",
  "portfolio.defaultAssets.bonds",
  "portfolio.defaultAssets.gold",
  "portfolio.defaultAssets.emergingMarkets",
] as const;

export type PortfolioDefaultAssetNameKey = (typeof PORTFOLIO_DEFAULT_ASSET_NAME_KEYS)[number];

const portfolioDefaultAssetNameKeys = new Set<string>(PORTFOLIO_DEFAULT_ASSET_NAME_KEYS);

export interface PortfolioAssetState {
  id: number;
  name: string;
  nameKey?: PortfolioDefaultAssetNameKey;
  return: string;
  risk: string;
}

export type RestoredPortfolioAsset = PortfolioAssetState;

export const DEFAULT_PORTFOLIO_ASSETS = [
  {
    id: 1,
    name: "US Tech",
    nameKey: "portfolio.defaultAssets.usTech",
    return: "12",
    risk: "20",
  },
  {
    id: 2,
    name: "Bonds",
    nameKey: "portfolio.defaultAssets.bonds",
    return: "4",
    risk: "5",
  },
  {
    id: 3,
    name: "Gold",
    nameKey: "portfolio.defaultAssets.gold",
    return: "6",
    risk: "15",
  },
  {
    id: 4,
    name: "Emerging Mkts",
    nameKey: "portfolio.defaultAssets.emergingMarkets",
    return: "15",
    risk: "25",
  },
] as const satisfies readonly PortfolioAssetState[];

export function isPortfolioDefaultAssetNameKey(value: unknown): value is PortfolioDefaultAssetNameKey {
  return typeof value === "string" && portfolioDefaultAssetNameKeys.has(value);
}

function normalizeRestoredNumber(value: unknown, min: number, max: number): number | null {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? parseOptionalNumber(sanitizeInput(value)) : null;
  return parsed !== null && Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export function normalizeRestoredPortfolioRiskFreeRate(value: unknown): number | null {
  return normalizeRestoredNumber(value, MIN_PORTFOLIO_RISK_FREE_RATE, MAX_PORTFOLIO_RISK_FREE_RATE);
}

export function normalizeRestoredPortfolioCorrelation(value: unknown): number | null {
  return normalizeRestoredNumber(value, -1, 1);
}

export function normalizeRestoredPortfolioAssets(value: unknown): RestoredPortfolioAsset[] {
  if (!Array.isArray(value)) return [];

  const normalized: RestoredPortfolioAsset[] = [];
  for (const candidate of value) {
    if (normalized.length >= MAX_PORTFOLIO_ASSETS) break;
    if (typeof candidate !== "object" || candidate === null) continue;

    const record = candidate as Record<string, unknown>;
    const name = typeof record.name === "string" ? sanitizeInput(record.name).trim() : "";
    const nameKey = isPortfolioDefaultAssetNameKey(record.nameKey) ? record.nameKey : undefined;
    const expectedReturn =
      typeof record.return === "number"
        ? record.return
        : typeof record.return === "string"
          ? parseOptionalNumber(sanitizeInput(record.return))
          : null;
    const risk =
      typeof record.risk === "number"
        ? record.risk
        : typeof record.risk === "string"
          ? parseOptionalNumber(sanitizeInput(record.risk))
          : null;

    if (
      !name ||
      expectedReturn === null ||
      !Number.isFinite(expectedReturn) ||
      expectedReturn < MIN_INTEREST_RATE ||
      expectedReturn > MAX_INTEREST_RATE ||
      risk === null ||
      !Number.isFinite(risk) ||
      risk < 0 ||
      risk > MAX_VOLATILITY
    ) {
      continue;
    }

    normalized.push({
      id: normalized.length + 1,
      name,
      ...(nameKey ? { nameKey } : {}),
      return: String(expectedReturn),
      risk: String(risk),
    });
  }

  return normalized.length >= 2 ? normalized : [];
}
