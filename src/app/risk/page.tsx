"use client";

import { useState, useMemo } from "react";
import { Finance } from "@/lib/finance-math"; // Assuming normPDF/CDF are here
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
    const result = RiskInputSchema.safeParse({
      value: parsedInputs.value ?? Number.NaN,
      volatility: parsedInputs.volatility ?? Number.NaN,
      confidence: parsedInputs.confidence ?? Number.NaN,
      days: parsedInputs.days ?? Number.NaN,
    });

    return result.success
      ? {}
      : Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
  }, [parsedInputs]);

  const hasValidationErrors = Object.keys(validation).length > 0;

  const metrics = useMemo(() => {
    if (hasValidationErrors) {
      return {
        VaR_val: Number.NaN,
        VaR_pct: Number.NaN,
        CVaR_val: Number.NaN,
        CVaR_pct: Number.NaN,
        sigmaHorizon: 0,
        z: 0,
      };
    }

    const P = parsedInputs.value ?? 0;
    const sigmaAnnual = (parsedInputs.volatility ?? 0) / 100;
    const conf = parsedInputs.confidence ?? 0.95;
    const d = parsedInputs.days ?? 1;

    // Scale volatility to horizon
    const sigmaHorizon = sigmaAnnual * Math.sqrt(d / 252);

    // Precise z-score via inverse normal CDF (Beasley-Springer-Moro algorithm)
    const z = Finance.normCDFInverse(conf);

    const VaR_pct = z * sigmaHorizon;
    const VaR_val = P * VaR_pct;

    const alpha = 1 - conf;
    const es_factor = Finance.normPDF(z) / alpha;
    const CVaR_pct = es_factor * sigmaHorizon;
    const CVaR_val = P * CVaR_pct;

    return { VaR_val, VaR_pct, CVaR_val, CVaR_pct, sigmaHorizon, z };
  }, [hasValidationErrors, parsedInputs]);

  // Generate Distribution Curve
  const chartData = useMemo(() => {
    const data: { dev: number; return: number; loss: number; prob: number; isTail: boolean }[] = [];
    if (hasValidationErrors) {
      return data;
    }
    const sigma = metrics.sigmaHorizon;
    const P = parsedInputs.value ?? 0;
    const tailZ = metrics.z; // precise z from normCDFInverse, matches confidence level
    // Show range from -4 std dev to +4 std dev
    for (let i = -4; i <= 4; i += 0.1) {
      const ret = i * sigma;
      const prob = Finance.normPDF(i); // pdf of standard normal
      const loss = -ret * P;

      data.push({
        dev: i,
        return: ret,
        loss: loss,
        prob: prob,
        isTail: i < -tailZ, // dynamically matches current confidence level
      });
    }
    return data;
  }, [hasValidationErrors, metrics, parsedInputs]);

  useHistoryRecorder({
    addToHistory,
    inputs: { value, volatility, confidence, days },
    result: metrics.VaR_val,
    label: t("risk.var"),
    enabled: hasInteracted && !hasValidationErrors,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("risk.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("risk.subtitle")}</p>
        </div>
        <HistoryPanel
          page="risk"
          onRestore={(inputs) => {
            if (inputs.value !== undefined) setValue(String(inputs.value));
            if (inputs.volatility !== undefined) setVolatility(String(inputs.volatility));
            if (inputs.confidence !== undefined) setConfidence(String(inputs.confidence));
            if (inputs.days !== undefined) setDays(String(inputs.days));
            setHasInteracted(true);
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
              />
              <ValidationError error={validation.value as string | null} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-volatility">{t("risk.vol")}</Label>
              <Input
                id="risk-volatility"
                value={volatility}
                onChange={(e) => updateField(setVolatility)(e.target.value)}
                type="number"
                min="0"
              />
              <ValidationError error={validation.volatility as string | null} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-days">{t("risk.horizon")}</Label>
              <Input
                id="risk-days"
                value={days}
                onChange={(e) => updateField(setDays)(e.target.value)}
                type="number"
                min="1"
              />
              <ValidationError error={validation.days as string | null} />
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
            isReady={!hasValidationErrors}
            emptyTitle={t("risk.title")}
            emptyDescription={Object.values(validation)[0] as string | undefined}
            actions={
              !hasValidationErrors ? (
                <ResultActions
                  title={t("risk.title")}
                  results={{
                    [t("risk.var")]: metrics.VaR_val,
                    [t("risk.cvar")]: metrics.CVaR_val,
                    [t("risk.vol")]: `${(metrics.sigmaHorizon * 100).toFixed(2)}%`,
                  }}
                  inputs={{ value, volatility, confidence, days }}
                  shareUrl={shareUrl}
                  exportData={chartData as unknown as Record<string, unknown>[]}
                  exportJson={metrics}
                  pdfElementId="risk-report-content"
                  pdfFilename="risk-analysis"
                  pdfTitle={t("risk.title")}
                />
              ) : null
            }
            summary={
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium uppercase">
                      {t("risk.var")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-destructive break-all">
                      {formatCurrency(metrics.VaR_val)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(metrics.VaR_val)} ({(metrics.VaR_pct * 100).toFixed(2)}% {t("risk.varDesc")})
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium uppercase">
                      {t("risk.cvar")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-destructive break-all">
                      {formatCurrency(metrics.CVaR_val)}
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
                  <ClientOnlyChart>
                    {({ width, height }) => (
                      <AreaChart width={width} height={height} data={chartData}>
                        <defs>
                          <linearGradient id="colorProb" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                            <stop
                              offset={`${Math.max(0, Math.min(100, ((4 - metrics.z) / 8) * 100))}%`}
                              stopColor="hsl(var(--destructive))"
                              stopOpacity={0.5}
                            />
                            <stop
                              offset={`${Math.max(0, Math.min(100, ((4 - metrics.z) / 8) * 100))}%`}
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0.3}
                            />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          </linearGradient>
                          <linearGradient id="strokeProb" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={1} />
                            <stop
                              offset={`${Math.max(0, Math.min(100, ((4 - metrics.z) / 8) * 100))}%`}
                              stopColor="hsl(var(--destructive))"
                              stopOpacity={1}
                            />
                            <stop
                              offset={`${Math.max(0, Math.min(100, ((4 - metrics.z) / 8) * 100))}%`}
                              stopColor="hsl(var(--primary))"
                              stopOpacity={1}
                            />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="loss"
                          tickFormatter={(v) => formatCurrency(v)}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          minTickGap={22}
                        />
                        <YAxis hide />
                        <Tooltip labelFormatter={() => ""} formatter={(v: number) => v.toFixed(4)} />
                        <Area
                          type="monotone"
                          dataKey="prob"
                          stroke="url(#strokeProb)"
                          fillOpacity={1}
                          fill="url(#colorProb)"
                        />
                        <ReferenceLine
                          x={metrics.VaR_val}
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
