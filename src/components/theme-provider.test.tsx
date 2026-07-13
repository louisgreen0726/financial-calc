/// <reference types="vitest/globals" />

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { ThemeProvider, useTheme } from "@/components/theme-provider";

function ThemeHarness() {
  const { theme, setTheme } = useTheme();
  const [persisted, setPersisted] = useState<boolean | null>(null);

  return (
    <>
      <span>{theme}</span>
      <output>{persisted === null ? "idle" : String(persisted)}</output>
      <button type="button" onClick={() => setPersisted(setTheme("dark"))}>
        Set dark
      </button>
    </>
  );
}

describe("ThemeProvider", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.localStorage.clear();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it("keeps rendering when localStorage reads and writes fail", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    render(
      <ThemeProvider defaultTheme="system" enableSystem>
        <ThemeHarness />
      </ThemeProvider>
    );

    expect(screen.getByText("system")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Set dark" }));

    await waitFor(() => {
      expect(screen.getByText("dark")).toBeInTheDocument();
      expect(screen.getByText("false")).toBeInTheDocument();
    });
  });

  it("removes an invalid persisted theme and uses the configured fallback", async () => {
    window.localStorage.setItem("theme", "sepia");
    render(
      <ThemeProvider defaultTheme="system" enableSystem>
        <ThemeHarness />
      </ThemeProvider>
    );

    await waitFor(() => expect(window.localStorage.getItem("theme")).toBeNull());
    expect(screen.getByText("system")).toBeInTheDocument();
  });

  it("follows theme changes made in another tab", async () => {
    render(
      <ThemeProvider defaultTheme="system" enableSystem>
        <ThemeHarness />
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByText("system")).toBeInTheDocument());
    fireEvent(
      window,
      new StorageEvent("storage", {
        key: "theme",
        newValue: "dark",
      })
    );

    expect(screen.getByText("dark")).toBeInTheDocument();
  });
});
