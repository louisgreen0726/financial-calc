import { describe, expect, it } from "vitest";

import { labelReportFields } from "@/lib/report-fields";

describe("human-readable report fields", () => {
  it("replaces internal keys with unit-bearing labels and preserves values", () => {
    expect(
      labelReportFields(
        { rate: "5", years: "30", method: "Fixed payment" },
        { rate: "Annual Rate (%)", years: "Term (Years)", method: "Loan Method" }
      )
    ).toEqual({
      "Annual Rate (%)": "5",
      "Term (Years)": "30",
      "Loan Method": "Fixed payment",
    });
  });

  it("falls back to the internal key for missing or empty labels", () => {
    expect(labelReportFields({ amount: "1000", note: "kept" }, { amount: " ", note: "Note" })).toEqual({
      amount: "1000",
      Note: "kept",
    });
    expect(labelReportFields(undefined, { amount: "Amount" })).toBeUndefined();
  });

  it("creates safe own properties for special labels", () => {
    const result = labelReportFields({ field: "value" }, { field: "__proto__" });

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.hasOwn(result ?? {}, "__proto__")).toBe(true);
    expect(result?.__proto__).toBe("value");
  });
});
