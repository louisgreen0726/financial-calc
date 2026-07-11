import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProgressBar } from "@/components/progress-bar";
import { ResultShell } from "@/components/result-shell";
import { CardTitle } from "@/components/ui/card";
import { ErrorDisplay, ValidationError } from "@/components/ui/error-display";
import { LanguageProvider } from "@/lib/i18n";

function renderWithLanguage(children: React.ReactNode) {
  return render(<LanguageProvider>{children}</LanguageProvider>);
}

describe("shared accessibility semantics", () => {
  it("announces the concise result summary without including details", () => {
    render(
      <ResultShell title="Result" isReady summary={<p>Net present value: $100</p>} details={<p>Detailed schedule</p>} />
    );

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toHaveTextContent("Net present value: $100");
    expect(status).not.toHaveTextContent("Detailed schedule");
  });

  it("exposes progress values while keeping cancel interactive", () => {
    const onCancel = vi.fn();
    renderWithLanguage(<ProgressBar progress={42.4} label="Portfolio simulation" onCancel={onCancel} />);

    const progressbar = screen.getByRole("progressbar", { name: "Portfolio simulation" });
    expect(progressbar).toHaveAttribute("aria-valuemin", "0");
    expect(progressbar).toHaveAttribute("aria-valuemax", "100");
    expect(progressbar).toHaveAttribute("aria-valuenow", "42");

    fireEvent.click(screen.getByRole("button", { name: "Cancel calculation" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("renders localized alert labels and addressable validation messages", () => {
    const onDismiss = vi.fn();
    renderWithLanguage(
      <>
        <ErrorDisplay id="summary-error" message="Invalid value" variant="warning" onDismiss={onDismiss} />
        <ValidationError id="amount-error" error="Amount is required" />
      </>
    );

    expect(screen.getAllByRole("alert")[0]).toHaveAttribute("id", "summary-error");
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Amount is required")).toHaveAttribute("id", "amount-error");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss message" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("uses semantic headings with a configurable level", () => {
    render(
      <>
        <CardTitle>Parameters</CardTitle>
        <CardTitle as="h3">Scenario</CardTitle>
      </>
    );

    expect(screen.getByRole("heading", { level: 2, name: "Parameters" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Scenario" })).toBeInTheDocument();
  });
});
