import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BondsPage from "@/app/bonds/page";
import EquityPage from "@/app/equity/page";
import LoansPage from "@/app/loans/page";
import OptionsPage from "@/app/options/page";
import PortfolioPage from "@/app/portfolio/page";
import TVMPage from "@/app/tvm/page";
import { ClientOnlyChart } from "@/components/client-only-chart";
import { Sidebar } from "@/components/layout/sidebar";
import { normalizeRestoredPortfolioAssets } from "@/lib/portfolio-state";

vi.stubGlobal(
  "ResizeObserver",
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);

const mocks = vi.hoisted(() => ({
  addToHistory: vi.fn(),
  cancel: vi.fn(),
  runSimulation: vi.fn(),
  setField: vi.fn(),
  setState: vi.fn(),
  urlStateOverrides: {} as Record<string, Record<string, string>>,
}));

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    language: "en",
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/use-url-state", () => ({
  useUrlState: ({ defaultValues, prefix }: { defaultValues: Record<string, string>; prefix: string }) => {
    const state = {
      ...defaultValues,
      ...(prefix === "loans" ? { years: "1" } : {}),
      ...mocks.urlStateOverrides[prefix],
    };
    return {
      state,
      setField: mocks.setField,
      setState: mocks.setState,
      shareUrl: "https://example.test/calculator",
    };
  },
}));

vi.mock("@/hooks/use-shareable-url", () => ({
  useShareableUrl: () => "https://example.test/calculator",
}));

vi.mock("@/hooks/use-calculation-history", () => ({
  useCalculationHistory: () => ({ addToHistory: mocks.addToHistory }),
}));

vi.mock("@/hooks/use-history-recorder", () => ({ useHistoryRecorder: () => undefined }));
vi.mock("@/components/history-panel", () => ({
  HistoryPanel: ({
    page,
    onRestore,
  }: {
    page: string;
    onRestore?: (inputs: Record<string, number | string>) => void;
  }) =>
    page === "loans" ? (
      <button type="button" onClick={() => onRestore?.({ amount: "250000", rate: "3.75", years: "15", method: "CAM" })}>
        restore loan fixture
      </button>
    ) : null,
}));
vi.mock("@/components/result-actions", () => ({ ResultActions: () => null }));
vi.mock("@/components/sensitivity-heatmap", () => ({ SensitivityHeatmap: () => null }));
vi.mock("@/components/theme-provider", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));

