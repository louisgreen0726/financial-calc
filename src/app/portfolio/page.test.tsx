import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PortfolioPage from "@/app/portfolio/page";
import { buildShareableUrl } from "@/hooks/use-shareable-url";
import { MAX_SHARE_URL_LENGTH } from "@/lib/constants";
import type { PortfolioPoint } from "@/lib/portfolio-math";
import type { UrlStateValue } from "@/lib/url-state-utils";

interface CapturedShareOptions {
  state: Record<string, UrlStateValue>;
  defaults?: Record<string, UrlStateValue>;
  onRestore?: (state: Record<string, number | string>) => void;
}

interface CapturedResultActions {
  inputs: { assets: string };
  displayInputs: { assets: string };
  exportJson: { assets: Array<{ id: number; name: string; return: string; risk: string }> };
}

const mocks = vi.hoisted(() => ({
  addToHistory: vi.fn(),
  cancel: vi.fn(),
  language: "en" as "en" | "zh",
  lastRunPayload: null as null | { assets: Array<{ name: string }> },
  restorePortfolio: null as null | ((inputs: Record<string, number | string>) => void),
  resultActions: null as null | CapturedResultActions,
  runSimulation: vi.fn(),
  shareOptions: null as null | CapturedShareOptions,
}));

vi.stubGlobal(
  "ResizeObserver",
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    language: mocks.language,
    t: (key: string) => {
      const english: Record<string, string> = {
        "portfolio.defaultAssets.usTech": "US Tech",
        "portfolio.defaultAssets.bonds": "Bonds",
        "portfolio.defaultAssets.gold": "Gold",
        "portfolio.defaultAssets.emergingMarkets": "Emerging Mkts",
      };
      const chinese: Record<string, string> = {
        "portfolio.defaultAssets.usTech": "美国科技股",
        "portfolio.defaultAssets.bonds": "债券",
        "portfolio.defaultAssets.gold": "黄金",
        "portfolio.defaultAssets.emergingMarkets": "新兴市场",
      };
      return (mocks.language === "zh" ? chinese : english)[key] ?? key;
    },
  }),
}));

vi.mock("@/hooks/use-calculation-history", () => ({
  useCalculationHistory: () => ({ addToHistory: mocks.addToHistory }),
}));

vi.mock("@/hooks/use-shareable-url", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-shareable-url")>();
  return {
    ...actual,
    useShareableUrl: (options: CapturedShareOptions) => {
      mocks.shareOptions = options;
      return "https://example.test/portfolio/";
    },
  };
});

vi.mock("@/hooks/use-monte-carlo-simulation", () => ({
  useMonteCarloSimulation: () => ({
    progress: 0,
    isRunning: false,
    run: mocks.runSimulation,
    cancel: mocks.cancel,
  }),
}));

vi.mock("@/components/history-panel", () => ({
  HistoryPanel: ({ onRestore }: { onRestore: (inputs: Record<string, number | string>) => void }) => {
    mocks.restorePortfolio = onRestore;
    return null;
  },
}));

vi.mock("@/components/reset-defaults-button", () => ({
  ResetDefaultsButton: ({ onReset }: { onReset: () => void }) => (
    <button type="button" onClick={onReset}>
      Reset defaults
    </button>
  ),
}));

vi.mock("@/components/result-actions", () => ({
  ResultActions: (props: CapturedResultActions) => {
    mocks.resultActions = props;
    return <div data-testid="portfolio-result-actions" />;
  },
}));

