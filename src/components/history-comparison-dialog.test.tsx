import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HistoryComparisonDialog, type HistoryComparisonCopy } from "@/components/history-comparison-dialog";
import type { CalculationHistoryItem } from "@/lib/calculation-history";

const copy: HistoryComparisonCopy = {
  baseline: "Baseline",
  changeFromBaseline: "Change from baseline",
  close: "Close",
  comparison: "Comparison",
  input: "Input",
  percentagePointsUnit: "pp",
  periodsUnit: "periods",
  recordedOnly: "These are recorded outputs and are not recalculated.",
  title: "Compare recorded results",
  yearsUnit: "years",
};

function makeCapmItem(id: string, result: number, beta: string, timestamp: number): CalculationHistoryItem {
  return {
    id,
    page: "equity",
    inputs: { rf: "3.5", beta, rm: "10" },
    result,
    timestamp,
    resultFormat: "percentDecimal",
  };
}

describe("HistoryComparisonDialog", () => {
  it("shows recorded results, an absolute delta, and changed canonical inputs", () => {
    render(
      <HistoryComparisonDialog
        baseline={makeCapmItem("baseline", 0.08, "1.2", 1_700_000_000_000)}
        comparison={makeCapmItem("comparison", 0.105, "1.4", 1_700_000_100_000)}
        copy={copy}
        formatOptions={{ locale: "en" }}
        getInputLabel={(key) => key.toUpperCase()}
        locale="en"
        metricLabel="CAPM"
        onOpenChange={vi.fn()}
        open
      />
    );

    const dialog = screen.getByRole("dialog", { name: `${copy.title}: CAPM` });
    expect(within(dialog).getByText(copy.recordedOnly)).toBeInTheDocument();
    expect(within(dialog).getByText("8%")).toBeInTheDocument();
    expect(within(dialog).getByText("10.5%")).toBeInTheDocument();
    expect(within(dialog).getByText("+2.5 pp")).toBeInTheDocument();

    const rfRow = within(dialog).getByRole("row", { name: /RF 3\.5 3\.5/ });
    const betaRow = within(dialog).getByRole("row", { name: /BETA 1\.2 1\.4/ });
    expect(rfRow).toHaveAttribute("data-changed", "false");
    expect(betaRow).toHaveAttribute("data-changed", "true");
    expect(betaRow).toHaveClass("bg-primary/5");
  });

  it("closes through the explicit command", () => {
    const onOpenChange = vi.fn();
    render(
      <HistoryComparisonDialog
        baseline={makeCapmItem("baseline", 0.08, "1.2", 1)}
        comparison={makeCapmItem("comparison", 0.1, "1.2", 2)}
        copy={copy}
        formatOptions={{ locale: "en" }}
        getInputLabel={(key) => key}
        locale="en"
        metricLabel="CAPM"
        onOpenChange={onOpenChange}
        open
      />
    );

    const closeButtons = screen.getAllByRole("button", { name: copy.close });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render a dialog for an incompatible pair", () => {
    const baseline = makeCapmItem("baseline", 0.08, "1.2", 1);
    render(
      <HistoryComparisonDialog
        baseline={baseline}
        comparison={{ ...baseline }}
        copy={copy}
        formatOptions={{ locale: "en" }}
        getInputLabel={(key) => key}
        locale="en"
        metricLabel="CAPM"
        onOpenChange={vi.fn()}
        open
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
