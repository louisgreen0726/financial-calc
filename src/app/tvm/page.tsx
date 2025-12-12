"use client";

import { useState } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calculator, ArrowRightLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

type TVMTarget = "pv" | "fv" | "pmt" | "nper" | "rate";

export default function TVMPage() {
    const { t } = useLanguage();
    const [target, setTarget] = useState<TVMTarget>("fv");

    // State for inputs (strings to allow empty state)
    const [rate, setRate] = useState<string>("5");
    const [nper, setNper] = useState<string>("10");
    const [pmt, setPmt] = useState<string>("0");
    const [pv, setPv] = useState<string>("-1000");
    const [fv, setFv] = useState<string>("0");
    const [type, setType] = useState<"0" | "1">("0"); // 0 = End (Arrears), 1 = Begin (Due)

    const [result, setResult] = useState<number | null>(null);

    const handleCalculate = () => {
        const r = parseFloat(rate) / 100; // Convert percentage to decimal
        const n = parseFloat(nper);
        const p = parseFloat(pmt);
        const pres = parseFloat(pv);
        const fut = parseFloat(fv);
        const t = parseInt(type) as 0 | 1;

        let res = 0;

        try {
            switch (target) {
                case "fv":
                    res = Finance.fv(r, n, p, pres, t);
                    break;
                case "pv":
                    res = Finance.pv(r, n, p, fut, t);
                    break;
                case "pmt":
                    res = Finance.pmt(r, n, pres, fut, t);
                    break;
                case "nper":
                    res = Finance.nper(r, p, pres, fut, t);
                    break;
                case "rate":
                    res = 0;
                    break;
            }
            setResult(res);
        } catch (e) {
            console.error(e);
            setResult(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('tvm.title')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('tvm.subtitle')}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-primary" />
                            {t('common.parameters')}
                        </CardTitle>
                        <CardDescription>{t('tvm.emptyState')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>{t('common.solveFor')}</Label>
                            <Select value={target} onValueChange={(v) => { setTarget(v as TVMTarget); setResult(null); }}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fv">{t('tvm.fv')}</SelectItem>
                                    <SelectItem value="pv">{t('tvm.pv')}</SelectItem>
                                    <SelectItem value="pmt">{t('tvm.pmt')}</SelectItem>
                                    <SelectItem value="nper">{t('tvm.nper')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className={target === "rate" ? "text-primary font-bold" : ""}>{t('tvm.annualRate')}</Label>
                                <Input
                                    type="number"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    disabled={target === "rate"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className={target === "nper" ? "text-primary font-bold" : ""}>{t('tvm.periods')}</Label>
                                <Input
                                    type="number"
                                    value={nper}
                                    onChange={(e) => setNper(e.target.value)}
                                    disabled={target === "nper"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className={target === "pmt" ? "text-primary font-bold" : ""}>{t('tvm.payment')}</Label>
                                <Input
                                    type="number"
                                    value={pmt}
                                    onChange={(e) => setPmt(e.target.value)}
                                    disabled={target === "pmt"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className={target === "pv" ? "text-primary font-bold" : ""}>{t('tvm.presentValue')}</Label>
                                <Input
                                    type="number"
                                    value={pv}
                                    onChange={(e) => setPv(e.target.value)}
                                    disabled={target === "pv"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className={target === "fv" ? "text-primary font-bold" : ""}>{t('tvm.futureValue')}</Label>
                                <Input
                                    type="number"
                                    value={fv}
                                    onChange={(e) => setFv(e.target.value)}
                                    disabled={target === "fv"}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label>{t('tvm.paymentMode')}</Label>
                            <RadioGroup
                                value={type}
                                onValueChange={(v) => setType(v as "0" | "1")}
                                className="flex items-center space-x-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="0" id="end" />
                                    <Label htmlFor="end">{t('tvm.end')}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="1" id="begin" />
                                    <Label htmlFor="begin">{t('tvm.begin')}</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <Button onClick={handleCalculate} className="w-full" size="lg">
                            {t('common.calculate')} {target.toUpperCase()}
                        </Button>
                    </CardContent>
                </Card>

                {/* Result Card */}
                <Card className="bg-muted/30 border-dashed border-2 flex flex-col justify-center items-center p-8 text-center">
                    {result !== null ? (
                        <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                            <h3 className="text-lg font-medium text-muted-foreground">{t('common.result')} ({target.toUpperCase()})</h3>
                            <p className="text-5xl font-bold tracking-tighter text-primary">
                                {target === "nper" ? result.toFixed(2) :
                                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(result)
                                }
                            </p>
                            <p className="text-sm text-muted-foreground mt-4 max-w-xs mx-auto">
                                {target === "fv" && t('tvm.resultDesc.fv')}
                                {target === "pv" && t('tvm.resultDesc.pv')}
                                {target === "pmt" && t('tvm.resultDesc.pmt')}
                                {target === "nper" && t('tvm.resultDesc.nper')}
                            </p>
                        </div>
                    ) : (
                        <div className="text-muted-foreground/50 flex flex-col items-center">
                            <ArrowRightLeft className="h-12 w-12 mb-4 opacity-20" />
                            <p>{t('tvm.emptyState')}</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

