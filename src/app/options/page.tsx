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
import { useShareableUrl } from "@/hooks/use-shareable-url";
import { buildOptionPayoffData, getOptionPayoffDomain } from "@/lib/chart-data";
import { ImpliedVolatilityInputSchema } from "@/lib/validation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResetDefaultsButton } from "@/components/reset-defaults-button";

const DEFAULT_OPTION_INPUTS = {
  spot: "100",
  strike: "100",
  time: "1",
  rate: "5",
  dividendYield: "0",
  volatility: "20",
  impliedOptionType: "call" as const,
  marketPrice: "10",
};

export default function OptionsPage() {
  const { t } = useLanguage();
  const [spot, setSpot] = useState(DEFAULT_OPTION_INPUTS.spot);
  const [strike, setStrike] = useState(DEFAULT_OPTION_INPUTS.strike);
  const [time, setTime] = useState(DEFAULT_OPTION_INPUTS.time); // Years
  const [rate, setRate] = useState(DEFAULT_OPTION_INPUTS.rate); // %
  const [dividendYield, setDividendYield] = useState(DEFAULT_OPTION_INPUTS.dividendYield); // %
  const [volatility, setVolatility] = useState(DEFAULT_OPTION_INPUTS.volatility); // %
  const [impliedOptionType, setImpliedOptionType] = useState<"call" | "put">(DEFAULT_OPTION_INPUTS.impliedOptionType);
  const [marketPrice, setMarketPrice] = useState(DEFAULT_OPTION_INPUTS.marketPrice);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasImpliedInteracted, setHasImpliedInteracted] = useState(false);
  const shareUrl = useShareableUrl({
    prefix: "options",
    state: { spot, strike, time, rate, dividendYield, volatility, impliedOptionType, marketPrice },
    onRestore: (inputs) => {
      if (inputs.spot !== undefined) setSpot(String(inputs.spot));
      if (inputs.strike !== undefined) setStrike(String(inputs.strike));
      if (inputs.time !== undefined) setTime(String(inputs.time));
      if (inputs.rate !== undefined) setRate(String(inputs.rate));
      setDividendYield(inputs.dividendYield !== undefined ? String(inputs.dividendYield) : "0");
      if (inputs.volatility !== undefined) setVolatility(String(inputs.volatility));
      setImpliedOptionType(inputs.impliedOptionType === "put" ? "put" : "call");
      setMarketPrice(inputs.marketPrice !== undefined ? String(inputs.marketPrice) : "10");
      setHasInteracted(false);
      setHasImpliedInteracted(false);
    },
  });

  const resetDefaults = () => {
    const previous = {
      spot,
      strike,
      time,
      rate,
      dividendYield,
      volatility,
      impliedOptionType,
      marketPrice,
      hasInteracted,
      hasImpliedInteracted,
    };
    setSpot(DEFAULT_OPTION_INPUTS.spot);
    setStrike(DEFAULT_OPTION_INPUTS.strike);
    setTime(DEFAULT_OPTION_INPUTS.time);
    setRate(DEFAULT_OPTION_INPUTS.rate);
    setDividendYield(DEFAULT_OPTION_INPUTS.dividendYield);
    setVolatility(DEFAULT_OPTION_INPUTS.volatility);
    setImpliedOptionType(DEFAULT_OPTION_INPUTS.impliedOptionType);
    setMarketPrice(DEFAULT_OPTION_INPUTS.marketPrice);
    setHasInteracted(false);
    setHasImpliedInteracted(false);
    return () => {
      setSpot(previous.spot);
      setStrike(previous.strike);
      setTime(previous.time);
      setRate(previous.rate);
      setDividendYield(previous.dividendYield);
      setVolatility(previous.volatility);
      setImpliedOptionType(previous.impliedOptionType);
      setMarketPrice(previous.marketPrice);
      setHasInteracted(previous.hasInteracted);
      setHasImpliedInteracted(previous.hasImpliedInteracted);
    };
  };

  const parsedInputs = useMemo(
    () => ({
      S: parseOptionalNumber(spot),
      K: parseOptionalNumber(strike),
      t: parseOptionalNumber(time),
      r: parseOptionalNumber(rate),
      q: parseOptionalNumber(dividendYield),
      sigma: parseOptionalNumber(volatility),
      marketPrice: parseOptionalNumber(marketPrice),
    }),
    [dividendYield, marketPrice, rate, spot, strike, time, volatility]
  );

  const validation = useMemo(() => {
    const messages = {
      S: t("options.validation.spotPositive"),
      K: t("options.validation.strikePositive"),
      t: t("options.validation.timeRange"),
      r: t("options.validation.rateRange"),
      q: t("options.validation.dividendYieldRange"),
      sigma: t("options.validation.volatilityRange"),
    } as const;
    const result = OptionsInputSchema.safeParse({
      S: parsedInputs.S ?? Number.NaN,
      K: parsedInputs.K ?? Number.NaN,
      t: parsedInputs.t ?? Number.NaN,
      r: (parsedInputs.r ?? Number.NaN) / 100,
      q: (parsedInputs.q ?? Number.NaN) / 100,
      sigma: (parsedInputs.sigma ?? Number.NaN) / 100,
    });

    return result.success
      ? {}
      : Object.fromEntries(
          result.error.issues.map((issue) => {
            const field = String(issue.path[0]) as keyof typeof messages;
            return [field, messages[field] ?? t("options.validation.invalidInputs")];
          })
        );
  }, [parsedInputs, t]);

  const hasValidationErrors = Object.keys(validation).length > 0;

  const impliedAnalysis = useMemo(() => {
    const messages = {
      S: t("options.validation.spotPositive"),
      K: t("options.validation.strikePositive"),
      t: t("options.validation.timeRange"),
      r: t("options.validation.rateRange"),
      q: t("options.validation.dividendYieldRange"),
      type: t("options.validation.optionType"),
      marketPrice: t("options.validation.marketPriceRange"),
    } as const;
    const parsed = ImpliedVolatilityInputSchema.safeParse({
      S: parsedInputs.S ?? Number.NaN,
      K: parsedInputs.K ?? Number.NaN,
      t: parsedInputs.t ?? Number.NaN,
      r: (parsedInputs.r ?? Number.NaN) / 100,
      q: (parsedInputs.q ?? Number.NaN) / 100,
      type: impliedOptionType,
      marketPrice: parsedInputs.marketPrice ?? Number.NaN,
    });

    if (!parsed.success) {
      return {
        value: Number.NaN,
        errors: Object.fromEntries(
          parsed.error.issues.map((issue) => {
            const field = String(issue.path[0]) as keyof typeof messages;
            return [field, messages[field] ?? t("options.validation.invalidInputs")];
          })
        ),
      };
    }

    const value = Finance.impliedVolatility(
      parsed.data.type,
      parsed.data.S,
      parsed.data.K,
      parsed.data.t,
      parsed.data.r,
      parsed.data.marketPrice,
      parsed.data.q
    );
    return Number.isFinite(value)
      ? { value, errors: {} }
      : { value: Number.NaN, errors: { marketPrice: t("options.validation.marketPriceRange") } };
  }, [impliedOptionType, parsedInputs, t]);
  const impliedReady = Number.isFinite(impliedAnalysis.value) && Object.keys(impliedAnalysis.errors).length === 0;

  const results = useMemo(() => {
    if (hasValidationErrors) {
      const emptyGreeks = {
        delta: Number.NaN,
        gamma: Number.NaN,
        theta: Number.NaN,
        vega: Number.NaN,
        rho: Number.NaN,
      };
      return { callPrice: Number.NaN, putPrice: Number.NaN, callGreeks: emptyGreeks, putGreeks: emptyGreeks };
    }

    const S = parsedInputs.S ?? 0;
    const K = parsedInputs.K ?? 0;
    const tm = parsedInputs.t ?? 0;
    const r = (parsedInputs.r ?? 0) / 100;
    const q = (parsedInputs.q ?? 0) / 100;
    const sigma = (parsedInputs.sigma ?? 0) / 100;

    const callPrice = Finance.blackScholes("call", S, K, tm, r, sigma, q);
    const putPrice = Finance.blackScholes("put", S, K, tm, r, sigma, q);

    const callGreeks = Finance.greeks("call", S, K, tm, r, sigma, q);
    const putGreeks = Finance.greeks("put", S, K, tm, r, sigma, q);

    return { callPrice, putPrice, callGreeks, putGreeks };
  }, [hasValidationErrors, parsedInputs]);
  const resultReady = !hasValidationErrors && Number.isFinite(results.callPrice) && Number.isFinite(results.putPrice);
  const formatGreek = (value: number) => (Number.isFinite(value) ? value.toFixed(4) : t("common.notAvailable"));
  const exportResults = useMemo(() => {
    const serializeGreeks = (greeks: typeof results.callGreeks) =>
      Object.fromEntries(
        Object.entries(greeks).map(([key, value]) => [key, Number.isFinite(value) ? value : t("common.notAvailable")])
      );

    return {
      callPrice: results.callPrice,
      putPrice: results.putPrice,
      callGreeks: serializeGreeks(results.callGreeks),
      putGreeks: serializeGreeks(results.putGreeks),
      ...(impliedReady ? { impliedVolatility: impliedAnalysis.value } : {}),
    };
  }, [impliedAnalysis.value, impliedReady, results, t]);

  const reportResults = useMemo(
    () => ({
      [t("options.call")]: results.callPrice,
      [t("options.put")]: results.putPrice,
      ...(impliedReady ? { [t("options.impliedVolatility")]: `${(impliedAnalysis.value * 100).toFixed(2)}%` } : {}),
    }),
    [impliedAnalysis.value, impliedReady, results.callPrice, results.putPrice, t]
  );

  const { addToHistory } = useCalculationHistory({ page: "options" });

  useHistoryRecorder({
    addToHistory,
    inputs: { spot, strike, time, rate, dividendYield, volatility },
    result: hasValidationErrors ? Number.NaN : results.callPrice,
    label: t("options.callPrice"),
    resultFormat: "currency",
    enabled: hasInteracted && resultReady,
  });

  useHistoryRecorder({
    addToHistory,
    inputs: { spot, strike, time, rate, dividendYield, impliedOptionType, marketPrice },
    result: impliedAnalysis.value,
    label: `${t("options.impliedVolatility")} (${t(`options.${impliedOptionType}`)})`,
    resultFormat: "percentDecimal",
    enabled: hasImpliedInteracted && impliedReady,
  });

  // Payoff Diagram (Price vs Spot)
  const chartData = useMemo(() => {
    if (!resultReady || parsedInputs.S === null || parsedInputs.K === null) {
      return [];
    }

    return buildOptionPayoffData(parsedInputs.S, parsedInputs.K);
  }, [parsedInputs, resultReady]);
  const chartSpotDomain = useMemo(
    () => getOptionPayoffDomain(parsedInputs.S ?? 0, parsedInputs.K ?? 0),
    [parsedInputs.K, parsedInputs.S]
  );

  return (
    <>
      <div className="page-stack" data-tone="rose">
        <div className="page-header">
          <div>
            <h1 className="page-title">{t("options.title")}</h1>
            <p className="page-description">{t("options.subtitle")}</p>
          </div>
          <div className="page-actions">
            <ResetDefaultsButton urlPrefix="options" onReset={resetDefaults} />
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
                  aria-invalid={Boolean(validation.S)}
                  aria-describedby={validation.S ? "opt-spot-error" : undefined}
                />
                <ValidationError id="opt-spot-error" error={validation.S as string | null} />
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
                  aria-invalid={Boolean(validation.K)}
                  aria-describedby={validation.K ? "opt-strike-error" : undefined}
                />
                <ValidationError id="opt-strike-error" error={validation.K as string | null} />
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
                  aria-invalid={Boolean(validation.t)}
                  aria-describedby={validation.t ? "opt-time-error" : undefined}
                />
                <ValidationError id="opt-time-error" error={validation.t as string | null} />
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
                  aria-invalid={Boolean(validation.r)}
                  aria-describedby={validation.r ? "opt-rate-error" : undefined}
                />
                <ValidationError id="opt-rate-error" error={validation.r as string | null} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opt-dividend-yield">{t("options.dividendYield")}</Label>
                <Input
                  id="opt-dividend-yield"
                  value={dividendYield}
                  onChange={(e) => {
                    setHasInteracted(true);
                    setDividendYield(e.target.value);
                  }}
                  type="number"
                  step="0.1"
                  aria-invalid={Boolean(validation.q)}
                  aria-describedby={validation.q ? "opt-dividend-yield-error" : undefined}
                />
                <ValidationError id="opt-dividend-yield-error" error={validation.q as string | null} />
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
                  aria-invalid={Boolean(validation.sigma)}
                  aria-describedby={validation.sigma ? "opt-vol-error" : undefined}
                />
                <ValidationError id="opt-vol-error" error={validation.sigma as string | null} />
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold">{t("options.impliedVolatility")}</h3>
                <div className="space-y-2">
                  <Label id="opt-implied-type-label" htmlFor="opt-implied-type">
                    {t("options.optionType")}
                  </Label>
                  <Select
                    value={impliedOptionType}
                    onValueChange={(value: "call" | "put") => {
                      setHasImpliedInteracted(true);
                      setImpliedOptionType(value);
                    }}
                  >
                    <SelectTrigger id="opt-implied-type" className="w-full" aria-labelledby="opt-implied-type-label">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">{t("options.call")}</SelectItem>
                      <SelectItem value="put">{t("options.put")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opt-market-price">{t("options.marketPrice")}</Label>
                  <Input
                    id="opt-market-price"
                    value={marketPrice}
                    onChange={(event) => {
                      setHasImpliedInteracted(true);
                      setMarketPrice(event.target.value);
                    }}
                    type="number"
                    min="0"
                    step="0.01"
                    aria-invalid={Boolean(impliedAnalysis.errors.marketPrice)}
                    aria-describedby={impliedAnalysis.errors.marketPrice ? "opt-market-price-error" : undefined}
                  />
                  <ValidationError
                    id="opt-market-price-error"
                    error={impliedAnalysis.errors.marketPrice as string | null}
                  />
                </div>
                <div
                  className="flex items-baseline justify-between gap-3 border-t pt-3"
                  role="status"
                  aria-live="polite"
                >
                  <span className="text-sm text-muted-foreground">{t("options.impliedVolatility")}</span>
                  <strong className="text-xl" data-implied-volatility-result>
                    {impliedReady ? `${(impliedAnalysis.value * 100).toFixed(2)}%` : t("common.notAvailable")}
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-8">
            <ResultShell
              title={t("common.result")}
              description={t("options.subtitle")}
              isReady={resultReady}
              emptyTitle={t("options.title")}
              emptyDescription={Object.values(validation)[0] as string | undefined}
              actions={
                resultReady ? (
                  <ResultActions
                    title={t("options.title")}
                    results={reportResults}
                    inputs={{
                      spot,
                      strike,
                      time,
                      rate,
                      dividendYield,
                      volatility,
                      impliedOptionType,
                      marketPrice,
                    }}
                    displayInputs={{
                      spot,
                      strike,
                      time,
                      rate,
                      dividendYield,
                      volatility,
                      impliedOptionType: impliedOptionType === "call" ? t("options.call") : t("options.put"),
                      marketPrice,
                    }}
                    inputLabels={{
                      spot: t("options.spot"),
                      strike: t("options.strike"),
                      time: t("options.time"),
                      rate: t("options.rate"),
                      dividendYield: t("options.dividendYield"),
                      volatility: t("options.vol"),
                      impliedOptionType: t("options.optionType"),
                      marketPrice: t("options.marketPrice"),
                    }}
                    shareUrl={shareUrl}
                    exportData={chartData as unknown as Record<string, unknown>[]}
                    exportJson={exportResults}
                    pdfElementId="options-report-content"
                    pdfFilename="options-analysis"
                    pdfTitle={t("options.title")}
                  />
                ) : null
              }
              summary={
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Call Option */}
                  <Card variant="result">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-primary">{t("options.call")}</CardTitle>
                      <CardDescription>{t("options.buy")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 break-words text-3xl font-bold">{formatCurrency(results.callPrice)}</div>
                      <div className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2 sm:gap-x-4">
                        <div className="flex justify-between gap-3">
                          <span className="min-w-0">{t("options.greeks.delta")}</span>
                          <span className="font-mono">{formatGreek(results.callGreeks.delta)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="min-w-0">{t("options.greeks.gamma")}</span>
                          <span className="font-mono">{formatGreek(results.callGreeks.gamma)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="min-w-0">{t("options.greeks.theta")}</span>
                          <span className="font-mono">{formatGreek(results.callGreeks.theta)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="min-w-0">{t("options.greeks.vega")}</span>
                          <span className="font-mono">{formatGreek(results.callGreeks.vega)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="min-w-0">{t("options.greeks.rho")}</span>
                          <span className="font-mono">{formatGreek(results.callGreeks.rho)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Put Option */}
                  <Card variant="result" className="!border-destructive/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-destructive">{t("options.put")}</CardTitle>
                      <CardDescription>{t("options.sell")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 break-words text-3xl font-bold">{formatCurrency(results.putPrice)}</div>
                      <div className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2 sm:gap-x-4">
                        <div className="flex justify-between gap-3">
                          <span className="min-w-0">{t("options.greeks.delta")}</span>
                          <span className="font-mono">{formatGreek(results.putGreeks.delta)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="min-w-0">{t("options.greeks.gamma")}</span>
                          <span className="font-mono">{formatGreek(results.putGreeks.gamma)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="min-w-0">{t("options.greeks.theta")}</span>
                          <span className="font-mono">{formatGreek(results.putGreeks.theta)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="min-w-0">{t("options.greeks.vega")}</span>
                          <span className="font-mono">{formatGreek(results.putGreeks.vega)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="min-w-0">{t("options.greeks.rho")}</span>
                          <span className="font-mono">{formatGreek(results.putGreeks.rho)}</span>
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
                    <ClientOnlyChart ariaLabel={`${t("options.payoff")}. ${t("options.intrinsic")}`}>
                      {({ width, height }) => (
                        <LineChart
                          width={width}
                          height={height}
                          data={chartData}
                          margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis
                            type="number"
                            dataKey="spot"
                            domain={chartSpotDomain}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            minTickGap={18}
                            tickFormatter={(v) => v.toFixed(0)}
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                            formatter={(value) => formatCurrency(Number(value ?? 0))}
                          />
                          <ReferenceLine
                            x={parsedInputs.K ?? 0}
                            ifOverflow="extendDomain"
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
          setDividendYield(inputs.dividendYield !== undefined ? String(inputs.dividendYield) : "0");
          if (inputs.volatility !== undefined) setVolatility(String(inputs.volatility));
          setImpliedOptionType(inputs.impliedOptionType === "put" ? "put" : "call");
          setMarketPrice(inputs.marketPrice !== undefined ? String(inputs.marketPrice) : "10");
          setHasInteracted(false);
          setHasImpliedInteracted(false);
        }}
      />
    </>
  );
}