vi.mock("@/components/responsive-disclosure", () => ({
  ResponsiveDisclosure: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

vi.mock("recharts", () => {
  const EmptyChart = () => null;
  return {
    CartesianGrid: EmptyChart,
    Scatter: EmptyChart,
    ScatterChart: EmptyChart,
    Tooltip: EmptyChart,
    XAxis: EmptyChart,
    YAxis: EmptyChart,
    ZAxis: EmptyChart,
  };
});

function assetNameInput(id: number): HTMLInputElement {
  const input = document.getElementById(`portfolio-desktop-asset-name-${id}`);
  if (!(input instanceof HTMLInputElement)) throw new Error(`Missing Portfolio asset input ${id}`);
  return input;
}

function capturedShareOptions(): CapturedShareOptions {
  if (!mocks.shareOptions) throw new Error("Share options were not captured");
  return mocks.shareOptions;
}

function capturedRawAssets() {
  return JSON.parse(String(capturedShareOptions().state.assets)) as Array<Record<string, unknown>>;
}

function restorePortfolio(inputs: Record<string, number | string>) {
  if (!mocks.restorePortfolio) throw new Error("Portfolio restore callback was not captured");
  mocks.restorePortfolio(inputs);
}

describe("Portfolio default asset localization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.language = "en";
    mocks.lastRunPayload = null;
    mocks.restorePortfolio = null;
    mocks.resultActions = null;
    mocks.shareOptions = null;
    mocks.runSimulation.mockImplementation(
      (
        payload: { assets: Array<{ name: string }> },
        options: {
          onComplete?: (result: {
            simulations: PortfolioPoint[];
            optimal: PortfolioPoint;
            minVol: PortfolioPoint;
          }) => void;
        }
      ) => {
        mocks.lastRunPayload = payload;
        const point: PortfolioPoint = {
          ret: 8,
          risk: 10,
          sharpe: 0.5,
          weights: [0.25, 0.25, 0.25, 0.25],
        };
        options.onComplete?.({ simulations: [point], optimal: point, minVol: point });
      }
    );
  });

  it("localizes keyed defaults while preserving edits and restoring localized defaults on reset", () => {
    const { rerender } = render(<PortfolioPage />);
    expect(assetNameInput(1)).toHaveValue("US Tech");
    expect(assetNameInput(4)).toHaveValue("Emerging Mkts");
    const initialRawAssets = String(capturedShareOptions().state.assets);

    mocks.language = "zh";
    rerender(<PortfolioPage />);
    expect(assetNameInput(1)).toHaveValue("美国科技股");
    expect(assetNameInput(4)).toHaveValue("新兴市场");
    expect(capturedShareOptions().state.assets).toBe(initialRawAssets);

    fireEvent.change(assetNameInput(1), { target: { value: "我的科技配置" } });
    expect(assetNameInput(1)).toHaveValue("我的科技配置");
    expect(capturedRawAssets()[0]).toEqual({ id: 1, name: "我的科技配置", return: "12", risk: "20" });

    mocks.language = "en";
    rerender(<PortfolioPage />);
    expect(assetNameInput(1)).toHaveValue("我的科技配置");
    expect(assetNameInput(2)).toHaveValue("Bonds");

    mocks.language = "zh";
    rerender(<PortfolioPage />);
    fireEvent.click(screen.getByRole("button", { name: "Reset defaults" }));
    expect(assetNameInput(1)).toHaveValue("美国科技股");
    expect(capturedRawAssets()[0]).toMatchObject({
      name: "US Tech",
      nameKey: "portfolio.defaultAssets.usTech",
    });
  });

  it("hydrates keyed defaults and keeps legacy restored names literal", () => {
    mocks.language = "zh";
    render(<PortfolioPage />);

    const defaults = capturedShareOptions().defaults;
    if (!defaults) throw new Error("Portfolio share defaults were not captured");
    act(() => restorePortfolio(defaults as Record<string, number | string>));
    expect(assetNameInput(1)).toHaveValue("美国科技股");

    act(() =>
      restorePortfolio({
        assets: JSON.stringify([
          { id: 7, name: "US Tech", return: "12", risk: "20" },
          { id: 8, name: "Legacy Bond", return: "4", risk: "5" },
        ]),
      })
    );
    expect(assetNameInput(1)).toHaveValue("US Tech");
    expect(assetNameInput(2)).toHaveValue("Legacy Bond");

    act(() =>
      restorePortfolio({
        assets: JSON.stringify([
          {
            id: 7,
            name: "US Tech",
            nameKey: "portfolio.defaultAssets.usTech",
            return: "12",
            risk: "20",
          },
          {
            id: 8,
            name: "Bonds",
            nameKey: "portfolio.defaultAssets.bonds",
            return: "4",
            risk: "5",
          },
        ]),
      })
    );
    expect(assetNameInput(1)).toHaveValue("美国科技股");
    expect(assetNameInput(2)).toHaveValue("债券");
  });

  it("keeps results and raw URLs stable across languages while resolving worker and export names", async () => {
    const { rerender } = render(<PortfolioPage />);
    const rawAssetsBeforeRun = String(capturedShareOptions().state.assets);

    fireEvent.submit(document.getElementById("portfolio-simulation-form")!);
    await waitFor(() => expect(screen.getByTestId("portfolio-result-actions")).toBeInTheDocument());
    expect(mocks.lastRunPayload?.assets[0].name).toBe("US Tech");
    expect(mocks.resultActions?.exportJson.assets[0].name).toBe("US Tech");
    const recordedAssets = JSON.parse(String(mocks.addToHistory.mock.calls[0]?.[0]?.assets)) as Array<
      Record<string, unknown>
    >;
    expect(recordedAssets[0]).toMatchObject({
      name: "US Tech",
      nameKey: "portfolio.defaultAssets.usTech",
    });

    const shareUrl = buildShareableUrl("/portfolio/", "portfolio", capturedShareOptions().state);
    expect(shareUrl).not.toBe("");
    expect(shareUrl.length).toBeLessThanOrEqual(MAX_SHARE_URL_LENGTH);

    mocks.language = "zh";
    rerender(<PortfolioPage />);
    expect(screen.getByTestId("portfolio-result-actions")).toBeInTheDocument();
    expect(screen.getAllByText("25.0%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("美国科技股").length).toBeGreaterThan(0);
    expect(capturedShareOptions().state.assets).toBe(rawAssetsBeforeRun);
    expect(mocks.resultActions?.displayInputs.assets).toContain("美国科技股");
    expect(mocks.resultActions?.exportJson.assets[0].name).toBe("美国科技股");
    expect(JSON.parse(mocks.resultActions?.inputs.assets ?? "[]")[0]).toMatchObject({
      name: "US Tech",
      nameKey: "portfolio.defaultAssets.usTech",
    });

    fireEvent.change(assetNameInput(1), { target: { value: "自定义科技" } });
    expect(screen.queryByTestId("portfolio-result-actions")).not.toBeInTheDocument();
  });
});
