import { describe, expect, it } from "vitest";

import type { CalculationHistoryItem, HistoryResultFormat } from "@/lib/calculation-history";
import {
  areHistoryItemsComparable,
  createHistoryComparisonDelta,
  createHistoryComparisonPair,
  getHistoryComparisonEligibility,
  type HistoryComparisonMetric,
} from "@/lib/history-comparison";

interface EligibleCase {
  name: string;
  compatibilityKey: HistoryComparisonMetric;
  page: CalculationHistoryItem["page"];
  resultFormat: HistoryResultFormat;
  inputs: Record<string, number | string>;
  canonicalKeys: string[];
}

const eligibleCases: EligibleCase[] = [
  {
    name: "TVM rate",
    compatibilityKey: "tvm:rate",
    page: "tvm",
    resultFormat: "percentDecimal",
    inputs: { rate: "", nper: "10", pmt: "0", pv: "-1,000", fv: "1500", type: "0", target: "rate" },
    canonicalKeys: ["nper", "pmt", "pv", "fv", "type"],
  },
  {
    name: "TVM periods",
    compatibilityKey: "tvm:nper",
    page: "tvm",
    resultFormat: "periods",
    inputs: { rate: "5", nper: "", pmt: "0", pv: "-1000", fv: "1500", type: 1, target: "nper" },
    canonicalKeys: ["rate", "pmt", "pv", "fv", "type"],
  },
  {
    name: "CAPM",
    compatibilityKey: "equity:capm",
    page: "equity",
    resultFormat: "percentDecimal",
    inputs: { rf: "3.5", beta: "1.2", rm: "10" },
    canonicalKeys: ["rf", "beta", "rm"],
  },
  {
    name: "WACC",
    compatibilityKey: "equity:wacc",
    page: "equity",
    resultFormat: "percentDecimal",
    inputs: { equity: "1,000,000", debt: 500000, costEquity: "12", costDebt: "6", taxRate: "25" },
    canonicalKeys: ["equity", "debt", "costEquity", "costDebt", "taxRate"],
  },
  {
    name: "call implied volatility",
    compatibilityKey: "options:implied-volatility:call",
    page: "options",
    resultFormat: "percentDecimal",
    inputs: {
      spot: "100",
      strike: "95",
      time: "1",
      rate: "5",
      dividendYield: "2",
      impliedOptionType: "call",
      marketPrice: "12",
    },
    canonicalKeys: ["spot", "strike", "time", "rate", "dividendYield", "marketPrice"],
  },
  {
    name: "put implied volatility",
    compatibilityKey: "options:implied-volatility:put",
    page: "options",
    resultFormat: "percentDecimal",
    inputs: {
      spot: "100",
      strike: "105",
      time: "1",
      rate: "5",
      dividendYield: "2",
      impliedOptionType: "put",
      marketPrice: "11",
    },
    canonicalKeys: ["spot", "strike", "time", "rate", "dividendYield", "marketPrice"],
  },
  {
    name: "inflation",
    compatibilityKey: "macro:inflation",
    page: "macro",
    resultFormat: "percent",
    inputs: { calculator: "inflation", startPrice: "100", endPrice: "125", years: "5" },
    canonicalKeys: ["startPrice", "endPrice", "years"],
  },
  {
    name: "real rate",
    compatibilityKey: "macro:real-rate",
    page: "macro",
    resultFormat: "percent",
    inputs: { calculator: "realRate", nominalRate: "7", inflation: "3" },
    canonicalKeys: ["nominalRate", "inflation"],
  },
  {
    name: "purchasing power parity",
    compatibilityKey: "macro:ppp",
    page: "macro",
    resultFormat: "ratio",
    inputs: { calculator: "ppp", domesticPrice: "5.5", foreignPrice: "4" },
    canonicalKeys: ["domesticPrice", "foreignPrice"],
  },
];

function makeItem(testCase: EligibleCase, overrides: Partial<CalculationHistoryItem> = {}): CalculationHistoryItem {
  return {
    id: `${testCase.compatibilityKey}-1`,
    page: testCase.page,
    inputs: { ...testCase.inputs },
    result: 1,
    timestamp: 1,
    label: "English label",
    resultFormat: testCase.resultFormat,
    ...overrides,
  };
}

