"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  label?: string;
  showETA?: boolean;
  estimatedTotalMs?: number;
  onCancel?: () => void;
  className?: string;
}

/**
 * Animated progress bar with color transitions and optional cancel.
 */
export function ProgressBar({ progress, label, showETA, estimatedTotalMs, onCancel, className }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Color transitions: green → yellow → primary
  const barColor = clampedProgress < 60 ? "bg-emerald-500" : clampedProgress < 80 ? "bg-yellow-500" : "bg-primary";

  // ETA calculation
  const elapsedMs = estimatedTotalMs ? (estimatedTotalMs * clampedProgress) / 100 : 0;
  const remainingMs = estimatedTotalMs ? estimatedTotalMs - elapsedMs : 0;
  const etaSeconds = remainingMs ? Math.ceil(remainingMs / 1000) : 0;

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label || "Calculating..."}</span>
        <div className="flex items-center gap-2">
          {showETA && etaSeconds > 0 && <span>~{etaSeconds}s remaining</span>}
          <span className="font-mono font-medium">{Math.round(clampedProgress)}%</span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="ml-1 flex items-center gap-1 text-destructive hover:text-destructive/80 transition-colors"
              aria-label="Cancel calculation"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          )}
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
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
