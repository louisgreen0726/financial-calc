import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileSidebar } from "@/components/layout/mobile-sidebar";

const mocks = vi.hoisted(() => ({
  language: "en" as "en" | "zh",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/portfolio/",
}));

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    language: mocks.language,
    t: (key: string) => {
      const english: Record<string, string> = {
        "common.close": "Close",
        "common.primaryNavigation": "Primary navigation",
        "common.toggleMenu": "Toggle Menu",
        "sidebar.mobileDescription": "Search or browse the full calculator directory.",
        "sidebar.mobileTitle": "Calculator menu",
        "sidebar.workspace": "Financial workspace",
      };
      const chinese: Record<string, string> = {
        "common.close": "关闭",
        "common.primaryNavigation": "主导航",
        "common.toggleMenu": "切换菜单",
        "sidebar.mobileDescription": "搜索或浏览完整的金融计算器目录。",
        "sidebar.mobileTitle": "计算器菜单",
        "sidebar.workspace": "金融工作台",
      };
      return (mocks.language === "zh" ? chinese : english)[key] ?? key;
    },
  }),
}));

describe("MobileSidebar", () => {
  beforeEach(() => {
    mocks.language = "en";
  });

  it("gives the calculator drawer localized content semantics instead of its trigger label", () => {
    const { rerender } = render(<MobileSidebar />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle Menu" }));
    const englishDialog = screen.getByRole("dialog", { name: "Calculator menu" });
    expect(englishDialog).toHaveAccessibleDescription("Search or browse the full calculator directory.");
    expect(within(englishDialog).getByText("Financial workspace")).toBeInTheDocument();
    expect(within(englishDialog).getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Toggle Menu" })).not.toBeInTheDocument();
    fireEvent.click(within(englishDialog).getByRole("button", { name: "Close" }));

    mocks.language = "zh";
    rerender(<MobileSidebar key="zh" />);
    fireEvent.click(screen.getByRole("button", { name: "切换菜单" }));

    const chineseDialog = screen.getByRole("dialog", { name: "计算器菜单" });
    expect(chineseDialog).toHaveAccessibleDescription("搜索或浏览完整的金融计算器目录。");
    expect(within(chineseDialog).getByText("金融工作台")).toBeInTheDocument();
    expect(within(chineseDialog).getByRole("navigation", { name: "主导航" })).toBeInTheDocument();
    expect(within(chineseDialog).getByRole("button", { name: "关闭" })).toBeInTheDocument();
  });
});
