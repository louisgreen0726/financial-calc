import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SensitivityHeatmap } from "@/components/sensitivity-heatmap";

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
    const cells = screen.getAllByRole("cell");
    expect(cells[0]).toHaveAttribute("data-heatmap-level", "0");
    expect(cells[1]).toHaveAttribute("data-heatmap-level", "8");
    expect(cells.every((cell) => !cell.hasAttribute("style"))).toBe(true);
  });
});
