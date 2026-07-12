"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { useLanguage } from "@/lib/i18n";
import { ResultShell } from "@/components/result-shell";
import { ResultActions } from "@/components/result-actions";
import { parseOptionalNumber } from "@/lib/input-utils";
import { RiskInputSchema } from "@/lib/validation";
import { ErrorDisplay, ValidationError } from "@/components/ui/error-display";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { HistoryPanel } from "@/components/history-panel";
import { ClientOnlyChart } from "@/components/client-only-chart";
import { useShareableUrl } from "@/hooks/use-shareable-url";
import { buildRiskDistributionData, getRiskTailGradientOffset } from "@/lib/chart-data";
import { calculateParametricNormalRisk } from "@/lib/risk-math";

export default function RiskPage() {
  const { t } = useLanguage();
  const [value, setValue] = useState("100000"); // Portfolio Value
  const [volatility, setVolatility] = useState("15"); // Annual Vol %
  const [confidence, setConfidence] = useState("0.95");
  const [days, setDays] = useState("10"); // Horizon
  const [hasInteracted, setHasInteracted] = useState(false);
  const { addToHistory } = useCalculationHistory({ page: "risk" });
  const shareUrl = useShareableUrl({
    prefix: "risk",
    state: { value, volatility, confidence, days },
    onRestore: (inputs) => {
      if (inputs.value !== undefined) setValue(String(inputs.value));
      if (inputs.volatility !== undefined) setVolatility(String(inputs.volatility));
      if (inputs.confidence !== undefined) setConfidence(String(inputs.confidence));
      if (inputs.days !== undefined) setDays(String(inputs.days));
      setHasInteracted(false);
    },
  });

  const updateField = (setter: (value: string) => void) => (nextValue: string) => {
    setHasInteracted(true);
    setter(nextValue);
  };

  const parsedInputs = useMemo(
    () => ({
      value: parseOptionalNumber(value),
      volatility: parseOptionalNumber(volatility),
      confidence: parseOptionalNumber(confidence),
      days: parseOptionalNumber(days),
    }),
    [confidence, days, value, volatility]
  );

  const validation = useMemo(() => {
    const messages = {
      value: t("risk.validation.valuePositive"),
      volatility: t("risk.validation.volatilityRange"),
      days: t("risk.validation.horizonPositive"),
      confidence: t("risk.validation.invalidInputs"),
    } as const;
    const result = RiskInputSchema.safeParse({
      value: parsedInputs.value ?? Number.NaN,
      volatility: parsedInputs.volatility ?? Number.NaN,
      confidence: parsedInputs.confidence ?? Number.NaN,
      days: parsedInputs.days ?? Number.NaN,
    });

    return result.success
      ? {}
      : Object.fromEntries(
          result.error.issues.map((issue) => {
            const field = String(issue.path[0]) as keyof typeof messages;
            return [field, messages[field] ?? t("risk.validation.invalidInputs")];
          })
        );
  }, [parsedInputs, t]);

  const hasValidationErrors = Object.keys(validation).length > 0;

  const metrics = useMemo(() => {
    if (hasValidationErrors) {
      return null;
    }

    return calculateParametricNormalRisk({
      portfolioValue: parsedInputs.value ?? Number.NaN,
      annualVolatility: (parsedInputs.volatility ?? Number.NaN) / 100,
      confidence: parsedInputs.confidence ?? Number.NaN,
      horizonDays: parsedInputs.days ?? Number.NaN,
    });
  }, [hasValidationErrors, parsedInputs]);
  const resultReady = !hasValidationErrors && metrics !== null;

  // Generate Distribution Curve
  const chartData = useMemo(() => {
    if (!resultReady) {
      return [];
    }

    return buildRiskDistributionData(metrics?.horizonVolatility ?? 0, parsedInputs.value ?? 0, metrics?.zScore ?? 0);
  }, [metrics, parsedInputs, resultReady]);
  const tailGradientOffset = getRiskTailGradientOffset(metrics?.zScore ?? 0);

  useHistoryRecorder({
    addToHistory,
    inputs: { value, volatility, confidence, days },
    result: metrics?.valueAtRisk ?? Number.NaN,
    label: t("risk.var"),
    resultFormat: "currency",
    enabled: hasInteracted && resultReady,
  });

  return (
    <div className="page-stack" data-tone="rose">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("risk.title")}</h1>
          <p className="page-description">{t("risk.subtitle")}</p>
        </div>
        <HistoryPanel
          page="risk"
          onRestore={(inputs) => {
            if (inputs.value !== undefined) setValue(String(inputs.value));
            if (inputs.volatility !== undefined) setVolatility(String(inputs.volatility));
            if (inputs.confidence !== undefined) setConfidence(String(inputs.confidence));
            if (inputs.days !== undefined) setDays(String(inputs.days));
            setHasInteracted(false);
          }}
        />
      </div>

      <div id="risk-report-content" className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4 h-fit">
          <CardHeader>
            <CardTitle>{t("risk.params")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasValidationErrors && <ErrorDisplay message={Object.values(validation)[0] as string} variant="warning" />}
            <div className="space-y-2">
              <Label htmlFor="risk-value">{t("risk.val")}</Label>
              <Input
                id="risk-value"
                value={value}
                onChange={(e) => updateField(setValue)(e.target.value)}
                type="number"
                min="0"
                aria-invalid={Boolean(validation.value)}
                aria-describedby={validation.value ? "risk-value-error" : undefined}
              />
              <ValidationError id="risk-value-error" error={validation.value as string | null} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-volatility">{t("risk.vol")}</Label>
              <Input
                id="risk-volatility"
                value={volatility}
                onChange={(e) => updateField(setVolatility)(e.target.value)}
                type="number"
                min="0"
                aria-invalid={Boolean(validation.volatility)}
                aria-describedby={validation.volatility ? "risk-volatility-error" : undefined}
              />
              <ValidationError id="risk-volatility-error" error={validation.volatility as string | null} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-days">{t("risk.horizon")}</Label>
              <Input
                id="risk-days"
                value={days}
                onChange={(e) => updateField(setDays)(e.target.value)}
                type="number"
                min="1"
                aria-invalid={Boolean(validation.days)}
                aria-describedby={validation.days ? "risk-days-error" : undefined}
              />
              <ValidationError id="risk-days-error" error={validation.days as string | null} />
            </div>
            <div className="space-y-2">
              <Label id="risk-confidence-label" htmlFor="risk-confidence">
                {t("risk.conf")}
              </Label>
              <Select value={confidence} onValueChange={updateField(setConfidence)}>
                <SelectTrigger id="risk-confidence" aria-labelledby="risk-confidence-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.90">90%</SelectItem>
                  <SelectItem value="0.95">95%</SelectItem>
                  <SelectItem value="0.99">99%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-8">
          <ResultShell
            title={t("common.result")}
            description={t("risk.subtitle")}
            isReady={resultReady}
            emptyTitle={t("risk.title")}
            emptyDescription={Object.values(validation)[0] as string | undefined}
            actions={
              resultReady ? (
                <ResultActions
                  title={t("risk.title")}
                  results={{
                    [t("risk.var")]: metrics?.valueAtRisk ?? 0,
                    [t("risk.cvar")]: metrics?.conditionalValueAtRisk ?? 0,
                    [t("risk.vol")]: `${((metrics?.horizonVolatility ?? 0) * 100).toFixed(2)}%`,
                  }}
                  inputs={{ value, volatility, confidence, days }}
                  shareUrl={shareUrl}
                  exportData={chartData as unknown as Record<string, unknown>[]}
                  exportJson={metrics ? { ...metrics } : {}}
                  pdfElementId="risk-report-content"
                  pdfFilename="risk-analysis"
                  pdfTitle={t("risk.title")}
                />
              ) : null
            }
            summary={
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card variant="result" className="!border-destructive/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium uppercase">
                      {t("risk.var")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-destructive break-all">
                      {formatCurrency(metrics?.valueAtRisk ?? 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(metrics?.valueAtRisk ?? 0)} (
                      {((metrics?.valueAtRiskFraction ?? 0) * 100).toFixed(2)}% {t("risk.varDesc")})
                    </p>
                  </CardContent>
                </Card>
                <Card variant="result" className="!border-destructive/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium uppercase">
                      {t("risk.cvar")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-destructive break-all">
                      {formatCurrency(metrics?.conditionalValueAtRisk ?? 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">{t("risk.cvarDesc")}</p>
                  </CardContent>
                </Card>
              </div>
            }
            advanced={
              <Card className="h-[260px] sm:h-[320px] md:h-[380px] flex flex-col">
                <CardHeader>
                  <CardTitle>{t("risk.dist")}</CardTitle>
                  <CardDescription>{t("risk.distDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                  <ClientOnlyChart ariaLabel={`${t("risk.dist")}. ${t("risk.distDesc")}`}>
                    {({ width, height }) => (
                      <AreaChart width={width} height={height} data={chartData}>
                        <defs>
                          <linearGradient id="colorProb" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset={`${tailGradientOffset}%`} stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop
                              offset={`${tailGradientOffset}%`}
                              stopColor="hsl(var(--destructive))"
                              stopOpacity={0.5}
                            />
                            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                          </linearGradient>
                          <linearGradient id="strokeProb" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                            <stop offset={`${tailGradientOffset}%`} stopColor="hsl(var(--primary))" stopOpacity={1} />
                            <stop
                              offset={`${tailGradientOffset}%`}
                              stopColor="hsl(var(--destructive))"
                              stopOpacity={1}
                            />
                            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                          type="number"
                          dataKey="loss"
                          domain={["dataMin", "dataMax"]}
                          tickFormatter={(v) => formatCurrency(v)}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          minTickGap={22}
                        />
                        <YAxis hide />
                        <Tooltip
                          labelFormatter={(value) => formatCurrency(Number(value))}
                          formatter={(value) => Number(value ?? 0).toFixed(4)}
                        />
                        <Area
                          type="monotone"
                          dataKey="prob"
                          stroke="url(#strokeProb)"
                          fillOpacity={1}
                          fill="url(#colorProb)"
                        />
                        <ReferenceLine
                          x={metrics?.valueAtRisk ?? 0}
                          ifOverflow="extendDomain"
                          stroke="hsl(var(--destructive))"
                          strokeWidth={2}
                          label={{ value: "VaR", fill: "hsl(var(--destructive))", fontSize: 11 }}
                        />
                      </AreaChart>
                    )}
                  </ClientOnlyChart>
                </CardContent>
              </Card>
            }
          />
        </div>
      </div>
    </div>
  );
}
