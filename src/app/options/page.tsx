"use client";

import { useState, useMemo } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { useLanguage } from "@/lib/i18n";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { HistoryPanel } from "@/components/history-panel";
import { ClientOnlyChart } from "@/components/client-only-chart";
import { ResultShell } from "@/components/result-shell";
import { ResultActions } from "@/components/result-actions";
import { parseOptionalNumber } from "@/lib/input-utils";
import { OptionsInputSchema } from "@/lib/validation";
import { ErrorDisplay, ValidationError } from "@/components/ui/error-display";

export default function OptionsPage() {
  const { t } = useLanguage();
  const [spot, setSpot] = useState("100");
  const [strike, setStrike] = useState("100");
  const [time, setTime] = useState("1"); // Years
  const [rate, setRate] = useState("5"); // %
  const [volatility, setVolatility] = useState("20"); // %
  const [hasInteracted, setHasInteracted] = useState(false);

  const parsedInputs = useMemo(
    () => ({
      S: parseOptionalNumber(spot),
      K: parseOptionalNumber(strike),
      t: parseOptionalNumber(time),
      r: parseOptionalNumber(rate),
      sigma: parseOptionalNumber(volatility),
    }),
    [rate, spot, strike, time, volatility]
  );

  const validation = useMemo(() => {
    const result = OptionsInputSchema.safeParse({
      S: parsedInputs.S ?? Number.NaN,
      K: parsedInputs.K ?? Number.NaN,
      t: parsedInputs.t ?? Number.NaN,
      r: (parsedInputs.r ?? Number.NaN) / 100,
      sigma: (parsedInputs.sigma ?? Number.NaN) / 100,
    });

    return result.success
      ? {}
      : Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
  }, [parsedInputs]);

  const hasValidationErrors = Object.keys(validation).length > 0;

  const results = useMemo(() => {
    if (hasValidationErrors) {
      const emptyGreeks = { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
      return { callPrice: Number.NaN, putPrice: Number.NaN, callGreeks: emptyGreeks, putGreeks: emptyGreeks };
    }

    const S = parsedInputs.S ?? 0;
    const K = parsedInputs.K ?? 0;
    const tm = parsedInputs.t ?? 0;
    const r = (parsedInputs.r ?? 0) / 100;
    const sigma = (parsedInputs.sigma ?? 0) / 100;

    const callPrice = Finance.blackScholes("call", S, K, tm, r, sigma);
    const putPrice = Finance.blackScholes("put", S, K, tm, r, sigma);

    const callGreeks = Finance.greeks("call", S, K, tm, r, sigma);
    const putGreeks = Finance.greeks("put", S, K, tm, r, sigma);

    return { callPrice, putPrice, callGreeks, putGreeks };
  }, [hasValidationErrors, parsedInputs]);

  const { addToHistory } = useCalculationHistory({ page: "options" });

  useHistoryRecorder({
    addToHistory,
    inputs: { spot, strike, time, rate, volatility },
    result: hasValidationErrors ? Number.NaN : results.callPrice,
    label: t("options.callPrice"),
    enabled: hasInteracted && !hasValidationErrors,
  });

  // Payoff Diagram (Price vs Spot)
  const chartData = useMemo(() => {
    if (hasValidationErrors || parsedInputs.S === null || parsedInputs.K === null) {
      return [];
    }

    const K = parsedInputs.K;
    const S_center = parsedInputs.S;
    const data = [];
    for (let s = S_center * 0.5; s <= S_center * 1.5; s += S_center * 0.05) {
      data.push({
        spot: s,
        intrinsicCall: Math.max(s - K, 0),
        intrinsicPut: Math.max(K - s, 0),
      });
    }
    return data;
  }, [hasValidationErrors, parsedInputs]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("options.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("options.subtitle")}</p>
          </div>
        </div>

        <div id="options-report-content" className="grid gap-6 lg:grid-cols-12">
          {/* Inputs */}
          <Card className="lg:col-span-4 h-fit">
            <CardHeader>
              <CardTitle>{t("options.params")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasValidationErrors && (
                <ErrorDisplay message={Object.values(validation)[0] as string} variant="warning" />
              )}
              <div className="space-y-2">
                <Label htmlFor="opt-spot">{t("options.spot")}</Label>
                <Input
                  id="opt-spot"
                  value={spot}
                  onChange={(e) => {
                    setHasInteracted(true);
                    setSpot(e.target.value);
                  }}
                  type="number"
                  min="0"
                />
                <ValidationError error={validation.S as string | null} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opt-strike">{t("options.strike")}</Label>
                <Input
                  id="opt-strike"
                  value={strike}
                  onChange={(e) => {
                    setHasInteracted(true);
                    setStrike(e.target.value);
                  }}
                  type="number"
                  min="0"
                />
                <ValidationError error={validation.K as string | null} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opt-time">{t("options.time")}</Label>
                <Input
                  id="opt-time"
                  value={time}
                  onChange={(e) => {
                    setHasInteracted(true);
                    setTime(e.target.value);
                  }}
                  type="number"
                  min="0"
                  step="0.1"
                />
                <ValidationError error={validation.t as string | null} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opt-rate">{t("options.rate")}</Label>
                <Input
                  id="opt-rate"
                  value={rate}
                  onChange={(e) => {
                    setHasInteracted(true);
                    setRate(e.target.value);
                  }}
                  type="number"
                  step="0.1"
                />
                <ValidationError error={validation.r as string | null} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opt-vol">{t("options.vol")}</Label>
                <Input
                  id="opt-vol"
                  value={volatility}
                  onChange={(e) => {
                    setHasInteracted(true);
                    setVolatility(e.target.value);
                  }}
                  type="number"
                  min="0"
                  step="1"
                />
                <ValidationError error={validation.sigma as string | null} />
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-8">
            <ResultShell
              title={t("common.result")}
              description={t("options.subtitle")}
              isReady={!hasValidationErrors}
              emptyTitle={t("options.title")}
              emptyDescription={Object.values(validation)[0] as string | undefined}
              actions={
                !hasValidationErrors ? (
                  <ResultActions
                    title={t("options.title")}
                    results={{ [t("options.call")]: results.callPrice, [t("options.put")]: results.putPrice }}
                    inputs={{ spot, strike, time, rate, volatility }}
                    exportData={chartData as unknown as Record<string, unknown>[]}
                    exportJson={results}
                    pdfElementId="options-report-content"
                    pdfFilename="options-analysis"
                    pdfTitle={t("options.title")}
                  />
                ) : null
              }
              summary={
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Call Option */}
                  <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-primary">{t("options.call")}</CardTitle>
                      <CardDescription>{t("options.buy")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-4">{formatCurrency(results.callPrice)}</div>
                      <div className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2 sm:gap-x-4">
                        <div className="flex justify-between">
                          <span>{t("options.greeks.delta")}</span>
                          <span className="font-mono">{results.callGreeks.delta.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("options.greeks.gamma")}</span>
                          <span className="font-mono">{results.callGreeks.gamma.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("options.greeks.theta")}</span>
                          <span className="font-mono">{results.callGreeks.theta.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("options.greeks.vega")}</span>
                          <span className="font-mono">{results.callGreeks.vega.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("options.greeks.rho")}</span>
                          <span className="font-mono">{results.callGreeks.rho.toFixed(4)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Put Option */}
                  <Card className="border-l-4 border-l-destructive">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-destructive">{t("options.put")}</CardTitle>
                      <CardDescription>{t("options.sell")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-4">{formatCurrency(results.putPrice)}</div>
                      <div className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2 sm:gap-x-4">
                        <div className="flex justify-between">
                          <span>{t("options.greeks.delta")}</span>
                          <span className="font-mono">{results.putGreeks.delta.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("options.greeks.gamma")}</span>
                          <span className="font-mono">{results.putGreeks.gamma.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("options.greeks.theta")}</span>
                          <span className="font-mono">{results.putGreeks.theta.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("options.greeks.vega")}</span>
                          <span className="font-mono">{results.putGreeks.vega.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("options.greeks.rho")}</span>
                          <span className="font-mono">{results.putGreeks.rho.toFixed(4)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              }
              advanced={
                <Card className="h-[250px] sm:h-[320px] flex flex-col" id="options-chart-content">
                  <CardHeader>
                    <CardTitle>{t("options.payoff")}</CardTitle>
                    <CardDescription>{t("options.intrinsic")}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0">
                    <ClientOnlyChart>
                      {({ width, height }) => (
                        <LineChart
                          width={width}
                          height={height}
                          data={chartData}
                          margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="spot"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            minTickGap={18}
                            tickFormatter={(v) => v.toFixed(0)}
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                            formatter={(v: number) => formatCurrency(v)}
                          />
                          <ReferenceLine
                            x={parsedInputs.K ?? 0}
                            stroke="hsl(var(--muted-foreground))"
                            strokeDasharray="3 3"
                            label="K"
                          />
                          <Line
                            type="monotone"
                            dataKey="intrinsicCall"
                            stroke="hsl(var(--primary))"
                            name={t("options.call")}
                            dot={false}
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="intrinsicPut"
                            stroke="hsl(var(--destructive))"
                            name={t("options.put")}
                            dot={false}
                            strokeWidth={2}
                          />
                        </LineChart>
                      )}
                    </ClientOnlyChart>
                  </CardContent>
                </Card>
              }
            />
          </div>
        </div>
      </div>
      <HistoryPanel
        page="options"
        onRestore={(inputs) => {
          if (inputs.spot !== undefined) setSpot(String(inputs.spot));
          if (inputs.strike !== undefined) setStrike(String(inputs.strike));
          if (inputs.time !== undefined) setTime(String(inputs.time));
          if (inputs.rate !== undefined) setRate(String(inputs.rate));
          if (inputs.volatility !== undefined) setVolatility(String(inputs.volatility));
        }}
      />
    </>
  );
}
