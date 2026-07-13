import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "@/components/layout/header";

const mocks = vi.hoisted(() => ({
  pathname: "/portfolio/",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("@/components/layout/mobile-sidebar", () => ({
  MobileSidebar: () => <button type="button">Open menu</button>,
}));

vi.mock("@/components/language-switcher", () => ({
  LanguageSwitcher: () => <button data-testid="language-switcher">Language</button>,
}));

vi.mock("@/components/mode-toggle", () => ({
  ModeToggle: () => <button data-testid="mode-toggle">Theme</button>,
}));

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    t: (key: string) =>
      ({
        "common.home": "Home",
        "nav.investing.portfolio.title": "Portfolio",
      })[key] ?? key,
  }),
}));

describe("Header", () => {
  beforeEach(() => {
    mocks.pathname = "/portfolio/";
  });

  it("exposes one named breadcrumb landmark on a calculator route", () => {
    render(<Header />);

    const breadcrumb = screen.getByRole("navigation", { name: "Home / Portfolio" });
    expect(screen.getAllByRole("navigation")).toEqual([breadcrumb]);
    expect(within(breadcrumb).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(within(breadcrumb).getByText("Portfolio")).toHaveAttribute("aria-current", "page");
    expect(breadcrumb.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    const utilityControls = screen.getByTestId("mode-toggle").parentElement;
    expect(utilityControls).toHaveProperty("tagName", "DIV");
    expect(utilityControls).toContainElement(screen.getByTestId("language-switcher"));
  });

  it("marks Home as the current breadcrumb without linking to itself", () => {
    mocks.pathname = "/";
    render(<Header />);

    const breadcrumb = screen.getByRole("navigation", { name: "Home" });
    expect(screen.getAllByRole("navigation")).toEqual([breadcrumb]);
    expect(within(breadcrumb).queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    expect(within(breadcrumb).getByText("Home")).toHaveAttribute("aria-current", "page");
    expect(breadcrumb.querySelector("svg")).not.toBeInTheDocument();
  });
});
