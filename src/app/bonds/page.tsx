"use client";

import { useMemo, useState } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/lib/i18n";
import { SensitivityHeatmap } from "@/components/sensitivity-heatmap";
import { ExportMenu } from "@/components/export-menu";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { HistoryPanel } from "@/components/history-panel";
import { ClientOnlyChart } from "@/components/client-only-chart";
import { ResponsiveDisclosure } from "@/components/responsive-disclosure";
import { parseOptionalNumber, parseRequiredNumber } from "@/lib/input-utils";
import { ErrorDisplay, ValidationError } from "@/components/ui/error-display";
import { BondInputSchema } from "@/lib/validation";
import { ResultShell } from "@/components/result-shell";
import { ResultActions } from "@/components/result-actions";

export default function BondsPage() {
  const { t } = useLanguage();
  const [showErrors, setShowErrors] = useState(false);
  const [faceValue, setFaceValue] = useState("1000");
  const [couponRate, setCouponRate] = useState("5");
  const [years, setYears] = useState("10");
  const [ytm, setYtm] = useState("4");
  const [frequency, setFrequency] = useState("2");

  const bondValidation = useMemo(() => {
    const result = BondInputSchema.safeParse({
      faceValue: parseOptionalNumber(faceValue) ?? Number.NaN,
      couponRate: parseOptionalNumber(couponRate) ?? Number.NaN,
      yearsToMaturity: parseOptionalNumber(years) ?? Number.NaN,
      ytm: parseOptionalNumber(ytm) ?? Number.NaN,
      frequency: parseOptionalNumber(frequency) ?? Number.NaN,
    });
    return result.success
      ? {}
      : Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
  }, [couponRate, faceValue, frequency, years, ytm]);

  const hasBondErrors = Object.keys(bondValidation).length > 0;

  const metrics = useMemo(() => {
    const fv = parseRequiredNumber(faceValue);
    const cr = parseRequiredNumber(couponRate) / 100;
    const time = parseRequiredNumber(years);
    const y = parseRequiredNumber(ytm) / 100;
    const freq = parseInt(frequency);

    const price = Finance.bondPrice(fv, cr, time, y, freq);
    const { macDuration, modDuration } = Finance.bondDuration(fv, cr, time, y, freq);
    const convexity = Finance.bondConvexity(fv, cr, time, y, freq);

    return { price, macDuration, modDuration, convexity };
  }, [faceValue, couponRate, years, ytm, frequency]);

  const { addToHistory } = useCalculationHistory({ page: "bonds" });

  useHistoryRecorder({
    addToHistory,
    inputs: { faceValue, couponRate, years, ytm, frequency },
    result: metrics.price,
    label: "Price",
  });

  // Generate Price-Yield Curve
  const chartData = useMemo(() => {
    const fv = parseRequiredNumber(faceValue);
    const cr = parseRequiredNumber(couponRate) / 100;
    const time = parseRequiredNumber(years);
    const freq = parseInt(frequency);

    // Generate yields from 0% to 15%
    const data = [];
    for (let i = 0; i <= 15; i += 0.5) {
      const y = i / 100;
      if (y === 0) continue;
      const p = Finance.bondPrice(fv, cr, time, y, freq);
      data.push({ yield: i, price: p });
    }
    return data;
  }, [faceValue, couponRate, years, frequency]);

  // Generate sensitivity data grid for Price Sensitivity heatmap
  // YTM values (columns): [2%, 3%, 4%, 5%, 6%]
  // Years (rows): [1, 5, 10, 15, 20]
  const sensitivityData = useMemo(() => {
    const fv = parseRequiredNumber(faceValue);
    const cr = parseRequiredNumber(couponRate) / 100;
    const freq = parseInt(frequency);

    const ytms = [2, 3, 4, 5, 6]; // in percent
    const yrs = [1, 5, 10, 15, 20];

    const data: number[][] = [];
    for (let r = 0; r < yrs.length; r++) {
      const t = yrs[r];
      const row: number[] = [];
      for (let c = 0; c < ytms.length; c++) {
        const y = ytms[c] / 100; // convert to decimal
        const p = Finance.bondPrice(fv, cr, t, y, freq);
        row.push(p);
      }
      data.push(row);
    }
    return data;
  }, [faceValue, couponRate, frequency]);

  const rowLabels = ["1 yr", "5 yrs", "10 yrs", "15 yrs", "20 yrs"];
  const colLabels = ["2%", "3%", "4%", "5%", "6%"];
  const formatCell = (v: number) => `$${v.toFixed(0)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("bonds.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("bonds.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <HistoryPanel
            page="bonds"
            onRestore={(inputs) => {
              if (inputs.faceValue) setFaceValue(String(inputs.faceValue));
              if (inputs.couponRate) setCouponRate(String(inputs.couponRate));
              if (inputs.years) setYears(String(inputs.years));
              if (inputs.ytm) setYtm(String(inputs.ytm));
              if (inputs.frequency) setFrequency(String(inputs.frequency));
            }}
          />
        </div>
      </div>

      {showErrors && hasBondErrors && <ErrorDisplay message={t("bonds.validation.invalidInputs")} variant="warning" />}

      <div id="bonds-report-content" className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-4 h-fit">
          <CardHeader>
            <CardTitle>{t("bonds.characteristics")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bond-face">{t("bonds.face")}</Label>
              <Input
                id="bond-face"
                value={faceValue}
                onChange={(e) => setFaceValue(e.target.value)}
                onBlur={() => setShowErrors(true)}
                type="number"
                aria-describedby="bond-face-help"
              />
              <ValidationError error={showErrors ? (bondValidation.faceValue as string | null) : null} />
              <p id="bond-face-help" className="sr-only">
                Face value of the bond, the amount paid at maturity.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bond-coupon">{t("bonds.coupon")}</Label>
              <Input
                id="bond-coupon"
                value={couponRate}
                onChange={(e) => setCouponRate(e.target.value)}
                onBlur={() => setShowErrors(true)}
                type="number"
                aria-describedby="bond-coupon-help"
              />
              <ValidationError error={showErrors ? (bondValidation.couponRate as string | null) : null} />
              <p id="bond-coupon-help" className="sr-only">
                Annual coupon rate expressed as a percentage of face value.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bond-ytm">{t("bonds.ytm")}</Label>
              <Input
                id="bond-ytm"
                value={ytm}
                onChange={(e) => setYtm(e.target.value)}
                onBlur={() => setShowErrors(true)}
                type="number"
                aria-describedby="bond-ytm-help"
              />
              <ValidationError error={showErrors ? (bondValidation.ytm as string | null) : null} />
              <p id="bond-ytm-help" className="sr-only">
                Yield to maturity, the overall expected return if the bond is held to maturity.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bond-years">{t("bonds.years")}</Label>
              <Input
                id="bond-years"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                onBlur={() => setShowErrors(true)}
                type="number"
                aria-describedby="bond-years-help"
              />
              <ValidationError error={showErrors ? (bondValidation.yearsToMaturity as string | null) : null} />
              <p id="bond-years-help" className="sr-only">
                Number of years until the bond matures.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bond-freq">{t("bonds.freq")}</Label>
              <Select
                value={frequency}
                onValueChange={(value) => {
                  setFrequency(value);
                  setShowErrors(true);
                }}
              >
                <SelectTrigger id="bond-freq" aria-describedby="bond-freq-help">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("bonds.freqOpts.annual")}</SelectItem>
                  <SelectItem value="2">{t("bonds.freqOpts.semi")}</SelectItem>
                  <SelectItem value="4">{t("bonds.freqOpts.quart")}</SelectItem>
                  <SelectItem value="12">{t("bonds.freqOpts.month")}</SelectItem>
                </SelectContent>
              </Select>
              <p id="bond-freq-help" className="sr-only">
                Coupon payment frequency per year: 1=annual, 2=semiannual, 4=quarterly, 12=monthly.
              </p>
              <ValidationError error={showErrors ? (bondValidation.frequency as string | null) : null} />
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-8">
          <ResultShell
            title={t("common.result")}
            description={t("bonds.subtitle")}
            isReady={!hasBondErrors}
            emptyTitle={t("bonds.metrics")}
            emptyDescription={t("bonds.validation.invalidInputs")}
            actions={
              !hasBondErrors ? (
                <ResultActions
                  title={t("bonds.title")}
                  results={{
                    [t("bonds.fairPrice")]: metrics.price,
                    [t("bonds.macDur")]: metrics.macDuration,
                    [t("bonds.modDur")]: metrics.modDuration,
                    [t("bonds.convexity")]: metrics.convexity,
                  }}
                  inputs={{ faceValue, couponRate, years, ytm, frequency }}
                  exportData={chartData}
                  exportJson={metrics}
                  pdfElementId="bonds-report-content"
                  pdfFilename={`bond-analysis-${years}yr`}
                  pdfTitle={t("bonds.title")}
                />
              ) : null
            }
            summary={
              <section aria-label="Bond calculation results">
                <h2 className="text-xl font-semibold mb-2">{t("bonds.metrics")}</h2>
                <div
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                  role="region"
                  aria-live="polite"
                  aria-label="Bond calculation results"
                >
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                        {t("bonds.fairPrice")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">{formatCurrency(metrics.price)}</div>
                      <p className="text-xs text-muted-foreground">
                        {metrics.price < parseRequiredNumber(faceValue) ? t("bonds.discount") : t("bonds.premium")}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                        {t("bonds.macDur")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">{`${metrics.macDuration.toFixed(2)} ${t("common.year")}`}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                        {t("bonds.modDur")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">{metrics.modDuration.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">{`Sens: ${(metrics.modDuration * 1).toFixed(2)}% / 1% ΔYield`}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                        {t("bonds.convexity")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">{metrics.convexity.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                </div>
              </section>
            }
            advanced={
              <div className="space-y-6" id="bonds-report-content">
                {/* Key Metrics Grid */}
                {/* Price-Yield Curve */}
                <ResponsiveDisclosure
                  title={t("bonds.curve")}
                  description={t("bonds.validation.curveDisclosure")}
                  defaultOpen={false}
                >
                  <Card className="h-[260px] sm:h-[320px] md:h-[380px] flex flex-col">
                    <CardHeader>
                      <CardTitle>{t("bonds.curve")}</CardTitle>
                      <CardDescription>{t("bonds.subtitle")}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                      <ClientOnlyChart>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                              dataKey="yield"
                              label={{ value: `${t("bonds.ytm")}`, position: "bottom", offset: 0 }}
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={10}
                              minTickGap={18}
                            />
                            <YAxis
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={10}
                              domain={["auto", "auto"]}
                              tickFormatter={(val) => `$${val}`}
                            />
                            <Tooltip
                              formatter={(value: number) => formatCurrency(value)}
                              labelFormatter={(l) => `Yield: ${l}%`}
                              contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="price"
                              stroke="hsl(var(--primary))"
                              strokeWidth={3}
                              dot={false}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ClientOnlyChart>
                    </CardContent>
                  </Card>
                </ResponsiveDisclosure>

                {/* Price Sensitivity Heatmap */}
                <ResponsiveDisclosure
                  title={t("bonds.priceSensitivity")}
                  description={t("bonds.validation.heatmapDisclosure")}
                  defaultOpen={false}
                >
                  <Card className="h-auto">
                    <CardHeader>
                      <CardTitle>{t("bonds.priceSensitivity")}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                      <SensitivityHeatmap
                        data={sensitivityData}
                        rowLabels={rowLabels}
                        colLabels={colLabels}
                        formatCell={formatCell}
                      />
                      <div className="grid gap-3 border-t border-white/10 p-4 sm:hidden">
                        <p className="text-sm font-semibold text-muted-foreground">
                          {t("bonds.validation.mobileHeatmapTitle")}
                        </p>
                        {rowLabels.map((rowLabel, rowIndex) => (
                          <div
                            key={rowLabel}
                            className="rounded-2xl border border-white/10 bg-background/30 p-3 space-y-2"
                          >
                            <p className="text-sm font-semibold">{rowLabel}</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {colLabels.map((colLabel, colIndex) => (
                                <div key={`${rowLabel}-${colLabel}`} className="rounded-xl bg-muted/40 px-3 py-2">
                                  <p className="text-xs text-muted-foreground">{colLabel}</p>
                                  <p className="font-mono font-medium">
                                    {formatCell(sensitivityData[rowIndex][colIndex])}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </ResponsiveDisclosure>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
