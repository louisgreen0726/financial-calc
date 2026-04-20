"use client";

import { useMemo, useState } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Activity, DollarSign } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { HistoryPanel } from "@/components/history-panel";
import { parseRequiredNumber } from "@/lib/input-utils";
import { ResponsiveDisclosure } from "@/components/responsive-disclosure";
import { ErrorDisplay, ValidationError } from "@/components/ui/error-display";
import { EquityCAPMSchema, EquityDDMSchema, EquityWACCSchema } from "@/lib/validation";
import { ResultShell } from "@/components/result-shell";

export default function EquityPage() {
  const { t } = useLanguage();
  const [showErrors, setShowErrors] = useState(false);
  // CAPM State
  const [rf, setRf] = useState("3.5");
  const [beta, setBeta] = useState("1.2");
  const [rm, setRm] = useState("10");

  // WACC State
  const [equity, setEquity] = useState("1000000");
  const [debt, setDebt] = useState("500000");
  const [costEquity, setCostEquity] = useState("12");
  const [costDebt, setCostDebt] = useState("6");
  const [taxRate, setTaxRate] = useState("25");

  // DDM State
  const [div, setDiv] = useState("2.5");
  const [growth, setGrowth] = useState("4");
  const [reqReturn, setReqReturn] = useState("9");

  // Memoized calculations for performance
  const capmResult = useMemo(() => {
    return Finance.capm(parseRequiredNumber(rf) / 100, parseRequiredNumber(beta), parseRequiredNumber(rm) / 100);
  }, [rf, beta, rm]);

  const waccResult = useMemo(() => {
    return Finance.wacc(
      parseRequiredNumber(equity),
      parseRequiredNumber(debt),
      parseRequiredNumber(costEquity) / 100,
      parseRequiredNumber(costDebt) / 100,
      parseRequiredNumber(taxRate) / 100
    );
  }, [equity, debt, costEquity, costDebt, taxRate]);

  const ddmResult = useMemo(() => {
    return Finance.ddm(
      parseRequiredNumber(div),
      parseRequiredNumber(reqReturn) / 100,
      parseRequiredNumber(growth) / 100
    );
  }, [div, reqReturn, growth]);

  const capmValidation = useMemo(() => {
    const result = EquityCAPMSchema.safeParse({
      rf: parseRequiredNumber(rf, Number.NaN),
      beta: parseRequiredNumber(beta, Number.NaN),
      rm: parseRequiredNumber(rm, Number.NaN),
    });
    return result.success
      ? {}
      : Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
  }, [beta, rf, rm]);

  const waccValidation = useMemo(() => {
    const result = EquityWACCSchema.safeParse({
      equityValue: parseRequiredNumber(equity, Number.NaN),
      debtValue: parseRequiredNumber(debt, Number.NaN),
      costEquity: parseRequiredNumber(costEquity, Number.NaN) / 100,
      costDebt: parseRequiredNumber(costDebt, Number.NaN) / 100,
      taxRate: parseRequiredNumber(taxRate, Number.NaN) / 100,
    });
    return result.success
      ? {}
      : Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
  }, [costDebt, costEquity, debt, equity, taxRate]);

  const ddmValidation = useMemo(() => {
    const result = EquityDDMSchema.safeParse({
      d1: parseRequiredNumber(div, Number.NaN),
      r: parseRequiredNumber(reqReturn, Number.NaN) / 100,
      g: parseRequiredNumber(growth, Number.NaN) / 100,
    });
    return result.success
      ? {}
      : Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
  }, [div, growth, reqReturn]);

  const hasErrors =
    Object.keys(capmValidation).length > 0 ||
    Object.keys(waccValidation).length > 0 ||
    Object.keys(ddmValidation).length > 0;

  const { addToHistory } = useCalculationHistory({ page: "equity" });

  useHistoryRecorder({
    addToHistory,
    inputs: { rf, beta, rm },
    result: capmResult,
    label: "CAPM",
  });

  useHistoryRecorder({
    addToHistory,
    inputs: { equity, debt, costEquity, costDebt, taxRate },
    result: waccResult,
    label: "WACC",
  });

  useHistoryRecorder({
    addToHistory,
    inputs: { div, growth, reqReturn },
    result: ddmResult,
    label: "DDM",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("equity.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("equity.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <HistoryPanel
            page="equity"
            onRestore={(inputs) => {
              if (inputs.rf) setRf(String(inputs.rf));
              if (inputs.beta) setBeta(String(inputs.beta));
              if (inputs.rm) setRm(String(inputs.rm));

              if (inputs.equity) setEquity(String(inputs.equity));
              if (inputs.debt) setDebt(String(inputs.debt));
              if (inputs.costEquity) setCostEquity(String(inputs.costEquity));
              if (inputs.costDebt) setCostDebt(String(inputs.costDebt));
              if (inputs.taxRate) setTaxRate(String(inputs.taxRate));

              if (inputs.div) setDiv(String(inputs.div));
              if (inputs.growth) setGrowth(String(inputs.growth));
              if (inputs.reqReturn) setReqReturn(String(inputs.reqReturn));
            }}
          />
        </div>
      </div>

      {showErrors && hasErrors && <ErrorDisplay message={t("equity.validation.invalidInputs")} variant="warning" />}

      <Tabs defaultValue="capm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-xl overflow-x-auto">
          <TabsTrigger value="capm">{t("equity.capm.tab")}</TabsTrigger>
          <TabsTrigger value="wacc">{t("equity.wacc.tab")}</TabsTrigger>
          <TabsTrigger value="ddm">{t("equity.ddm.tab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="capm" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  {t("equity.capm.title")}
                </CardTitle>
                <CardDescription>{t("equity.capm.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="capm-rf">{t("equity.capm.rf")}</Label>
                  <Input
                    id="capm-rf"
                    value={rf}
                    onChange={(e) => setRf(e.target.value)}
                    onBlur={() => setShowErrors(true)}
                    type="number"
                    aria-describedby="capm-rf-help"
                  />
                  <ValidationError error={showErrors ? (capmValidation.rf as string | null) : null} />
                  <p id="capm-rf-help" className="sr-only">
                    Risk-free rate used in the CAPM calculation.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capm-beta">{t("equity.capm.beta")}</Label>
                  <Input
                    id="capm-beta"
                    value={beta}
                    onChange={(e) => setBeta(e.target.value)}
                    onBlur={() => setShowErrors(true)}
                    type="number"
                    step="0.1"
                    aria-describedby="capm-beta-help"
                  />
                  <ValidationError error={showErrors ? (capmValidation.beta as string | null) : null} />
                  <p id="capm-beta-help" className="sr-only">
                    CAPM beta input representing the asset&apos;s sensitivity to market movements.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capm-rm">{t("equity.capm.rm")}</Label>
                  <Input
                    id="capm-rm"
                    value={rm}
                    onChange={(e) => setRm(e.target.value)}
                    onBlur={() => setShowErrors(true)}
                    type="number"
                    aria-describedby="capm-rm-help"
                  />
                  <ValidationError error={showErrors ? (capmValidation.rm as string | null) : null} />
                  <p id="capm-rm-help" className="sr-only">
                    CAPM market return input used in the calculation of expected return.
                  </p>
                </div>
              </CardContent>
            </Card>

            <ResultShell
              title={t("equity.capm.re")}
              description={t("equity.capm.desc")}
              isReady={Object.keys(capmValidation).length === 0}
              emptyTitle={t("equity.capm.re")}
              emptyDescription={t("equity.validation.invalidInputs")}
              summary={
                <Card className="flex flex-col justify-center items-center bg-muted/30">
                  <CardContent className="text-center space-y-2 pt-6">
                    <div className="text-4xl sm:text-5xl font-bold text-primary tracking-tighter break-all">{`${(capmResult * 100).toFixed(2)}%`}</div>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto pt-4">
                      {t("equity.capm.prem")}: {(parseRequiredNumber(rm) - parseRequiredNumber(rf)).toFixed(2)}%.
                    </p>
                  </CardContent>
                </Card>
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="wacc" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  {t("equity.wacc.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="wacc-equity">{t("equity.wacc.eqVal")}</Label>
                    <Input
                      id="wacc-equity"
                      value={equity}
                      onChange={(e) => setEquity(e.target.value)}
                      onBlur={() => setShowErrors(true)}
                      type="number"
                    />
                    <ValidationError error={showErrors ? (waccValidation.equityValue as string | null) : null} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wacc-cost-eq">{t("equity.wacc.costEq")}</Label>
                    <Input
                      id="wacc-cost-eq"
                      value={costEquity}
                      onChange={(e) => setCostEquity(e.target.value)}
                      onBlur={() => setShowErrors(true)}
                      type="number"
                    />
                    <ValidationError error={showErrors ? (waccValidation.costEquity as string | null) : null} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="wacc-debt">{t("equity.wacc.debtVal")}</Label>
                    <Input
                      id="wacc-debt"
                      value={debt}
                      onChange={(e) => setDebt(e.target.value)}
                      onBlur={() => setShowErrors(true)}
                      type="number"
                    />
                    <ValidationError error={showErrors ? (waccValidation.debtValue as string | null) : null} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wacc-cost-debt">{t("equity.wacc.costDebt")}</Label>
                    <Input
                      id="wacc-cost-debt"
                      value={costDebt}
                      onChange={(e) => setCostDebt(e.target.value)}
                      onBlur={() => setShowErrors(true)}
                      type="number"
                    />
                    <ValidationError error={showErrors ? (waccValidation.costDebt as string | null) : null} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wacc-tax">{t("equity.wacc.tax")}</Label>
                  <Input
                    id="wacc-tax"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    onBlur={() => setShowErrors(true)}
                    type="number"
                  />
                  <ValidationError error={showErrors ? (waccValidation.taxRate as string | null) : null} />
                </div>
              </CardContent>
            </Card>

            <ResultShell
              title={t("equity.wacc.result")}
              description={t("equity.wacc.desc")}
              isReady={Object.keys(waccValidation).length === 0}
              emptyTitle={t("equity.wacc.result")}
              emptyDescription={t("equity.validation.invalidInputs")}
              summary={
                <Card className="flex flex-col justify-center items-center bg-muted/30">
                  <CardContent className="text-center space-y-2 pt-6">
                    <div className="text-4xl sm:text-5xl font-bold text-primary tracking-tighter break-all">{`${(waccResult * 100).toFixed(2)}%`}</div>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto pt-4">{t("equity.wacc.desc")}</p>
                  </CardContent>
                </Card>
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="ddm" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  {t("equity.ddm.title")}
                </CardTitle>
                <CardDescription>{t("equity.ddm.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ResponsiveDisclosure
                  title={t("equity.ddm.title")}
                  description={t("equity.validation.ddmDisclosure")}
                  defaultOpen={true}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ddm-div">{t("equity.ddm.d1")}</Label>
                      <Input
                        id="ddm-div"
                        value={div}
                        onChange={(e) => setDiv(e.target.value)}
                        onBlur={() => setShowErrors(true)}
                        type="number"
                        step="0.01"
                      />
                      <ValidationError error={showErrors ? (ddmValidation.d1 as string | null) : null} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ddm-req">{t("equity.ddm.req")}</Label>
                      <Input
                        id="ddm-req"
                        value={reqReturn}
                        onChange={(e) => setReqReturn(e.target.value)}
                        onBlur={() => setShowErrors(true)}
                        type="number"
                      />
                      <ValidationError error={showErrors ? (ddmValidation.r as string | null) : null} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ddm-growth">{t("equity.ddm.g")}</Label>
                      <Input
                        id="ddm-growth"
                        value={growth}
                        onChange={(e) => setGrowth(e.target.value)}
                        onBlur={() => setShowErrors(true)}
                        type="number"
                      />
                      <ValidationError error={showErrors ? (ddmValidation.g as string | null) : null} />
                    </div>
                  </div>
                </ResponsiveDisclosure>
              </CardContent>
            </Card>

            <ResultShell
              title={t("equity.ddm.intrinsic")}
              description={t("equity.ddm.desc")}
              isReady={Object.keys(ddmValidation).length === 0 && ddmResult > 0}
              emptyTitle={t("equity.ddm.intrinsic")}
              emptyDescription={ddmResult <= 0 ? t("equity.ddm.growthError") : t("equity.validation.invalidInputs")}
              summary={
                <Card className="flex flex-col justify-center items-center bg-muted/30">
                  <CardContent className="text-center space-y-2 pt-6">
                    <div
                      className={`text-4xl sm:text-5xl font-bold tracking-tighter break-all ${ddmResult <= 0 ? "text-muted-foreground" : "text-primary"}`}
                    >
                      {formatCurrency(ddmResult)}
                    </div>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto pt-4">{t("equity.ddm.resultDesc")}</p>
                  </CardContent>
                </Card>
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
