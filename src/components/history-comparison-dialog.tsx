"use client";

import { ArrowLeftRight, GitCompareArrows } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CalculationHistoryItem } from "@/lib/calculation-history";
import { formatHistoryResult, type HistoryFormatOptions } from "@/lib/history-format";
import {
  createHistoryComparisonPair,
  type HistoryComparisonDelta,
  type HistoryComparisonMetric,
} from "@/lib/history-comparison";
import { cn, formatNumber } from "@/lib/utils";

export interface HistoryComparisonCopy {
  baseline: string;
  changeFromBaseline: string;
  close: string;
  comparison: string;
  input: string;
  percentagePointsUnit: string;
  periodsUnit: string;
  recordedOnly: string;
  swap: string;
  title: string;
  yearsUnit: string;
}

interface HistoryComparisonDialogProps {
  baseline: CalculationHistoryItem;
  comparison: CalculationHistoryItem;
  copy: HistoryComparisonCopy;
  formatOptions: HistoryFormatOptions;
  getInputLabel: (key: string, metric: HistoryComparisonMetric) => string;
  locale: "en" | "zh";
  metricLabel: string;
  onOpenChange: (open: boolean) => void;
  onSwap: () => void;
  open: boolean;
}

function formatInputValue(value: number | string, locale: "en" | "zh") {
  return typeof value === "number" ? formatNumber(value, 6, locale) : value;
}

function formatDelta(delta: HistoryComparisonDelta, copy: HistoryComparisonCopy, locale: "en" | "zh") {
  const prefix = delta.value > 0 ? "+" : "";
  const value = `${prefix}${formatNumber(delta.value, 4, locale)}`;
  const unit =
    delta.unit === "percentage-points"
      ? copy.percentagePointsUnit
      : delta.unit === "periods"
        ? copy.periodsUnit
        : delta.unit === "years"
          ? copy.yearsUnit
          : "";
  return unit ? `${value} ${unit}` : value;
}

export function HistoryComparisonDialog({
  baseline,
  comparison,
  copy,
  formatOptions,
  getInputLabel,
  locale,
  metricLabel,
  onOpenChange,
  onSwap,
  open,
}: HistoryComparisonDialogProps) {
  const pair = createHistoryComparisonPair(baseline, comparison);
  if (!pair) return null;

  const comparisonInputs = new Map(pair.comparisonInputs.map(({ key, value }) => [key, value]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-3xl" closeLabel={copy.close}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>
              {copy.title}: {metricLabel}
            </span>
          </DialogTitle>
          <DialogDescription>{copy.recordedOnly}</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-md border">
          <div className="grid grid-cols-2 divide-x">
            {[
              { item: baseline, key: "baseline", label: copy.baseline },
              { item: comparison, key: "comparison", label: copy.comparison },
            ].map(({ item, key, label }) => (
              <section className="min-w-0 p-4" key={key} aria-label={label}>
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                <p className="mt-1 break-all text-lg font-semibold">{formatHistoryResult(item, formatOptions)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
                </p>
              </section>
            ))}
          </div>
          <div className="border-t bg-muted/40 px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">{copy.changeFromBaseline}</p>
            <p className="mt-1 text-base font-semibold tabular-nums">{formatDelta(pair.delta, copy, locale)}</p>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto rounded-md border">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold" scope="col">
                  {copy.input}
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  {copy.baseline}
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  {copy.comparison}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pair.baselineInputs.map(({ key, value }) => {
                const comparisonValue = comparisonInputs.get(key);
                const changed = comparisonValue !== value;
                return (
                  <tr className={cn(changed && "bg-primary/5")} data-changed={changed} key={key}>
                    <th className="px-4 py-3 text-left font-medium" scope="row">
                      {getInputLabel(key, pair.compatibilityKey)}
                    </th>
                    <td className="px-4 py-3 tabular-nums">{formatInputValue(value, locale)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {comparisonValue === undefined ? "-" : formatInputValue(comparisonValue, locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10"
            aria-label={copy.swap}
            title={copy.swap}
            onClick={onSwap}
          >
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {copy.close}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
