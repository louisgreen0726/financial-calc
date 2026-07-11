import { describe, expect, it } from "vitest";

import { MAX_SANITIZED_INPUT_LENGTH, sanitizeInput } from "@/lib/sanitize";

describe("sanitizeInput", () => {
  it("preserves plain-text comparison and markup characters", () => {
    expect(sanitizeInput("<Growth> Fund & A < B")).toBe("<Growth> Fund & A < B");
  });

  it("normalizes Unicode and removes control characters", () => {
    expect(sanitizeInput("Cafe\u0301\u0000\n\tSeed")).toBe("Caf\u00e9 Seed");
  });

  it("limits input by Unicode code points without splitting a surrogate pair", () => {
    expect(sanitizeInput("A😀B", 2)).toBe("A😀");
    expect(sanitizeInput("x".repeat(MAX_SANITIZED_INPUT_LENGTH + 5))).toHaveLength(MAX_SANITIZED_INPUT_LENGTH);
  });
});