describe("history comparison eligibility", () => {
  it.each(eligibleCases)("recognizes the strict $name contract", (testCase) => {
    const eligibility = getHistoryComparisonEligibility(makeItem(testCase));

    expect(eligibility).toMatchObject({
      eligible: true,
      compatibilityKey: testCase.compatibilityKey,
      resultFormat: testCase.resultFormat,
    });
    if (eligibility.eligible) {
      expect(eligibility.canonicalInputs.map(({ key }) => key)).toEqual(testCase.canonicalKeys);
      expect(
        eligibility.canonicalInputs.every(({ value }) => typeof value === "number" || typeof value === "string")
      ).toBe(true);
    }
  });

  it.each(eligibleCases)("ignores localized labels and timestamps for $name compatibility", (testCase) => {
    const baseline = makeItem(testCase, { label: "English", timestamp: 1 });
    const comparison = makeItem(testCase, {
      id: `${testCase.compatibilityKey}-2`,
      label: "中文标签",
      timestamp: 99_999,
    });

    expect(areHistoryItemsComparable(baseline, comparison)).toBe(true);
  });

  it("rejects every cross-metric pairing", () => {
    for (let baselineIndex = 0; baselineIndex < eligibleCases.length; baselineIndex += 1) {
      for (let comparisonIndex = baselineIndex + 1; comparisonIndex < eligibleCases.length; comparisonIndex += 1) {
        const baseline = makeItem(eligibleCases[baselineIndex]);
        const comparison = makeItem(eligibleCases[comparisonIndex], {
          id: `${eligibleCases[comparisonIndex].compatibilityKey}-2`,
        });
        expect(
          areHistoryItemsComparable(baseline, comparison),
          `${eligibleCases[baselineIndex].name} versus ${eligibleCases[comparisonIndex].name}`
        ).toBe(false);
      }
    }
  });

  it.each(eligibleCases)(
    "rejects extra, missing, malformed, unit-bearing, and wrong-format $name records",
    (testCase) => {
      const [firstCanonicalKey] = testCase.canonicalKeys;
      const withExtraKey = makeItem(testCase, { inputs: { ...testCase.inputs, unexpected: "value" } });
      const missingInputs = { ...testCase.inputs };
      delete missingInputs[firstCanonicalKey];
      const malformedInputs = { ...testCase.inputs, [firstCanonicalKey]: "not-a-number" };

      const invalidItems = [
        withExtraKey,
        makeItem(testCase, { inputs: missingInputs }),
        makeItem(testCase, { inputs: malformedInputs }),
        makeItem(testCase, { resultUnit: "custom-unit" }),
        makeItem(testCase, { resultFormat: testCase.resultFormat === "ratio" ? "number" : "ratio" }),
        makeItem(testCase, { result: Number.NaN }),
        makeItem(testCase, { resultFormat: undefined }),
      ];

      for (const item of invalidItems) {
        expect(getHistoryComparisonEligibility(item), testCase.name).toEqual({
          eligible: false,
          reason: "legacy-or-unsupported",
        });
      }
    }
  );

  it("rejects invalid current discriminators and enums", () => {
    const tvm = eligibleCases[0];
    const option = eligibleCases[4];
    const macro = eligibleCases[6];
    const invalidItems = [
      makeItem(tvm, { inputs: { ...tvm.inputs, target: "yield" } }),
      makeItem(tvm, { inputs: { ...tvm.inputs, type: "2" } }),
      makeItem(option, { inputs: { ...option.inputs, impliedOptionType: "straddle" } }),
      makeItem(macro, { inputs: { ...macro.inputs, calculator: "gdp" } }),
    ];

    for (const item of invalidItems) {
      expect(getHistoryComparisonEligibility(item)).toEqual({
        eligible: false,
        reason: "legacy-or-unsupported",
      });
    }
  });

  it("rejects current currency result families because their original currency is absent", () => {
    const currencyItems: CalculationHistoryItem[] = [
      {
        id: "tvm-pv",
        page: "tvm",
        inputs: { rate: "5", nper: "10", pmt: "0", pv: "", fv: "1500", type: "0", target: "pv" },
        result: 1000,
        timestamp: 1,
        resultFormat: "currency",
      },
      {
        id: "cash-flow",
        page: "cash-flow",
        inputs: { rate: "10", flows: '["-1000","1100"]' },
        result: 100,
        timestamp: 1,
        resultFormat: "currency",
      },
      {
        id: "ddm",
        page: "equity",
        inputs: { div: "2.5", growth: "4", reqReturn: "9" },
        result: 50,
        timestamp: 1,
        resultFormat: "currency",
      },
      {
        id: "bond",
        page: "bonds",
        inputs: { faceValue: "1000", couponRate: "5", years: "10", ytm: "4", frequency: "2" },
        result: 1081,
        timestamp: 1,
        resultFormat: "currency",
      },
      {
        id: "call-price",
        page: "options",
        inputs: { spot: "100", strike: "95", time: "1", rate: "5", dividendYield: "2", volatility: "20" },
        result: 12,
        timestamp: 1,
        resultFormat: "currency",
      },
      {
        id: "var",
        page: "risk",
        inputs: { value: "100000", volatility: "15", confidence: "0.99", days: "10" },
        result: 8000,
        timestamp: 1,
        resultFormat: "currency",
      },
      {
        id: "loan",
        page: "loans",
        inputs: { amount: "250000", rate: "4.25", years: "30", method: "CPM" },
        result: 442000,
        timestamp: 1,
        resultFormat: "currency",
      },
      {
        id: "purchasing-power",
        page: "macro",
        inputs: { calculator: "purchasingPower", amount: "1000", inflation: "3", years: "10" },
        result: 744,
        timestamp: 1,
        resultFormat: "currency",
      },
      {
        id: "cpi-adjust",
        page: "macro",
        inputs: { calculator: "cpiAdjust", amount: "1000", fromCPI: "200", toCPI: "240" },
        result: 1200,
        timestamp: 1,
        resultFormat: "currency",
      },
    ];

    for (const item of currencyItems) {
      expect(getHistoryComparisonEligibility(item), item.id).toEqual({
        eligible: false,
        reason: "currency-metadata-missing",
      });
    }
  });

  it("rejects Portfolio results because the stored record has no model version or simulation count", () => {
    const item: CalculationHistoryItem = {
      id: "portfolio",
      page: "portfolio",
      inputs: {
        assets: JSON.stringify([
          { id: 1, name: "A", return: "8", risk: "10" },
          { id: 2, name: "B", return: "5", risk: "4" },
        ]),
        rf: 2,
        correlation: 0.2,
        seed: "seed",
      },
      result: 1.2,
      timestamp: 1,
      resultFormat: "ratio",
    };

    expect(getHistoryComparisonEligibility(item)).toEqual({
      eligible: false,
      reason: "model-metadata-missing",
    });
  });

  it("canonicalizes numeric representations and omits discriminators and solved TVM fields", () => {
    const wacc = eligibleCases[3];
    const waccEligibility = getHistoryComparisonEligibility(makeItem(wacc));
    expect(waccEligibility).toMatchObject({
      eligible: true,
      canonicalInputs: [
        { key: "equity", value: 1_000_000 },
        { key: "debt", value: 500_000 },
        { key: "costEquity", value: 12 },
        { key: "costDebt", value: 6 },
        { key: "taxRate", value: 25 },
      ],
    });

    const tvmRateEligibility = getHistoryComparisonEligibility(makeItem(eligibleCases[0]));
    expect(tvmRateEligibility).toMatchObject({
      eligible: true,
      canonicalInputs: [
        { key: "nper", value: 10 },
        { key: "pmt", value: 0 },
        { key: "pv", value: -1000 },
        { key: "fv", value: 1500 },
        { key: "type", value: "0" },
      ],
    });
  });
});

