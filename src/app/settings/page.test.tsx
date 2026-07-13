import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "@/app/settings/page";
import { createCalculationHistoryEnvelope } from "@/lib/calculation-history";
import {
  CURRENCY_KEY,
  FAVORITES_KEY,
  HISTORY_KEY,
  LANGUAGE_KEY,
  SIDEBAR_COLLAPSED_KEY,
  THEME_KEY,
} from "@/lib/constants";
import { createWorkspaceBackup } from "@/lib/workspace-backup";

const mocks = vi.hoisted(() => ({
  exportToJSON: vi.fn(),
  exportWorkspaceToJSON: vi.fn(),
  exportOptions: [] as Array<{ filename: string; jsonSpace?: 0 | 2 }>,
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
  useExport: (options: { filename: string; jsonSpace?: 0 | 2 }) => {
    mocks.exportOptions.push(options);
    return {
      exportToJSON: options.filename === "financial-calc-workspace" ? mocks.exportWorkspaceToJSON : mocks.exportToJSON,
    };
  },
}));

vi.mock("sonner", () => ({ toast: mocks.toast }));

describe("SettingsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    mocks.exportOptions.length = 0;
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
    expect(mocks.toast.error).toHaveBeenNthCalledWith(1, "common.changeNotPersisted");
    expect(mocks.toast.error).toHaveBeenNthCalledWith(2, "common.changeNotPersisted");
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
      expect(mocks.toast.error).toHaveBeenCalledWith("common.storageOperationFailed");
    } finally {
      setItem.mockRestore();
    }
  });

  it("returns to the default currency after another tab clears localStorage", async () => {
    window.localStorage.setItem("financial-calc-currency", "EUR");
    render(<SettingsPage />);

    await waitFor(() => expect(screen.getByRole("button", { name: /EUR/ })).toHaveAttribute("aria-pressed", "true"));
    fireEvent(window, new StorageEvent("storage", { key: null, storageArea: window.sessionStorage }));
    expect(screen.getByRole("button", { name: /EUR/ })).toHaveAttribute("aria-pressed", "true");

    window.localStorage.clear();
    fireEvent(window, new StorageEvent("storage", { key: null, storageArea: window.localStorage }));

    expect(screen.getByRole("button", { name: /USD/ })).toHaveAttribute("aria-pressed", "true");
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

  it("exports a versioned workspace from persisted preferences before state hydration", () => {
    const item = {
      id: "workspace-record",
      page: "tvm" as const,
      inputs: { rate: "5" },
      result: 100,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(createCalculationHistoryEnvelope([item])));
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([item.id, "orphan"]));
    window.localStorage.setItem(CURRENCY_KEY, "CNY");
    window.localStorage.setItem(LANGUAGE_KEY, "zh");
    window.localStorage.setItem(THEME_KEY, "dark");
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "true");
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "settings.exportWorkspaceJson" }));

    expect(mocks.exportWorkspaceToJSON).toHaveBeenCalledOnce();
    expect(mocks.exportOptions).toContainEqual({ filename: "financial-calc-workspace", jsonSpace: 0 });
    expect(mocks.exportWorkspaceToJSON).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "financial-calc-workspace",
        version: 1,
        history: createCalculationHistoryEnvelope([item]),
        favorites: [item.id],
        preferences: {
          language: "zh",
          theme: "dark",
          currency: "CNY",
          sidebarCollapsed: true,
        },
      })
    );
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

  it("reports an incomplete operation when confirmed history import cannot persist", async () => {
    const item = {
      id: "blocked-import",
      page: "tvm" as const,
      inputs: { rate: "7" },
      result: 120,
      timestamp: Date.now(),
    };
    const file = {
      size: 500,
      text: async () => JSON.stringify(createCalculationHistoryEnvelope([item])),
    };
    render(<SettingsPage />);

    fireEvent.change(screen.getByLabelText("settings.importHistoryFile"), { target: { files: [file] } });
    expect(await screen.findByText(/1 settings\.historyItemsAdded/)).toBeInTheDocument();

    const originalSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.localStorage && key === "financial-calc-history") {
        throw new DOMException("Storage blocked", "SecurityError");
      }
      return originalSetItem.call(this, key, value);
    });
    try {
      fireEvent.click(screen.getByRole("button", { name: "settings.importHistoryConfirm" }));
      await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("common.storageOperationFailed"));
      expect(mocks.toast.success).not.toHaveBeenCalled();
    } finally {
      setItem.mockRestore();
    }
  });

  it("previews then restores merged workspace data and preferences", async () => {
    const now = Date.now();
    const retained = {
      id: "retained",
      page: "risk" as const,
      inputs: { value: "1000" },
      result: 50,
      timestamp: now - 1_000,
    };
    const imported = {
      id: "imported",
      page: "loans" as const,
      inputs: { principal: "10000" },
      result: 500,
      timestamp: now,
      resultFormat: "currency" as const,
    };
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(createCalculationHistoryEnvelope([retained])));
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([retained.id, "orphan"]));
    const backup = createWorkspaceBackup({
      history: [imported],
      favorites: [imported.id],
      preferences: { language: "zh", theme: "dark", currency: "CNY", sidebarCollapsed: true },
      now,
    });
    const serialized = JSON.stringify(backup);
    const file = {
      size: new TextEncoder().encode(serialized).byteLength,
      text: async () => serialized,
    };
    render(<SettingsPage />);

    fireEvent.change(screen.getByLabelText("settings.importWorkspaceFile"), { target: { files: [file] } });
    expect(await screen.findByText(/1 settings\.historyItemsAdded/)).toHaveTextContent(
      "settings.workspacePreferencesReplace"
    );
    expect(JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null")).toEqual(
      createCalculationHistoryEnvelope([retained])
    );

    fireEvent.click(screen.getByRole("button", { name: "settings.importWorkspaceConfirm" }));

    await waitFor(() => {
      const storedHistory = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null");
      expect(new Set(storedHistory.items.map((item: { id: string }) => item.id))).toEqual(
        new Set([retained.id, imported.id])
      );
    });
    expect(new Set(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]"))).toEqual(
      new Set([retained.id, imported.id])
    );
    expect(mocks.setLanguage).toHaveBeenCalledWith("zh");
    expect(mocks.setTheme).toHaveBeenCalledWith("dark");
    expect(window.localStorage.getItem(CURRENCY_KEY)).toBe("CNY");
    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe("true");
    expect(mocks.toast.success).toHaveBeenCalledWith("settings.importWorkspaceSuccess");
  });

  it("keeps successful workspace sections and names a partial persistence failure", async () => {
    const item = {
      id: "partial-import",
      page: "tvm" as const,
      inputs: { rate: "7" },
      result: 120,
      timestamp: Date.now(),
    };
    const backup = createWorkspaceBackup({
      history: [item],
      favorites: [item.id],
      preferences: { language: "en", theme: "light", currency: "EUR", sidebarCollapsed: false },
    });
    const serialized = JSON.stringify(backup);
    const file = {
      size: new TextEncoder().encode(serialized).byteLength,
      text: async () => serialized,
    };
    render(<SettingsPage />);
    fireEvent.change(screen.getByLabelText("settings.importWorkspaceFile"), { target: { files: [file] } });
    expect(await screen.findByText(/1 settings\.historyItemsAdded/)).toBeInTheDocument();

    const originalSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.localStorage && key === FAVORITES_KEY) {
        throw new DOMException("Storage blocked", "SecurityError");
      }
      return originalSetItem.call(this, key, value);
    });
    try {
      fireEvent.click(screen.getByRole("button", { name: "settings.importWorkspaceConfirm" }));
      await waitFor(() =>
        expect(mocks.toast.error).toHaveBeenCalledWith(
          expect.stringContaining("settings.importWorkspacePartial: history.favorites")
        )
      );
      expect(JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null")).toEqual(
        createCalculationHistoryEnvelope([item])
      );
      expect(window.localStorage.getItem(CURRENCY_KEY)).toBe("EUR");
      expect(mocks.toast.success).not.toHaveBeenCalledWith("settings.importWorkspaceSuccess");
    } finally {
      setItem.mockRestore();
    }
  });

  it("rechecks history inside the favorites lock before restoring favorite ids", async () => {
    const now = Date.now();
    const imported = {
      id: "raced-import",
      page: "tvm" as const,
      inputs: { rate: "7" },
      result: 120,
      timestamp: now,
    };
    const replacement = {
      id: "other-tab-record",
      page: "risk" as const,
      inputs: { value: "900" },
      result: 45,
      timestamp: now + 1,
    };
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([replacement.id]));
    const backup = createWorkspaceBackup({
      history: [imported],
      favorites: [imported.id],
      preferences: { language: "en", theme: "light", currency: "USD", sidebarCollapsed: false },
      now,
    });
    const serialized = JSON.stringify(backup);
    render(<SettingsPage />);
    fireEvent.change(screen.getByLabelText("settings.importWorkspaceFile"), {
      target: {
        files: [
          {
            size: new TextEncoder().encode(serialized).byteLength,
            text: async () => serialized,
          },
        ],
      },
    });
    expect(await screen.findByText(/1 settings\.historyItemsAdded/)).toBeInTheDocument();

    const originalSetItem = Storage.prototype.setItem;
    let historyReplaced = false;
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      const result = originalSetItem.call(this, key, value);
      if (this === window.localStorage && key === HISTORY_KEY && !historyReplaced) {
        historyReplaced = true;
        originalSetItem.call(this, HISTORY_KEY, JSON.stringify(createCalculationHistoryEnvelope([replacement])));
      }
      return result;
    });
    try {
      fireEvent.click(screen.getByRole("button", { name: "settings.importWorkspaceConfirm" }));
      await waitFor(() =>
        expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]")).toEqual([replacement.id])
      );
      expect(JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null")).toEqual(
        createCalculationHistoryEnvelope([replacement])
      );
    } finally {
      setItem.mockRestore();
    }
  });

  it("does not rewrite favorites when history becomes an unsupported schema after preview", async () => {
    const current = {
      id: "current-record",
      page: "tvm" as const,
      inputs: { rate: "5" },
      result: 100,
      timestamp: Date.now() - 1,
    };
    const imported = { ...current, id: "future-import", timestamp: Date.now() };
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(createCalculationHistoryEnvelope([current])));
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([current.id]));
    const backup = createWorkspaceBackup({
      history: [imported],
      favorites: [imported.id],
      preferences: { language: "en", theme: "light", currency: "USD", sidebarCollapsed: false },
    });
    const serialized = JSON.stringify(backup);
    render(<SettingsPage />);
    fireEvent.change(screen.getByLabelText("settings.importWorkspaceFile"), {
      target: {
        files: [
          {
            size: new TextEncoder().encode(serialized).byteLength,
            text: async () => serialized,
          },
        ],
      },
    });
    expect(await screen.findByText(/1 settings\.historyItemsAdded/)).toBeInTheDocument();

    const futureHistory = JSON.stringify({ version: 2, items: [{ future: true }] });
    window.localStorage.setItem(HISTORY_KEY, futureHistory);
    fireEvent.click(screen.getByRole("button", { name: "settings.importWorkspaceConfirm" }));

    await waitFor(() =>
      expect(mocks.toast.error).toHaveBeenCalledWith(
        "settings.importWorkspacePartial: history.title, history.favorites"
      )
    );
    expect(window.localStorage.getItem(HISTORY_KEY)).toBe(futureHistory);
    expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]")).toEqual([current.id]);
  });

  it("continues restoring later preferences when a provider setter throws", async () => {
    const item = {
      id: "provider-error-import",
      page: "loans" as const,
      inputs: { principal: "5000" },
      result: 250,
      timestamp: Date.now(),
    };
    const backup = createWorkspaceBackup({
      history: [item],
      favorites: [item.id],
      preferences: { language: "zh", theme: "dark", currency: "EUR", sidebarCollapsed: true },
    });
    const serialized = JSON.stringify(backup);
    render(<SettingsPage />);
    fireEvent.change(screen.getByLabelText("settings.importWorkspaceFile"), {
      target: {
        files: [
          {
            size: new TextEncoder().encode(serialized).byteLength,
            text: async () => serialized,
          },
        ],
      },
    });
    expect(await screen.findByText(/1 settings\.historyItemsAdded/)).toBeInTheDocument();
    mocks.setLanguage.mockImplementationOnce(() => {
      throw new Error("Provider unavailable");
    });

    fireEvent.click(screen.getByRole("button", { name: "settings.importWorkspaceConfirm" }));

    await waitFor(() =>
      expect(mocks.toast.error).toHaveBeenCalledWith("settings.importWorkspacePartial: settings.language")
    );
    expect(mocks.setTheme).toHaveBeenCalledWith("dark");
    expect(window.localStorage.getItem(CURRENCY_KEY)).toBe("EUR");
    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe("true");
    expect(JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null")).toEqual(
      createCalculationHistoryEnvelope([item])
    );
    expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]")).toEqual([item.id]);
  });

  it("rejects malformed imports without changing storage", async () => {
    const file = { size: 20, text: async () => "not-json" };
    render(<SettingsPage />);

    fireEvent.change(screen.getByLabelText("settings.importHistoryFile"), { target: { files: [file] } });

    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith("settings.importHistoryInvalid"));
    expect(window.localStorage.getItem("financial-calc-history")).toBeNull();
  });
});
