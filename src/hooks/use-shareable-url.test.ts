import { describe, expect, it } from "vitest";

import { buildShareableUrl, readShareableState } from "@/hooks/use-shareable-url";

describe("shareable URL helpers", () => {
  it("normalizes trailing slashes and preserves unrelated query parameters", () => {
    const url = buildShareableUrl("/cash-flow/", "source=recent", "cash", {
      rate: 8,
      flows: ["-1000", "350", "450"],
    });

    expect(url).toBe("/cash-flow?source=recent&cash_rate=8&cash_flows=-1000%7C350%7C450");
  });

  it("removes empty values from the share query", () => {
    const url = buildShareableUrl("/risk/", "risk_value=1000&risk_days=10", "risk", {
      value: "",
      days: 30,
    });

    expect(url).toBe("/risk?risk_days=30");
  });

  it("restores numbers, strings, and string arrays from a prefixed query", () => {
    const restored = readShareableState("?cash_rate=7.5&cash_flows=-1000%7C500&cash_label=base", "cash", {
      rate: 0,
      flows: [] as string[],
      label: "",
    });

    expect(restored).toEqual({
      rate: 7.5,
      flows: ["-1000", "500"],
      label: "base",
    });
  });
});
