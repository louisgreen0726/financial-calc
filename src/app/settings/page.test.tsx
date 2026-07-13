import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "@/app/settings/page";
import { createCalculationHistoryEnvelope } from "@/lib/calculation-history";

const mocks = vi.hoisted(() => ({
  exportToJSON: vi.fn(),
  setLanguage: vi.fn(),
  setTheme: vi.fn(),
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    language: "en",
    setLanguage: mocks.setLanguage,
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "light", setTheme: mocks.setTheme }),
}));

vi.mock("@/hooks/use-export", () => ({
  useExport: () => ({ exportToJSON: mocks.exportToJSON }),
}));

vi.mock("sonner", () => ({ toast: mocks.toast }));

describe("SettingsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    mocks.setLanguage.mockReturnValue(true);
    mocks.setTheme.mockReturnValue(true);
  });

  it("reports theme and language persistence failures", () => {
    mocks.setTheme.mockReturnValue(false);
    mocks.setLanguage.mockReturnValue(false);
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "settings.dark" }));
    fireEvent.click(screen.getByRole("button", { name: "中文" }));

    expect(mocks.setTheme).toHaveBeenCalledWith("dark");
    expect(mocks.setLanguage).toHaveBeenCalledWith("zh");
    expect(mocks.toast.error).toHaveBeenCalledTimes(2);
    expect(mocks.toast.error).toHaveBeenNthCalledWith(1, "common.storageError");
    expect(mocks.toast.error).toHaveBeenNthCalledWith(2, "common.storageError");
  });

  it("keeps the previous currency selected when persistence is blocked", () => {
    render(<SettingsPage />);
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });

    try {
      fireEvent.click(screen.getByRole("button", { name: /CNY/ }));
      expect(screen.getByRole("button", { name: /USD/ })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: /CNY/ })).toHaveAttribute("aria-pressed", "false");
    } finally {
      setItem.mockRestore();
    }
  });

  it("exports a normalized versioned history envelope", () => {
    const item = {
      id: "legacy",
      page: "tvm" as const,
      inputs: { rate: "5" },
      result: 100,
      timestamp: Date.now(),
    };
    window.localStorage.setItem("financial-calc-history", JSON.stringify([item]));
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "settings.exportHistoryJson" }));

    expect(mocks.exportToJSON).toHaveBeenCalledWith(createCalculationHistoryEnvelope([item]));
  });

  it("previews and atomically imports a valid history file", async () => {
    const item = {
      id: "imported",
      page: "loans" as const,
      inputs: { principal: "10000" },
      result: 500,
      timestamp: Date.now(),
      resultFormat: "currency" as const,
    };
    const file = {
      size: 500,
      text: async () => JSON.stringify(createCalculationHistoryEnvelope([item])),
    };
    render(<SettingsPage />);

    fireEvent.change(screen.getByLabelText("settings.importHistoryFile"), { target: { files: [file] } });
    expect(await screen.findByText(/1 settings\.historyItemsAdded/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "settings.importHistoryConfirm" }));

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem("financial-calc-history") ?? "null")).toEqual(
        createCalculationHistoryEnvelope([item])
      );
    });
    expect(mocks.toast.success).toHaveBeenCalledWith(expect.stringContaining("settings.importHistorySuccess"));
  });

  it("rejects malformed imports without changing storage", async () => {
    const file = { size: 20, text: async () => "not-json" };
    render(<SettingsPage />);

    fireEvent.change(screen.getByLabelText("settings.importHistoryFile"), { target: { files: [file] } });

    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("settings.importHistoryInvalid"));
    expect(window.localStorage.getItem("financial-calc-history")).toBeNull();
  });
});
