import { MAX_INTEREST_RATE, MAX_PORTFOLIO_ASSETS, MAX_VOLATILITY, MIN_INTEREST_RATE } from "@/lib/constants";
import { parseOptionalNumber } from "@/lib/input-utils";
import { sanitizeInput } from "@/lib/sanitize";

export interface RestoredPortfolioAsset {
  id: number;
  name: string;
  return: string;
  risk: string;
}

export function normalizeRestoredPortfolioAssets(value: unknown): RestoredPortfolioAsset[] {
  if (!Array.isArray(value)) return [];

  const normalized: RestoredPortfolioAsset[] = [];
  for (const candidate of value) {
    if (normalized.length >= MAX_PORTFOLIO_ASSETS) break;
    if (typeof candidate !== "object" || candidate === null) continue;

    const record = candidate as Record<string, unknown>;
    const name = typeof record.name === "string" ? sanitizeInput(record.name).trim() : "";
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
      return: String(expectedReturn),
      risk: String(risk),
    });
  }

  return normalized.length >= 2 ? normalized : [];
}
