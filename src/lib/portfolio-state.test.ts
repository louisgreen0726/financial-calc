import { describe, expect, it } from "vitest";

import {
  DEFAULT_PORTFOLIO_ASSETS,
  isPortfolioDefaultAssetNameKey,
  normalizeRestoredPortfolioAssets,
  normalizeRestoredPortfolioCorrelation,
  normalizeRestoredPortfolioRiskFreeRate,
} from "@/lib/portfolio-state";

describe("portfolio asset restore state", () => {
  it("defines stable localized identities with backward-compatible English fallbacks", () => {
    expect(DEFAULT_PORTFOLIO_ASSETS.map(({ name, nameKey }) => ({ name, nameKey }))).toEqual([
      { name: "US Tech", nameKey: "portfolio.defaultAssets.usTech" },
      { name: "Bonds", nameKey: "portfolio.defaultAssets.bonds" },
      { name: "Gold", nameKey: "portfolio.defaultAssets.gold" },
      { name: "Emerging Mkts", nameKey: "portfolio.defaultAssets.emergingMarkets" },
    ]);
    expect(isPortfolioDefaultAssetNameKey("portfolio.defaultAssets.gold")).toBe(true);
    expect(isPortfolioDefaultAssetNameKey("portfolio.defaultAssets.futureAsset")).toBe(false);
  });

  it("preserves allowlisted name keys while normalizing restored asset ids and numbers", () => {
    expect(
      normalizeRestoredPortfolioAssets([
        {
          id: 20,
          name: "US Tech",
          nameKey: "portfolio.defaultAssets.usTech",
          return: "12.50",
          risk: 20,
        },
        {
          id: 20,
          name: "Bonds",
          nameKey: "portfolio.defaultAssets.bonds",
          return: 4,
          risk: "5",
        },
      ])
    ).toEqual([
      {
        id: 1,
        name: "US Tech",
        nameKey: "portfolio.defaultAssets.usTech",
        return: "12.5",
        risk: "20",
      },
      {
        id: 2,
        name: "Bonds",
        nameKey: "portfolio.defaultAssets.bonds",
        return: "4",
        risk: "5",
      },
    ]);
  });

  it("keeps legacy names literal and degrades unknown name keys without guessing from text", () => {
    expect(
      normalizeRestoredPortfolioAssets([
        { id: 1, name: "US Tech", return: "12", risk: "20" },
        {
          id: 2,
          name: "Future default",
          nameKey: "portfolio.defaultAssets.futureAsset",
          return: "4",
          risk: "5",
        },
        {
          id: 3,
          name: "",
          nameKey: "portfolio.defaultAssets.futureAsset",
          return: "6",
          risk: "15",
        },
      ])
    ).toEqual([
      { id: 1, name: "US Tech", return: "12", risk: "20" },
      { id: 2, name: "Future default", return: "4", risk: "5" },
    ]);
  });
});

describe("portfolio restore settings", () => {
  it("accepts finite numeric and string values within UI bounds", () => {
    expect(normalizeRestoredPortfolioRiskFreeRate(-10)).toBe(-10);
    expect(normalizeRestoredPortfolioRiskFreeRate("-2.5")).toBe(-2.5);
    expect(normalizeRestoredPortfolioRiskFreeRate(10)).toBe(10);
    expect(normalizeRestoredPortfolioCorrelation("-0.25")).toBe(-0.25);
    expect(normalizeRestoredPortfolioCorrelation(1)).toBe(1);
  });

  it("rejects malformed, non-finite, and out-of-range restored settings", () => {
    for (const value of [-10.01, 10.01, Number.NaN, Number.POSITIVE_INFINITY, "1,2", "not-a-rate", null]) {
      expect(normalizeRestoredPortfolioRiskFreeRate(value)).toBeNull();
    }
    for (const value of [-1.01, 1.01, Number.NaN, Number.NEGATIVE_INFINITY, "0.2%", undefined]) {
      expect(normalizeRestoredPortfolioCorrelation(value)).toBeNull();
    }
  });
});
