import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "@/app/settings/page";

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    language: "en",
    setLanguage: vi.fn(),
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
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
});
