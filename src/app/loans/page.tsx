"use client";

import { useMemo, Suspense, useState } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
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
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
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
import { normalizeLoanMethod, type LoanMethodState } from "@/lib/route-state";
import { MAX_DISPLAY_ROWS, MAX_PERIODS, MONTHS_PER_YEAR } from "@/lib/constants";
import { ResetDefaultsButton } from "@/components/reset-defaults-button";

const DEFAULT_LOAN_INPUTS = {
  method: "CPM" as LoanMethodState,
  amount: "500000",
  rate: "4.5",
  years: "30",
};

function LoansPageContent() {
  const { t } = useLanguage();
  const {
    state: urlState,
    setState,
    setField,
    shareUrl,
  } = useUrlState({
    defaultValues: DEFAULT_LOAN_INPUTS,
    prefix: "loans",
  });

  const [hasInteracted, setHasInteracted] = useState(false);

  const method = normalizeLoanMethod(urlState.method);
  const setMethod = (v: LoanMethodState) => {
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
  const scheduleKey = `${method}|${amount}|${rate}|${years}`;
  const [schedulePagination, setSchedulePagination] = useState({ key: scheduleKey, page: 0 });
  const [printAllSchedule, setPrintAllSchedule] = useState(false);
  const requestedSchedulePage = schedulePagination.key === scheduleKey ? schedulePagination.page : 0;

  const resetDefaults = () => {
    const previous = { hasInteracted };
    setHasInteracted(false);
    return () => {
      setHasInteracted(previous.hasInteracted);
    };
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
    const messages = {
      amount: t("loans.errorPositiveAmount"),
      rate: t("loans.errorValidRate"),
      years: t("loans.errorValidYears"),
      method: t("loans.errorValidMethod"),
    } as const;
    const result = LoanInputSchema.safeParse({
      amount: parsedLoanInputs.amount ?? Number.NaN,
      rate: parsedLoanInputs.rate ?? Number.NaN,
      years: parsedLoanInputs.years ?? Number.NaN,
      method,
    });

    return result.success
      ? {}
      : Object.fromEntries(
          result.error.issues.map((issue) => {
            const field = String(issue.path[0]) as keyof typeof messages;
            return [field, messages[field] ?? t("loans.emptySchedule")];
          })
        );
  }, [method, parsedLoanInputs, t]);

  const validationError = useMemo(() => {
    if (loanValidation.amount) return String(loanValidation.amount);
    if (loanValidation.rate) return String(loanValidation.rate);
    if (loanValidation.years) return String(loanValidation.years);
    if (loanValidation.method) return String(loanValidation.method);
    return null;
  }, [loanValidation]);

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
    const n = parsedLoanInputs.years * 12;

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
  const statsAreFinite = Object.values(stats).every(Number.isFinite);
  const loanReady = schedule.length > 0 && statsAreFinite;
  const schedulePageCount = Math.max(1, Math.ceil(schedule.length / MAX_DISPLAY_ROWS));
  const schedulePage = Math.min(requestedSchedulePage, schedulePageCount - 1);
  const scheduleStart = schedule.length === 0 ? 0 : schedulePage * MAX_DISPLAY_ROWS;
  const scheduleEnd = Math.min(scheduleStart + MAX_DISPLAY_ROWS, schedule.length);
  const displayedSchedule = printAllSchedule ? schedule : schedule.slice(scheduleStart, scheduleEnd);
  const scheduleRange =
    schedule.length === 0
      ? `0 ${t("common.rows")}`
      : printAllSchedule
        ? `${schedule.length} ${t("common.rows")}`
        : `${scheduleStart + 1}-${scheduleEnd} / ${schedule.length} ${t("common.rows")}`;
  const goToSchedulePage = (page: number) => {
    setSchedulePagination({ key: scheduleKey, page: Math.min(Math.max(page, 0), schedulePageCount - 1) });
  };
  const paymentLabel = method === "CPM" ? t("loans.monthly") : t("loans.firstPayment");
  const paymentResults =
    method === "CPM"
      ? { [t("loans.monthly")]: stats.monthlyPayment }
      : {
          [t("loans.firstPayment")]: stats.firstPayment,
          [t("loans.lastPayment")]: stats.lastPayment,
        };
  const balanceChartData = useMemo(
    () => schedule.filter((row) => row.period === 1 || row.period % 12 === 0 || row.period === schedule.length),
    [schedule]
  );

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
    resultFormat: "currency",
    enabled: hasInteracted && !validationError && loanReady,
  });

  return (
    <div className="page-stack" data-tone="amber">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("loans.title")}</h1>
          <p className="page-description">{t("loans.subtitle")}</p>
        </div>
        <div className="page-actions">
          <ResetDefaultsButton urlPrefix="loans" onReset={resetDefaults} />
          <HistoryPanel
            page="loans"
            onRestore={(inputs) => {
              setState({
                method: inputs.method !== undefined ? normalizeLoanMethod(inputs.method) : method,
                amount: inputs.amount !== undefined ? String(inputs.amount) : amount,
                rate: inputs.rate !== undefined ? String(inputs.rate) : rate,
                years: inputs.years !== undefined ? String(inputs.years) : years,
              });
              setHasInteracted(false);
            }}
          />
        </div>
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
              <RadioGroup
                value={method}
                onValueChange={(value) => setMethod(normalizeLoanMethod(value))}
                className="grid w-full grid-cols-2 gap-1 rounded-md bg-muted p-1"
                aria-labelledby="loans-method-label"
              >
                <div className="flex min-w-0 items-center gap-2 rounded-sm px-3 py-2 has-[[data-state=checked]]:bg-background has-[[data-state=checked]]:shadow-sm">
                  <RadioGroupItem id="loan-method-cpm" value="CPM" />
                  <Label htmlFor="loan-method-cpm" className="min-w-0 flex-1 cursor-pointer text-center">
                    {t("loans.cpm")}
                  </Label>
                </div>
                <div className="flex min-w-0 items-center gap-2 rounded-sm px-3 py-2 has-[[data-state=checked]]:bg-background has-[[data-state=checked]]:shadow-sm">
                  <RadioGroupItem id="loan-method-cam" value="CAM" />
                  <Label htmlFor="loan-method-cam" className="min-w-0 flex-1 cursor-pointer text-center">
                    {t("loans.cam")}
                  </Label>
                </div>
              </RadioGroup>
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
                aria-invalid={Boolean(loanValidation.amount)}
                aria-describedby={loanValidation.amount ? "loan-amount-error" : undefined}
                className={loanValidation.amount ? "border-destructive" : ""}
              />
              <ValidationError
                id="loan-amount-error"
                error={loanValidation.amount ? String(loanValidation.amount) : null}
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
                aria-invalid={Boolean(loanValidation.rate)}
                aria-describedby={loanValidation.rate ? "loan-rate-error" : undefined}
                className={loanValidation.rate ? "border-destructive" : ""}
              />
              <ValidationError id="loan-rate-error" error={loanValidation.rate ? String(loanValidation.rate) : null} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-term">{t("loans.term")}</Label>
              <Input
                id="loan-term"
                type="number"
                min={1 / MONTHS_PER_YEAR}
                max={MAX_PERIODS / MONTHS_PER_YEAR}
                step={1 / MONTHS_PER_YEAR}
                value={years}
                onChange={(e) => setYears(e.target.value)}
                aria-invalid={Boolean(loanValidation.years)}
                aria-describedby={loanValidation.years ? "loan-term-error" : undefined}
                className={loanValidation.years ? "border-destructive" : ""}
              />
              <ValidationError
                id="loan-term-error"
                error={loanValidation.years ? String(loanValidation.years) : null}
              />
            </div>

            {validationError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{validationError}</AlertDescription>
              </Alert>
            )}

            <div className="pt-4 bg-muted/40 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{paymentLabel}</span>
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
            isReady={loanReady}
            emptyTitle={t("loans.schedule")}
            emptyDescription={validationError || t("loans.emptySchedule")}
            actions={
              loanReady ? (
                <ResultActions
                  title={reportTitle}
                  results={{
                    ...paymentResults,
                    [t("loans.totalInt")]: stats.totalInterest,
                    [t("loans.totalCost")]: stats.totalPayment,
                  }}
                  inputs={{ amount, rate, years, method }}
                  displayInputs={{ amount, rate, years, method: method === "CPM" ? t("loans.cpm") : t("loans.cam") }}
                  inputLabels={{
                    amount: t("loans.amount"),
                    rate: t("loans.rate"),
                    years: t("loans.term"),
                    method: t("loans.method"),
                  }}
                  shareUrl={shareUrl}
                  exportData={schedule as unknown as Record<string, unknown>[]}
                  exportJson={schedule}
                  pdfElementId="loans-report-content"
                  pdfFilename={`loan-summary-${method}-${rate}pct-${years}yr`}
                  pdfTitle={reportTitle}
                  onPrintModeChange={setPrintAllSchedule}
                />
              ) : null
            }
            summary={
              <Card variant="result">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{paymentLabel}</p>
                      <p className="text-xl font-bold">
                        {method === "CPM"
                          ? formatCurrency(stats.monthlyPayment)
                          : schedule.length > 0
                            ? formatCurrency(stats.firstPayment)
                            : "-"}
                      </p>
                      {method === "CAM" && schedule.length > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {t("loans.lastPayment")}: {formatCurrency(stats.lastPayment)}
                        </p>
                      ) : null}
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
                          {t("loans.noData")}
                        </div>
                      ) : (
                        <div
                          role="img"
                          aria-label={`${t("loans.breakdown")}: ${t("loans.principal")} ${formatCurrency(parsedLoanInputs.amount ?? 0)}, ${t("loans.totalInt")} ${formatCurrency(stats.totalInterest)}`}
                        >
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
                                formatter={(value) => formatCurrency(Number(value ?? 0))}
                                contentStyle={{
                                  backgroundColor: "hsl(var(--card))",
                                  borderRadius: "8px",
                                  border: "1px solid hsl(var(--border))",
                                }}
                              />
                              <Legend verticalAlign="bottom" height={28} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
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
                          {t("loans.noData")}
                        </div>
                      ) : (
                        <div
                          role="img"
                          aria-label={`${t("loans.balance")}: ${formatCurrency(parsedLoanInputs.amount ?? 0)} ${"\u2192"} ${formatCurrency(schedule.at(-1)?.balance ?? 0)}`}
                        >
                          <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={balanceChartData}>
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
                                formatter={(value) => formatCurrency(Number(value ?? 0))}
                                labelFormatter={(label) => `${t("cashFlow.period")} ${label}`}
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
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Schedule Table */}
                <Card className="flex min-h-[320px] min-w-0 flex-1 flex-col overflow-hidden" data-pdf-expand="true">
                  <CardHeader className="pb-3">
                    <CardTitle
                      id="loan-schedule-title"
                      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span>{t("loans.schedule")}</span>
                      <span className="text-xs font-normal text-muted-foreground">{scheduleRange}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    {schedule.length === 0 ? (
                      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                        <Alert variant="destructive" className="mx-6">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{validationError || t("loans.emptySchedule")}</AlertDescription>
                        </Alert>
                      </div>
                    ) : (
                      <div
                        role="region"
                        aria-labelledby="loan-schedule-title"
                        tabIndex={0}
                        className="max-h-[52vh] min-h-[18rem] w-full max-w-full overflow-auto rounded-b-lg border-t"
                        data-pdf-expand="true"
                      >
                        <table id="loan-schedule-table" className="w-full min-w-[680px] border-collapse text-sm">
                          <caption className="sr-only">
                            {t("loans.schedule")}: {scheduleRange}
                          </caption>
                          <thead className="sticky top-0 z-10 bg-background text-muted-foreground">
                            <tr className="border-b">
                              <th scope="col" className="w-20 px-4 py-3 text-left font-medium">
                                {t("cashFlow.period")}
                              </th>
                              <th scope="col" className="px-4 py-3 text-left font-medium">
                                {t("loans.payment")}
                              </th>
                              <th scope="col" className="px-4 py-3 text-left font-medium">
                                {t("loans.principal")}
                              </th>
                              <th scope="col" className="px-4 py-3 text-left font-medium">
                                {t("loans.interest")}
                              </th>
                              <th scope="col" className="px-4 py-3 text-right font-medium">
                                {t("loans.remBalance")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayedSchedule.map((row) => (
                              <tr key={row.period} className="h-11 border-b hover:bg-muted/50">
                                <th scope="row" className="px-4 text-left font-mono text-xs font-normal">
                                  {row.period}
                                </th>
                                <td className="px-4 font-mono text-xs">{formatCurrency(row.payment)}</td>
                                <td className="px-4 font-mono text-xs text-primary">{formatCurrency(row.principal)}</td>
                                <td className="px-4 font-mono text-xs text-destructive">
                                  {formatCurrency(row.interest)}
                                </td>
                                <td className="px-4 text-right font-mono text-xs">{formatCurrency(row.balance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {!printAllSchedule && schedulePageCount > 1 ? (
                      <div
                        className="flex min-h-14 items-center justify-center gap-3 border-t px-4 py-2"
                        data-pdf-exclude="true"
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label={t("common.previousPage")}
                          title={t("common.previousPage")}
                          disabled={schedulePage === 0}
                          onClick={() => goToSchedulePage(schedulePage - 1)}
                        >
                          <ChevronLeft />
                        </Button>
                        <span className="min-w-20 text-center text-sm tabular-nums" aria-live="polite">
                          {t("common.page")} {schedulePage + 1} / {schedulePageCount}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label={t("common.nextPage")}
                          title={t("common.nextPage")}
                          disabled={schedulePage === schedulePageCount - 1}
                          onClick={() => goToSchedulePage(schedulePage + 1)}
                        >
                          <ChevronRight />
                        </Button>
                      </div>
                    ) : null}
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
