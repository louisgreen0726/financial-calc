import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SensitivityHeatmap } from "@/components/sensitivity-heatmap";

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

describe("SensitivityHeatmap", () => {
  it("makes its horizontal scroll region reachable and names it from the table caption", () => {
    render(
      <SensitivityHeatmap
        data={[[100, 101]]}
        rowLabels={["5 years"]}
        colLabels={["4%", "5%"]}
        formatCell={(value) => `$${value}`}
        caption="Bond price sensitivity"
        cornerLabel="Maturity / yield"
      />
    );

    const region = screen.getByRole("region", { name: "Bond price sensitivity" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toContainElement(screen.getByRole("table", { name: "Bond price sensitivity" }));
  });
});
