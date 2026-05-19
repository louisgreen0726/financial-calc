import { describe, expect, it } from "vitest";

import { OptionsInputSchema } from "@/lib/validation";

describe("shared validation schemas", () => {
  it("allows option maturity and volatility at zero because the pricing engine supports them", () => {
    const parsed = OptionsInputSchema.safeParse({ S: 100, K: 100, t: 0, r: 0.05, sigma: 0 });

    expect(parsed.success).toBe(true);
  });

  it("rejects negative option maturity and volatility", () => {
    expect(OptionsInputSchema.safeParse({ S: 100, K: 100, t: -1, r: 0.05, sigma: 0.2 }).success).toBe(false);
    expect(OptionsInputSchema.safeParse({ S: 100, K: 100, t: 1, r: 0.05, sigma: -0.2 }).success).toBe(false);
  });
});
