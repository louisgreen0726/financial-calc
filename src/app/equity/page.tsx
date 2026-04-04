"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Activity, DollarSign } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { HistoryPanel } from "@/components/history-panel";

export default function EquityPage() {
  const { t } = useLanguage();
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
    return Finance.capm(parseFloat(rf) / 100 || 0, parseFloat(beta) || 0, parseFloat(rm) / 100 || 0);
  }, [rf, beta, rm]);

  const waccResult = useMemo(() => {
    return Finance.wacc(
      parseFloat(equity) || 0,
      parseFloat(debt) || 0,
      (parseFloat(costEquity) || 0) / 100,
      (parseFloat(costDebt) || 0) / 100,
      (parseFloat(taxRate) || 0) / 100
    );
  }, [equity, debt, costEquity, costDebt, taxRate]);

  const ddmResult = useMemo(() => {
    return Finance.ddm(parseFloat(div) || 0, (parseFloat(reqReturn) || 0) / 100, (parseFloat(growth) || 0) / 100);
  }, [div, reqReturn, growth]);

  const { addToHistory } = useCalculationHistory({ page: "equity" });

  // Track last saved results to avoid duplicate history entries on re-renders
  const lastCapmRef = useRef<number | null>(null);
  const lastWaccRef = useRef<number | null>(null);
  const lastDdmRef = useRef<number | null>(null);

  useEffect(() => {
    if (isFinite(capmResult) && !isNaN(capmResult) && capmResult !== lastCapmRef.current) {
      lastCapmRef.current = capmResult;
      addToHistory({ rf, beta, rm }, capmResult, "CAPM");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capmResult]);

  useEffect(() => {
    if (isFinite(waccResult) && !isNaN(waccResult) && waccResult !== lastWaccRef.current) {
      lastWaccRef.current = waccResult;
      addToHistory({ equity, debt, costEquity, costDebt, taxRate }, waccResult, "WACC");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waccResult]);

  useEffect(() => {
    if (isFinite(ddmResult) && !isNaN(ddmResult) && ddmResult !== lastDdmRef.current) {
      lastDdmRef.current = ddmResult;
      addToHistory({ div, growth, reqReturn }, ddmResult, "DDM");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ddmResult]);

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

      <Tabs defaultValue="capm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="capm">{t("equity.capm.tab")}</TabsTrigger>
          <TabsTrigger value="wacc">{t("equity.wacc.tab")}</TabsTrigger>
          <TabsTrigger value="ddm">{t("equity.ddm.tab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="capm" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
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
                    type="number"
                    aria-describedby="capm-rf-help"
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
                    onChange={(e) => setBeta(e.target.value)}
                    type="number"
                    step="0.1"
                    aria-describedby="capm-beta-help"
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
                    onChange={(e) => setRm(e.target.value)}
                    type="number"
                    aria-describedby="capm-rm-help"
                  />
                  <p id="capm-rm-help" className="sr-only">
                    CAPM market return input used in the calculation of expected return.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-muted/30">
              <div
                className="text-center space-y-2"
                role="region"
                aria-live="polite"
                aria-label="CAPM calculation result"
              >
                <h2 className="text-lg font-medium text-muted-foreground">{t("equity.capm.re")}</h2>
                <div className="text-5xl font-bold text-primary tracking-tighter">{(capmResult * 100).toFixed(2)}%</div>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto pt-4">
                  {t("equity.capm.prem")}: {(parseFloat(rm) - parseFloat(rf)).toFixed(2)}%.
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wacc" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  {t("equity.wacc.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wacc-equity">{t("equity.wacc.eqVal")}</Label>
                    <Input id="wacc-equity" value={equity} onChange={(e) => setEquity(e.target.value)} type="number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wacc-cost-eq">{t("equity.wacc.costEq")}</Label>
                    <Input
                      id="wacc-cost-eq"
                      value={costEquity}
                      onChange={(e) => setCostEquity(e.target.value)}
                      type="number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wacc-debt">{t("equity.wacc.debtVal")}</Label>
                    <Input id="wacc-debt" value={debt} onChange={(e) => setDebt(e.target.value)} type="number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wacc-cost-debt">{t("equity.wacc.costDebt")}</Label>
                    <Input
                      id="wacc-cost-debt"
                      value={costDebt}
                      onChange={(e) => setCostDebt(e.target.value)}
                      type="number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wacc-tax">{t("equity.wacc.tax")}</Label>
                  <Input id="wacc-tax" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} type="number" />
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-muted/30">
              <div
                className="text-center space-y-2"
                role="region"
                aria-live="polite"
                aria-label="WACC calculation result"
              >
                <h2 className="text-lg font-medium text-muted-foreground">{t("equity.wacc.result")}</h2>
                <div className="text-5xl font-bold text-primary tracking-tighter">{(waccResult * 100).toFixed(2)}%</div>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto pt-4">{t("equity.wacc.desc")}</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ddm" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  {t("equity.ddm.title")}
                </CardTitle>
                <CardDescription>{t("equity.ddm.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ddm-div">{t("equity.ddm.d1")}</Label>
                  <Input id="ddm-div" value={div} onChange={(e) => setDiv(e.target.value)} type="number" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ddm-req">{t("equity.ddm.req")}</Label>
                  <Input id="ddm-req" value={reqReturn} onChange={(e) => setReqReturn(e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ddm-growth">{t("equity.ddm.g")}</Label>
                  <Input id="ddm-growth" value={growth} onChange={(e) => setGrowth(e.target.value)} type="number" />
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-muted/30">
              <div
                className="text-center space-y-2"
                role="region"
                aria-live="polite"
                aria-label="DDM calculation result"
              >
                <h2 className="text-lg font-medium text-muted-foreground">{t("equity.ddm.intrinsic")}</h2>
                <div
                  className={`text-5xl font-bold tracking-tighter ${ddmResult <= 0 ? "text-muted-foreground" : "text-primary"}`}
                >
                  {ddmResult > 0 ? formatCurrency(ddmResult) : "N/A"}
                </div>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto pt-4">
                  {ddmResult <= 0 ? t("equity.ddm.growthError") : t("equity.ddm.resultDesc")}
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
