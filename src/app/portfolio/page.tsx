"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Play, PieChart as PieIcon, RefreshCw, Loader2 } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis } from "recharts";
import { formatNumber } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { sanitizeInput } from "@/lib/sanitize";
import { EmptyState } from "@/components/empty-state";
import { ProgressBar } from "@/components/progress-bar";
import { useMonteCarloSimulation } from "@/hooks/use-monte-carlo-simulation";
import { ResponsiveDisclosure } from "@/components/responsive-disclosure";
import { parseOptionalNumber } from "@/lib/input-utils";
import { PortfolioInputSchema } from "@/lib/validation";
import { ErrorDisplay } from "@/components/ui/error-display";
import { SectionActionBar } from "@/components/section-action-bar";
import { ResultActions } from "@/components/result-actions";
import { clampEqualCorrelation, getMinimumEqualCorrelation, type PortfolioPoint } from "@/lib/portfolio-math";
import { normalizeRestoredPortfolioAssets } from "@/lib/portfolio-state";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { HistoryPanel } from "@/components/history-panel";
import { useShareableUrl } from "@/hooks/use-shareable-url";
import {
  MAX_INTEREST_RATE,
  MAX_MONTE_CARLO_SIMULATIONS,
  MAX_PORTFOLIO_ASSETS,
  MAX_VOLATILITY,
  MIN_INTEREST_RATE,
} from "@/lib/constants";

interface Asset {
  id: number;
  name: string;
  return: string;
  risk: string;
}

const DEFAULT_PORTFOLIO_SEED = "balanced-2026";
const DEFAULT_PORTFOLIO_ASSETS: Asset[] = [
  { id: 1, name: "US Tech", return: "12", risk: "20" },
  { id: 2, name: "Bonds", return: "4", risk: "5" },
  { id: 3, name: "Gold", return: "6", risk: "15" },
  { id: 4, name: "Emerging Mkts", return: "15", risk: "25" },
];

