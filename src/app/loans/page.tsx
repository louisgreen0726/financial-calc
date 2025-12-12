"use client";

import { useState, useMemo } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/i18n";

export default function LoansPage() {
    const { t } = useLanguage();
    const [method, setMethod] = useState<"CPM" | "CAM">("CPM"); // CPM = Equal Payments, CAM = Equal Principal
    const [amount, setAmount] = useState<string>("500000");
    const [rate, setRate] = useState<string>("4.5");
    const [years, setYears] = useState<string>("30");

    const schedule = useMemo(() => {
        const P = parseFloat(amount) || 0;
        const r = (parseFloat(rate) || 0) / 100 / 12; // Monthly rate
        const n = (parseFloat(years) || 0) * 12; // Months

        if (P <= 0 || r <= 0 || n <= 0) return [];

        return Finance.amortizationSchedule(P, r, n, method);
    }, [amount, rate, years, method]);

    const stats = useMemo(() => {
        if (!schedule.length) return { totalInterest: 0, totalPayment: 0, monthlyPayment: 0 };

        const totalPayment = schedule.reduce((acc, row) => acc + row.payment, 0);
        const totalInterest = schedule.reduce((acc, row) => acc + row.interest, 0);
        const monthlyPayment = schedule[0].payment;

        return { totalInterest, totalPayment, monthlyPayment };
    }, [schedule]);

    const pieData = [
        { name: t('loans.principal'), value: parseFloat(amount) || 0, color: "hsl(var(--primary))" },
        { name: t('loans.totalInt'), value: stats.totalInterest, color: "hsl(var(--destructive))" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('loans.title')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('loans.subtitle')}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Controls */}
                <Card className="lg:col-span-4 h-fit">
                    <CardHeader>
                        <CardTitle>{t('loans.details')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('loans.method')}</Label>
                            <Tabs value={method} onValueChange={(v) => setMethod(v as any)} className="w-full">
                                <TabsList className="w-full">
                                    <TabsTrigger value="CPM" className="flex-1">{t('loans.cpm')}</TabsTrigger>
                                    <TabsTrigger value="CAM" className="flex-1">{t('loans.cam')}</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('loans.amount')}</Label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('loans.rate')}</Label>
                            <Input
                                type="number"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('loans.term')}</Label>
                            <Input
                                type="number"
                                value={years}
                                onChange={(e) => setYears(e.target.value)}
                            />
                        </div>

                        <div className="pt-4 bg-muted/40 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('loans.monthly')}</span>
                                <span className="font-bold">
                                    {method === "CPM"
                                        ? formatCurrency(stats.monthlyPayment)
                                        : `${formatCurrency(schedule[0]?.payment || 0)}`
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('loans.totalInt')}</span>
                                <span className="font-bold text-destructive">{formatCurrency(stats.totalInterest)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t">
                                <span className="text-muted-foreground">{t('loans.totalCost')}</span>
                                <span className="font-bold">{formatCurrency(stats.totalPayment)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Visuals */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pie Chart */}
                        <Card className="min-h-[300px] flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">{t('loans.breakdown')}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Area Chart: Balance Over Time */}
                        <Card className="min-h-[300px] flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">{t('loans.balance')}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={schedule.filter((_, i) => i % 12 === 0)}> {/* Downsample for performance */}
                                        <defs>
                                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="period" hide />
                                        <YAxis hide domain={[0, 'auto']} />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            labelFormatter={(label) => `Month ${label}`}
                                            contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                        />
                                        <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorBalance)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Schedule Table */}
                    <Card className="flex-1 flex flex-col min-h-[400px]">
                        <CardHeader>
                            <CardTitle>{t('loans.schedule')}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            <ScrollArea className="h-[400px]">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="w-[80px]">{t('cashFlow.period')}</TableHead>
                                            <TableHead>{t('loans.payment')}</TableHead>
                                            <TableHead>{t('loans.principal')}</TableHead>
                                            <TableHead>{t('loans.interest')}</TableHead>
                                            <TableHead className="text-right">{t('loans.remBalance')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {schedule.map((row) => (
                                            <TableRow key={row.period}>
                                                <TableCell className="font-mono text-xs">{row.period}</TableCell>
                                                <TableCell className="font-mono text-xs">{formatCurrency(row.payment)}</TableCell>
                                                <TableCell className="font-mono text-xs text-primary">{formatCurrency(row.principal)}</TableCell>
                                                <TableCell className="font-mono text-xs text-destructive">{formatCurrency(row.interest)}</TableCell>
                                                <TableCell className="text-right font-mono text-xs">{formatCurrency(row.balance)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}