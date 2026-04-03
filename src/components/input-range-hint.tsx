"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
        "flex items-center gap-1.5 text-xs text-muted-foreground/70 mt-1",
        isOutOfRange && "text-destructive/80",
        isInValidRange && "text-emerald-600/70 dark:text-emerald-400/70",
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
            Range: {min}
            {unit ? ` ${unit}` : ""} – {max}
            {unit ? ` ${unit}` : ""}
          </>
        )}
        {min !== undefined && max === undefined && (
          <>
            Min: {min}
            {unit ? ` ${unit}` : ""}
          </>
        )}
        {min === undefined && max !== undefined && (
          <>
            Max: {max}
            {unit ? ` ${unit}` : ""}
          </>
        )}
        {example && (
          <>
            {" "}
            · Example: {example}
            {unit ? ` ${unit}` : ""}
          </>
        )}
      </span>
    </div>
  );
}
