import { describe, expect, it } from "vitest";

import { parseNumberArray, parseOptionalNumber, parseRequiredNumber } from "@/lib/input-utils";

describe("input-utils", () => {
  it("parses optional numbers safely", () => {
    expect(parseOptionalNumber("42.5")).toBe(42.5);
    expect(parseOptionalNumber(" ")).toBeNull();
    expect(parseOptionalNumber("abc")).toBeNull();
  });

  it("normalizes common numeric separators", () => {
    expect(parseOptionalNumber("1,234.56")).toBe(1234.56);
    expect(parseOptionalNumber("1 234.56")).toBe(1234.56);
    expect(parseOptionalNumber("1_234.56")).toBe(1234.56);
  });

  it("rejects incomplete or non-finite numeric strings", () => {
    expect(parseOptionalNumber("1.2.3")).toBeNull();
    expect(parseOptionalNumber("1e")).toBeNull();
    expect(parseOptionalNumber("Infinity")).toBeNull();
    expect(parseOptionalNumber("NaN")).toBeNull();
  });

  it("provides fallback for required number parsing", () => {
    expect(parseRequiredNumber("12")).toBe(12);
    expect(parseRequiredNumber("bad", 7)).toBe(7);
  });

  it("parses number arrays and reports invalid entries", () => {
    const result = parseNumberArray(["1", "2.5", "oops"]);
    expect(result.parsed).toEqual([1, 2.5, 0]);
    expect(result.hasInvalid).toBe(true);
  });
});
