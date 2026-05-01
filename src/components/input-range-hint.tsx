"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

interface InputRangeHintProps {
  min?: number;
  max?: number;
  unit?: string;
  example?: string;
  currentValue?: number;
  className?: string;
}

/**
 * Displays input range hints with validation feedback.
 * Shows warning icon if current value is out of range.
 */
export function InputRangeHint({ min, max, unit, example, currentValue, className }: InputRangeHintProps) {
  const { t } = useLanguage();
  const isOutOfRange =
    currentValue !== undefined &&
    ((min !== undefined && currentValue < min) || (max !== undefined && currentValue > max));

  const isInValidRange =
    currentValue !== undefined &&
    (min === undefined || currentValue >= min) &&
    (max === undefined || currentValue <= max);

  return (
    <div
      className={cn(
        "mt-1 flex items-center gap-1.5 text-xs text-muted-foreground",
        isOutOfRange && "text-destructive",
        isInValidRange && "text-emerald-700 dark:text-emerald-300",
        className
      )}
    >
      {isOutOfRange ? (
        <AlertTriangle className="h-3 w-3 shrink-0" />
      ) : isInValidRange ? (
        <CheckCircle2 className="h-3 w-3 shrink-0" />
      ) : null}
      <span>
        {min !== undefined && max !== undefined && (
          <>
            {t("common.range")}: {min}
            {unit ? ` ${unit}` : ""} {"\u2013"} {max}
            {unit ? ` ${unit}` : ""}
          </>
        )}
        {min !== undefined && max === undefined && (
          <>
            {t("common.min")}: {min}
            {unit ? ` ${unit}` : ""}
          </>
        )}
        {min === undefined && max !== undefined && (
          <>
            {t("common.max")}: {max}
            {unit ? ` ${unit}` : ""}
          </>
        )}
        {example && (
          <>
            {" "}
            {"\u00B7"} {t("common.example")}: {example}
            {unit ? ` ${unit}` : ""}
          </>
        )}
      </span>
    </div>
  );
}
