/// <reference types="vitest/globals" />

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/components/theme-provider";

function ThemeHarness() {
  const { theme, setTheme } = useTheme();

  return (
    <button type="button" onClick={() => setTheme("dark")}>
      {theme}
    </button>
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

    expect(screen.getByRole("button", { name: "system" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "system" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "dark" })).toBeInTheDocument();
    });
  });
});
