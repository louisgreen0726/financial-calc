import { describe, expect, it } from "vitest";

import { parseNumberArray, parseOptionalNumber, parseRequiredNumber } from "@/lib/input-utils";

describe("input-utils", () => {
  it("parses optional numbers safely", () => {
    expect(parseOptionalNumber("42.5")).toBe(42.5);
    expect(parseOptionalNumber(" ")).toBeNull();
    expect(parseOptionalNumber("abc")).toBeNull();
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
