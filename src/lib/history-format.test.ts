import { describe, expect, it } from "vitest";

import { formatHistoryResult } from "@/lib/history-format";
import type { CalculationHistoryItem } from "@/hooks/use-calculation-history";
import { formatCurrency } from "@/lib/utils";

function item(overrides: Partial<CalculationHistoryItem>): CalculationHistoryItem {
  return {
    id: "id",
    page: "tvm",
    inputs: {},
    result: 0,
    timestamp: 1,
    ...overrides,
  };
}

describe("formatHistoryResult", () => {
  it("uses explicit result metadata for percentages and periods", () => {
    expect(formatHistoryResult(item({ result: 0.075, resultFormat: "percentDecimal" }))).toBe("7.5%");
    expect(formatHistoryResult(item({ result: 12, resultFormat: "periods" }))).toBe("12 periods");
  });

  it("infers ratio formatting for portfolio history", () => {
    expect(formatHistoryResult(item({ page: "portfolio", result: 1.23456 }))).toBe("1.2346");
  });

  it("infers legacy TVM formats from the stable target instead of the display label", () => {
    expect(formatHistoryResult(item({ inputs: { target: "rate" }, result: 0.075, label: "Amount" }))).toBe("7.5%");
    expect(
      formatHistoryResult(item({ inputs: { target: "nper" }, result: 12, label: "TVM -> NPER" }), {
        periodsUnit: "期",
      })
    ).toBe("12 期");
    expect(formatHistoryResult(item({ inputs: { target: "pv" }, result: 1000, label: "Rate" }))).toBe(
      formatCurrency(1000)
    );
  });

  it("infers legacy Macro formats independently of English or Chinese labels", () => {
    expect(
      formatHistoryResult(item({ page: "macro", inputs: { calculator: "inflation" }, result: 2.5, label: "通胀率" }))
    ).toBe("2.5%");
    expect(formatHistoryResult(item({ page: "macro", inputs: { calculator: "realRate" }, result: 3 }))).toBe("3%");
    expect(
      formatHistoryResult(item({ page: "macro", inputs: { calculator: "ppp" }, result: 7.2, label: "Exchange Rate" }))
    ).toBe("7.2");
    expect(
      formatHistoryResult(
        item({ page: "macro", inputs: { calculator: "purchasingPower" }, result: 1000, label: "Return" })
      )
    ).toBe(formatCurrency(1000));
  });

  it("infers legacy implied-volatility results from the stable option type", () => {
    expect(
      formatHistoryResult(
        item({ page: "options", inputs: { impliedOptionType: "call" }, result: 0.2, label: "隐含波动率" })
      )
    ).toBe("20%");
    expect(formatHistoryResult(item({ page: "options", inputs: { impliedOptionType: "put" }, result: 0.25 }))).toBe(
      "25%"
    );
  });

  it("keeps explicit metadata above raw-input inference and falls back for unknown discriminators", () => {
    expect(formatHistoryResult(item({ inputs: { target: "rate" }, result: 0.075, resultFormat: "number" }))).toBe(
      "0.075"
    );
    expect(formatHistoryResult(item({ inputs: { target: "future-target" }, result: 0.1, label: "Return" }))).toBe(
      "10%"
    );
  });

  it("does not render invalid stored values as currency", () => {
    expect(formatHistoryResult(item({ result: Number.NaN }))).toBe("N/A");
  });

  it("uses localized fallback units and unavailable labels", () => {
    expect(
      formatHistoryResult(item({ result: 12, resultFormat: "periods" }), {
        locale: "zh",
        periodsUnit: "期",
      })
    ).toBe("12 期");
    expect(formatHistoryResult(item({ result: Number.NaN }), { notAvailable: "暂无" })).toBe("暂无");
  });
});
