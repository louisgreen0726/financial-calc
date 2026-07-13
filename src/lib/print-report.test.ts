import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { prepareReportForPrint, printReport } from "@/lib/print-report";

describe("report printing", () => {
  beforeEach(() => {
    document.documentElement.lang = "en";
    document.title = "Financial Calc";
    document.body.innerHTML = `
      <div id="app-shell">
        <nav>Navigation</nav>
        <main>
          <h1>Calculator page</h1>
          <section id="report">
            <p>Printable result</p>
            <div class="recharts-wrapper"><svg class="recharts-surface"></svg></div>
          </section>
          <aside>History</aside>
        </main>
      </div>
      <div id="portal">Open dialog</div>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.removeAttribute("data-print-mode");
  });

  it("isolates the selected report, creates metadata, and restores the document", () => {
    const chart = document.querySelector(".recharts-wrapper") as HTMLElement;
    vi.spyOn(chart, "getBoundingClientRect").mockReturnValue({
      width: 640,
      height: 240,
    } as DOMRect);
    const cleanup = prepareReportForPrint({
      elementId: "report",
      title: "Loan analysis",
      filename: "loan-summary.pdf",
      generatedLabel: "Generated",
    });

    const report = document.getElementById("report") as HTMLElement;
    const header = report.querySelector('[data-print-report-header="true"]');

    expect(document.body).toHaveAttribute("data-print-mode", "report");
    expect(report).toHaveAttribute("data-print-target", "true");
    expect(header).toHaveTextContent("Loan analysis");
    expect(header).toHaveTextContent("Generated:");
    expect(document.querySelector("nav")).toHaveAttribute("data-print-hidden-by-export", "true");
    expect(document.querySelector("main > h1")).toHaveAttribute("data-print-hidden-by-export", "true");
    expect(document.getElementById("portal")).toHaveAttribute("data-print-hidden-by-export", "true");
    expect(document.title).toBe("loan-summary");
    expect(chart).toHaveAttribute("data-print-chart", "true");
    expect(chart.style.getPropertyValue("--print-chart-width")).toBe("640px");
    expect(chart.style.getPropertyValue("--print-chart-height")).toBe("240px");

    cleanup();

    expect(document.body).not.toHaveAttribute("data-print-mode");
    expect(report).not.toHaveAttribute("data-print-target");
    expect(report.querySelector('[data-print-report-header="true"]')).toBeNull();
    expect(document.querySelectorAll('[data-print-hidden-by-export="true"]')).toHaveLength(0);
    expect(chart).not.toHaveAttribute("data-print-chart");
    expect(chart.style.getPropertyValue("--print-chart-width")).toBe("");
    expect(document.title).toBe("Financial Calc");
  });

  it("waits for layout, opens print, and cleans up after printing", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const print = vi.spyOn(window, "print").mockImplementation(() => {
      window.dispatchEvent(new Event("afterprint"));
    });

    await printReport({ elementId: "report", title: "Report" });

    expect(print).toHaveBeenCalledOnce();
    expect(document.body).not.toHaveAttribute("data-print-mode");
    expect(document.querySelector('[data-print-report-header="true"]')).toBeNull();
  });

  it("waits for caller-owned complete content and restores it after printing", async () => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const report = document.getElementById("report") as HTMLElement;
    const onPrintModeChange = vi.fn((isPrinting: boolean) => {
      report.dataset.rows = isPrinting ? "600" : "100";
    });
    const print = vi.spyOn(window, "print").mockImplementation(() => {
      expect(report.dataset.rows).toBe("600");
      window.dispatchEvent(new Event("afterprint"));
    });

    await printReport({ elementId: "report", title: "Report", onPrintModeChange });

    expect(print).toHaveBeenCalledOnce();
    expect(onPrintModeChange.mock.calls).toEqual([[true], [false]]);
    expect(report.dataset.rows).toBe("100");
  });

  it("fails without changing the page when the report target is missing", () => {
    expect(() => prepareReportForPrint({ elementId: "missing", title: "Report" })).toThrow(
      'Element with id "missing" not found'
    );
    expect(document.body).not.toHaveAttribute("data-print-mode");
    expect(document.title).toBe("Financial Calc");
  });
});
