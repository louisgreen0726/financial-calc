"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseAutoCalculateResult<R> {
  result: R | null;
  isCalculating: boolean;
  error: string | null;
  triggerCalculation: () => void;
}

/**
 * Hook for debounced auto-calculation with manual trigger.
 * Automatically recalculates 300ms after inputs stop changing.
 */
export function useAutoCalculate<T extends Record<string, unknown>, R>(
  inputs: T,
  calculateFn: (inputs: T) => R,
  enabled = true
): UseAutoCalculateResult<R> {
  const [result, setResult] = useState<R | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;

  const performCalculation = useCallback(
    (inputSnapshot: T) => {
      try {
        setIsCalculating(true);
        setError(null);
        const res = calculateFn(inputSnapshot);
        setResult(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Calculation error");
        setResult(null);
      } finally {
        setIsCalculating(false);
      }
    },
    [calculateFn]
  );

  const triggerCalculation = useCallback(() => {
    performCalculation(inputsRef.current);
  }, [performCalculation]);

  useEffect(() => {
    if (!enabled) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performCalculation(inputsRef.current);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputs, enabled, performCalculation]);

  return { result, isCalculating, error, triggerCalculation };
}
