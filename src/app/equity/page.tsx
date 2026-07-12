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
import { ResultActions } from "@/components/result-actions";
import { useShareableUrl } from "@/hooks/use-shareable-url";

type EquitySection = "capm" | "wacc" | "ddm";

export default function EquityPage() {
  const { t } = useLanguage();
  const [showErrors, setShowErrors] = useState(false);
  const [interactedSections, setInteractedSections] = useState<Record<EquitySection, boolean>>({
    capm: false,
    wacc: false,
    ddm: false,
  });
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
  const [activeSection, setActiveSection] = useState<EquitySection>("capm");

  const shareUrl = useShareableUrl({
    prefix: "equity",
    state: {
      section: activeSection,
      rf,
      beta,
      rm,
      equity,
      debt,
      costEquity,
      costDebt,
      taxRate,
      div,
      growth,
      reqReturn,
    },
    onRestore: (inputs) => {
      if (inputs.section === "capm" || inputs.section === "wacc" || inputs.section === "ddm") {
        setActiveSection(inputs.section);
      }
      if (inputs.rf !== undefined) setRf(String(inputs.rf));
      if (inputs.beta !== undefined) setBeta(String(inputs.beta));
      if (inputs.rm !== undefined) setRm(String(inputs.rm));
      if (inputs.equity !== undefined) setEquity(String(inputs.equity));
      if (inputs.debt !== undefined) setDebt(String(inputs.debt));
      if (inputs.costEquity !== undefined) setCostEquity(String(inputs.costEquity));
      if (inputs.costDebt !== undefined) setCostDebt(String(inputs.costDebt));
      if (inputs.taxRate !== undefined) setTaxRate(String(inputs.taxRate));
      if (inputs.div !== undefined) setDiv(String(inputs.div));
      if (inputs.growth !== undefined) setGrowth(String(inputs.growth));
      if (inputs.reqReturn !== undefined) setReqReturn(String(inputs.reqReturn));
      setInteractedSections({ capm: false, wacc: false, ddm: false });
    },
  });

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
    const messages = {
      rf: t("equity.validation.capmRate"),
      beta: t("equity.validation.capmBeta"),
      rm: t("equity.validation.capmMarketReturn"),
    } as const;
    const result = EquityCAPMSchema.safeParse({
      rf: parseRequiredNumber(rf, Number.NaN),
      beta: parseRequiredNumber(beta, Number.NaN),
      rm: parseRequiredNumber(rm, Number.NaN),
    });
    return result.success
      ? {}
      : Object.fromEntries(
          result.error.issues.map((issue) => {
            const field = String(issue.path[0]) as keyof typeof messages;
            return [field, messages[field] ?? t("equity.validation.invalidInputs")];
          })
        );
  }, [beta, rf, rm, t]);

  const waccValidation = useMemo(() => {
    const messages = {
      equityValue: t("equity.validation.waccEquity"),
      debtValue: t("equity.validation.waccDebt"),
      costEquity: t("equity.validation.waccCostEquity"),
      costDebt: t("equity.validation.waccCostDebt"),
      taxRate: t("equity.validation.waccTax"),
    } as const;
    const result = EquityWACCSchema.safeParse({
      equityValue: parseRequiredNumber(equity, Number.NaN),
      debtValue: parseRequiredNumber(debt, Number.NaN),
      costEquity: parseRequiredNumber(costEquity, Number.NaN) / 100,
      costDebt: parseRequiredNumber(costDebt, Number.NaN) / 100,
      taxRate: parseRequiredNumber(taxRate, Number.NaN) / 100,
    });
    return result.success
      ? {}
      : Object.fromEntries(
          result.error.issues.map((issue) => {
            const field = String(issue.path[0]) as keyof typeof messages;
            return [field, messages[field] ?? t("equity.validation.invalidInputs")];
          })
        );
  }, [costDebt, costEquity, debt, equity, t, taxRate]);

  const ddmValidation = useMemo(() => {
    const messages = {
      d1: t("equity.validation.ddmDividend"),
      r: t("equity.validation.ddmRequiredReturn"),
      g: t("equity.validation.ddmGrowthRate"),
    } as const;
    const result = EquityDDMSchema.safeParse({
      d1: parseRequiredNumber(div, Number.NaN),
      r: parseRequiredNumber(reqReturn, Number.NaN) / 100,
      g: parseRequiredNumber(growth, Number.NaN) / 100,
    });
    return result.success
      ? {}
      : Object.fromEntries(
          result.error.issues.map((issue) => {
            const field = String(issue.path[0]) as keyof typeof messages;
            return [field, messages[field] ?? t("equity.validation.invalidInputs")];
          })
        );
  }, [div, growth, reqReturn, t]);

  const hasErrors =
    Object.keys(capmValidation).length > 0 ||
    Object.keys(waccValidation).length > 0 ||
    Object.keys(ddmValidation).length > 0;
  const capmReady = Object.keys(capmValidation).length === 0 && Number.isFinite(capmResult);
  const waccReady = Object.keys(waccValidation).length === 0 && Number.isFinite(waccResult);
  const ddmReady = Object.keys(ddmValidation).length === 0 && Number.isFinite(ddmResult) && ddmResult >= 0;

  const markInteracted = (section: EquitySection) => {
    setInteractedSections((prev) => ({ ...prev, [section]: true }));
  };

  const { addToHistory } = useCalculationHistory({ page: "equity" });

  useHistoryRecorder({
    addToHistory,
    inputs: { rf, beta, rm },
    result: capmResult,
    label: "CAPM",
    resultFormat: "percentDecimal",
    enabled: interactedSections.capm && capmReady,
  });

  useHistoryRecorder({
    addToHistory,
    inputs: { equity, debt, costEquity, costDebt, taxRate },
    result: waccResult,
    label: "WACC",
    resultFormat: "percentDecimal",
    enabled: interactedSections.wacc && waccReady,
  });

  useHistoryRecorder({
    addToHistory,
    inputs: { div, growth, reqReturn },
    result: ddmResult,
    label: "DDM",
    resultFormat: "currency",
    enabled: interactedSections.ddm && ddmReady,
  });

  return (
    <div className="page-stack" data-tone="blue">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("equity.title")}</h1>
          <p className="page-description">{t("equity.subtitle")}</p>
        </div>
        <div className="page-actions">
          <HistoryPanel
            page="equity"
            onRestore={(inputs) => {
              if (inputs.rf !== undefined) setRf(String(inputs.rf));
              if (inputs.beta !== undefined) setBeta(String(inputs.beta));
              if (inputs.rm !== undefined) setRm(String(inputs.rm));

              if (inputs.equity !== undefined) setEquity(String(inputs.equity));
              if (inputs.debt !== undefined) setDebt(String(inputs.debt));
              if (inputs.costEquity !== undefined) setCostEquity(String(inputs.costEquity));
              if (inputs.costDebt !== undefined) setCostDebt(String(inputs.costDebt));
              if (inputs.taxRate !== undefined) setTaxRate(String(inputs.taxRate));

              if (inputs.div !== undefined) setDiv(String(inputs.div));
              if (inputs.growth !== undefined) setGrowth(String(inputs.growth));
              if (inputs.reqReturn !== undefined) setReqReturn(String(inputs.reqReturn));
              if (inputs.rf !== undefined || inputs.beta !== undefined || inputs.rm !== undefined)
                setActiveSection("capm");
              if (
                inputs.equity !== undefined ||
                inputs.debt !== undefined ||
                inputs.costEquity !== undefined ||
                inputs.costDebt !== undefined ||
                inputs.taxRate !== undefined
              )
                setActiveSection("wacc");
              if (inputs.div !== undefined || inputs.growth !== undefined || inputs.reqReturn !== undefined)
                setActiveSection("ddm");
              setInteractedSections({ capm: false, wacc: false, ddm: false });
            }}
          />
        </div>
      </div>

      {showErrors && hasErrors && <ErrorDisplay message={t("equity.validation.invalidInputs")} variant="warning" />}

      <Tabs
        value={activeSection}
        onValueChange={(value) => setActiveSection(value as EquitySection)}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-xl overflow-x-auto">
          <TabsTrigger value="capm">{t("equity.capm.tab")}</TabsTrigger>
          <TabsTrigger value="wacc">{t("equity.wacc.tab")}</TabsTrigger>
          <TabsTrigger value="ddm">{t("equity.ddm.tab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="capm" className="space-y-6">
          <div id="equity-capm-report-content" className="grid gap-6 xl:grid-cols-2">
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
                    onChange={(e) => {
                      markInteracted("capm");
                      setRf(e.target.value);
                    }}
                    onBlur={() => setShowErrors(true)}
                    type="number"
                    aria-invalid={Boolean(showErrors && capmValidation.rf)}
                    aria-describedby={showErrors && capmValidation.rf ? "capm-rf-help capm-rf-error" : "capm-rf-help"}
                  />
                  <ValidationError
                    id="capm-rf-error"
                    error={showErrors ? (capmValidation.rf as string | null) : null}
                  />
                  <p id="capm-rf-help" className="sr-only">
                    Risk-free rate used in the CAPM calculation.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capm-beta">{t("equity.capm.beta")}</Label>
                  <Input
                    id="capm-beta"
                    value={beta}
                    onChange={(e) => {
                      markInteracted("capm");
                      setBeta(e.target.value);
                    }}
                    onBlur={() => setShowErrors(true)}
                    type="number"
                    step="0.1"
                    aria-invalid={Boolean(showErrors && capmValidation.beta)}
                    aria-describedby={
                      showErrors && capmValidation.beta ? "capm-beta-help capm-beta-error" : "capm-beta-help"
                    }
                  />
                  <ValidationError
                    id="capm-beta-error"
                    error={showErrors ? (capmValidation.beta as string | null) : null}
                  />
                  <p id="capm-beta-help" className="sr-only">
                    CAPM beta input representing the asset&apos;s sensitivity to market movements.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capm-rm">{t("equity.capm.rm")}</Label>
                  <Input
                    id="capm-rm"
                    value={rm}
                    onChange={(e) => {
                      markInteracted("capm");
                      setRm(e.target.value);
                    }}
                    onBlur={() => setShowErrors(true)}
                    type="number"
                    aria-invalid={Boolean(showErrors && capmValidation.rm)}
                    aria-describedby={showErrors && capmValidation.rm ? "capm-rm-help capm-rm-error" : "capm-rm-help"}
                  />
                  <ValidationError
                    id="capm-rm-error"
                    error={showErrors ? (capmValidation.rm as string | null) : null}
                  />
                  <p id="capm-rm-help" className="sr-only">
                    CAPM market return input used in the calculation of expected return.
                  </p>
                </div>
              </CardContent>
            </Card>

            <ResultShell
              title={t("equity.capm.re")}
              description={t("equity.capm.desc")}
              isReady={capmReady}
              emptyTitle={t("equity.capm.re")}
              emptyDescription={t("equity.validation.invalidInputs")}
              actions={
                capmReady ? (
                  <ResultActions
                    title={t("equity.capm.title")}
                    results={{ [t("equity.capm.re")]: `${(capmResult * 100).toFixed(2)}%` }}
                    inputs={{ rf, beta, rm }}
                    shareUrl={shareUrl}
                    exportData={[
                      {
                        metric: t("equity.capm.re"),
                        value: `${(capmResult * 100).toFixed(2)}%`,
                      },
                    ]}
                    exportJson={{ rf, beta, rm, expectedReturn: capmResult }}
                    pdfElementId="equity-capm-report-content"
                    pdfFilename="equity-capm"
                    pdfTitle={t("equity.capm.title")}
                  />
                ) : null
              }
              summary={
                <Card variant="result" className="flex flex-col items-center justify-center">
                  <CardContent className="text-center space-y-2 pt-6">
                    <div className="break-words text-3xl font-semibold text-primary sm:text-4xl">{`${(capmResult * 100).toFixed(2)}%`}</div>
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
          <div id="equity-wacc-report-content" className="grid gap-6 xl:grid-cols-2">
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
                      onChange={(e) => {
                        markInteracted("wacc");
                        setEquity(e.target.value);
                      }}
                      onBlur={() => setShowErrors(true)}
                      type="number"
                      aria-invalid={Boolean(showErrors && waccValidation.equityValue)}
                      aria-describedby={showErrors && waccValidation.equityValue ? "wacc-equity-error" : undefined}
                    />
                    <ValidationError
                      id="wacc-equity-error"
                      error={showErrors ? (waccValidation.equityValue as string | null) : null}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wacc-cost-eq">{t("equity.wacc.costEq")}</Label>
                    <Input
                      id="wacc-cost-eq"
                      value={costEquity}
                      onChange={(e) => {
                        markInteracted("wacc");
                        setCostEquity(e.target.value);
                      }}
                      onBlur={() => setShowErrors(true)}
                      type="number"
                      aria-invalid={Boolean(showErrors && waccValidation.costEquity)}
                      aria-describedby={showErrors && waccValidation.costEquity ? "wacc-cost-equity-error" : undefined}
                    />
                    <ValidationError
                      id="wacc-cost-equity-error"
                      error={showErrors ? (waccValidation.costEquity as string | null) : null}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="wacc-debt">{t("equity.wacc.debtVal")}</Label>
                    <Input
                      id="wacc-debt"
                      value={debt}
                      onChange={(e) => {
                        markInteracted("wacc");
                        setDebt(e.target.value);
                      }}
                      onBlur={() => setShowErrors(true)}
                      type="number"
                      aria-invalid={Boolean(showErrors && waccValidation.debtValue)}
                      aria-describedby={showErrors && waccValidation.debtValue ? "wacc-debt-error" : undefined}
                    />
                    <ValidationError
                      id="wacc-debt-error"
                      error={showErrors ? (waccValidation.debtValue as string | null) : null}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wacc-cost-debt">{t("equity.wacc.costDebt")}</Label>
                    <Input
                      id="wacc-cost-debt"
                      value={costDebt}
                      onChange={(e) => {
                        markInteracted("wacc");
                        setCostDebt(e.target.value);
                      }}
                      onBlur={() => setShowErrors(true)}
                      type="number"
                      aria-invalid={Boolean(showErrors && waccValidation.costDebt)}
                      aria-describedby={showErrors && waccValidation.costDebt ? "wacc-cost-debt-error" : undefined}
                    />
                    <ValidationError
                      id="wacc-cost-debt-error"
                      error={showErrors ? (waccValidation.costDebt as string | null) : null}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wacc-tax">{t("equity.wacc.tax")}</Label>
                  <Input
                    id="wacc-tax"
                    value={taxRate}
                    onChange={(e) => {
                      markInteracted("wacc");
                      setTaxRate(e.target.value);
                    }}
                    onBlur={() => setShowErrors(true)}
                    type="number"
                    aria-invalid={Boolean(showErrors && waccValidation.taxRate)}
                    aria-describedby={showErrors && waccValidation.taxRate ? "wacc-tax-error" : undefined}
                  />
                  <ValidationError
                    id="wacc-tax-error"
                    error={showErrors ? (waccValidation.taxRate as string | null) : null}
                  />
                </div>
              </CardContent>
            </Card>

            <ResultShell
              title={t("equity.wacc.result")}
              description={t("equity.wacc.desc")}
              isReady={waccReady}
              emptyTitle={t("equity.wacc.result")}
              emptyDescription={t("equity.validation.invalidInputs")}
              actions={
                waccReady ? (
                  <ResultActions
                    title={t("equity.wacc.title")}
                    results={{ [t("equity.wacc.result")]: `${(waccResult * 100).toFixed(2)}%` }}
                    inputs={{ equity, debt, costEquity, costDebt, taxRate }}
                    shareUrl={shareUrl}
                    exportData={[
                      {
                        metric: t("equity.wacc.result"),
                        value: `${(waccResult * 100).toFixed(2)}%`,
                      },
                    ]}
                    exportJson={{ equity, debt, costEquity, costDebt, taxRate, wacc: waccResult }}
                    pdfElementId="equity-wacc-report-content"
                    pdfFilename="equity-wacc"
                    pdfTitle={t("equity.wacc.title")}
                  />
                ) : null
              }
              summary={
                <Card variant="result" className="flex flex-col items-center justify-center">
                  <CardContent className="text-center space-y-2 pt-6">
                    <div className="break-words text-3xl font-semibold text-primary sm:text-4xl">{`${(waccResult * 100).toFixed(2)}%`}</div>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto pt-4">{t("equity.wacc.desc")}</p>
                  </CardContent>
                </Card>
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="ddm" className="space-y-6">
          <div id="equity-ddm-report-content" className="grid gap-6 xl:grid-cols-2">
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
                        onChange={(e) => {
                          markInteracted("ddm");
                          setDiv(e.target.value);
                        }}
                        onBlur={() => setShowErrors(true)}
                        type="number"
                        step="0.01"
                        aria-invalid={Boolean(showErrors && ddmValidation.d1)}
                        aria-describedby={showErrors && ddmValidation.d1 ? "ddm-div-error" : undefined}
                      />
                      <ValidationError
                        id="ddm-div-error"
                        error={showErrors ? (ddmValidation.d1 as string | null) : null}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ddm-req">{t("equity.ddm.req")}</Label>
                      <Input
                        id="ddm-req"
                        value={reqReturn}
                        onChange={(e) => {
                          markInteracted("ddm");
                          setReqReturn(e.target.value);
                        }}
                        onBlur={() => setShowErrors(true)}
                        type="number"
                        aria-invalid={Boolean(showErrors && ddmValidation.r)}
                        aria-describedby={showErrors && ddmValidation.r ? "ddm-req-error" : undefined}
                      />
                      <ValidationError
                        id="ddm-req-error"
                        error={showErrors ? (ddmValidation.r as string | null) : null}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ddm-growth">{t("equity.ddm.g")}</Label>
                      <Input
                        id="ddm-growth"
                        value={growth}
                        onChange={(e) => {
                          markInteracted("ddm");
                          setGrowth(e.target.value);
                        }}
                        onBlur={() => setShowErrors(true)}
                        type="number"
                        aria-invalid={Boolean(showErrors && ddmValidation.g)}
                        aria-describedby={showErrors && ddmValidation.g ? "ddm-growth-error" : undefined}
                      />
                      <ValidationError
                        id="ddm-growth-error"
                        error={showErrors ? (ddmValidation.g as string | null) : null}
                      />
                    </div>
                  </div>
                </ResponsiveDisclosure>
              </CardContent>
            </Card>

            <ResultShell
              title={t("equity.ddm.intrinsic")}
              description={t("equity.ddm.desc")}
              isReady={ddmReady}
              emptyTitle={t("equity.ddm.intrinsic")}
              emptyDescription={
                Object.keys(ddmValidation).length > 0
                  ? t("equity.validation.invalidInputs")
                  : t("equity.ddm.growthError")
              }
              actions={
                ddmReady ? (
                  <ResultActions
                    title={t("equity.ddm.title")}
                    results={{ [t("equity.ddm.intrinsic")]: ddmResult }}
                    inputs={{ div, growth, reqReturn }}
                    shareUrl={shareUrl}
                    exportData={[
                      {
                        metric: t("equity.ddm.intrinsic"),
                        value: ddmResult,
                      },
                    ]}
                    exportJson={{ div, growth, reqReturn, intrinsicValue: ddmResult }}
                    pdfElementId="equity-ddm-report-content"
                    pdfFilename="equity-ddm"
                    pdfTitle={t("equity.ddm.title")}
                  />
                ) : null
              }
              summary={
                <Card variant="result" className="flex flex-col items-center justify-center">
                  <CardContent className="text-center space-y-2 pt-6">
                    <div
                      className={`break-words text-3xl font-semibold sm:text-4xl ${ddmResult <= 0 ? "text-muted-foreground" : "text-primary"}`}
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
