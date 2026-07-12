import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import HelpPage from "@/app/help/page";
import { LanguageProvider } from "@/lib/i18n";

function renderHelpPage() {
  return render(
    <LanguageProvider>
      <HelpPage />
    </LanguageProvider>
  );
}

describe("Help model guide", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("documents assumptions, worked examples, and limitations for every model family", () => {
    renderHelpPage();

    expect(screen.getByRole("heading", { name: "Model assumptions & worked examples" })).toBeInTheDocument();
    expect(screen.getByText(/not verified advice/i)).toBeInTheDocument();
    const models = [
      "TVM, cash flow & loans",
      "Bonds & fixed income",
      "Equity valuation",
      "Options & implied volatility",
      "Portfolio & risk",
      "Macroeconomic scenarios",
    ];

    for (const model of models) {
      expect(screen.getByRole("heading", { name: model })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("article")).toHaveLength(6);
    expect(screen.getByText(/FV = 16,288\.95/)).toBeInTheDocument();
    expect(screen.getByText(/price 9\.227 returns implied volatility near 20\.00%/)).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Worked example" })).toHaveLength(6);
  });

  it("renders the complete guide in Chinese from the persisted language", async () => {
    window.localStorage.setItem("financial-calc-language", "zh");
    const { container } = renderHelpPage();

    await waitFor(() => expect(screen.getByRole("heading", { name: "模型假设与计算示例" })).toBeInTheDocument());
    const guideHeading = screen.getByRole("heading", { name: "模型假设与计算示例" });
    const guideCard = guideHeading.closest('[data-slot="card"]');
    expect(guideCard).not.toBeNull();
    expect(within(guideCard as HTMLElement).getByText(/实际利率为 1\.9417%/)).toBeInTheDocument();
    expect(within(guideCard as HTMLElement).getAllByRole("heading", { name: "计算示例" })).toHaveLength(6);
    expect(container).not.toHaveTextContent("Model assumptions & worked examples");
  });
});
