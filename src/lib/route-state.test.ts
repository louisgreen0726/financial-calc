import { describe, expect, it } from "vitest";

import { normalizeLoanMethod, normalizeMacroTab, normalizeTVMTarget } from "@/lib/route-state";

describe("route state normalizers", () => {
  it("keeps valid enum-like route state values", () => {
    expect(normalizeTVMTarget("rate")).toBe("rate");
    expect(normalizeLoanMethod("CAM")).toBe("CAM");
    expect(normalizeMacroTab("ppp")).toBe("ppp");
  });

  it("falls back when route state values are malformed", () => {
    expect(normalizeTVMTarget("drop-table")).toBe("fv");
    expect(normalizeLoanMethod("balloon")).toBe("CPM");
    expect(normalizeMacroTab("unknown")).toBe("inflation");
  });
});
