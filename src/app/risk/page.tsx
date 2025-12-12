"use client";

import { useState, useMemo } from "react";
import { Finance } from "@/lib/finance-math"; // Assuming normPDF/CDF are here
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useLanguage } from "@/lib/i18n";

export default function RiskPage() {
    const { t } = useLanguage();
    const [value, setValue] = useState("100000"); // Portfolio Value
    const [volatility, setVolatility] = useState("15"); // Annual Vol %
    const [confidence, setConfidence] = useState("0.95");
    const [days, setDays] = useState("10"); // Horizon

    const metrics = useMemo(() => {
        const P = parseFloat(value) || 0;
        const sigmaAnnual = (parseFloat(volatility) || 0) / 100;
        const conf = parseFloat(confidence);
        const d = parseFloat(days) || 1;

        // Scale volatility to horizon
        const sigmaHorizon = sigmaAnnual * Math.sqrt(d / 252);

        // Z-score for confidence
        const getZ = (p: number) => {
            if (p >= 0.99) return 2.326;
            if (p >= 0.95) return 1.645;
            if (p >= 0.90) return 1.282;
            return 1.645;
        };
        const z = getZ(conf);

        const VaR_pct = z * sigmaHorizon;
        const VaR_val = P * VaR_pct;

        const alpha = 1 - conf;
        const es_factor = (Finance.normPDF(z) / alpha);
        const CVaR_pct = es_factor * sigmaHorizon;
        const CVaR_val = P * CVaR_pct;

        return { VaR_val, VaR_pct, CVaR_val, CVaR_pct, sigmaHorizon };
    }, [value, volatility, confidence, days]);

    // Generate Distribution Curve
    const chartData = useMemo(() => {
        const data = [];
        const sigma = metrics.sigmaHorizon;
        const P = parseFloat(value) || 0;
        // Show range from -4 std dev to +4 std dev
        for (let i = -4; i <= 4; i += 0.1) {
            const ret = i * sigma;
            const prob = Finance.normPDF(i); // pdf of standard normal
            const loss = -ret * P;

            data.push({
                dev: i,
                return: ret,
                loss: loss,
                prob: prob,
                isTail: i < -1.645 // Visual approximation, dynamic based on Z needed
            });
        }
        return data;
    }, [metrics, value]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('risk.title')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('risk.subtitle')}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                <Card className="lg:col-span-4 h-fit">
                    <CardHeader>
                        <CardTitle>{t('risk.params')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('risk.val')}</Label>
                            <Input value={value} onChange={e => setValue(e.target.value)} type="number" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('risk.vol')}</Label>
                            <Input value={volatility} onChange={e => setVolatility(e.target.value)} type="number" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('risk.horizon')}</Label>
                            <Input value={days} onChange={e => setDays(e.target.value)} type="number" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('risk.conf')}</Label>
                            <Select value={confidence} onValueChange={setConfidence}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0.90">90%</SelectItem>
                                    <SelectItem value="0.95">95%</SelectItem>
                                    <SelectItem value="0.99">99%</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-muted-foreground text-sm font-medium uppercase">{t('risk.var')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-destructive">{formatCurrency(metrics.VaR_val)}</div>
                                <p className="text-sm text-muted-foreground">
                                    {metrics.VaR_pct.toFixed(2)}{t('risk.varDesc')}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-muted-foreground text-sm font-medium uppercase">{t('risk.cvar')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-destructive">{formatCurrency(metrics.CVaR_val)}</div>
                                <p className="text-sm text-muted-foreground">
                                    {t('risk.cvarDesc')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="h-[400px] flex flex-col">
                        <CardHeader>
                            <CardTitle>{t('risk.dist')}</CardTitle>
                            <CardDescription>{t('risk.distDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="loss" tickFormatter={(v) => formatCurrency(v)} stroke="hsl(var(--muted-foreground))" fontSize={10} minTickGap={30} />
                                    <YAxis hide />
                                    <Tooltip labelFormatter={() => ''} formatter={(v: number) => v.toFixed(4)} />
                                    <Area type="monotone" dataKey="prob" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorProb)" />
                                    <ReferenceLine x={-metrics.VaR_val} stroke="hsl(var(--destructive))" label="VaR" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}