export default function PortfolioPage() {
  const { t } = useLanguage();
  const formatSharpe = (value: number | null) => (value === null ? t("common.notAvailable") : formatNumber(value));
  const [rf, setRf] = useState(3.0);
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_PORTFOLIO_ASSETS);
  const [correlation, setCorrelation] = useState(0.2);
  const [seed, setSeed] = useState(DEFAULT_PORTFOLIO_SEED);
  const [simulations, setSimulations] = useState<PortfolioPoint[]>([]);
  const [optimal, setOptimal] = useState<PortfolioPoint | null>(null);
  const [minVol, setMinVol] = useState<PortfolioPoint | null>(null);
  const [resultSignature, setResultSignature] = useState("");
  const [chartsReady, setChartsReady] = useState(false);
  const [chartElement, setChartElement] = useState<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const { addToHistory } = useCalculationHistory({ page: "portfolio" });

  const parsedAssets = useMemo(
    () =>
      assets.map((asset) => ({
        name: asset.name.trim(),
        return: parseOptionalNumber(asset.return),
        risk: parseOptionalNumber(asset.risk),
      })),
    [assets]
  );

  const minimumCorrelation = useMemo(() => getMinimumEqualCorrelation(parsedAssets.length), [parsedAssets.length]);
  const effectiveCorrelation = useMemo(
    () => clampEqualCorrelation(correlation, parsedAssets.length),
    [correlation, parsedAssets.length]
  );
  const effectiveSeed = useMemo(() => seed.trim() || DEFAULT_PORTFOLIO_SEED, [seed]);
  const inputSignature = useMemo(
    () => JSON.stringify({ assets: parsedAssets, correlation: effectiveCorrelation, rf, seed: effectiveSeed }),
    [effectiveCorrelation, effectiveSeed, parsedAssets, rf]
  );
  const serializedAssets = useMemo(() => JSON.stringify(assets), [assets]);

  const portfolioValidation = useMemo(() => {
    const hasInvalidAssetValue = parsedAssets.some(
      (asset) => asset.return === null || asset.risk === null || asset.name.length === 0
    );
    const result = PortfolioInputSchema.safeParse({
      rf,
      correlation: effectiveCorrelation,
      assets: parsedAssets.map((asset) => ({
        name: asset.name,
        return: asset.return ?? Number.NaN,
        risk: asset.risk ?? Number.NaN,
      })),
    });
    if (!result.success) {
      return {
        isValid: false,
        message: t("portfolio.validation.invalidInputs"),
      };
    }

    if (effectiveCorrelation < minimumCorrelation) {
      return {
        isValid: false,
        message: t("portfolio.validation.correlationRange").replace("{min}", minimumCorrelation.toFixed(2)),
      };
    }

    if (hasInvalidAssetValue) {
      return {
        isValid: false,
        message: t("portfolio.validation.invalidInputs"),
      };
    }

    return { isValid: true, message: null };
  }, [effectiveCorrelation, minimumCorrelation, parsedAssets, rf, t]);

  // Monte Carlo simulation hook: prefers a real worker, falls back to chunked client execution.
  const { progress, isRunning, run, cancel } = useMonteCarloSimulation();

  // Ensure cleanup on unmount
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setChartsReady(true));

    return () => {
      window.cancelAnimationFrame(frame);
      cancel();
    };
  }, [cancel]);

  useEffect(() => {
    if (!chartElement) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      const height = Math.floor(entry.contentRect.height);
      if (width > 0 && height > 0) {
        setChartSize((current) => (current.width === width && current.height === height ? current : { width, height }));
      }
    });

    observer.observe(chartElement);
    return () => observer.disconnect();
  }, [chartElement]);

  const resultsAreFresh = resultSignature === inputSignature;
  const visibleSimulations = resultsAreFresh ? simulations : [];
  const visibleOptimal = resultsAreFresh ? optimal : null;
  const visibleMinVol = resultsAreFresh ? minVol : null;
  const hasVisibleResults = Boolean(visibleOptimal && visibleMinVol && visibleSimulations.length > 0);

  const addAsset = () => {
    if (assets.length >= MAX_PORTFOLIO_ASSETS) {
      return;
    }

    const id = Math.max(0, ...assets.map((a) => a.id)) + 1;
    setAssets([...assets, { id, name: `${t("portfolio.asset")} ${id}`, return: "8", risk: "10" }]);
  };

  const removeAsset = (id: number) => {
    setAssets(assets.filter((a) => a.id !== id));
  };

  const updateAsset = (id: number, field: keyof Asset, value: string) => {
    const sanitizedValue = field === "name" ? sanitizeInput(value) : value;
    setAssets(
      assets.map((a) =>
        a.id === id
          ? {
              ...a,
              [field]: field === "name" ? sanitizedValue : sanitizedValue,
            }
          : a
      )
    );
  };

  const isAssetFieldInvalid = (index: number, field: "name" | "return" | "risk") => {
    const asset = parsedAssets[index];
    if (!asset) return true;
    if (field === "name") return asset.name.length === 0;
    if (field === "return")
      return asset.return === null || asset.return < MIN_INTEREST_RATE || asset.return > MAX_INTEREST_RATE;
    return asset.risk === null || asset.risk < 0 || asset.risk > MAX_VOLATILITY;
  };

  const startSimulation = () => {
    if (!portfolioValidation.isValid || assets.length < 2) return;
    const runSignature = inputSignature;
    const payload = {
      assets: parsedAssets.map((asset, index) => ({
        id: assets[index].id,
        name: asset.name,
        return: asset.return ?? 0,
        risk: asset.risk ?? 0,
      })),
      correlation: effectiveCorrelation,
      rf,
      seed: effectiveSeed,
      simulations: Math.min(2000, MAX_MONTE_CARLO_SIMULATIONS),
    } as const;

    run(payload, {
      onProgress: () => {
        // progress is surfaced by the hook; no extra action needed
      },
      onComplete: (data) => {
        const d = data as { simulations: PortfolioPoint[]; optimal: PortfolioPoint; minVol: PortfolioPoint };
        if (d?.simulations) setSimulations(d.simulations);
        if (d?.optimal) setOptimal(d.optimal);
        if (d?.minVol) setMinVol(d.minVol);
        if (d?.optimal && d.optimal.sharpe !== null) {
          addToHistory(
            {
              assets: JSON.stringify(assets),
              rf,
              correlation: effectiveCorrelation,
              seed: effectiveSeed,
            },
            d.optimal.sharpe,
            { label: t("portfolio.maxSharpe"), resultFormat: "ratio" }
          );
        }
        setResultSignature(runSignature);
      },
      onError: () => {
        // Fallback handling lives inside the hook; keep the UI responsive even if worker setup fails.
      },
    });
  };

  const restorePortfolio = (inputs: Record<string, number | string>) => {
    if (typeof inputs.assets === "string") {
      try {
        const restoredAssets = normalizeRestoredPortfolioAssets(JSON.parse(inputs.assets));
        if (restoredAssets.length >= 2) setAssets(restoredAssets);
      } catch {
        // Ignore malformed old history entries.
      }
    }
    if (typeof inputs.rf === "number") setRf(inputs.rf);
    if (typeof inputs.rf === "string") {
      const parsed = parseOptionalNumber(inputs.rf);
      if (parsed !== null) setRf(parsed);
    }
    if (typeof inputs.correlation === "number") setCorrelation(inputs.correlation);
    if (typeof inputs.correlation === "string") {
      const parsed = parseOptionalNumber(inputs.correlation);
      if (parsed !== null) setCorrelation(parsed);
    }
    if (typeof inputs.seed === "string") setSeed(sanitizeInput(inputs.seed) || DEFAULT_PORTFOLIO_SEED);
    if (typeof inputs.seed === "number") setSeed(String(inputs.seed));
    setResultSignature("");
  };

  const shareDefaults = useMemo(
    () => ({
      rf: 3,
      correlation: 0.2,
      seed: DEFAULT_PORTFOLIO_SEED,
      assets: JSON.stringify(DEFAULT_PORTFOLIO_ASSETS),
    }),
    []
  );
  const shareState = useMemo(
    () => ({
      rf,
      correlation: effectiveCorrelation,
      seed: effectiveSeed,
      assets: serializedAssets,
    }),
    [effectiveCorrelation, effectiveSeed, rf, serializedAssets]
  );
  const shareUrl = useShareableUrl({
    prefix: "portfolio",
    state: shareState,
    defaults: shareDefaults,
    onRestore: (restored) => restorePortfolio(restored as Record<string, number | string>),
  });

  return (
    <div className="page-stack" data-tone="blue">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("portfolio.title")}</h1>
          <p className="page-description">{t("portfolio.subtitle")}</p>
        </div>
        <HistoryPanel page="portfolio" onRestore={restorePortfolio} />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-5 h-fit">
          <form
            id="portfolio-simulation-form"
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              startSimulation();
            }}
          >
            <CardHeader>
              <CardTitle>{t("portfolio.workflow.settings")}</CardTitle>
              <CardDescription>{t("portfolio.workflow.runHint")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 min-w-0">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span id="portfolio-rf-label" className="text-sm font-medium">
                    {t("portfolio.rf")}: {rf}%
                  </span>
                  <span id="portfolio-correlation-label" className="text-sm font-medium">
                    {t("portfolio.corr")}: {effectiveCorrelation}
                  </span>
                </div>
                <Slider
                  aria-labelledby="portfolio-rf-label"
                  aria-label={t("portfolio.rf")}
                  name="portfolio-risk-free-rate"
                  value={[rf]}
                  onValueChange={(v) => setRf(v[0])}
                  max={10}
                  step={0.1}
                  className="pb-4"
                />
                <Slider
                  aria-labelledby="portfolio-correlation-label"
                  aria-label={t("portfolio.corr")}
                  name="portfolio-correlation"
                  value={[effectiveCorrelation]}
                  onValueChange={(v) => setCorrelation(v[0])}
                  min={minimumCorrelation}
                  max={1}
                  step={0.1}
                />
                {!portfolioValidation.isValid && (
                  <ErrorDisplay
                    id="portfolio-validation-error"
                    message={portfolioValidation.message}
                    variant="warning"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio-seed">{t("portfolio.seed")}</Label>
                <Input
                  id="portfolio-seed"
                  name="portfolio-seed"
                  value={seed}
                  onChange={(event) => setSeed(sanitizeInput(event.target.value))}
                  aria-describedby="portfolio-seed-description"
                />
                <p id="portfolio-seed-description" className="text-xs text-muted-foreground">
                  {t("portfolio.seedDesc")}
                </p>
              </div>

              <ResponsiveDisclosure
                title={t("portfolio.workflow.assets")}
                description={t("portfolio.validation.universeDisclosure")}
                defaultOpen={true}
              >
                <div className="hidden overflow-x-auto rounded-lg border bg-muted/30 p-2 sm:block sm:p-3">
                  <Table>
                    <TableCaption className="sr-only">{t("portfolio.workflow.assets")}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead scope="col" className="w-[100px]">
                          {t("portfolio.asset")}
                        </TableHead>
                        <TableHead scope="col">{t("portfolio.ret")}</TableHead>
                        <TableHead scope="col">{t("portfolio.risk")}</TableHead>
                        <TableHead scope="col" className="w-[40px]">
                          <span className="sr-only">{t("common.remove")}</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.map((asset, index) => (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <Input
                              id={`portfolio-desktop-asset-name-${asset.id}`}
                              name={`portfolio-desktop-asset-name-${asset.id}`}
                              aria-label={t("portfolio.asset")}
                              aria-invalid={isAssetFieldInvalid(index, "name")}
                              aria-describedby={
                                isAssetFieldInvalid(index, "name") ? "portfolio-validation-error" : undefined
                              }
                              value={asset.name}
                              onChange={(e) => updateAsset(asset.id, "name", e.target.value)}
                              className="h-10 w-28 min-w-[7rem]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              id={`portfolio-desktop-asset-return-${asset.id}`}
                              name={`portfolio-desktop-asset-return-${asset.id}`}
                              aria-label={`${t("portfolio.ret")}: ${asset.name}`}
                              aria-invalid={isAssetFieldInvalid(index, "return")}
                              aria-describedby={
                                isAssetFieldInvalid(index, "return") ? "portfolio-validation-error" : undefined
                              }
                              type="number"
                              value={asset.return}
                              onChange={(e) => updateAsset(asset.id, "return", e.target.value)}
                              className="h-10 w-[4.5rem] min-w-[4.5rem]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              id={`portfolio-desktop-asset-risk-${asset.id}`}
                              name={`portfolio-desktop-asset-risk-${asset.id}`}
                              aria-label={`${t("portfolio.risk")}: ${asset.name}`}
                              aria-invalid={isAssetFieldInvalid(index, "risk")}
                              aria-describedby={
                                isAssetFieldInvalid(index, "risk") ? "portfolio-validation-error" : undefined
                              }
                              type="number"
                              value={asset.risk}
                              onChange={(e) => updateAsset(asset.id, "risk", e.target.value)}
                              className="h-10 w-[4.5rem] min-w-[4.5rem]"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-destructive"
                              onClick={() => removeAsset(asset.id)}
                              aria-label={t("common.remove")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="space-y-3 sm:hidden">
                  {assets.map((asset, index) => (
                    <div key={asset.id} className="space-y-3 rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{t("portfolio.validation.assetCardTitle")}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-destructive"
                          onClick={() => removeAsset(asset.id)}
                          aria-label={t("common.remove")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`portfolio-asset-name-${asset.id}`}>{t("portfolio.asset")}</Label>
                        <Input
                          id={`portfolio-asset-name-${asset.id}`}
                          name={`portfolio-asset-name-${asset.id}`}
                          aria-label={t("portfolio.asset")}
                          aria-invalid={isAssetFieldInvalid(index, "name")}
                          aria-describedby={
                            isAssetFieldInvalid(index, "name") ? "portfolio-validation-error" : undefined
                          }
                          value={asset.name}
                          onChange={(e) => updateAsset(asset.id, "name", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`portfolio-asset-return-${asset.id}`}>{t("portfolio.ret")}</Label>
                          <Input
                            id={`portfolio-asset-return-${asset.id}`}
                            name={`portfolio-asset-return-${asset.id}`}
                            aria-label={`${t("portfolio.ret")}: ${asset.name}`}
                            aria-invalid={isAssetFieldInvalid(index, "return")}
                            aria-describedby={
                              isAssetFieldInvalid(index, "return") ? "portfolio-validation-error" : undefined
                            }
                            type="number"
                            value={asset.return}
                            onChange={(e) => updateAsset(asset.id, "return", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`portfolio-asset-risk-${asset.id}`}>{t("portfolio.risk")}</Label>
                          <Input
                            id={`portfolio-asset-risk-${asset.id}`}
                            name={`portfolio-asset-risk-${asset.id}`}
                            aria-label={`${t("portfolio.risk")}: ${asset.name}`}
                            aria-invalid={isAssetFieldInvalid(index, "risk")}
                            aria-describedby={
                              isAssetFieldInvalid(index, "risk") ? "portfolio-validation-error" : undefined
                            }
                            type="number"
                            value={asset.risk}
                            onChange={(e) => updateAsset(asset.id, "risk", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ResponsiveDisclosure>

              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={addAsset}
                disabled={assets.length >= MAX_PORTFOLIO_ASSETS}
              >
                <Plus className="mr-2 h-4 w-4" /> {t("portfolio.add")}
              </Button>

              <div className="space-y-3 rounded-lg border border-dashed bg-muted/30 p-4 xl:hidden">
                <p className="text-sm font-semibold">{t("portfolio.workflow.results")}</p>
                <p className="text-sm text-muted-foreground">{t("portfolio.workflow.resultsHint")}</p>
                <Button type="submit" className="w-full gap-2" disabled={isRunning}>
                  {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {isRunning
                    ? t("common.loading")
                    : visibleSimulations.length > 0
                      ? t("portfolio.rerun")
                      : t("portfolio.run")}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        <div id="portfolio-report-content" className="min-w-0 space-y-6 xl:col-span-7">
          {isRunning && (
            <ProgressBar
              progress={progress}
              label={t("portfolio.run")}
              showETA
              onCancel={cancel}
              cancelLabel={t("common.cancel")}
              cancelAriaLabel={t("common.cancelCalculation")}
              formatETA={(seconds) => t("common.secondsRemaining").replace("{seconds}", String(seconds))}
            />
          )}

          <SectionActionBar
            title={t("portfolio.workflow.results")}
            description={t("portfolio.workflow.resultsHint")}
            actions={
              <>
                <Button
                  type="submit"
                  form="portfolio-simulation-form"
                  variant="outline"
                  className="gap-2 hidden xl:inline-flex"
                  disabled={isRunning}
                >
                  {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {isRunning
                    ? t("common.loading")
                    : visibleSimulations.length > 0
                      ? t("portfolio.rerun")
                      : t("portfolio.run")}
                </Button>
                {hasVisibleResults && visibleOptimal && visibleMinVol ? (
                  <ResultActions
                    title={t("portfolio.title")}
                    results={{
                      [t("portfolio.maxSharpe")]: `${t("portfolio.ratio")}: ${formatSharpe(visibleOptimal.sharpe)}`,
                      [t("portfolio.minVol")]:
                        `${formatNumber(visibleMinVol.ret)}% / ${formatNumber(visibleMinVol.risk)}%`,
                    }}
                    inputs={{
                      [t("portfolio.rf")]: `${rf}%`,
                      [t("portfolio.corr")]: effectiveCorrelation,
                      [t("portfolio.seed")]: effectiveSeed,
                      [t("portfolio.asset")]: assets.map((asset) => asset.name).join(", "),
                    }}
                    shareUrl={shareUrl}
                    exportData={visibleSimulations as unknown as Record<string, unknown>[]}
                    exportJson={{
                      assets,
                      rf,
                      correlation: effectiveCorrelation,
                      seed: effectiveSeed,
                      optimal: visibleOptimal,
                      minVol: visibleMinVol,
                      simulations: visibleSimulations,
                    }}
                    pdfElementId="portfolio-report-content"
                    pdfFilename="portfolio-optimization"
                    pdfTitle={t("portfolio.title")}
                  />
                ) : null}
              </>
            }
          />

          {visibleSimulations.length === 0 && !isRunning ? (
            <Card variant="subtle" className="border-dashed">
              <CardContent className="pt-6">
                <EmptyState
                  icon={RefreshCw}
                  title={t("portfolio.empty")}
                  description={t("portfolio.workflow.runHint")}
                />
              </CardContent>
            </Card>
          ) : null}

          {visibleOptimal && (
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
              <Card variant="result">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-chart-4">
                    <PieIcon className="h-5 w-5" /> {t("portfolio.maxSharpe")}
                  </CardTitle>
                  <CardDescription>
                    {t("portfolio.ratio")}: {formatSharpe(visibleOptimal.sharpe)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {visibleOptimal.weights.map((w, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 text-sm">
                        <span className="min-w-0 break-words">{assets[i]?.name}</span>
                        <span className="shrink-0 font-bold">{(w * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                    <div className="mt-4 flex flex-col gap-1 border-t pt-4 text-sm font-medium sm:flex-row sm:items-center sm:justify-between">
                      <span>{t("portfolio.retRisk")}</span>
                      <span className="break-words">
                        {formatNumber(visibleOptimal.ret)}% / {formatNumber(visibleOptimal.risk)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="result">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-chart-2">
                    <PieIcon className="h-5 w-5" /> {t("portfolio.minVol")}
                  </CardTitle>
                  <CardDescription>{t("portfolio.minVol")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {visibleMinVol?.weights.map((w, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 text-sm">
                        <span className="min-w-0 break-words">{assets[i]?.name}</span>
                        <span className="shrink-0 font-bold">{(w * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                    <div className="mt-4 flex flex-col gap-1 border-t pt-4 text-sm font-medium sm:flex-row sm:items-center sm:justify-between">
                      <span>{t("portfolio.retRisk")}</span>
                      <span className="break-words">
                        {formatNumber(visibleMinVol?.ret || 0)}% / {formatNumber(visibleMinVol?.risk || 0)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <ResponsiveDisclosure
            title={t("portfolio.workflow.chart")}
            description={t("portfolio.workflow.chartHint")}
            defaultOpen={visibleSimulations.length > 0}
          >
            <div className="flex h-[280px] flex-col sm:h-[360px] md:h-[430px]">
              <CardHeader className="px-0">
                <CardTitle>{t("portfolio.frontier")}</CardTitle>
                <CardDescription>{t("portfolio.frontierDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[240px] flex-1 px-0">
                <div
                  ref={setChartElement}
                  className="h-full min-h-[240px] w-full"
                  role={visibleSimulations.length > 0 ? "img" : undefined}
                  aria-label={
                    visibleSimulations.length > 0
                      ? `${t("portfolio.frontier")}. ${t("portfolio.frontierDesc")}`
                      : undefined
                  }
                >
                  {visibleSimulations.length > 0 ? (
                    chartsReady && chartSize.width > 0 && chartSize.height > 0 ? (
                      <ScatterChart
                        width={chartSize.width}
                        height={chartSize.height}
                        margin={{ top: 12, right: 12, bottom: 12, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                          type="number"
                          dataKey="risk"
                          name={t("portfolio.risk")}
                          label={{ value: `${t("portfolio.risk")}`, position: "bottom", offset: 0 }}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          domain={["auto", "auto"]}
                        />
                        <YAxis
                          type="number"
                          dataKey="ret"
                          name={t("portfolio.ret")}
                          label={{ value: `${t("portfolio.ret")}`, angle: -90, position: "insideLeft" }}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          domain={["auto", "auto"]}
                        />
                        <ZAxis range={[20, 20]} />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="rounded-lg border bg-card p-2 shadow-sm">
                                  <p className="font-semibold">{data.type || t("portfolio.title")}</p>
                                  <p className="text-sm">
                                    {t("portfolio.ret")}: {formatNumber(data.ret)}%
                                  </p>
                                  <p className="text-sm">
                                    {t("portfolio.risk")}: {formatNumber(data.risk)}%
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {t("portfolio.ratio")}: {formatSharpe(data.sharpe)}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter
                          name={t("portfolio.title")}
                          data={visibleSimulations}
                          fill="hsl(var(--primary))"
                          fillOpacity={0.4}
                        />
                        {visibleOptimal && (
                          <Scatter
                            name={t("portfolio.maxSharpe")}
                            data={[visibleOptimal]}
                            fill="hsl(var(--chart-4))"
                            shape="star"
                            r={200}
                          />
                        )}
                        {visibleMinVol && (
                          <Scatter
                            name={t("portfolio.minVol")}
                            data={[visibleMinVol]}
                            fill="hsl(var(--chart-2))"
                            shape="diamond"
                          />
                        )}
                      </ScatterChart>
                    ) : (
                      <div className="h-full w-full" aria-hidden="true" />
                    )
                  ) : (
                    <EmptyState
                      icon={RefreshCw}
                      title={t("portfolio.empty")}
                      description={isRunning ? t("common.loading") : undefined}
                    />
                  )}
                </div>
              </CardContent>
            </div>
          </ResponsiveDisclosure>
        </div>
      </div>
    </div>
  );
}
