"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Play, PieChart as PieIcon, RefreshCw } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis, Legend } from "recharts";
import { formatNumber } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

interface Asset {
    id: number;
    name: string;
    return: number; // %
    risk: number; // %
}

interface PortfolioPoint {
    ret: number;
    risk: number;
    sharpe: number;
    weights: number[];
}

export default function PortfolioPage() {
    const { t } = useLanguage();
    const [rf, setRf] = useState(3.0); // Risk free rate
    const [assets, setAssets] = useState<Asset[]>([
        { id: 1, name: "US Tech", return: 12, risk: 20 },
        { id: 2, name: "Bonds", return: 4, risk: 5 },
        { id: 3, name: "Gold", return: 6, risk: 15 },
        { id: 4, name: "Emerging Mkts", return: 15, risk: 25 },
    ]);
    const [correlation, setCorrelation] = useState(0.2); // Simplified correlation assumption
    const [simulations, setSimulations] = useState<PortfolioPoint[]>([]);
    const [optimal, setOptimal] = useState<PortfolioPoint | null>(null);
    const [minVol, setMinVol] = useState<PortfolioPoint | null>(null);

    const addAsset = () => {
        const id = Math.max(0, ...assets.map(a => a.id)) + 1;
        setAssets([...assets, { id, name: `${t('portfolio.asset')} ${id}`, return: 8, risk: 10 }]);
    };

    const removeAsset = (id: number) => {
        setAssets(assets.filter(a => a.id !== id));
    };

    const updateAsset = (id: number, field: keyof Asset, value: string) => {
        setAssets(assets.map(a =>
            a.id === id ? { ...a, [field]: field === "name" ? value : parseFloat(value) || 0 } : a
        ));
    };

    const runSimulation = () => {
        if (assets.length < 2) return;

        const N = 2000;
        const sims: PortfolioPoint[] = [];
        let maxSharpe = -Infinity;
        let minRisk = Infinity;
        let bestPort: PortfolioPoint | null = null;
        let safestPort: PortfolioPoint | null = null;

        for (let i = 0; i < N; i++) {
            // Generate random weights
            let weights = assets.map(() => Math.random());
            const sum = weights.reduce((a, b) => a + b, 0);
            weights = weights.map(w => w / sum);

            // Portfolio Return
            const portRet = weights.reduce((acc, w, idx) => acc + w * assets[idx].return, 0);

            // Portfolio Variance (Simplified: w_i*w_j*cov_ij)
            // Cov_ij = rho * sigma_i * sigma_j
            let portVar = 0;
            for (let j = 0; j < assets.length; j++) {
                for (let k = 0; k < assets.length; k++) {
                    const w1 = weights[j];
                    const w2 = weights[k];
                    const sig1 = assets[j].risk;
                    const sig2 = assets[k].risk;
                    const rho = j === k ? 1 : correlation;

                    portVar += w1 * w2 * rho * sig1 * sig2;
                }
            }
            const portRisk = Math.sqrt(portVar);
            const sharpe = (portRet - rf) / portRisk;

            const point = { ret: portRet, risk: portRisk, sharpe, weights };
            sims.push(point);

            if (sharpe > maxSharpe) {
                maxSharpe = sharpe;
                bestPort = point;
            }
            if (portRisk < minRisk) {
                minRisk = portRisk;
                safestPort = point;
            }
        }
        setSimulations(sims);
        setOptimal(bestPort);
        setMinVol(safestPort);
    };

    const chartData = [
        ...(simulations.map(p => ({ ...p, type: "Simulated" }))),
        ...(optimal ? [{ ...optimal, type: t('portfolio.maxSharpe') }] : []),
        ...(minVol ? [{ ...minVol, type: t('portfolio.minVol') }] : []),
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('portfolio.title')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('portfolio.subtitle')}
                    </p>
                </div>
                <Button onClick={runSimulation} size="lg" className="gap-2">
                    <Play className="h-4 w-4" /> {t('portfolio.run')}
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Asset Inputs */}
                <Card className="lg:col-span-4 h-fit">
                    <CardHeader>
                        <CardTitle>{t('portfolio.universe')}</CardTitle>
                        <CardDescription>{t('portfolio.universeDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>{t('portfolio.rf')}: {rf}%</Label>
                                <Label>{t('portfolio.corr')}: {correlation}</Label>
                            </div>
                            <Slider
                                value={[rf]}
                                onValueChange={v => setRf(v[0])}
                                max={10} step={0.1}
                                className="pb-4"
                            />
                            <Slider
                                value={[correlation]}
                                onValueChange={v => setCorrelation(v[0])}
                                min={-1} max={1} step={0.1}
                            />
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">{t('portfolio.asset')}</TableHead>
                                    <TableHead>{t('portfolio.ret')}</TableHead>
                                    <TableHead>{t('portfolio.risk')}</TableHead>
                                    <TableHead className="w-[40px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assets.map((asset) => (
                                    <TableRow key={asset.id}>
                                        <TableCell>
                                            <Input
                                                value={asset.name}
                                                onChange={e => updateAsset(asset.id, "name", e.target.value)}
                                                className="h-8 w-24"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={asset.return}
                                                onChange={e => updateAsset(asset.id, "return", e.target.value)}
                                                className="h-8 w-16"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={asset.risk}
                                                onChange={e => updateAsset(asset.id, "risk", e.target.value)}
                                                className="h-8 w-16"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAsset(asset.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <Button variant="outline" className="w-full border-dashed" onClick={addAsset}>
                            <Plus className="mr-2 h-4 w-4" /> {t('portfolio.add')}
                        </Button>
                    </CardContent>
                </Card>

                {/* Chart & Results */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="h-[450px] flex flex-col">
                        <CardHeader>
                            <CardTitle>{t('portfolio.frontier')}</CardTitle>
                            <CardDescription>{t('portfolio.frontierDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0">
                            {simulations.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis
                                            type="number"
                                            dataKey="risk"
                                            name="Risk"
                                            label={{ value: `${t('portfolio.risk')}`, position: 'bottom', offset: 0 }}
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            domain={['auto', 'auto']}
                                        />
                                        <YAxis
                                            type="number"
                                            dataKey="ret"
                                            name="Return"
                                            label={{ value: `${t('portfolio.ret')}`, angle: -90, position: 'insideLeft' }}
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            domain={['auto', 'auto']}
                                        />
                                        <ZAxis range={[20, 20]} />
                                        <Tooltip
                                            cursor={{ strokeDasharray: '3 3' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="rounded-lg border bg-card p-2 shadow-sm">
                                                            <p className="font-semibold">{data.type || "Portfolio"}</p>
                                                            <p className="text-sm">Ret: {formatNumber(data.ret)}%</p>
                                                            <p className="text-sm">Risk: {formatNumber(data.risk)}%</p>
                                                            <p className="text-sm text-muted-foreground">Sharpe: {formatNumber(data.sharpe)}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Scatter name="Portfolios" data={simulations} fill="hsl(var(--primary))" fillOpacity={0.4} />
                                        {optimal && <Scatter name="Max Sharpe" data={[optimal]} fill="hsl(var(--chart-4))" shape="star" r={200} />}
                                        {minVol && <Scatter name="Min Volatility" data={[minVol]} fill="hsl(var(--chart-2))" shape="diamond" />}
                                    </ScatterChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <RefreshCw className="h-12 w-12 mb-4" />
                                    <p>{t('portfolio.empty')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {optimal && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-chart-4">
                                        <PieIcon className="h-5 w-5" /> {t('portfolio.maxSharpe')}
                                    </CardTitle>
                                    <CardDescription>{t('portfolio.ratio')}: {formatNumber(optimal.sharpe)}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {optimal.weights.map((w, i) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span>{assets[i]?.name}</span>
                                                <span className="font-bold">{(w * 100).toFixed(1)}%</span>
                                            </div>
                                        ))}
                                        <div className="pt-4 mt-4 border-t flex justify-between font-medium">
                                            <span>{t('portfolio.retRisk')}</span>
                                            <span>{formatNumber(optimal.ret)}% / {formatNumber(optimal.risk)}%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-chart-2">
                                        <PieIcon className="h-5 w-5" /> {t('portfolio.minVol')}
                                    </CardTitle>
                                    <CardDescription>{t('portfolio.minVol')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {minVol?.weights.map((w, i) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span>{assets[i]?.name}</span>
                                                <span className="font-bold">{(w * 100).toFixed(1)}%</span>
                                            </div>
                                        ))}
                                        <div className="pt-4 mt-4 border-t flex justify-between font-medium">
                                            <span>{t('portfolio.retRisk')}</span>
                                            <span>{formatNumber(minVol?.ret || 0)}% / {formatNumber(minVol?.risk || 0)}%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}