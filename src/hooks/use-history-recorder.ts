"use client";

import { useEffect, useMemo, useRef } from "react";
import type { AddToHistoryOptions, HistoryResultFormat } from "@/hooks/use-calculation-history";
import { stableSerialize } from "@/lib/stable-serialize";

interface UseHistoryRecorderOptions {
  addToHistory: (
    inputs: Record<string, number | string>,
    result: number,
    labelOrOptions?: string | AddToHistoryOptions
  ) => void;
  inputs: Record<string, number | string>;
  result: number;
  label?: string;
  resultFormat?: HistoryResultFormat;
  resultUnit?: string;
  enabled?: boolean;
}

export function useHistoryRecorder({
  addToHistory,
  inputs,
  result,
  label,
  resultFormat,
  resultUnit,
  enabled = true,
}: UseHistoryRecorderOptions) {
  const lastSignatureRef = useRef<string | null>(null);

  const signature = useMemo(() => {
    if (!enabled || !Number.isFinite(result)) {
      return null;
    }

    return stableSerialize({ inputs, result, resultFormat, resultUnit });
  }, [enabled, inputs, result, resultFormat, resultUnit]);

  useEffect(() => {
    if (!signature || signature === lastSignatureRef.current) {
      return;
    }

    lastSignatureRef.current = signature;
    if (resultFormat || resultUnit) {
      addToHistory(inputs, result, { label, resultFormat, resultUnit });
      return;
    }

    addToHistory(inputs, result, label);
  }, [addToHistory, inputs, label, result, resultFormat, resultUnit, signature]);
}
