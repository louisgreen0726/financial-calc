"use client";

import { useMemo, useState } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus, TrendingUp, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell } from "recharts";
import { useLanguage } from "@/lib/i18n";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { HistoryPanel } from "@/components/history-panel";

import { ClientOnlyChart } from "@/components/client-only-chart";
import { ResponsiveDisclosure } from "@/components/responsive-disclosure";
import { parseOptionalNumber } from "@/lib/input-utils";
import { CashFlowSchema } from "@/lib/validation";
import { ErrorDisplay } from "@/components/ui/error-display";
import { ResultShell } from "@/components/result-shell";
import { ResultActions } from "@/components/result-actions";
import { useShareableUrl } from "@/hooks/use-shareable-url";

export default function CashFlowPage() {
  const { t } = useLanguage();
  const [rate, setRate] = useState<string>("10");
  const [flowInputs, setFlowInputs] = useState<string[]>(["-10000", "3000", "4000", "5000", "6000"]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { addToHistory } = useCalculationHistory({ page: "cash-flow" });
  const shareUrl = useShareableUrl({
    prefix: "cash",
    state: { rate, flows: flowInputs },
    onRestore: (inputs) => {
      if (inputs.rate !== undefined) setRate(String(inputs.rate));
      if (Array.isArray(inputs.flows) && inputs.flows.length > 0) {
        setFlowInputs(inputs.flows.map(String));
      }
    },
  });

  const parsedRate = parseOptionalNumber(rate);
  const parsedFlows = useMemo(() => flowInputs.map((flow) => parseOptionalNumber(flow)), [flowInputs]);
  const hasInvalidFlow = parsedFlows.some((flow) => flow === null);
  const flows = parsedFlows.map((flow) => flow ?? 0);

  const validation = useMemo(() => {
    const result = CashFlowSchema.safeParse({
      rate: parsedRate ?? Number.NaN,
      flows,
    });

    if (!result.success) {
      return {
        isValid: false,
        message: result.error.issues[0]?.message ?? "Invalid cash-flow inputs.",
      };
    }

    if (hasInvalidFlow || parsedRate === null) {
      return {
        isValid: false,
        message: "Please enter valid numeric inputs for discount rate and cash flows.",
      };
    }

    return { isValid: true, message: null };
  }, [flows, hasInvalidFlow, parsedRate]);

  const addFlow = () => {
    setHasInteracted(true);
    setFlowInputs([...flowInputs, "0"]);
  };
  const removeFlow = (index: number) => {
    setHasInteracted(true);
    setFlowInputs(flowInputs.filter((_, i) => i !== index));
  };
  const updateFlow = (index: number, val: string) => {
    setHasInteracted(true);
    const next = [...flowInputs];
    next[index] = val;
    setFlowInputs(next);
  };

  const calculateMetrics = useMemo(() => {
    if (!validation.isValid || parsedRate === null) {
      return { npv: 0, irr: Number.NaN, payback: -1 };
    }

    const r = parsedRate / 100;
    const npv = Finance.npv(r, flows);
    const irr = Finance.irr(flows);

    // Payback Period (Simple)
    let cumulative = 0;
    let payback = -1;
    for (let i = 0; i < flows.length; i++) {
      cumulative += flows[i];
      if (cumulative >= 0) {
        // Linear interpolation for more precision? Or just period
        // Previous cumulative was negative.
        const prevCum = cumulative - flows[i];
        if (flows[i] === 0) {
          payback = i;
        } else {
          payback = i - 1 + -prevCum / flows[i];
        }
        break;
      }
    }

    return { npv, irr, payback };
  }, [flows, parsedRate, validation.isValid]);

  useHistoryRecorder({
    addToHistory,
    inputs: { rate, flows: flowInputs.join(",") },
    result: calculateMetrics.npv,
    label: "NPV",
    enabled: hasInteracted && validation.isValid,
  });

  const chartData = flows.map((val, i) => ({
    period: `${t("common.year")} ${i}`,
    amount: val,
    color: val >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))", // Emerald for positive, Rose for negative
  }));

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("cashFlow.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("cashFlow.subtitle")}</p>
          </div>
        </div>

        <div id="cash-flow-report-content" className="grid gap-6 lg:grid-cols-12">
          {/* Input Section */}
          <Card className="lg:col-span-5 h-fit">
            <CardHeader>
              <CardTitle>{t("cashFlow.inputsTitle")}</CardTitle>
              <CardDescription>{t("cashFlow.inputsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cash-flow-discount-rate">{t("cashFlow.discountRate")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="cash-flow-discount-rate"
                    type="number"
                    value={rate}
                    onChange={(e) => {
                      setHasInteracted(true);
                      setRate(e.target.value);
                    }}
                    className="flex-1"
                  />
                  <div className="flex items-center text-sm text-muted-foreground">%</div>
                </div>
                {!validation.isValid && <ErrorDisplay message={validation.message} variant="warning" />}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>{t("cashFlow.period")}</span>
                  <span>{t("cashFlow.flow")}</span>
                </div>
                <div className="space-y-2 max-h-[250px] sm:max-h-[400px] pr-2 overflow-y-auto">
                  {flowInputs.map((flow, i) => {
                    const periodLabel = i === 0 ? t("common.initial") : `${t("common.year")} ${i}`;

                    return (
                      <div
                        key={i}
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-xl border border-white/10 bg-background/30 p-3 animate-in fade-in slide-in-from-left-2 duration-300 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center sm:gap-3"
                      >
                        <div className="text-sm text-muted-foreground font-mono">{periodLabel}</div>
                        <Input
                          type="number"
                          aria-label={`${periodLabel} ${t("cashFlow.flow")}`}
                          value={flow}
                          onChange={(e) => updateFlow(i, e.target.value)}
                          className={
                            (parsedFlows[i] ?? 0) < 0 ? "text-destructive font-medium" : "text-primary font-medium"
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => removeFlow(i)}
                          disabled={flows.length <= 1}
                          aria-label={`${t("common.remove")} ${periodLabel}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <Button onClick={addFlow} variant="outline" className="w-full border-dashed mt-2">
                  <Plus className="mr-2 h-4 w-4" /> {t("cashFlow.addPeriod")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results & Visualization */}
          <div className="lg:col-span-7">
            <ResultShell
              title={t("common.result")}
              description={t("cashFlow.subtitle")}
              isReady={validation.isValid}
              emptyTitle={t("cashFlow.title")}
              emptyDescription={validation.message ?? t("cashFlow.invalidInputs")}
              actions={
                validation.isValid ? (
                  <ResultActions
                    title={t("cashFlow.title")}
                    results={{
                      [t("cashFlow.npv")]: calculateMetrics.npv,
                      [t("cashFlow.irr")]: isFinite(calculateMetrics.irr)
                        ? `${(calculateMetrics.irr * 100).toFixed(2)}%`
                        : t("common.notAvailable"),
                    }}
                    inputs={{ rate, flows: flowInputs.join(",") }}
                    shareUrl={shareUrl}
                    exportData={chartData}
                    exportJson={calculateMetrics}
                    pdfElementId="cash-flow-report-content"
                    pdfFilename="cash-flow-analysis"
                  />
                ) : null
              }
              summary={
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{t("cashFlow.npv")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${calculateMetrics.npv >= 0 ? "text-primary" : "text-destructive"}`}
                      >
                        {formatCurrency(calculateMetrics.npv)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{t("cashFlow.irr")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {isNaN(calculateMetrics.irr) || !isFinite(calculateMetrics.irr) ? (
                          <span className="text-muted-foreground">N/A</span>
                        ) : (
                          `${(calculateMetrics.irr * 100).toFixed(2)}%`
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {t("cashFlow.payback")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {calculateMetrics.payback >= 0
                          ? `${calculateMetrics.payback.toFixed(1)} ${t("common.year")}`
                          : "N/A"}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              }
              advanced={
                <div className="space-y-6">
                  <ResponsiveDisclosure
                    title={t("cashFlow.visualization")}
                    description={t("cashFlow.chartDisclosure")}
                    defaultOpen={false}
                  >
                    <Card className="h-[260px] sm:h-[320px] md:h-[380px] flex flex-col order-first lg:order-none">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          {t("cashFlow.visualization")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 w-full min-h-0">
                        <ClientOnlyChart>
                          {({ width, height }) => (
                            <BarChart
                              width={width}
                              height={height}
                              data={chartData}
                              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                              <XAxis
                                dataKey="period"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                minTickGap={18}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                              />
                              <Tooltip
                                cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                                contentStyle={{
                                  backgroundColor: "hsl(var(--card))",
                                  borderColor: "hsl(var(--border))",
                                  borderRadius: "8px",
                                }}
                                itemStyle={{ color: "hsl(var(--foreground))" }}
                              />
                              <ReferenceLine y={0} stroke="hsl(var(--border))" />
                              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          )}
                        </ClientOnlyChart>
                      </CardContent>
                    </Card>
                  </ResponsiveDisclosure>

                  <ResponsiveDisclosure
                    title={t("common.analysis")}
                    description={t("cashFlow.infoDisclosure")}
                    defaultOpen={false}
                  >
                    <Card className="bg-muted/30">
                      <CardContent className="pt-6 flex gap-4 text-sm text-muted-foreground">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>{t("cashFlow.info")}</p>
                      </CardContent>
                    </Card>
                  </ResponsiveDisclosure>
                </div>
              }
            />
          </div>
        </div>
      </div>
      <HistoryPanel
        page="cash-flow"
        onRestore={(inputs) => {
          if (inputs.rate !== undefined) setRate(String(inputs.rate));
          if (inputs.flows !== undefined) {
            const restoredFlows = String(inputs.flows)
              .split(",")
              .map((value) => value.trim())
              .filter((value) => parseOptionalNumber(value) !== null);

            if (restoredFlows.length > 0) {
              setFlowInputs(restoredFlows);
            }
          }
        }}
      />
    </>
  );
}
