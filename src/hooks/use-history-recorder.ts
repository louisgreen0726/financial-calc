"use client";

import { useEffect, useMemo, useRef } from "react";
import { stableSerialize } from "@/lib/stable-serialize";

interface UseHistoryRecorderOptions {
  addToHistory: (inputs: Record<string, number | string>, result: number, label?: string) => void;
  inputs: Record<string, number | string>;
  result: number;
  label?: string;
  enabled?: boolean;
}

export function useHistoryRecorder({ addToHistory, inputs, result, label, enabled = true }: UseHistoryRecorderOptions) {
  const lastSignatureRef = useRef<string | null>(null);

  const signature = useMemo(() => {
    if (!enabled || !isFinite(result) || Number.isNaN(result)) {
      return null;
    }

    return stableSerialize({ inputs, result, label });
  }, [enabled, inputs, label, result]);

  useEffect(() => {
    if (!signature || signature === lastSignatureRef.current) {
      return;
    }

    lastSignatureRef.current = signature;
    addToHistory(inputs, result, label);
  }, [addToHistory, inputs, label, result, signature]);
}
