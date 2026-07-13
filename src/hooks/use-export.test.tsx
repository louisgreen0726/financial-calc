import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useExport } from "@/hooks/use-export";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

describe("useExport failure recovery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("reports CSV download failures and remains usable for a retry", () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    const { result } = renderHook(() => useExport({ filename: "report" }));

    act(() => result.current.exportToCSV([{ value: 42 }]));
    act(() => result.current.exportToCSV([{ value: 43 }]));

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(toast.error).toHaveBeenCalledTimes(2);
    expect(toast.error).toHaveBeenLastCalledWith("export.csvError");
    expect(toast.success).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(2);
  });

  it("reports JSON download failures and remains usable for a retry", () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
      throw new Error("Object URLs unavailable");
    });
    const { result } = renderHook(() => useExport({ filename: "report" }));

    act(() => result.current.exportToJSON({ value: 42 }));
    act(() => result.current.exportToJSON({ value: 43 }));

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(toast.error).toHaveBeenCalledTimes(2);
    expect(toast.error).toHaveBeenLastCalledWith("export.jsonError");
    expect(toast.success).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(2);
  });
});
