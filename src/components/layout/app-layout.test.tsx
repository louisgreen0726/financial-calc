import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppLayout } from "@/components/layout/app-layout";

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock("@/components/layout/sidebar", () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}));

vi.mock("@/components/layout/header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock("@/components/mobile-nav", () => ({
  MobileNav: () => <div data-testid="mobile-nav">Mobile navigation</div>,
}));

describe("AppLayout print contract", () => {
  it("marks fixed application chrome for exclusion and isolates printable content", () => {
    render(
      <AppLayout>
        <article>Printable report</article>
      </AppLayout>
    );

    const skipLink = screen.getByRole("link", { name: "common.skipToContent" });
    expect(skipLink).toHaveAttribute("data-pdf-exclude", "true");
    expect(skipLink).toHaveClass("no-print");

    ["sidebar", "header", "mobile-nav"].forEach((testId) => {
      const chromeWrapper = screen.getByTestId(testId).parentElement;
      expect(chromeWrapper).toHaveAttribute("data-pdf-exclude", "true");
      expect(chromeWrapper).toHaveClass("no-print");
    });

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("data-print-content", "true");
    expect(main.parentElement).toHaveAttribute("data-app-content", "true");
    expect(main).toHaveTextContent("Printable report");
  });
});
