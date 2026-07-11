"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

interface ProgressBarProps {
  progress: number;
  label?: string;
  showETA?: boolean;
  estimatedTotalMs?: number;
  onCancel?: () => void;
  cancelLabel?: string;
  cancelAriaLabel?: string;
  formatETA?: (seconds: number) => string;
  className?: string;
}

/**
 * Animated progress bar with color transitions and optional cancel.
 */
export function ProgressBar({
  progress,
  label,
  showETA,
  estimatedTotalMs,
  onCancel,
  cancelLabel,
  cancelAriaLabel,
  formatETA,
  className,
}: ProgressBarProps) {
  const { t } = useLanguage();
  const labelId = useId();
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const resolvedLabel = label ?? t("common.loading");
  const resolvedCancelLabel = cancelLabel ?? t("common.cancel");
  const resolvedCancelAriaLabel = cancelAriaLabel ?? t("common.cancelCalculation");
  const resolvedFormatETA =
    formatETA ?? ((seconds: number) => t("common.secondsRemaining").replace("{seconds}", String(seconds)));

  // Color transitions: green -> yellow -> primary
  const barColor = clampedProgress < 60 ? "bg-emerald-500" : clampedProgress < 80 ? "bg-yellow-500" : "bg-primary";

  // ETA calculation
  const elapsedMs = estimatedTotalMs ? (estimatedTotalMs * clampedProgress) / 100 : 0;
  const remainingMs = estimatedTotalMs ? estimatedTotalMs - elapsedMs : 0;
  const etaSeconds = remainingMs ? Math.ceil(remainingMs / 1000) : 0;

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span id={labelId}>{resolvedLabel}</span>
        <div className="flex items-center gap-2">
          {showETA && etaSeconds > 0 && <span>{resolvedFormatETA(etaSeconds)}</span>}
          <span className="font-mono font-medium">{Math.round(clampedProgress)}%</span>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="ml-1 h-10 px-2 text-destructive hover:text-destructive/80 sm:h-8"
              aria-label={resolvedCancelAriaLabel}
            >
              <X className="h-3 w-3" />
              {resolvedCancelLabel}
            </Button>
          )}
        </div>
      </div>
      <div
        className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clampedProgress)}
        aria-valuetext={`${Math.round(clampedProgress)}%`}
      >
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
