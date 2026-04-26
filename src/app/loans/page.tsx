"use client";

import { useMemo, Suspense } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/i18n";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useUrlState } from "@/hooks/use-url-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ValidationError } from "@/components/ui/error-display";
import { ResultShell } from "@/components/result-shell";
import { ResultActions } from "@/components/result-actions";

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

  const method = urlState.method as "CPM" | "CAM";
  const setMethod = (v: "CPM" | "CAM") => setField("method", v);

  const amount = urlState.amount as string;
  const setAmount = (v: string) => setField("amount", v);

  const rate = urlState.rate as string;
  const setRate = (v: string) => setField("rate", v);

  const years = urlState.years as string;
  const setYears = (v: string) => setField("years", v);

  const validationError = useMemo(() => {
    const P = parseFloat(amount);
    const r = parseFloat(rate);
    const n = parseFloat(years);

    if (amount && (isNaN(P) || P <= 0)) return t("loans.errorPositiveAmount") || "Loan amount must be positive";
    if (rate && (isNaN(r) || r <= 0)) return t("loans.errorPositiveRate") || "Interest rate must be positive";
    if (years && (isNaN(n) || n <= 0)) return t("loans.errorPositiveYears") || "Loan term must be positive";
    return null;
  }, [amount, rate, years, t]);

  const schedule = useMemo(() => {
    const P = parseFloat(amount) || 0;
    const r = (parseFloat(rate) || 0) / 100 / 12;
    const n = (parseFloat(years) || 0) * 12;

    if (P <= 0 || r <= 0 || n <= 0) {
      return [];
    }

    return Finance.amortizationSchedule(P, r, n, method);
  }, [amount, rate, years, method]);

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
    { name: t("loans.principal"), value: parseFloat(amount) || 0, color: "hsl(var(--primary))" },
    { name: t("loans.totalInt"), value: stats.totalInterest, color: "hsl(var(--destructive))" },
  ];

  const reportTitle = `${t("loans.title")} - ${method}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("loans.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("loans.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Controls */}
        <Card className="xl:col-span-4 h-fit">
          <CardHeader>
            <CardTitle>{t("loans.details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("loans.method")}</Label>
              <Tabs value={method} onValueChange={(v) => setMethod(v as "CPM" | "CAM")} className="w-full">
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
                className={amount && parseFloat(amount) <= 0 ? "border-destructive" : ""}
              />
              <ValidationError
                error={amount && parseFloat(amount) <= 0 ? t("loans.errorPositiveAmount") || validationError : null}
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
                className={rate && parseFloat(rate) <= 0 ? "border-destructive" : ""}
              />
              <ValidationError
                error={rate && parseFloat(rate) <= 0 ? t("loans.errorPositiveRate") || validationError : null}
              />
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
                className={years && parseFloat(years) <= 0 ? "border-destructive" : ""}
              />
              <ValidationError
                error={years && parseFloat(years) <= 0 ? t("loans.errorPositiveYears") || validationError : null}
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
                <span className="text-muted-foreground">{t("loans.monthly")}</span>
                <span className="font-bold">
                  {method === "CPM" ? (
                    formatCurrency(stats.monthlyPayment)
                  ) : schedule.length > 0 ? (
                    <span className="flex flex-col items-end">
                      <span>{formatCurrency(stats.firstPayment)}</span>
                      <span className="text-xs text-muted-foreground">? {formatCurrency(stats.lastPayment)}</span>
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
              <div className="flex min-w-0 flex-col gap-6" id="loans-report-content">
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
                      <ScrollArea className="h-[22rem] max-h-[52vh] min-h-[18rem] w-full max-w-full rounded-b-lg border-t">
                        <div className="min-w-[640px]">
                          <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                              <TableRow>
                                <TableHead className="w-[80px]">{t("cashFlow.period")}</TableHead>
                                <TableHead>{t("loans.payment")}</TableHead>
                                <TableHead>{t("loans.principal")}</TableHead>
                                <TableHead>{t("loans.interest")}</TableHead>
                                <TableHead className="text-right">{t("loans.remBalance")}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {schedule.map((row) => (
                                <TableRow key={row.period}>
                                  <TableCell className="font-mono text-xs">{row.period}</TableCell>
                                  <TableCell className="font-mono text-xs">{formatCurrency(row.payment)}</TableCell>
                                  <TableCell className="font-mono text-xs text-primary">
                                    {formatCurrency(row.principal)}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs text-destructive">
                                    {formatCurrency(row.interest)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-xs">
                                    {formatCurrency(row.balance)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
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
