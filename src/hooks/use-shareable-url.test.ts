import { describe, expect, it } from "vitest";

import { buildShareableUrl, readShareableState } from "@/hooks/use-shareable-url";

describe("shareable URL helpers", () => {
  it("normalizes trailing slashes and preserves unrelated query parameters", () => {
    const url = buildShareableUrl("/cash-flow/", "source=recent", "cash", {
      rate: 8,
      flows: ["-1000", "350", "450"],
    });

    const parsed = new URL(url);
    expect(parsed.origin).toBe(window.location.origin);
    expect(parsed.pathname).toBe("/cash-flow");
    expect(parsed.searchParams.get("source")).toBe("recent");
    expect(parsed.searchParams.get("cash_rate")).toBe("8");
    expect(parsed.searchParams.get("cash_flows")).toBe('json:["-1000","350","450"]');
  });

  it("removes empty values from the share query", () => {
    const url = buildShareableUrl("/risk/", "risk_value=1000&risk_days=10", "risk", {
      value: "",
      days: 30,
    });

    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/risk");
    expect(parsed.searchParams.get("risk_value")).toBeNull();
    expect(parsed.searchParams.get("risk_days")).toBe("30");
  });

  it("restores numbers, strings, and JSON string arrays from a prefixed query", () => {
    const restored = readShareableState(
      "?cash_rate=7.5&cash_flows=json%3A%5B%22-1000%22%2C%22500%7Cpipe%22%5D&cash_label=base",
      "cash",
      {
        rate: 0,
        flows: [] as string[],
        label: "",
      }
    );

    expect(restored).toEqual({
      rate: 7.5,
      flows: ["-1000", "500|pipe"],
      label: "base",
    });
  });

  it("keeps reading legacy pipe-delimited string arrays", () => {
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
