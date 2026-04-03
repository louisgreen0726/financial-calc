import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercent,
  validateNumber,
  validatePositive,
  validateNonNegative,
  clamp,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names correctly", () => {
    expect(cn("px-2", "py-3")).toBe("px-2 py-3");
  });

  it("handles conditional classes", () => {
    expect(cn("base", true && "active", false && "inactive")).toBe("base active");
  });

  it("resolves Tailwind conflicts", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("", false && "hidden")).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats positive values", () => {
    expect(formatCurrency(1234.56)).toContain("1,234.56");
  });

  it("formats negative values", () => {
    const result = formatCurrency(-500);
    expect(result).toContain("500");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("formatNumber", () => {
  it("uses default 2 decimal places", () => {
    expect(formatNumber(3.14159)).toBe("3.14");
  });

  it("respects custom precision", () => {
    expect(formatNumber(3.14159, 4)).toBe("3.1416");
  });

  it("formats negative numbers", () => {
    expect(formatNumber(-42.5)).toBe("-42.5");
  });

  it("formats large numbers with commas", () => {
    expect(formatNumber(1000000)).toBe("1,000,000");
  });
});

describe("formatPercent", () => {
  it("formats 0.05 as 5.00%", () => {
    expect(formatPercent(0.05)).toBe("5.00%");
  });

  it("formats 0.1234 as 12.34%", () => {
    expect(formatPercent(0.1234)).toBe("12.34%");
  });

  it("respects custom decimal places", () => {
    expect(formatPercent(0.1234, 1)).toBe("12.3%");
  });
});

describe("validateNumber", () => {
  it("accepts valid numbers", () => {
    expect(validateNumber("42")).toEqual({ valid: true, value: 42 });
    expect(validateNumber("-3.14")).toEqual({ valid: true, value: -3.14 });
    expect(validateNumber("0")).toEqual({ valid: true, value: 0 });
  });

  it("rejects NaN input", () => {
    const result = validateNumber("abc");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Please enter a valid number");
  });

  it("rejects empty string", () => {
    const result = validateNumber("");
    expect(result.valid).toBe(false);
  });

  it("rejects Infinity", () => {
    const result = validateNumber("Infinity");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Number is too large");
  });
});

describe("validatePositive", () => {
  it("accepts positive numbers", () => {
    expect(validatePositive("10")).toEqual({ valid: true, value: 10 });
  });

  it("rejects zero", () => {
    const result = validatePositive("0");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Must be greater than 0");
  });

  it("rejects negative numbers", () => {
    const result = validatePositive("-5");
    expect(result.valid).toBe(false);
  });

  it("rejects non-numeric", () => {
    const result = validatePositive("abc");
    expect(result.valid).toBe(false);
  });
});

describe("validateNonNegative", () => {
  it("accepts positive numbers", () => {
    expect(validateNonNegative("10")).toEqual({ valid: true, value: 10 });
  });

  it("accepts zero", () => {
    expect(validateNonNegative("0")).toEqual({ valid: true, value: 0 });
  });

  it("rejects negative numbers", () => {
    const result = validateNonNegative("-1");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Cannot be negative");
  });

  it("rejects non-numeric", () => {
    const result = validateNonNegative("xyz");
    expect(result.valid).toBe(false);
  });
});

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("returns min when value is below range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("returns max when value is above range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles edge cases", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});
