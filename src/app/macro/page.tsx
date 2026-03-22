"use client";

import { useState, useMemo, useCallback } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/i18n";
import { TrendingUp, DollarSign, Percent, Scale, Globe } from "lucide-react";

interface ValidationError {
  field: string;
  message: string;
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
    const start = parseFloat(startPrice);
    const end = parseFloat(endPrice);
    const years = parseFloat(infYears);

    if (isNaN(start) || start <= 0) {
      errors.push({ field: "startPrice", message: t("macro.inflation.error.negativePrice") });
    }
    if (isNaN(end) || end <= 0) {
      errors.push({ field: "endPrice", message: t("macro.inflation.error.negativePrice") });
    }
    if (isNaN(years) || years <= 0) {
      errors.push({ field: "years", message: t("macro.inflation.error.invalidYears") });
    }
    return errors;
  }, [startPrice, endPrice, infYears, t]);

  const validatePPInputs = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    const amount = parseFloat(ppAmount);
    const years = parseFloat(ppYears);

    if (isNaN(amount) || amount < 0) {
      errors.push({ field: "amount", message: t("macro.purchasingPower.error.negativeAmount") });
    }
    if (isNaN(years) || years < 0) {
      errors.push({ field: "years", message: t("macro.purchasingPower.error.invalidYears") });
    }
    return errors;
  }, [ppAmount, ppYears, t]);

  const validateCPIInputs = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    const amount = parseFloat(cpiAmount);
    const fromCpi = parseFloat(fromCPI);
    const toCpi = parseFloat(toCPI);

    if (isNaN(amount) || amount < 0) {
      errors.push({ field: "amount", message: t("macro.cpiAdjust.error.negativeAmount") });
    }
    if (isNaN(fromCpi) || fromCpi <= 0) {
      errors.push({ field: "fromCPI", message: t("macro.cpiAdjust.error.zeroCPI") });
    }
    if (isNaN(toCpi) || toCpi <= 0) {
      errors.push({ field: "toCPI", message: t("macro.cpiAdjust.error.zeroCPI") });
    }
    return errors;
  }, [cpiAmount, fromCPI, toCPI, t]);

  const validatePPPInputs = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    const domestic = parseFloat(domesticPrice);
    const foreign = parseFloat(foreignPrice);

    if (isNaN(domestic) || domestic <= 0) {
      errors.push({ field: "domestic", message: t("macro.ppp.error.negativePrice") });
    }
    if (isNaN(foreign) || foreign <= 0) {
      errors.push({ field: "foreign", message: t("macro.ppp.error.zeroForeign") });
    }
    return errors;
  }, [domesticPrice, foreignPrice, t]);

  // Real-time calculations
  const infResult = useMemo(() => {
    const errors = validateInflationInputs();
    if (errors.length > 0) return null;

    const start = parseFloat(startPrice);
    const end = parseFloat(endPrice);
    const years = parseFloat(infYears);
    return Finance.inflationRate(start, end, years);
  }, [startPrice, endPrice, infYears, validateInflationInputs]);

  const ppResult = useMemo(() => {
    const errors = validatePPInputs();
    if (errors.length > 0) return null;

    const amount = parseFloat(ppAmount);
    const rate = parseFloat(ppRate) / 100;
    const years = parseFloat(ppYears);
    return Finance.purchasingPower(amount, rate, years);
  }, [ppAmount, ppRate, ppYears, validatePPInputs]);

  const realResult = useMemo(() => {
    const nominal = parseFloat(nominalRate) / 100;
    const inflation = parseFloat(realInfRate) / 100;
    if (isNaN(nominal) || isNaN(inflation)) return null;
    return Finance.realInterestRate(nominal, inflation);
  }, [nominalRate, realInfRate]);

  const cpiResult = useMemo(() => {
    const errors = validateCPIInputs();
    if (errors.length > 0) return null;

    const amount = parseFloat(cpiAmount);
    const fromCpi = parseFloat(fromCPI);
    const toCpi = parseFloat(toCPI);
    return Finance.cpiAdjust(amount, fromCpi, toCpi);
  }, [cpiAmount, fromCPI, toCPI, validateCPIInputs]);

  const pppResult = useMemo(() => {
    const errors = validatePPPInputs();
    if (errors.length > 0) return null;

    const domestic = parseFloat(domesticPrice);
    const foreign = parseFloat(foreignPrice);
    return Finance.exchangeRatePPP(domestic, foreign);
  }, [domesticPrice, foreignPrice, validatePPPInputs]);

  const inflationErrors = validateInflationInputs();
  const ppErrors = validatePPInputs();
  const cpiErrors = validateCPIInputs();
  const pppErrors = validatePPPInputs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("macro.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("macro.subtitle")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inflation" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.inflation.tab")}</span>
          </TabsTrigger>
          <TabsTrigger value="purchasingPower" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.purchasingPower.tab")}</span>
          </TabsTrigger>
          <TabsTrigger value="realRate" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.realRate.tab")}</span>
          </TabsTrigger>
          <TabsTrigger value="cpiAdjust" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.cpiAdjust.tab")}</span>
          </TabsTrigger>
          <TabsTrigger value="ppp" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{t("macro.ppp.tab")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Inflation Rate Calculator */}
        <TabsContent value="inflation">
          <div className="grid gap-6 md:grid-cols-2">
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
                  <Label>{t("macro.inflation.startPrice")}</Label>
                  <Input
                    type="number"
                    value={startPrice}
                    onChange={(e) => setStartPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  {inflationErrors.find((e) => e.field === "startPrice") && (
                    <p className="text-sm text-red-500">
                      {inflationErrors.find((e) => e.field === "startPrice")?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("macro.inflation.endPrice")}</Label>
                  <Input
                    type="number"
                    value={endPrice}
                    onChange={(e) => setEndPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  {inflationErrors.find((e) => e.field === "endPrice") && (
                    <p className="text-sm text-red-500">
                      {inflationErrors.find((e) => e.field === "endPrice")?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("macro.inflation.years")}</Label>
                  <Input
                    type="number"
                    value={infYears}
                    onChange={(e) => setInfYears(e.target.value)}
                    min="0"
                    step="0.1"
                  />
                  {inflationErrors.find((e) => e.field === "years") && (
                    <p className="text-sm text-red-500">{inflationErrors.find((e) => e.field === "years")?.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-muted/30">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">{t("macro.inflation.rate")}</h3>
                <div className="text-5xl font-bold text-primary tracking-tighter">
                  {infResult !== null && !isNaN(infResult) ? `${(infResult * 100).toFixed(4)}%` : "—"}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Purchasing Power Calculator */}
        <TabsContent value="purchasingPower">
          <div className="grid gap-6 md:grid-cols-2">
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
                  <Label>{t("macro.purchasingPower.amount")}</Label>
                  <Input
                    type="number"
                    value={ppAmount}
                    onChange={(e) => setPpAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  {ppErrors.find((e) => e.field === "amount") && (
                    <p className="text-sm text-red-500">{ppErrors.find((e) => e.field === "amount")?.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("macro.purchasingPower.inflation")}</Label>
                  <Input type="number" value={ppRate} onChange={(e) => setPpRate(e.target.value)} step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label>{t("macro.purchasingPower.years")}</Label>
                  <Input
                    type="number"
                    value={ppYears}
                    onChange={(e) => setPpYears(e.target.value)}
                    min="0"
                    step="0.1"
                  />
                  {ppErrors.find((e) => e.field === "years") && (
                    <p className="text-sm text-red-500">{ppErrors.find((e) => e.field === "years")?.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-muted/30">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-muted-foreground">
                    {t("macro.purchasingPower.futureValue")}
                  </h3>
                  <div className="text-4xl font-bold text-primary tracking-tighter mt-2">
                    {ppResult !== null && !isNaN(ppResult)
                      ? `$${ppResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </div>
                </div>
                {ppResult !== null && !isNaN(ppResult) && (
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p className="text-sm text-muted-foreground">{t("macro.purchasingPower.loss")}</p>
                    <p className="text-2xl font-bold text-red-600">
                      $
                      {(parseFloat(ppAmount || "0") - ppResult).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Real Interest Rate Calculator */}
        <TabsContent value="realRate">
          <div className="grid gap-6 md:grid-cols-2">
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
                  <Label>{t("macro.realRate.nominal")}</Label>
                  <Input
                    type="number"
                    value={nominalRate}
                    onChange={(e) => setNominalRate(e.target.value)}
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("macro.realRate.inflation")}</Label>
                  <Input
                    type="number"
                    value={realInfRate}
                    onChange={(e) => setRealInfRate(e.target.value)}
                    step="0.01"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-muted/30">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">{t("macro.realRate.real")}</h3>
                <div className="text-5xl font-bold text-primary tracking-tighter">
                  {realResult !== null && !isNaN(realResult) ? `${(realResult * 100).toFixed(4)}%` : "—"}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* CPI Adjustment Calculator */}
        <TabsContent value="cpiAdjust">
          <div className="grid gap-6 md:grid-cols-2">
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
                  <Label>{t("macro.cpiAdjust.amount")}</Label>
                  <Input
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
                  <Label>{t("macro.cpiAdjust.fromCPI")}</Label>
                  <Input
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
                  <Label>{t("macro.cpiAdjust.toCPI")}</Label>
                  <Input type="number" value={toCPI} onChange={(e) => setToCPI(e.target.value)} min="0" step="0.01" />
                  {cpiErrors.find((e) => e.field === "toCPI") && (
                    <p className="text-sm text-red-500">{cpiErrors.find((e) => e.field === "toCPI")?.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-muted/30">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">{t("macro.cpiAdjust.adjusted")}</h3>
                <div className="text-5xl font-bold text-primary tracking-tighter">
                  {cpiResult !== null && !isNaN(cpiResult)
                    ? `$${cpiResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "—"}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* PPP Exchange Rate Calculator */}
        <TabsContent value="ppp">
          <div className="grid gap-6 md:grid-cols-2">
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
                  <Label>{t("macro.ppp.domestic")}</Label>
                  <Input
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
                  <Label>{t("macro.ppp.foreign")}</Label>
                  <Input
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
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-muted/30">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">{t("macro.ppp.rate")}</h3>
                <div className="text-5xl font-bold text-primary tracking-tighter">
                  {pppResult !== null && !isNaN(pppResult) ? pppResult.toFixed(4) : "—"}
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
