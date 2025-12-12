"use client";

import { useState } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart, Activity, DollarSign } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

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

    const capmResult = Finance.capm(
        parseFloat(rf) / 100 || 0,
        parseFloat(beta) || 0,
        parseFloat(rm) / 100 || 0
    );

    const waccResult = Finance.wacc(
        parseFloat(equity) || 0,
        parseFloat(debt) || 0,
        (parseFloat(costEquity) || 0) / 100,
        (parseFloat(costDebt) || 0) / 100,
        (parseFloat(taxRate) || 0) / 100
    );

    const ddmResult = Finance.ddm(
        parseFloat(div) || 0,
        (parseFloat(reqReturn) || 0) / 100,
        (parseFloat(growth) || 0) / 100
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('equity.title')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('equity.subtitle')}
                    </p>
                </div>
            </div>

            <Tabs defaultValue="capm" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="capm">{t('equity.capm.tab')}</TabsTrigger>
                    <TabsTrigger value="wacc">{t('equity.wacc.tab')}</TabsTrigger>
                    <TabsTrigger value="ddm">{t('equity.ddm.tab')}</TabsTrigger>
                </TabsList>

                <TabsContent value="capm" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
                                    {t('equity.capm.title')}
                                </CardTitle>
                                <CardDescription>{t('equity.capm.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('equity.capm.rf')}</Label>
                                    <Input value={rf} onChange={e => setRf(e.target.value)} type="number" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('equity.capm.beta')}</Label>
                                    <Input value={beta} onChange={e => setBeta(e.target.value)} type="number" step="0.1" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('equity.capm.rm')}</Label>
                                    <Input value={rm} onChange={e => setRm(e.target.value)} type="number" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="flex flex-col justify-center items-center bg-muted/30">
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-medium text-muted-foreground">{t('equity.capm.re')}</h3>
                                <div className="text-5xl font-bold text-primary tracking-tighter">
                                    {(capmResult * 100).toFixed(2)}%
                                </div>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto pt-4">
                                    {t('equity.capm.prem')}: {((parseFloat(rm) - parseFloat(rf))).toFixed(2)}%.
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
                                    {t('equity.wacc.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('equity.wacc.eqVal')}</Label>
                                        <Input value={equity} onChange={e => setEquity(e.target.value)} type="number" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('equity.wacc.costEq')}</Label>
                                        <Input value={costEquity} onChange={e => setCostEquity(e.target.value)} type="number" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('equity.wacc.debtVal')}</Label>
                                        <Input value={debt} onChange={e => setDebt(e.target.value)} type="number" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('equity.wacc.costDebt')}</Label>
                                        <Input value={costDebt} onChange={e => setCostDebt(e.target.value)} type="number" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('equity.wacc.tax')}</Label>
                                    <Input value={taxRate} onChange={e => setTaxRate(e.target.value)} type="number" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="flex flex-col justify-center items-center bg-muted/30">
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-medium text-muted-foreground">{t('equity.wacc.result')}</h3>
                                <div className="text-5xl font-bold text-primary tracking-tighter">
                                    {(waccResult * 100).toFixed(2)}%
                                </div>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto pt-4">
                                    {t('equity.wacc.desc')}
                                </p>
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
                                    {t('equity.ddm.title')}
                                </CardTitle>
                                <CardDescription>{t('equity.ddm.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('equity.ddm.d1')}</Label>
                                    <Input value={div} onChange={e => setDiv(e.target.value)} type="number" step="0.01" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('equity.ddm.req')}</Label>
                                    <Input value={reqReturn} onChange={e => setReqReturn(e.target.value)} type="number" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('equity.ddm.g')}</Label>
                                    <Input value={growth} onChange={e => setGrowth(e.target.value)} type="number" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="flex flex-col justify-center items-center bg-muted/30">
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-medium text-muted-foreground">{t('equity.ddm.intrinsic')}</h3>
                                <div className={`text-5xl font-bold tracking-tighter ${ddmResult <= 0 ? "text-muted-foreground" : "text-primary"}`}>
                                    {ddmResult > 0 ? formatCurrency(ddmResult) : "N/A"}
                                </div>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto pt-4">
                                    {ddmResult <= 0
                                        ? "Growth rate must be less than the required return."
                                        : t('equity.ddm.resultDesc')}
                                </p>
                            </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}