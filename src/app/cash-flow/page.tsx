"use client";

import { useState, useMemo } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus, TrendingUp, AlertCircle } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell
} from "recharts";
import { useLanguage } from "@/lib/i18n";

export default function CashFlowPage() {
    const { t } = useLanguage();
    const [rate, setRate] = useState<string>("10");
    // Initial flows: Investment at Year 0, Returns at 1-4
    const [flows, setFlows] = useState<number[]>([-10000, 3000, 4000, 5000, 6000]);

    const addFlow = () => setFlows([...flows, 0]);
    const removeFlow = (index: number) => setFlows(flows.filter((_, i) => i !== index));
    const updateFlow = (index: number, val: string) => {
        const newFlows = [...flows];
        newFlows[index] = parseFloat(val) || 0;
        setFlows(newFlows);
    };

    const calculateMetrics = useMemo(() => {
        const r = parseFloat(rate) / 100;
        const npv = Finance.npv(r, flows);
        const irr = Finance.irr(flows);

        // Payback Period (Simple)
        let cumulative = 0;
        let payback = -1;
        for (let i = 0; i < flows.length; i++) {
            cumulative += flows[i];
            if (cumulative >= 0) {
                // Linear interpolation for more precision? Or just period
                // Previous cumulative was negative.
                const prevCum = cumulative - flows[i];
                payback = (i - 1) + (-prevCum / flows[i]);
                break;
            }
        }

        return { npv, irr, payback };
    }, [rate, flows]);

    const chartData = flows.map((val, i) => ({
        period: `${t('common.year')} ${i}`,
        amount: val,
        color: val >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))" // Emerald for positive, Rose for negative
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('cashFlow.title')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('cashFlow.subtitle')}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Input Section */}
                <Card className="lg:col-span-5 h-fit">
                    <CardHeader>
                        <CardTitle>{t('cashFlow.inputsTitle')}</CardTitle>
                        <CardDescription>{t('cashFlow.inputsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>{t('cashFlow.discountRate')}</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    className="flex-1"
                                />
                                <div className="flex items-center text-sm text-muted-foreground">%</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span>{t('cashFlow.period')}</span>
                                <span>{t('cashFlow.flow')}</span>
                            </div>
                            <div className="space-y-2 max-h-[400px] pr-2 overflow-y-auto">
                                {flows.map((flow, i) => (
                                    <div key={i} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="w-16 text-sm text-muted-foreground font-mono">
                                            {i === 0 ? t('common.initial') : `${t('common.year')} ${i}`}
                                        </div>
                                        <Input
                                            type="number"
                                            value={flow}
                                            onChange={(e) => updateFlow(i, e.target.value)}
                                            className={flow < 0 ? "text-destructive font-medium" : "text-primary font-medium"}
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => removeFlow(i)} disabled={flows.length <= 1}>
                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={addFlow} variant="outline" className="w-full border-dashed mt-2">
                                <Plus className="mr-2 h-4 w-4" /> {t('cashFlow.addPeriod')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results & Visualization */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('cashFlow.npv')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${calculateMetrics.npv >= 0 ? "text-primary" : "text-destructive"}`}>
                                    {formatCurrency(calculateMetrics.npv)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('cashFlow.irr')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {(calculateMetrics.irr * 100).toFixed(2)}%
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('cashFlow.payback')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {calculateMetrics.payback > 0 ? `${calculateMetrics.payback.toFixed(1)} ${t('common.year')}` : "N/A"}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="h-[400px] flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                {t('cashFlow.visualization')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="period"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                                        itemStyle={{ color: "hsl(var(--foreground))" }}
                                    />
                                    <ReferenceLine y={0} stroke="hsl(var(--border))" />
                                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/30">
                        <CardContent className="pt-6 flex gap-4 text-sm text-muted-foreground">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p>
                                {t('cashFlow.info')}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}