describe("history comparison pairs and deltas", () => {
  it("builds an ordered compatible pair with canonical inputs and a signed absolute-unit delta", () => {
    const capm = eligibleCases[2];
    const baseline = makeItem(capm, { result: 0.08, label: "CAPM", timestamp: 100 });
    const comparison = makeItem(capm, { id: "capm-2", result: 0.105, label: "资本资产定价", timestamp: 1 });

    const pair = createHistoryComparisonPair(baseline, comparison);
    expect(pair).toMatchObject({
      compatibilityKey: "equity:capm",
      resultFormat: "percentDecimal",
      baselineInputs: [
        { key: "rf", value: 3.5 },
        { key: "beta", value: 1.2 },
        { key: "rm", value: 10 },
      ],
      comparisonInputs: [
        { key: "rf", value: 3.5 },
        { key: "beta", value: 1.2 },
        { key: "rm", value: 10 },
      ],
      delta: { unit: "percentage-points" },
    });
    expect(pair?.delta.value).toBeCloseTo(2.5, 12);
  });

  it("rejects the same record and incompatible metrics as pairs", () => {
    const baseline = makeItem(eligibleCases[0]);
    expect(createHistoryComparisonPair(baseline, { ...baseline })).toBeNull();
    expect(createHistoryComparisonPair(baseline, makeItem(eligibleCases[1]))).toBeNull();
  });

  it.each([
    {
      format: "percentDecimal" as const,
      baseline: 0.05,
      comparison: 0.075,
      expected: { value: 2.5, unit: "percentage-points" },
    },
    { format: "percent" as const, baseline: 5, comparison: 7.5, expected: { value: 2.5, unit: "percentage-points" } },
    {
      format: "ratio" as const,
      baseline: 1.2,
      comparison: 1.05,
      expected: { value: -0.1499999999999999, unit: "ratio" },
    },
    { format: "number" as const, baseline: 10, comparison: 12, expected: { value: 2, unit: "number" } },
    { format: "periods" as const, baseline: 12, comparison: 10, expected: { value: -2, unit: "periods" } },
    { format: "years" as const, baseline: 4, comparison: 5.5, expected: { value: 1.5, unit: "years" } },
  ])("maps $format changes to absolute display units", ({ format, baseline, comparison, expected }) => {
    const delta = createHistoryComparisonDelta(baseline, comparison, format);
    expect(delta?.unit).toBe(expected.unit);
    expect(delta?.value).toBeCloseTo(expected.value, 12);
  });

  it("does not create currency or non-finite deltas and normalizes a zero difference", () => {
    expect(createHistoryComparisonDelta(100, 110, "currency")).toBeNull();
    expect(createHistoryComparisonDelta(Number.NaN, 1, "number")).toBeNull();
    expect(createHistoryComparisonDelta(1, Number.POSITIVE_INFINITY, "ratio")).toBeNull();
    expect(createHistoryComparisonDelta(0, -0, "number")).toEqual({ value: 0, unit: "number" });
  });
});
