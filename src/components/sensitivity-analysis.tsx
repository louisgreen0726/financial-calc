"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SensitivityPoint {
  paramValue: number;
  result: number;
}

interface SensitivityAnalysisProps {
  baseValue: number;
  baseInputs: Record<string, number>;
  paramName: string;
  paramRange: { min: number; max: number; step: number };
  calculate: (inputs: Record<string, number>) => number;
  formatValue?: (value: number) => string;
}

export function SensitivityAnalysis({
  baseValue,
  baseInputs,
  paramName,
  paramRange,
  calculate,
  formatValue = formatCurrency,
}: SensitivityAnalysisProps) {
  const { t } = useLanguage();

  const sensitivityData = useMemo(() => {
    const data: SensitivityPoint[] = [];
    const { min, max, step } = paramRange;

    for (let value = min; value <= max; value += step) {
      const inputs = { ...baseInputs, [paramName]: value };
      const result = calculate(inputs);
      data.push({ paramValue: value, result });
    }

    return data;
  }, [baseInputs, paramName, paramRange, calculate]);

  const getChangeIcon = (current: number, base: number) => {
    if (current > base) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (current < base) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangePercent = (current: number, base: number) => {
    if (base === 0) return 0;
    return ((current - base) / Math.abs(base)) * 100;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">{t("sensitivity.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Base Value */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">{t("sensitivity.baseValue")}</span>
            <span className="text-lg font-bold">{formatValue(baseValue)}</span>
          </div>

          {/* Sensitivity Table */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">{paramName}</th>
                  <th className="px-4 py-2 text-right">{t("sensitivity.result")}</th>
                  <th className="px-4 py-2 text-right">{t("sensitivity.change")}</th>
                  <th className="px-4 py-2 text-center">{t("sensitivity.trend")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sensitivityData.map((point, index) => {
                  const change = point.result - baseValue;
                  const changePercent = getChangePercent(point.result, baseValue);

                  return (
                    <tr key={index} className={point.result === baseValue ? "bg-primary/5" : "hover:bg-muted/50"}>
                      <td className="px-4 py-2 font-mono">{formatNumber(point.paramValue)}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatValue(point.result)}</td>
                      <td className="px-4 py-2 text-right">
                        <span
                          className={
                            change > 0 ? "text-emerald-600" : change < 0 ? "text-red-600" : "text-muted-foreground"
                          }
                        >
                          {change > 0 ? "+" : ""}
                          {formatPercent(changePercent / 100)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">{getChangeIcon(point.result, baseValue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
              <div className="text-xs text-muted-foreground">{t("sensitivity.max")}</div>
              <div className="font-bold text-emerald-600">
                {formatValue(Math.max(...sensitivityData.map((d) => d.result)))}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground">{t("sensitivity.range")}</div>
              <div className="font-bold">
                {formatValue(
                  Math.max(...sensitivityData.map((d) => d.result)) - Math.min(...sensitivityData.map((d) => d.result))
                )}
              </div>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-xs text-muted-foreground">{t("sensitivity.min")}</div>
              <div className="font-bold text-red-600">
                {formatValue(Math.min(...sensitivityData.map((d) => d.result)))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
