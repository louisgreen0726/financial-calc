"use client";

import { useEffect, useMemo, useRef } from "react";

interface UseHistoryRecorderOptions {
  addToHistory: (inputs: Record<string, number | string>, result: number, label?: string) => void;
  inputs: Record<string, number | string>;
  result: number;
  label?: string;
}

export function useHistoryRecorder({ addToHistory, inputs, result, label }: UseHistoryRecorderOptions) {
  const lastSignatureRef = useRef<string | null>(null);

  const signature = useMemo(() => {
    if (!isFinite(result) || Number.isNaN(result)) {
      return null;
    }

    return JSON.stringify({ inputs, result, label });
  }, [inputs, label, result]);

  useEffect(() => {
    if (!signature || signature === lastSignatureRef.current) {
      return;
    }

    lastSignatureRef.current = signature;
    addToHistory(inputs, result, label);
  }, [addToHistory, inputs, label, result, signature]);
}
