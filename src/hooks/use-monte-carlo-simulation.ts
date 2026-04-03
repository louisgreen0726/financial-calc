"use client";

import { useState, useEffect } from "react";

interface UseMonteCarloOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (result: unknown) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook that manages Web Worker for Monte Carlo simulation with progress reporting.
 * Worker posts messages at 10% intervals.
 */
export function useMonteCarloSimulation() {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<Error | null>(null);

  const cancel = () => {
    // In the synthetic in-process mode there is nothing to terminate.
    // Reset running state to allow fresh runs.
    setIsRunning(false);
    setProgress(0);
  };

  const run = (workerUrl: string, payload: Record<string, unknown>, options: UseMonteCarloOptions = {}) => {
    // NOTE: In this environment, a dedicated Web Worker file may not be resolvable
    // at build time. Provide a lightweight in-process fallback that simulates
    // the Monte Carlo computation and reports progress similarly.
    cancel();
    setIsRunning(true);
    setProgress(0);
    setResult(null);
    setError(null);

    // In-process simulation using actual asset data
    const payloadTyped = payload as {
      assets?: { id: number; name: string; return: number; risk: number }[];
      simulations?: number;
      rf?: number;
      correlation?: number;
    };
    const assets = payloadTyped.assets ?? [];
    const simulationsTarget = payloadTyped.simulations ?? 1000;
    const rf = payloadTyped.rf ?? 0;
    const correlation = payloadTyped.correlation ?? 0;

    if (assets.length === 0) {
      options.onComplete?.({ simulations: [], optimal: null, minVol: null });
      setIsRunning(false);
      setProgress(100);
      return;
    }

    const n = assets.length;
    const returns = assets.map((a) => a.return);
    const risks = assets.map((a) => a.risk);

    // Covariance matrix using scalar pairwise correlation
    const cov: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? risks[i] * risks[i] : correlation * risks[i] * risks[j]))
    );

    const step = Math.max(1, Math.floor(simulationsTarget / 20));
    const results: { ret: number; risk: number; sharpe: number; weights: number[] }[] = [];
    for (let i = 0; i < simulationsTarget; i++) {
      // Dirichlet-like random weights
      const raw = assets.map(() => -Math.log(Math.random() + 1e-15));
      const sum = raw.reduce((a: number, b: number) => a + b, 0) || 1;
      const weights = raw.map((w) => w / sum);

      const ret = weights.reduce((acc, w, k) => acc + w * returns[k], 0);

      let variance = 0;
      for (let a = 0; a < n; a++) {
        for (let b = 0; b < n; b++) {
          variance += weights[a] * weights[b] * cov[a][b];
        }
      }
      const risk = Math.sqrt(Math.max(0, variance));
      const sharpe = risk > 0 ? (ret - rf) / risk : 0;
      results.push({ ret, risk, sharpe, weights });
      if (step > 0 && i % step === 0) {
        const progress = Math.round((i / simulationsTarget) * 100);
        setProgress(progress);
        options.onProgress?.(progress);
      }
    }

    // Compute aggregates
    let optimal: { ret: number; risk: number; sharpe: number; weights: number[] } | null = null;
    let bestSharpe = -Infinity;
    for (const s of results) {
      if (s.sharpe > bestSharpe) {
        bestSharpe = s.sharpe;
        optimal = s;
      }
    }
    const minVol = results.reduce((min, s) => ((min?.risk ?? Infinity) < s.risk ? min : s), results[0] ?? null);

    const final = { simulations: results, optimal, minVol };
    setResult(final);
    setIsRunning(false);
    setProgress(100);
    options.onComplete?.(final);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, []);

  return { progress, isRunning, result, error, cancel, run };
}
