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

interface ValidationError {
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

function makeMacroActionConfig(config: MacroActionConfig): MacroActionConfig {
  return config;
}

export default function MacroPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("inflation");

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
  const validateInflationInputs = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
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

  const validatePPInputs = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
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

  const validateRealRateInputs = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    const nominal = parseOptionalNumber(nominalRate);
    const inflation = parseOptionalNumber(realInfRate);

    if (nominal === null || inflation === null || inflation <= -100) {
      errors.push({ field: "rate", message: t("macro.realRate.error.invalidRate") });
    }

    return errors;
  }, [nominalRate, realInfRate, t]);

  const validateCPIInputs = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
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

  const validatePPPInputs = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
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
    return Finance.inflationRate(start, end, years);
  }, [startPrice, endPrice, infYears, validateInflationInputs]);

  const ppResult = useMemo(() => {
    const errors = validatePPInputs();
    if (errors.length > 0) return null;

    const amount = parseOptionalNumber(ppAmount);
    const rate = parseOptionalNumber(ppRate);
    const years = parseOptionalNumber(ppYears);
    if (amount === null || rate === null || years === null) return null;
    return Finance.purchasingPower(amount, rate / 100, years);
  }, [ppAmount, ppRate, ppYears, validatePPInputs]);

  const realResult = useMemo(() => {
    const errors = validateRealRateInputs();
    if (errors.length > 0) return null;

    const nominal = parseOptionalNumber(nominalRate);
    const inflation = parseOptionalNumber(realInfRate);
    if (nominal === null || inflation === null) return null;
    return Finance.realInterestRate(nominal / 100, inflation / 100);
  }, [nominalRate, realInfRate, validateRealRateInputs]);

  const cpiResult = useMemo(() => {
    const errors = validateCPIInputs();
    if (errors.length > 0) return null;

    const amount = parseOptionalNumber(cpiAmount);
    const fromCpi = parseOptionalNumber(fromCPI);
    const toCpi = parseOptionalNumber(toCPI);
    if (amount === null || fromCpi === null || toCpi === null) return null;
    return Finance.cpiAdjust(amount, fromCpi, toCpi);
  }, [cpiAmount, fromCPI, toCPI, validateCPIInputs]);

  const pppResult = useMemo(() => {
    const errors = validatePPPInputs();
    if (errors.length > 0) return null;

    const domestic = parseOptionalNumber(domesticPrice);
    const foreign = parseOptionalNumber(foreignPrice);
    if (domestic === null || foreign === null) return null;
    return Finance.exchangeRatePPP(domestic, foreign);
  }, [domesticPrice, foreignPrice, validatePPPInputs]);

  const inflationErrors = useMemo(() => validateInflationInputs(), [validateInflationInputs]);
  const ppErrors = useMemo(() => validatePPInputs(), [validatePPInputs]);
  const realRateErrors = useMemo(() => validateRealRateInputs(), [validateRealRateInputs]);
  const cpiErrors = useMemo(() => validateCPIInputs(), [validateCPIInputs]);
  const pppErrors = useMemo(() => validatePPPInputs(), [validatePPPInputs]);
  const macroActionConfig = useMemo<MacroActionConfig | null>(() => {
    if (activeTab === "inflation" && infResult !== null && !isNaN(infResult)) {
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

    if (activeTab === "purchasingPower" && ppResult !== null && !isNaN(ppResult)) {
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

    if (activeTab === "realRate" && realResult !== null && !isNaN(realResult)) {
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

    if (activeTab === "cpiAdjust" && cpiResult !== null && !isNaN(cpiResult)) {
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

    if (activeTab === "ppp" && pppResult !== null && !isNaN(pppResult)) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("macro.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("macro.subtitle")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inflation" className="flex items-center gap-2" aria-label={t("macro.inflation.tab")}>
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.inflation.tab")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="purchasingPower"
            className="flex items-center gap-2"
            aria-label={t("macro.purchasingPower.tab")}
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.purchasingPower.tab")}</span>
          </TabsTrigger>
          <TabsTrigger value="realRate" className="flex items-center gap-2" aria-label={t("macro.realRate.tab")}>
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.realRate.tab")}</span>
          </TabsTrigger>
          <TabsTrigger value="cpiAdjust" className="flex items-center gap-2" aria-label={t("macro.cpiAdjust.tab")}>
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.cpiAdjust.tab")}</span>
          </TabsTrigger>
          <TabsTrigger value="ppp" className="flex items-center gap-2" aria-label={t("macro.ppp.tab")}>
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
                    onChange={(e) => setStartPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <ValidationError error={inflationErrors.find((e) => e.field === "startPrice")?.message ?? null} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-inflation-end">{t("macro.inflation.endPrice")}</Label>
                  <Input
                    id="macro-inflation-end"
                    type="number"
                    value={endPrice}
                    onChange={(e) => setEndPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <ValidationError error={inflationErrors.find((e) => e.field === "endPrice")?.message ?? null} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-inflation-years">{t("macro.inflation.years")}</Label>
                  <Input
                    id="macro-inflation-years"
                    type="number"
                    value={infYears}
                    onChange={(e) => setInfYears(e.target.value)}
                    min="0"
                    step="0.1"
                  />
                  <ValidationError error={inflationErrors.find((e) => e.field === "years")?.message ?? null} />
                </div>
                {inflationErrors.length > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{inflationErrors[0].message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-muted/30">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">{t("macro.inflation.rate")}</h3>
                <div className="text-5xl font-bold text-primary tracking-tighter">
                  {infResult !== null && !isNaN(infResult) ? `${(infResult * 100).toFixed(4)}%` : EMPTY_RESULT}
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
                    onChange={(e) => setPpAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <ValidationError error={ppErrors.find((e) => e.field === "amount")?.message ?? null} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-pp-rate">{t("macro.purchasingPower.inflation")}</Label>
                  <Input
                    id="macro-pp-rate"
                    type="number"
                    value={ppRate}
                    onChange={(e) => setPpRate(e.target.value)}
                    step="0.01"
                  />
                  <ValidationError error={ppErrors.find((e) => e.field === "rate")?.message ?? null} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-pp-years">{t("macro.purchasingPower.years")}</Label>
                  <Input
                    id="macro-pp-years"
                    type="number"
                    value={ppYears}
                    onChange={(e) => setPpYears(e.target.value)}
                    min="0"
                    step="0.1"
                  />
                  <ValidationError error={ppErrors.find((e) => e.field === "years")?.message ?? null} />
                </div>
                {ppErrors.length > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{ppErrors[0].message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-muted/30">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-muted-foreground">
                    {t("macro.purchasingPower.futureValue")}
                  </h3>
                  <div className="text-4xl font-bold text-primary tracking-tighter mt-2">
                    {ppResult !== null && !isNaN(ppResult) ? formatCurrency(ppResult) : EMPTY_RESULT}
                  </div>
                </div>
                {ppResult !== null && !isNaN(ppResult) && (
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p className="text-sm text-muted-foreground">{t("macro.purchasingPower.loss")}</p>
                    <p className="text-2xl font-bold text-red-600">
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
                    onChange={(e) => setNominalRate(e.target.value)}
                    step="0.01"
                  />
                  <ValidationError error={realRateErrors.find((e) => e.field === "rate")?.message ?? null} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-real-inflation">{t("macro.realRate.inflation")}</Label>
                  <Input
                    id="macro-real-inflation"
                    type="number"
                    value={realInfRate}
                    onChange={(e) => setRealInfRate(e.target.value)}
                    step="0.01"
                  />
                  <ValidationError error={realRateErrors.find((e) => e.field === "rate")?.message ?? null} />
                </div>
                {realRateErrors.length > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{realRateErrors[0].message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-muted/30">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">{t("macro.realRate.real")}</h3>
                <div className="text-5xl font-bold text-primary tracking-tighter">
                  {realResult !== null && !isNaN(realResult) ? `${(realResult * 100).toFixed(4)}%` : EMPTY_RESULT}
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
                    onChange={(e) => setCpiAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  {cpiErrors.find((e) => e.field === "amount") && (
                    <p className="text-sm text-red-500">{cpiErrors.find((e) => e.field === "amount")?.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-cpi-from">{t("macro.cpiAdjust.fromCPI")}</Label>
                  <Input
                    id="macro-cpi-from"
                    type="number"
                    value={fromCPI}
                    onChange={(e) => setFromCPI(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  {cpiErrors.find((e) => e.field === "fromCPI") && (
                    <p className="text-sm text-red-500">{cpiErrors.find((e) => e.field === "fromCPI")?.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-cpi-to">{t("macro.cpiAdjust.toCPI")}</Label>
                  <Input
                    id="macro-cpi-to"
                    type="number"
                    value={toCPI}
                    onChange={(e) => setToCPI(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  {cpiErrors.find((e) => e.field === "toCPI") && (
                    <p className="text-sm text-red-500">{cpiErrors.find((e) => e.field === "toCPI")?.message}</p>
                  )}
                </div>
                {cpiErrors.length > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{cpiErrors[0].message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-muted/30">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">{t("macro.cpiAdjust.adjusted")}</h3>
                <div className="text-5xl font-bold text-primary tracking-tighter">
                  {cpiResult !== null && !isNaN(cpiResult) ? formatCurrency(cpiResult) : EMPTY_RESULT}
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
                    onChange={(e) => setDomesticPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  {pppErrors.find((e) => e.field === "domestic") && (
                    <p className="text-sm text-red-500">{pppErrors.find((e) => e.field === "domestic")?.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macro-ppp-foreign">{t("macro.ppp.foreign")}</Label>
                  <Input
                    id="macro-ppp-foreign"
                    type="number"
                    value={foreignPrice}
                    onChange={(e) => setForeignPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  {pppErrors.find((e) => e.field === "foreign") && (
                    <p className="text-sm text-red-500">{pppErrors.find((e) => e.field === "foreign")?.message}</p>
                  )}
                </div>
                {pppErrors.length > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{pppErrors[0].message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-muted/30">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">{t("macro.ppp.rate")}</h3>
                <div className="text-5xl font-bold text-primary tracking-tighter">
                  {pppResult !== null && !isNaN(pppResult) ? pppResult.toFixed(4) : EMPTY_RESULT}
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
