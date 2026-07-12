import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppLayout } from "@/components/layout/app-layout";

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock("@/components/layout/sidebar", () => ({
  Sidebar: ({ collapsed }: { collapsed: boolean }) => (
    <div data-testid="sidebar" data-collapsed={collapsed}>
      Sidebar
    </div>
  ),
}));

vi.mock("@/components/layout/header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock("@/components/mobile-nav", () => ({
  MobileNav: () => <div data-testid="mobile-nav">Mobile navigation</div>,
}));

describe("AppLayout print contract", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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
    expect(screen.getByRole("complementary", { name: "FinCalc Pro" })).toContainElement(screen.getByTestId("sidebar"));
  });

  it("collapses the desktop sidebar, updates content spacing, and persists the preference", async () => {
    render(
      <AppLayout>
        <article>Printable report</article>
      </AppLayout>
    );

    const sidebar = screen.getByTestId("sidebar");
    const sidebarFrame = sidebar.parentElement;
    const content = screen.getByRole("main").parentElement;

    expect(sidebar).toHaveAttribute("data-collapsed", "false");
    expect(sidebarFrame).toHaveClass("w-[17rem]");
    expect(content).toHaveClass("lg:pl-[17rem]");

    fireEvent.click(screen.getByRole("button", { name: "common.collapseSidebar" }));

    expect(sidebar).toHaveAttribute("data-collapsed", "true");
    expect(sidebarFrame).toHaveClass("w-[4.5rem]");
    expect(content).toHaveClass("lg:pl-[4.5rem]");
    await waitFor(() => expect(window.localStorage.getItem("financial-calc-sidebar-collapsed")).toBe("true"));
  });

  it("restores a persisted collapsed preference", () => {
    window.localStorage.setItem("financial-calc-sidebar-collapsed", "true");

    render(
      <AppLayout>
        <article>Printable report</article>
      </AppLayout>
    );

    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("main").parentElement).toHaveClass("lg:pl-[4.5rem]");
  });
});