vi.mock("@/hooks/use-monte-carlo-simulation", () => ({
  useMonteCarloSimulation: () => ({
    progress: 0,
    isRunning: false,
    run: mocks.runSimulation,
    cancel: mocks.cancel,
  }),
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/tvm" }));

vi.mock("recharts", () => {
  const ChartStub = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const EmptyStub = () => null;

  return {
    Area: EmptyStub,
    AreaChart: EmptyStub,
    CartesianGrid: EmptyStub,
    Cell: EmptyStub,
    Legend: EmptyStub,
    Line: EmptyStub,
    LineChart: EmptyStub,
    Pie: EmptyStub,
    PieChart: EmptyStub,
    ReferenceLine: EmptyStub,
    ResponsiveContainer: ChartStub,
    Scatter: EmptyStub,
    ScatterChart: EmptyStub,
    Tooltip: EmptyStub,
    XAxis: EmptyStub,
    YAxis: EmptyStub,
    ZAxis: EmptyStub,
  };
});

describe("calculator page accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.urlStateOverrides = {};
  });

  it("connects invalid option inputs to their field error", () => {
    render(<OptionsPage />);

    const spotInput = screen.getByLabelText("options.spot");
    fireEvent.change(spotInput, { target: { value: "" } });

    expect(spotInput).toHaveAttribute("aria-invalid", "true");
    expect(spotInput).toHaveAttribute("aria-describedby", "opt-spot-error");
    expect(document.getElementById("opt-spot-error")).toHaveTextContent("options.validation.spotPositive");
  });

  it("submits TVM through a form and keeps clear non-submitting", () => {
    render(<TVMPage />);

    const submitButton = screen.getByRole("button", { name: "common.calculate FV" });
    const form = submitButton.closest("form");

    expect(form).not.toBeNull();
    expect(submitButton).toHaveAttribute("type", "submit");
    expect(screen.getByRole("button", { name: /common.clear/ })).toHaveAttribute("type", "button");

    fireEvent.submit(form!);
    expect(mocks.addToHistory).toHaveBeenCalledOnce();
  });

  it("accepts signed TVM cash flows for retirement and rate calculations", () => {
    mocks.urlStateOverrides.tvm = {
      target: "fv",
      rate: "7",
      nper: "30",
      pmt: "-500",
      pv: "0",
      fv: "0",
      type: "0",
    };
    const { unmount } = render(<TVMPage />);

    fireEvent.submit(screen.getByRole("button", { name: "common.calculate FV" }).closest("form")!);

    expect(mocks.addToHistory).toHaveBeenCalledOnce();
    expect(screen.queryByText("tvm.fixValidation")).not.toBeInTheDocument();
    unmount();

    mocks.urlStateOverrides.tvm = {
      target: "rate",
      rate: "0",
      nper: "60",
      pmt: "-466.08",
      pv: "25000",
      fv: "0",
      type: "0",
    };
    render(<TVMPage />);

    fireEvent.submit(screen.getByRole("button", { name: "common.calculate RATE" }).closest("form")!);

    expect(mocks.addToHistory).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("tvm.fixValidation")).not.toBeInTheDocument();
  });

  it("submits portfolio simulation through either responsive submit control", () => {
    render(<PortfolioPage />);

    const form = document.getElementById("portfolio-simulation-form");
    expect(form).toBeInstanceOf(HTMLFormElement);

    const submitButtons = screen.getAllByRole("button", { name: "portfolio.run" });
    expect(submitButtons).toHaveLength(2);
    submitButtons.forEach((button) => expect(button).toHaveAttribute("type", "submit"));
    expect(submitButtons.some((button) => button.getAttribute("form") === "portfolio-simulation-form")).toBe(true);

    screen
      .getAllByRole("button", { name: "common.remove" })
      .forEach((button) => expect(button).toHaveAttribute("type", "button"));
    expect(screen.getByRole("button", { name: "portfolio.add" })).toHaveAttribute("type", "button");

    fireEvent.submit(form!);
    expect(mocks.runSimulation).toHaveBeenCalledOnce();
  });

  it("normalizes restored portfolio assets and rejects an undersized valid set", () => {
    const restored = normalizeRestoredPortfolioAssets([
      { id: 7, name: `  Growth\u0000\nFund  `, return: "12.50", risk: "20" },
      { id: 7, name: "Legacy Bond", return: 4, risk: 5 },
      { id: -1, name: "Invalid", return: "not-a-number", risk: "10" },
    ]);

    expect(restored).toEqual([
      { id: 1, name: "Growth Fund", return: "12.5", risk: "20" },
      { id: 2, name: "Legacy Bond", return: "4", risk: "5" },
    ]);
    expect(normalizeRestoredPortfolioAssets([{ id: 1, name: "Only", return: "8", risk: "10" }])).toEqual([]);
  });

  it("uses radio semantics and exposes every amortization row in a native table", () => {
    render(<LoansPage />);

    expect(screen.getByRole("radiogroup", { name: "loans.method" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "loans.cpm" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "loans.cam" })).toHaveAttribute("aria-checked", "false");

    const schedule = screen.getByRole("table", { name: /loans.schedule/ });
    expect(schedule).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
    expect(screen.getAllByRole("row")).toHaveLength(13);
  });

  it("restores every loan field in one atomic URL update", () => {
    render(<LoansPage />);
    fireEvent.click(screen.getByRole("button", { name: "restore loan fixture" }));

    expect(mocks.setState).toHaveBeenCalledOnce();
    expect(mocks.setState).toHaveBeenCalledWith({
      amount: "250000",
      rate: "3.75",
      years: "15",
      method: "CAM",
    });
  });

  it("classifies a coupon-equals-yield bond as par", () => {
    render(<BondsPage />);
    fireEvent.change(screen.getByLabelText("bonds.ytm"), { target: { value: "5" } });
    expect(screen.getByText("bonds.par")).toBeInTheDocument();
  });

  it("treats a zero-dividend DDM valuation as a valid zero result", () => {
    render(<EquityPage />);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "equity.ddm.tab" }), { button: 0 });
    fireEvent.change(screen.getByLabelText("equity.ddm.d1"), { target: { value: "0" } });
    expect(screen.getByRole("status")).toHaveTextContent("0.00");
  });

  it("names charts and avoids a nested Bonds result live region", () => {
    const { unmount } = render(
      <ClientOnlyChart ariaLabel="Cash flow by period">
        <div>chart</div>
      </ClientOnlyChart>
    );
    expect(screen.getByRole("img", { name: "Cash flow by period" })).toBeInTheDocument();
    unmount();

    render(<BondsPage />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("uses a labelled navigation landmark in the calculator sidebar", () => {
    render(<Sidebar />);
    expect(screen.getByRole("navigation", { name: "common.primaryNavigation" })).toBeInTheDocument();
  });
});
