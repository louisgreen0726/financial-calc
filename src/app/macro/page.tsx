import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MacroPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Macroeconomics & FX</h2>
                <p className="text-muted-foreground">
                    Analyze macroeconomic indicators and foreign exchange rates.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Module construction</CardTitle>
                        <CardDescription>This module is currently under development.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Coming soon: Inflation calculators, Purchasing Power Parity (PPP), and real-time FX rate conversion tools.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
