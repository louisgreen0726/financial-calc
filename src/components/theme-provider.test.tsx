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

  it("replaces an invalid theme when removal is blocked and still follows later updates", async () => {
    window.localStorage.setItem("theme", "sepia");
    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function removeItem(this: Storage, key) {
      if (key === "theme") throw new DOMException("Removal blocked", "SecurityError");
      return originalRemoveItem.call(this, key);
    });
    render(
      <ThemeProvider defaultTheme="system" enableSystem>
        <ThemeHarness />
      </ThemeProvider>
    );

    await waitFor(() => expect(window.localStorage.getItem("theme")).toBe("system"));
    expect(screen.getByText("system")).toBeInTheDocument();

    window.localStorage.setItem("theme", "dark");
    fireEvent(window, new StorageEvent("storage", { key: "theme", newValue: "dark" }));
    expect(screen.getByText("dark")).toBeInTheDocument();

    fireEvent(window, new StorageEvent("storage", { key: "theme", newValue: "sepia" }));
    expect(screen.getByText("dark")).toBeInTheDocument();
    expect(window.localStorage.getItem("theme")).toBe("dark");

    window.localStorage.setItem("theme", "sepia");
    fireEvent(window, new StorageEvent("storage", { key: "theme", newValue: "sepia" }));
    expect(screen.getByText("system")).toBeInTheDocument();
    expect(window.localStorage.getItem("theme")).toBe("system");
  });

  it("uses the theme fallback when both invalid-value cleanup operations are blocked", async () => {
    window.localStorage.setItem("theme", "sepia");
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("Removal blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Write blocked", "SecurityError");
    });

    render(
      <ThemeProvider defaultTheme="system" enableSystem>
        <ThemeHarness />
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByText("system")).toBeInTheDocument());
    expect(window.localStorage.getItem("theme")).toBe("sepia");
  });

  it("follows theme changes made in another tab", async () => {
    render(
      <ThemeProvider defaultTheme="system" enableSystem>
        <ThemeHarness />
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByText("system")).toBeInTheDocument());
    window.localStorage.setItem("theme", "dark");
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
