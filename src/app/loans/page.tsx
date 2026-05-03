"use client";

import { useMemo, Suspense, useState } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useLanguage } from "@/lib/i18n";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useUrlState } from "@/hooks/use-url-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ValidationError } from "@/components/ui/error-display";
import { ResultShell } from "@/components/result-shell";
import { ResultActions } from "@/components/result-actions";
import { parseOptionalNumber } from "@/lib/input-utils";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { HistoryPanel } from "@/components/history-panel";
import { LoanInputSchema } from "@/lib/validation";
import { VirtualTable } from "@/components/virtual-table";

function LoansPageContent() {
  const { t } = useLanguage();
  const {
    state: urlState,
    setField,
    shareUrl,
  } = useUrlState({
    defaultValues: {
      method: "CPM" as "CPM" | "CAM",
      amount: "500000",
      rate: "4.5",
      years: "30",
    },
    prefix: "loans",
  });

  const [hasInteracted, setHasInteracted] = useState(false);

  const method = urlState.method as "CPM" | "CAM";
  const setMethod = (v: "CPM" | "CAM") => {
    setHasInteracted(true);
    setField("method", v);
  };

  const amount = urlState.amount as string;
  const setAmount = (v: string) => {
    setHasInteracted(true);
    setField("amount", v);
  };

  const rate = urlState.rate as string;
  const setRate = (v: string) => {
    setHasInteracted(true);
    setField("rate", v);
  };

  const years = urlState.years as string;
  const setYears = (v: string) => {
    setHasInteracted(true);
    setField("years", v);
  };

  const parsedLoanInputs = useMemo(
    () => ({
      amount: parseOptionalNumber(amount),
      rate: parseOptionalNumber(rate),
      years: parseOptionalNumber(years),
    }),
    [amount, rate, years]
  );

  const loanValidation = useMemo(() => {
    const result = LoanInputSchema.safeParse({
      amount: parsedLoanInputs.amount ?? Number.NaN,
      rate: parsedLoanInputs.rate ?? Number.NaN,
      years: parsedLoanInputs.years ?? Number.NaN,
      method,
    });

    return result.success
      ? {}
      : Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
  }, [method, parsedLoanInputs]);

  const validationError = useMemo(() => {
    if (loanValidation.amount) return t("loans.errorPositiveAmount") || String(loanValidation.amount);
    if (loanValidation.rate) return t("loans.errorPositiveRate") || String(loanValidation.rate);
    if (loanValidation.years) return t("loans.errorPositiveYears") || String(loanValidation.years);
    if (loanValidation.method) return String(loanValidation.method);
    return null;
  }, [loanValidation, t]);

  const schedule = useMemo(() => {
    if (
      validationError ||
      parsedLoanInputs.amount === null ||
      parsedLoanInputs.rate === null ||
      parsedLoanInputs.years === null
    ) {
      return [];
    }

    const P = parsedLoanInputs.amount;
    const r = parsedLoanInputs.rate / 100 / 12;
    const n = Math.round(parsedLoanInputs.years * 12);

    if (P <= 0 || r < 0 || n <= 0) {
      return [];
    }

    return Finance.amortizationSchedule(P, r, n, method);
  }, [method, parsedLoanInputs, validationError]);

  const stats = useMemo(() => {
    if (!schedule.length)
      return { totalInterest: 0, totalPayment: 0, monthlyPayment: 0, firstPayment: 0, lastPayment: 0 };

    const totalPayment = schedule.reduce((acc, row) => acc + row.payment, 0);
    const totalInterest = schedule.reduce((acc, row) => acc + row.interest, 0);
    const monthlyPayment = schedule[0].payment;
    const firstPayment = schedule[0].payment;
    const lastPayment = schedule[schedule.length - 1].payment;

    return { totalInterest, totalPayment, monthlyPayment, firstPayment, lastPayment };
  }, [schedule]);

  const pieData = [
    { name: t("loans.principal"), value: parsedLoanInputs.amount ?? 0, color: "hsl(var(--primary))" },
    { name: t("loans.totalInt"), value: stats.totalInterest, color: "hsl(var(--destructive))" },
  ];

  const reportTitle = `${t("loans.title")} - ${method}`;
  const { addToHistory } = useCalculationHistory({ page: "loans" });

  useHistoryRecorder({
    addToHistory,
    inputs: { amount, rate, years, method },
    result: stats.totalPayment,
    label: t("loans.totalCost"),
    enabled: hasInteracted && !validationError && schedule.length > 0,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("loans.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("loans.subtitle")}</p>
        </div>
        <HistoryPanel
          page="loans"
          onRestore={(inputs) => {
            if (inputs.amount !== undefined) setField("amount", String(inputs.amount));
            if (inputs.rate !== undefined) setField("rate", String(inputs.rate));
            if (inputs.years !== undefined) setField("years", String(inputs.years));
            if (inputs.method === "CPM" || inputs.method === "CAM") setField("method", inputs.method);
            setHasInteracted(true);
          }}
        />
      </div>

      <div id="loans-report-content" className="grid gap-6 xl:grid-cols-12">
        {/* Controls */}
        <Card className="xl:col-span-4 h-fit">
          <CardHeader>
            <CardTitle>{t("loans.details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <span id="loans-method-label" className="text-sm font-medium">
                {t("loans.method")}
              </span>
              <Tabs
                value={method}
                onValueChange={(v) => setMethod(v as "CPM" | "CAM")}
                className="w-full"
                aria-labelledby="loans-method-label"
              >
                <TabsList className="w-full">
                  <TabsTrigger value="CPM" className="flex-1">
                    {t("loans.cpm")}
                  </TabsTrigger>
                  <TabsTrigger value="CAM" className="flex-1">
                    {t("loans.cam")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-amount">{t("loans.amount")}</Label>
              <Input
                id="loan-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={loanValidation.amount ? "border-destructive" : ""}
              />
              <ValidationError
                error={loanValidation.amount ? t("loans.errorPositiveAmount") || validationError : null}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-rate">{t("loans.rate")}</Label>
              <Input
                id="loan-rate"
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className={loanValidation.rate ? "border-destructive" : ""}
              />
              <ValidationError error={loanValidation.rate ? t("loans.errorPositiveRate") || validationError : null} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-term">{t("loans.term")}</Label>
              <Input
                id="loan-term"
                type="number"
                min="0"
                step="1"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className={loanValidation.years ? "border-destructive" : ""}
              />
              <ValidationError error={loanValidation.years ? t("loans.errorPositiveYears") || validationError : null} />
            </div>

            {validationError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{validationError}</AlertDescription>
              </Alert>
            )}

            <div className="pt-4 bg-muted/40 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("loans.monthly")}</span>
                <span className="font-bold">
                  {method === "CPM" ? (
                    formatCurrency(stats.monthlyPayment)
                  ) : schedule.length > 0 ? (
                    <span className="flex flex-col items-end">
                      <span>{formatCurrency(stats.firstPayment)}</span>
                      <span className="text-xs text-muted-foreground">
                        {"\u2192"} {formatCurrency(stats.lastPayment)}
                      </span>
                    </span>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("loans.totalInt")}</span>
                <span className="font-bold text-destructive">{formatCurrency(stats.totalInterest)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">{t("loans.totalCost")}</span>
                <span className="font-bold">{formatCurrency(stats.totalPayment)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 xl:col-span-8">
          <ResultShell
            title={t("common.result")}
            description={t("loans.subtitle")}
            isReady={schedule.length > 0}
            emptyTitle={t("loans.schedule")}
            emptyDescription={
              validationError ||
              t("loans.emptySchedule") ||
              "Please enter valid positive values for all fields to generate the amortization schedule."
            }
            actions={
              schedule.length > 0 ? (
                <ResultActions
                  title={reportTitle}
                  results={{
                    [t("loans.monthly")]: stats.monthlyPayment,
                    [t("loans.totalInt")]: stats.totalInterest,
                    [t("loans.totalCost")]: stats.totalPayment,
                  }}
                  inputs={{ amount, rate, years, method }}
                  shareUrl={shareUrl}
                  exportData={schedule as unknown as Record<string, unknown>[]}
                  exportJson={schedule}
                  pdfElementId="loans-report-content"
                  pdfFilename={`loan-summary-${method}-${rate}pct-${years}yr`}
                  pdfTitle={reportTitle}
                />
              ) : null
            }
            summary={
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("loans.monthly")}</p>
                      <p className="text-xl font-bold">
                        {method === "CPM"
                          ? formatCurrency(stats.monthlyPayment)
                          : schedule.length > 0
                            ? formatCurrency(stats.firstPayment)
                            : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("loans.totalInt")}</p>
                      <p className="text-xl font-bold text-destructive">{formatCurrency(stats.totalInterest)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("loans.totalCost")}</p>
                      <p className="text-xl font-bold">{formatCurrency(stats.totalPayment)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
            advanced={
              <div className="flex min-w-0 flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Pie Chart */}
                  <Card className="min-h-[260px] flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">{t("loans.breakdown")}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                      {schedule.length === 0 ? (
                        <div className="flex items-center justify-center h-[150px] sm:h-[200px] text-muted-foreground text-sm">
                          {t("loans.noData") || "Enter valid loan details to see breakdown"}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={48}
                              outerRadius={72}
                              paddingAngle={5}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                borderRadius: "8px",
                                border: "1px solid hsl(var(--border))",
                              }}
                            />
                            <Legend verticalAlign="bottom" height={28} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Area Chart: Balance Over Time */}
                  <Card className="min-h-[260px] flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">{t("loans.balance")}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                      {schedule.length === 0 ? (
                        <div className="flex items-center justify-center h-[150px] sm:h-[200px] text-muted-foreground text-sm">
                          {t("loans.noData") || "Enter valid loan details to see breakdown"}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={180}>
                          <AreaChart data={schedule.filter((_, i) => i % 12 === 0)}>
                            <defs>
                              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="period" hide />
                            <YAxis hide domain={[0, "auto"]} />
                            <Tooltip
                              formatter={(value: number) => formatCurrency(value)}
                              labelFormatter={(label) => `Month ${label}`}
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                borderRadius: "8px",
                                border: "1px solid hsl(var(--border))",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="balance"
                              stroke="hsl(var(--primary))"
                              fillOpacity={1}
                              fill="url(#colorBalance)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Schedule Table */}
                <Card className="flex min-h-[320px] min-w-0 flex-1 flex-col overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span>{t("loans.schedule")}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {schedule.length} {t("common.rows") || "rows"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    {schedule.length === 0 ? (
                      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                        <Alert variant="destructive" className="mx-6">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {validationError ||
                              t("loans.emptySchedule") ||
                              "Please enter valid positive values for all fields to generate the amortization schedule."}
                          </AlertDescription>
                        </Alert>
                      </div>
                    ) : (
                      <div className="w-full max-w-full overflow-x-auto rounded-b-lg border-t" role="table">
                        <div className="grid min-w-[680px] grid-cols-[80px_repeat(3,minmax(120px,1fr))_minmax(150px,1fr)] border-b bg-background text-sm font-medium text-muted-foreground">
                          <div className="px-4 py-3" role="columnheader">
                            {t("cashFlow.period")}
                          </div>
                          <div className="px-4 py-3" role="columnheader">
                            {t("loans.payment")}
                          </div>
                          <div className="px-4 py-3" role="columnheader">
                            {t("loans.principal")}
                          </div>
                          <div className="px-4 py-3" role="columnheader">
                            {t("loans.interest")}
                          </div>
                          <div className="px-4 py-3 text-right" role="columnheader">
                            {t("loans.remBalance")}
                          </div>
                        </div>
                        <VirtualTable
                          data={schedule}
                          rowHeight={44}
                          height="22rem"
                          minWidth="680px"
                          className="max-h-[52vh] min-h-[18rem]"
                          renderRow={(row) => (
                            <div
                              role="row"
                              className="grid h-11 min-w-[680px] grid-cols-[80px_repeat(3,minmax(120px,1fr))_minmax(150px,1fr)] items-center border-b text-sm"
                            >
                              <div role="cell" className="px-4 font-mono text-xs">
                                {row.period}
                              </div>
                              <div role="cell" className="px-4 font-mono text-xs">
                                {formatCurrency(row.payment)}
                              </div>
                              <div role="cell" className="px-4 font-mono text-xs text-primary">
                                {formatCurrency(row.principal)}
                              </div>
                              <div role="cell" className="px-4 font-mono text-xs text-destructive">
                                {formatCurrency(row.interest)}
                              </div>
                              <div role="cell" className="px-4 text-right font-mono text-xs">
                                {formatCurrency(row.balance)}
                              </div>
                            </div>
                          )}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

function LoansPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4 h-fit">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="min-h-[300px]">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[150px] sm:h-[200px] w-full" />
              </CardContent>
            </Card>
            <Card className="min-h-[300px]">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[150px] sm:h-[200px] w-full" />
              </CardContent>
            </Card>
          </div>
          <Card className="flex-1 min-h-[400px]">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] sm:h-[360px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoansPage() {
  return (
    <Suspense fallback={<LoansPageSkeleton />}>
      <LoansPageContent />
    </Suspense>
  );
}
