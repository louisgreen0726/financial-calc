import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResponsiveDisclosure } from "@/components/responsive-disclosure";

describe("ResponsiveDisclosure", () => {
  it("opens when defaultOpen becomes true after render", async () => {
    const { rerender } = render(
      <ResponsiveDisclosure title="Chart" defaultOpen={false}>
        <div>Frontier chart</div>
      </ResponsiveDisclosure>
    );

    const summary = screen.getByText("Chart");
    const details = summary.closest("details");
    expect(details).not.toHaveAttribute("open");

    rerender(
      <ResponsiveDisclosure title="Chart" defaultOpen>
        <div>Frontier chart</div>
      </ResponsiveDisclosure>
    );

    await waitFor(() => {
      expect(details).toHaveAttribute("open");
    });
  });
});
