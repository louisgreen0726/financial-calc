"use client";

import { useState, useMemo, useCallback } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/i18n";
import { TrendingUp, DollarSign, Percent, Scale, Globe, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ValidationError } from "@/components/ui/error-display";
import { formatCurrency } from "@/lib/utils";
import { ResultActions } from "@/components/result-actions";
import { parseOptionalNumber } from "@/lib/input-utils";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { HistoryPanel } from "@/components/history-panel";
import { useShareableUrl } from "@/hooks/use-shareable-url";
import { normalizeMacroTab, type MacroTab } from "@/lib/route-state";

interface FieldValidationError {
  field: string;
  message: string;
}

interface MacroActionConfig {
  title: string;
  results: Record<string, number | string>;
  inputs: Record<string, number | string>;
  exportData: Record<string, unknown>[];
  exportJson: Record<string, unknown>;
  pdfElementId: string;
  pdfFilename: string;
}

const EMPTY_RESULT = "\u2014";
const isFiniteNumber = (value: number | null): value is number => typeof value === "number" && Number.isFinite(value);

function makeMacroActionConfig(config: MacroActionConfig): MacroActionConfig {
  return config;
}

export default function MacroPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<MacroTab>("inflation");
  const [hasInteracted, setHasInteracted] = useState(false);
  const { addToHistory } = useCalculationHistory({ page: "macro" });

  const updateField = (setter: (value: string) => void) => (nextValue: string) => {
    setHasInteracted(true);
    setter(nextValue);
  };

  // Inflation Rate Calculator
  const [startPrice, setStartPrice] = useState<string>("100");
  const [endPrice, setEndPrice] = useState<string>("150");
  const [infYears, setInfYears] = useState<string>("10");

  // Purchasing Power Calculator
  const [ppAmount, setPpAmount] = useState<string>("100000");
  const [ppRate, setPpRate] = useState<string>("3");
  const [ppYears, setPpYears] = useState<string>("20");

  // Real Interest Rate Calculator
  const [nominalRate, setNominalRate] = useState<string>("5");
  const [realInfRate, setRealInfRate] = useState<string>("2");

  // CPI Adjustment Calculator
  const [cpiAmount, setCpiAmount] = useState<string>("1000");
  const [fromCPI, setFromCPI] = useState<string>("100");
  const [toCPI, setToCPI] = useState<string>("125");

  // PPP Calculator
  const [domesticPrice, setDomesticPrice] = useState<string>("5.81");
  const [foreignPrice, setForeignPrice] = useState<string>("650");

  // Validation functions
  const validateInflationInputs = useCallback((): FieldValidationError[] => {
    const errors: FieldValidationError[] = [];
    const start = parseOptionalNumber(startPrice);
    const end = parseOptionalNumber(endPrice);
    const years = parseOptionalNumber(infYears);

    if (start === null || start <= 0) {
      errors.push({ field: "startPrice", message: t("macro.inflation.error.negativePrice") });
    }
    if (end === null || end <= 0) {
      errors.push({ field: "endPrice", message: t("macro.inflation.error.negativePrice") });
    }
    if (years === null || years <= 0) {
      errors.push({ field: "years", message: t("macro.inflation.error.invalidYears") });
    }
    return errors;
  }, [startPrice, endPrice, infYears, t]);

  const validatePPInputs = useCallback((): FieldValidationError[] => {
    const errors: FieldValidationError[] = [];
    const amount = parseOptionalNumber(ppAmount);
    const rate = parseOptionalNumber(ppRate);
    const years = parseOptionalNumber(ppYears);

    if (amount === null || amount < 0) {
      errors.push({ field: "amount", message: t("macro.purchasingPower.error.negativeAmount") });
    }
    if (rate === null || rate <= -100) {
      errors.push({ field: "rate", message: t("macro.purchasingPower.error.invalidRate") });
    }
    if (years === null || years < 0) {
      errors.push({ field: "years", message: t("macro.purchasingPower.error.invalidYears") });
    }
    return errors;
  }, [ppAmount, ppRate, ppYears, t]);

  const validateRealRateInputs = useCallback((): FieldValidationError[] => {
    const errors: FieldValidationError[] = [];
    const nominal = parseOptionalNumber(nominalRate);
    const inflation = parseOptionalNumber(realInfRate);

    if (nominal === null || nominal <= -100)
      errors.push({ field: "nominal", message: t("macro.realRate.error.invalidRate") });
    if (inflation === null || inflation <= -100)
      errors.push({ field: "inflation", message: t("macro.realRate.error.invalidRate") });

    return errors;
  }, [nominalRate, realInfRate, t]);

  const validateCPIInputs = useCallback((): FieldValidationError[] => {
    const errors: FieldValidationError[] = [];
    const amount = parseOptionalNumber(cpiAmount);
    const fromCpi = parseOptionalNumber(fromCPI);
    const toCpi = parseOptionalNumber(toCPI);

    if (amount === null || amount < 0) {
      errors.push({ field: "amount", message: t("macro.cpiAdjust.error.negativeAmount") });
    }
    if (fromCpi === null || fromCpi <= 0) {
      errors.push({ field: "fromCPI", message: t("macro.cpiAdjust.error.zeroCPI") });
    }
    if (toCpi === null || toCpi <= 0) {
      errors.push({ field: "toCPI", message: t("macro.cpiAdjust.error.zeroCPI") });
    }
    return errors;
  }, [cpiAmount, fromCPI, toCPI, t]);

  const validatePPPInputs = useCallback((): FieldValidationError[] => {
    const errors: FieldValidationError[] = [];
    const domestic = parseOptionalNumber(domesticPrice);
    const foreign = parseOptionalNumber(foreignPrice);

    if (domestic === null || domestic <= 0) {
      errors.push({ field: "domestic", message: t("macro.ppp.error.negativePrice") });
    }
    if (foreign === null || foreign <= 0) {
      errors.push({ field: "foreign", message: t("macro.ppp.error.zeroForeign") });
    }
    return errors;
  }, [domesticPrice, foreignPrice, t]);

  // Real-time calculations
  const infResult = useMemo(() => {
    const errors = validateInflationInputs();
    if (errors.length > 0) return null;

    const start = parseOptionalNumber(startPrice);
    const end = parseOptionalNumber(endPrice);
    const years = parseOptionalNumber(infYears);
    if (start === null || end === null || years === null) return null;
    const result = Finance.inflationRate(start, end, years);
    return Number.isFinite(result) ? result : null;
  }, [startPrice, endPrice, infYears, validateInflationInputs]);

  const ppResult = useMemo(() => {
    const errors = validatePPInputs();
    if (errors.length > 0) return null;

    const amount = parseOptionalNumber(ppAmount);
    const rate = parseOptionalNumber(ppRate);
    const years = parseOptionalNumber(ppYears);
    if (amount === null || rate === null || years === null) return null;
    const result = Finance.purchasingPower(amount, rate / 100, years);
    return Number.isFinite(result) ? result : null;
  }, [ppAmount, ppRate, ppYears, validatePPInputs]);

  const realResult = useMemo(() => {
    const errors = validateRealRateInputs();
    if (errors.length > 0) return null;

    const nominal = parseOptionalNumber(nominalRate);
    const inflation = parseOptionalNumber(realInfRate);
    if (nominal === null || inflation === null) return null;
    const result = Finance.realInterestRate(nominal / 100, inflation / 100);
    return Number.isFinite(result) ? result : null;
  }, [nominalRate, realInfRate, validateRealRateInputs]);

  const cpiResult = useMemo(() => {
    const errors = validateCPIInputs();
    if (errors.length > 0) return null;

    const amount = parseOptionalNumber(cpiAmount);
    const fromCpi = parseOptionalNumber(fromCPI);
    const toCpi = parseOptionalNumber(toCPI);
    if (amount === null || fromCpi === null || toCpi === null) return null;
    const result = Finance.cpiAdjust(amount, fromCpi, toCpi);
    return Number.isFinite(result) ? result : null;
  }, [cpiAmount, fromCPI, toCPI, validateCPIInputs]);

  const pppResult = useMemo(() => {
    const errors = validatePPPInputs();
    if (errors.length > 0) return null;

    const domestic = parseOptionalNumber(domesticPrice);
    const foreign = parseOptionalNumber(foreignPrice);
    if (domestic === null || foreign === null) return null;
    const result = Finance.exchangeRatePPP(domestic, foreign);
    return Number.isFinite(result) ? result : null;
  }, [domesticPrice, foreignPrice, validatePPPInputs]);

  const inflationErrors = useMemo(() => validateInflationInputs(), [validateInflationInputs]);
  const ppErrors = useMemo(() => validatePPInputs(), [validatePPInputs]);
  const realRateErrors = useMemo(() => validateRealRateInputs(), [validateRealRateInputs]);
  const cpiErrors = useMemo(() => validateCPIInputs(), [validateCPIInputs]);
  const pppErrors = useMemo(() => validatePPPInputs(), [validatePPPInputs]);
  const macroActionConfig = useMemo<MacroActionConfig | null>(() => {
    if (activeTab === "inflation" && isFiniteNumber(infResult)) {
      const value = `${(infResult * 100).toFixed(4)}%`;
      return makeMacroActionConfig({
        title: t("macro.inflation.title"),
        results: { [t("macro.inflation.rate")]: value },
        inputs: { startPrice, endPrice, years: infYears },
        exportData: [{ metric: t("macro.inflation.rate"), value }],
        exportJson: { startPrice, endPrice, years: infYears, inflationRate: infResult },
        pdfElementId: "macro-inflation-report-content",
        pdfFilename: "macro-inflation",
      });
    }

    if (activeTab === "purchasingPower" && isFiniteNumber(ppResult)) {
      const loss = (parseOptionalNumber(ppAmount) ?? 0) - ppResult;
      return makeMacroActionConfig({
        title: t("macro.purchasingPower.title"),
        results: {
          [t("macro.purchasingPower.futureValue")]: ppResult,
          [t("macro.purchasingPower.loss")]: loss,
        },
        inputs: { amount: ppAmount, inflation: ppRate, years: ppYears },
        exportData: [
          { metric: t("macro.purchasingPower.futureValue"), value: ppResult },
          { metric: t("macro.purchasingPower.loss"), value: loss },
        ],
        exportJson: { amount: ppAmount, inflation: ppRate, years: ppYears, futureValue: ppResult, loss },
        pdfElementId: "macro-purchasing-power-report-content",
        pdfFilename: "macro-purchasing-power",
      });
    }

    if (activeTab === "realRate" && isFiniteNumber(realResult)) {
      const value = `${(realResult * 100).toFixed(4)}%`;
      return makeMacroActionConfig({
        title: t("macro.realRate.title"),
        results: { [t("macro.realRate.real")]: value },
        inputs: { nominalRate, inflation: realInfRate },
        exportData: [{ metric: t("macro.realRate.real"), value }],
        exportJson: { nominalRate, inflation: realInfRate, realRate: realResult },
        pdfElementId: "macro-real-rate-report-content",
        pdfFilename: "macro-real-rate",
      });
    }

    if (activeTab === "cpiAdjust" && isFiniteNumber(cpiResult)) {
      return makeMacroActionConfig({
        title: t("macro.cpiAdjust.title"),
        results: { [t("macro.cpiAdjust.adjusted")]: cpiResult },
        inputs: { amount: cpiAmount, fromCPI, toCPI },
        exportData: [{ metric: t("macro.cpiAdjust.adjusted"), value: cpiResult }],
        exportJson: { amount: cpiAmount, fromCPI, toCPI, adjustedAmount: cpiResult },
        pdfElementId: "macro-cpi-adjust-report-content",
        pdfFilename: "macro-cpi-adjust",
      });
    }

    if (activeTab === "ppp" && isFiniteNumber(pppResult)) {
      return makeMacroActionConfig({
        title: t("macro.ppp.title"),
        results: { [t("macro.ppp.rate")]: pppResult.toFixed(4) },
        inputs: { domesticPrice, foreignPrice },
        exportData: [{ metric: t("macro.ppp.rate"), value: pppResult.toFixed(4) }],
        exportJson: { domesticPrice, foreignPrice, pppRate: pppResult },
        pdfElementId: "macro-ppp-report-content",
        pdfFilename: "macro-ppp",
      });
    }

    return null;
  }, [
    activeTab,
    cpiAmount,
    cpiResult,
    domesticPrice,
    endPrice,
    foreignPrice,
    fromCPI,
    infResult,
    infYears,
    nominalRate,
    ppAmount,
    ppRate,
    ppResult,
    ppYears,
    pppResult,
    realInfRate,
    realResult,
    startPrice,
    t,
    toCPI,
  ]);

  const macroHistoryEntry = useMemo<{
    inputs: Record<string, number | string>;
    result: number;
    label: string;
    resultFormat?: "currency" | "percent" | "ratio";
  }>(() => {
    if (!macroActionConfig) {
      return { inputs: {} as Record<string, number | string>, result: Number.NaN, label: "" };
    }

    if (activeTab === "inflation" && isFiniteNumber(infResult)) {
      return {
        inputs: { calculator: activeTab, startPrice, endPrice, years: infYears } as Record<string, number | string>,
        result: infResult * 100,
        label: t("macro.inflation.rate"),
        resultFormat: "percent",
      };
    }

    if (activeTab === "purchasingPower" && isFiniteNumber(ppResult)) {
      return {
        inputs: { calculator: activeTab, amount: ppAmount, inflation: ppRate, years: ppYears } as Record<
          string,
          number | string
        >,
        result: ppResult,
        label: t("macro.purchasingPower.futureValue"),
        resultFormat: "currency",
      };
    }

    if (activeTab === "realRate" && isFiniteNumber(realResult)) {
      return {
        inputs: { calculator: activeTab, nominalRate, inflation: realInfRate } as Record<string, number | string>,
        result: realResult * 100,
        label: t("macro.realRate.real"),
        resultFormat: "percent",
      };
    }

    if (activeTab === "cpiAdjust" && isFiniteNumber(cpiResult)) {
      return {
        inputs: { calculator: activeTab, amount: cpiAmount, fromCPI, toCPI } as Record<string, number | string>,
        result: cpiResult,
        label: t("macro.cpiAdjust.adjusted"),
        resultFormat: "currency",
      };
    }

    if (activeTab === "ppp" && isFiniteNumber(pppResult)) {
      return {
        inputs: { calculator: activeTab, domesticPrice, foreignPrice } as Record<string, number | string>,
        result: pppResult,
        label: t("macro.ppp.rate"),
        resultFormat: "ratio",
      };
    }

    return { inputs: {} as Record<string, number | string>, result: Number.NaN, label: "" };
  }, [
    activeTab,
    cpiAmount,
    cpiResult,
    domesticPrice,
    endPrice,
    foreignPrice,
    fromCPI,
    infResult,
    infYears,
    macroActionConfig,
    nominalRate,
    ppAmount,
    ppRate,
    ppResult,
    ppYears,
    pppResult,
    realInfRate,
    realResult,
    startPrice,
    t,
    toCPI,
  ]);

  useHistoryRecorder({
    addToHistory,
    inputs: macroHistoryEntry.inputs,
    result: macroHistoryEntry.result,
    label: macroHistoryEntry.label,
    resultFormat: macroHistoryEntry.resultFormat,
    enabled: hasInteracted && macroActionConfig !== null,
  });

  const restoreMacroInputs = (inputs: Record<string, number | string>) => {
    if (inputs.calculator !== undefined) {
      setActiveTab(normalizeMacroTab(inputs.calculator, activeTab));
    }
    if (inputs.startPrice !== undefined) setStartPrice(String(inputs.startPrice));
    if (inputs.endPrice !== undefined) setEndPrice(String(inputs.endPrice));
    if (inputs.years !== undefined) {
      setInfYears(String(inputs.years));
      setPpYears(String(inputs.years));
    }
    if (inputs.amount !== undefined) {
      setPpAmount(String(inputs.amount));
      setCpiAmount(String(inputs.amount));
    }
    if (inputs.inflation !== undefined) {
      setPpRate(String(inputs.inflation));
      setRealInfRate(String(inputs.inflation));
    }
    if (inputs.nominalRate !== undefined) setNominalRate(String(inputs.nominalRate));
    if (inputs.fromCPI !== undefined) setFromCPI(String(inputs.fromCPI));
    if (inputs.toCPI !== undefined) setToCPI(String(inputs.toCPI));
    if (inputs.domesticPrice !== undefined) setDomesticPrice(String(inputs.domesticPrice));
    if (inputs.foreignPrice !== undefined) setForeignPrice(String(inputs.foreignPrice));
    setHasInteracted(false);
  };

  const shareUrl = useShareableUrl({
    prefix: "macro",
    state: {
      calculator: activeTab,
      startPrice,
      endPrice,
      infYears,
      ppAmount,
      ppRate,
      ppYears,
      nominalRate,
      realInfRate,
      cpiAmount,
      fromCPI,
      toCPI,
      domesticPrice,
      foreignPrice,
    },
    onRestore: (inputs) => {
      const restoredInputs = Object.fromEntries(
        Object.entries(inputs).filter(([, value]) => value !== undefined && !Array.isArray(value))
      ) as Record<string, number | string>;
      const restoredYears = inputs.infYears ?? inputs.ppYears;
      const restoredInflation = inputs.ppRate ?? inputs.realInfRate;
      const restoredAmount = inputs.ppAmount ?? inputs.cpiAmount;

      if (restoredYears !== undefined) restoredInputs.years = restoredYears;
      if (restoredInflation !== undefined) restoredInputs.inflation = restoredInflation;
      if (restoredAmount !== undefined) restoredInputs.amount = restoredAmount;

      restoreMacroInputs(restoredInputs);
      if (inputs.infYears !== undefined) setInfYears(String(inputs.infYears));
      if (inputs.ppYears !== undefined) setPpYears(String(inputs.ppYears));
      if (inputs.ppRate !== undefined) setPpRate(String(inputs.ppRate));
      if (inputs.realInfRate !== undefined) setRealInfRate(String(inputs.realInfRate));
      if (inputs.ppAmount !== undefined) setPpAmount(String(inputs.ppAmount));
      if (inputs.cpiAmount !== undefined) setCpiAmount(String(inputs.cpiAmount));
    },
  });

  const inflationStartError = inflationErrors.find((error) => error.field === "startPrice")?.message ?? null;
  const inflationEndError = inflationErrors.find((error) => error.field === "endPrice")?.message ?? null;
  const inflationYearsError = inflationErrors.find((error) => error.field === "years")?.message ?? null;
  const ppAmountError = ppErrors.find((error) => error.field === "amount")?.message ?? null;
  const ppRateError = ppErrors.find((error) => error.field === "rate")?.message ?? null;
  const ppYearsError = ppErrors.find((error) => error.field === "years")?.message ?? null;
  const nominalRateError = realRateErrors.find((error) => error.field === "nominal")?.message ?? null;
  const realInflationError = realRateErrors.find((error) => error.field === "inflation")?.message ?? null;
  const cpiAmountError = cpiErrors.find((error) => error.field === "amount")?.message ?? null;
  const cpiFromError = cpiErrors.find((error) => error.field === "fromCPI")?.message ?? null;
  const cpiToError = cpiErrors.find((error) => error.field === "toCPI")?.message ?? null;
  const pppDomesticError = pppErrors.find((error) => error.field === "domestic")?.message ?? null;
  const pppForeignError = pppErrors.find((error) => error.field === "foreign")?.message ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t("macro.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("macro.subtitle")}</p>
        </div>
        <HistoryPanel page="macro" onRestore={restoreMacroInputs} />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(normalizeMacroTab(value))} className="space-y-6">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg p-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
          <TabsTrigger
            value="inflation"
            className="min-h-10 min-w-12 flex-none px-3 sm:flex-1"
            aria-label={t("macro.inflation.tab")}
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.inflation.tab")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="purchasingPower"
            className="min-h-10 min-w-12 flex-none px-3 sm:flex-1"
            aria-label={t("macro.purchasingPower.tab")}
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.purchasingPower.tab")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="realRate"
            className="min-h-10 min-w-12 flex-none px-3 sm:flex-1"
            aria-label={t("macro.realRate.tab")}
          >
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.realRate.tab")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="cpiAdjust"
            className="min-h-10 min-w-12 flex-none px-3 sm:flex-1"
            aria-label={t("macro.cpiAdjust.tab")}
          >
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.cpiAdjust.tab")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="ppp"
            className="min-h-10 min-w-12 flex-none px-3 sm:flex-1"
            aria-label={t("macro.ppp.tab")}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.ppp.tab")}</span>
          </TabsTrigger>
        </TabsList>

        {macroActionConfig ? (
          <div className="flex justify-end">
            <ResultActions
              title={macroActionConfig.title}
              results={macroActionConfig.results}
              inputs={macroActionConfig.inputs}
              shareUrl={shareUrl}
              exportData={macroActionConfig.exportData}
              exportJson={macroActionConfig.exportJson}
              pdfElementId={macroActionConfig.pdfElementId}
              pdfFilename={macroActionConfig.pdfFilename}
              pdfTitle={macroActionConfig.title}
            />
          </div>
        ) : null}

        {/* Inflation Rate Calculator */}
        <TabsContent value="inflation">
          <div id="macro-inflation-report-content" className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t("macro.inflation.title")}
                </CardTitle>
                <CardDescription>{t("macro.inflation.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="macro-inflation-start">{t("macro.inflation.startPrice")}</Label>
                  <Input
                    id="macro-inflation-start"
                    type="number"
                    value={startPrice}
                    onChange={(e) => updateField(setStartPrice)(e.target.value)}
                    min="0"
                    step="0.01"
                    aria-invalid={Boolean(inflationStartError)}
                    aria-describedby={inflationStartError ? "macro-inflation-start-error" : undefined}
                  />
                  <ValidationError id="macro-inflation-start-error" error={inflationStartError} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-inflation-end">{t("macro.inflation.endPrice")}</Label>
                  <Input
                    id="macro-inflation-end"
                    type="number"
                    value={endPrice}
                    onChange={(e) => updateField(setEndPrice)(e.target.value)}
                    min="0"
                    step="0.01"
                    aria-invalid={Boolean(inflationEndError)}
                    aria-describedby={inflationEndError ? "macro-inflation-end-error" : undefined}
                  />
                  <ValidationError id="macro-inflation-end-error" error={inflationEndError} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-inflation-years">{t("macro.inflation.years")}</Label>
                  <Input
                    id="macro-inflation-years"
                    type="number"
                    value={infYears}
                    onChange={(e) => updateField(setInfYears)(e.target.value)}
                    min="0"
                    step="0.1"
                    aria-invalid={Boolean(inflationYearsError)}
                    aria-describedby={inflationYearsError ? "macro-inflation-years-error" : undefined}
                  />
                  <ValidationError id="macro-inflation-years-error" error={inflationYearsError} />
                </div>
                {inflationErrors.length > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{inflationErrors[0].message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="flex min-w-0 flex-col items-center justify-center bg-muted/30 p-4">
              <div className="min-w-0 max-w-full space-y-2 text-center">
                <h3 className="text-lg font-medium text-muted-foreground">{t("macro.inflation.rate")}</h3>
                <div className="max-w-full break-words text-4xl font-bold text-primary sm:text-5xl">
                  {isFiniteNumber(infResult) ? `${(infResult * 100).toFixed(4)}%` : EMPTY_RESULT}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Purchasing Power Calculator */}
        <TabsContent value="purchasingPower">
          <div id="macro-purchasing-power-report-content" className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  {t("macro.purchasingPower.title")}
                </CardTitle>
                <CardDescription>{t("macro.purchasingPower.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="macro-pp-amount">{t("macro.purchasingPower.amount")}</Label>
                  <Input
                    id="macro-pp-amount"
                    type="number"
                    value={ppAmount}
                    onChange={(e) => updateField(setPpAmount)(e.target.value)}
                    min="0"
                    step="0.01"
                    aria-invalid={Boolean(ppAmountError)}
                    aria-describedby={ppAmountError ? "macro-pp-amount-error" : undefined}
                  />
                  <ValidationError id="macro-pp-amount-error" error={ppAmountError} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-pp-rate">{t("macro.purchasingPower.inflation")}</Label>
                  <Input
                    id="macro-pp-rate"
                    type="number"
                    value={ppRate}
                    onChange={(e) => updateField(setPpRate)(e.target.value)}
                    step="0.01"
                    aria-invalid={Boolean(ppRateError)}
                    aria-describedby={ppRateError ? "macro-pp-rate-error" : undefined}
                  />
                  <ValidationError id="macro-pp-rate-error" error={ppRateError} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-pp-years">{t("macro.purchasingPower.years")}</Label>
                  <Input
                    id="macro-pp-years"
                    type="number"
                    value={ppYears}
                    onChange={(e) => updateField(setPpYears)(e.target.value)}
                    min="0"
                    step="0.1"
                    aria-invalid={Boolean(ppYearsError)}
                    aria-describedby={ppYearsError ? "macro-pp-years-error" : undefined}
                  />
                  <ValidationError id="macro-pp-years-error" error={ppYearsError} />
                </div>
                {ppErrors.length > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{ppErrors[0].message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="flex min-w-0 flex-col items-center justify-center bg-muted/30 p-4">
              <div className="min-w-0 max-w-full space-y-6 text-center">
                <div className="min-w-0">
                  <h3 className="text-lg font-medium text-muted-foreground">
                    {t("macro.purchasingPower.futureValue")}
                  </h3>
                  <div className="mt-2 max-w-full break-words text-3xl font-bold text-primary sm:text-4xl">
                    {isFiniteNumber(ppResult) ? formatCurrency(ppResult) : EMPTY_RESULT}
                  </div>
                </div>
                {isFiniteNumber(ppResult) && (
                  <div className="max-w-full rounded-lg bg-red-50 p-4 dark:bg-red-950">
                    <p className="text-sm text-muted-foreground">{t("macro.purchasingPower.loss")}</p>
                    <p className="break-words text-2xl font-bold text-red-600">
                      {formatCurrency((parseOptionalNumber(ppAmount) ?? 0) - ppResult)}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Real Interest Rate Calculator */}
        <TabsContent value="realRate">
          <div id="macro-real-rate-report-content" className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  {t("macro.realRate.title")}
                </CardTitle>
                <CardDescription>{t("macro.realRate.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="macro-real-nominal">{t("macro.realRate.nominal")}</Label>
                  <Input
                    id="macro-real-nominal"
                    type="number"
                    value={nominalRate}
                    onChange={(e) => updateField(setNominalRate)(e.target.value)}
                    step="0.01"
                    aria-invalid={Boolean(nominalRateError)}
                    aria-describedby={nominalRateError ? "macro-real-nominal-error" : undefined}
                  />
                  <ValidationError id="macro-real-nominal-error" error={nominalRateError} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-real-inflation">{t("macro.realRate.inflation")}</Label>
                  <Input
                    id="macro-real-inflation"
                    type="number"
                    value={realInfRate}
                    onChange={(e) => updateField(setRealInfRate)(e.target.value)}
                    step="0.01"
                    aria-invalid={Boolean(realInflationError)}
                    aria-describedby={realInflationError ? "macro-real-inflation-error" : undefined}
                  />
                  <ValidationError id="macro-real-inflation-error" error={realInflationError} />
                </div>
                {realRateErrors.length > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{realRateErrors[0].message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="flex min-w-0 flex-col items-center justify-center bg-muted/30 p-4">
              <div className="min-w-0 max-w-full space-y-2 text-center">
                <h3 className="text-lg font-medium text-muted-foreground">{t("macro.realRate.real")}</h3>
                <div className="max-w-full break-words text-4xl font-bold text-primary sm:text-5xl">
                  {isFiniteNumber(realResult) ? `${(realResult * 100).toFixed(4)}%` : EMPTY_RESULT}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* CPI Adjustment Calculator */}
        <TabsContent value="cpiAdjust">
          <div id="macro-cpi-adjust-report-content" className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  {t("macro.cpiAdjust.title")}
                </CardTitle>
                <CardDescription>{t("macro.cpiAdjust.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="macro-cpi-amount">{t("macro.cpiAdjust.amount")}</Label>
                  <Input
                    id="macro-cpi-amount"
                    type="number"
                    value={cpiAmount}
                    onChange={(e) => updateField(setCpiAmount)(e.target.value)}
                    min="0"
                    step="0.01"
                    aria-invalid={Boolean(cpiAmountError)}
                    aria-describedby={cpiAmountError ? "macro-cpi-amount-error" : undefined}
                  />
                  <ValidationError id="macro-cpi-amount-error" error={cpiAmountError} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-cpi-from">{t("macro.cpiAdjust.fromCPI")}</Label>
                  <Input
                    id="macro-cpi-from"
                    type="number"
                    value={fromCPI}
                    onChange={(e) => updateField(setFromCPI)(e.target.value)}
                    min="0"
                    step="0.01"
                    aria-invalid={Boolean(cpiFromError)}
                    aria-describedby={cpiFromError ? "macro-cpi-from-error" : undefined}
                  />
                  <ValidationError id="macro-cpi-from-error" error={cpiFromError} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-cpi-to">{t("macro.cpiAdjust.toCPI")}</Label>
                  <Input
                    id="macro-cpi-to"
                    type="number"
                    value={toCPI}
                    onChange={(e) => updateField(setToCPI)(e.target.value)}
                    min="0"
                    step="0.01"
                    aria-invalid={Boolean(cpiToError)}
                    aria-describedby={cpiToError ? "macro-cpi-to-error" : undefined}
                  />
                  <ValidationError id="macro-cpi-to-error" error={cpiToError} />
                </div>
                {cpiErrors.length > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{cpiErrors[0].message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="flex min-w-0 flex-col items-center justify-center bg-muted/30 p-4">
              <div className="min-w-0 max-w-full space-y-2 text-center">
                <h3 className="text-lg font-medium text-muted-foreground">{t("macro.cpiAdjust.adjusted")}</h3>
                <div className="max-w-full break-words text-4xl font-bold text-primary sm:text-5xl">
                  {isFiniteNumber(cpiResult) ? formatCurrency(cpiResult) : EMPTY_RESULT}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* PPP Exchange Rate Calculator */}
        <TabsContent value="ppp">
          <div id="macro-ppp-report-content" className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {t("macro.ppp.title")}
                </CardTitle>
                <CardDescription>{t("macro.ppp.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="macro-ppp-domestic">{t("macro.ppp.domestic")}</Label>
                  <Input
                    id="macro-ppp-domestic"
                    type="number"
                    value={domesticPrice}
                    onChange={(e) => updateField(setDomesticPrice)(e.target.value)}
                    min="0"
                    step="0.01"
                    aria-invalid={Boolean(pppDomesticError)}
                    aria-describedby={pppDomesticError ? "macro-ppp-domestic-error" : undefined}
                  />
                  <ValidationError id="macro-ppp-domestic-error" error={pppDomesticError} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-ppp-foreign">{t("macro.ppp.foreign")}</Label>
                  <Input
                    id="macro-ppp-foreign"
                    type="number"
                    value={foreignPrice}
                    onChange={(e) => updateField(setForeignPrice)(e.target.value)}
                    min="0"
                    step="0.01"
                    aria-invalid={Boolean(pppForeignError)}
                    aria-describedby={pppForeignError ? "macro-ppp-foreign-error" : undefined}
                  />
                  <ValidationError id="macro-ppp-foreign-error" error={pppForeignError} />
                </div>
                {pppErrors.length > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{pppErrors[0].message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="flex min-w-0 flex-col items-center justify-center bg-muted/30 p-4">
              <div className="min-w-0 max-w-full space-y-2 text-center">
                <h3 className="text-lg font-medium text-muted-foreground">{t("macro.ppp.rate")}</h3>
                <div className="max-w-full break-words text-4xl font-bold text-primary sm:text-5xl">
                  {isFiniteNumber(pppResult) ? pppResult.toFixed(4) : EMPTY_RESULT}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t("macro.ppp.rateDesc")}</p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
