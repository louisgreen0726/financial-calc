"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseMonteCarloOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (result: unknown) => void;
  onError?: (error: Error) => void;
}

interface MonteCarloPayload {
  assets?: { id: number; name: string; return: number; risk: number }[];
  simulations?: number;
  rf?: number;
  correlation?: number;
}

interface MonteCarloPoint {
  ret: number;
  risk: number;
  sharpe: number;
  weights: number[];
}

interface MonteCarloResult {
  simulations: MonteCarloPoint[];
  optimal: MonteCarloPoint | null;
  minVol: MonteCarloPoint | null;
}

type WorkerMessage =
  | { type: "progress"; data: number }
  | { type: "result"; data: MonteCarloResult }
  | { type: "error"; data: string };

/**
 * Hook that manages Web Worker for Monte Carlo simulation with progress reporting.
 * Worker posts messages at 10% intervals.
 */
export function useMonteCarloSimulation() {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<Error | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const activeRunIdRef = useRef(0);

  const cancel = useCallback(() => {
    activeRunIdRef.current += 1;
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsRunning(false);
    setProgress(0);
  }, []);

  const computeInProcess = useCallback(
    async (payload: MonteCarloPayload, options: UseMonteCarloOptions, runId: number) => {
      const assets = payload.assets ?? [];
      const simulationsTarget = payload.simulations ?? 1000;
      const rf = payload.rf ?? 0;
      const correlation = payload.correlation ?? 0;

      if (assets.length === 0) {
        const emptyResult: MonteCarloResult = { simulations: [], optimal: null, minVol: null };
        setResult(emptyResult);
        setIsRunning(false);
        setProgress(100);
        options.onComplete?.(emptyResult);
        return;
      }

      const n = assets.length;
      const returns = assets.map((a) => a.return);
      const risks = assets.map((a) => a.risk);
      const cov: number[][] = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? risks[i] * risks[i] : correlation * risks[i] * risks[j]))
      );

      const results: MonteCarloPoint[] = [];
      const chunkSize = Math.max(50, Math.floor(simulationsTarget / 20));

      for (let start = 0; start < simulationsTarget; start += chunkSize) {
        if (activeRunIdRef.current !== runId) {
          return;
        }

        const end = Math.min(start + chunkSize, simulationsTarget);
        for (let i = start; i < end; i++) {
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
        }

        const nextProgress = Math.round((end / simulationsTarget) * 100);
        setProgress(nextProgress);
        options.onProgress?.(nextProgress);

        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      if (activeRunIdRef.current !== runId) {
        return;
      }

      let optimal: MonteCarloPoint | null = null;
      let bestSharpe = -Infinity;
      for (const point of results) {
        if (point.sharpe > bestSharpe) {
          bestSharpe = point.sharpe;
          optimal = point;
        }
      }

      const minVol = results.reduce<MonteCarloPoint | null>(
        (min, point) => ((min?.risk ?? Infinity) < point.risk ? min : point),
        results[0] ?? null
      );

      const final: MonteCarloResult = { simulations: results, optimal, minVol };
      setError(null);
      setResult(final);
      setIsRunning(false);
      setProgress(100);
      options.onComplete?.(final);
    },
    []
  );

  const run = useCallback(
    async (payload: MonteCarloPayload, options: UseMonteCarloOptions = {}) => {
      cancel();
      setIsRunning(true);
      setProgress(0);
      setResult(null);
      setError(null);

      const runId = activeRunIdRef.current + 1;
      activeRunIdRef.current = runId;

      try {
        const worker = new Worker(new URL("../workers/monte-carlo.worker.ts", import.meta.url), { type: "module" });
        workerRef.current = worker;

        worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
          if (activeRunIdRef.current !== runId) {
            return;
          }

          const message = event.data;
          if (message.type === "progress") {
            setProgress(message.data);
            options.onProgress?.(message.data);
            return;
          }

          if (message.type === "result") {
            workerRef.current?.terminate();
            workerRef.current = null;
            setError(null);
            setResult(message.data);
            setIsRunning(false);
            setProgress(100);
            options.onComplete?.(message.data);
            return;
          }

          const nextError = new Error(message.data);
          workerRef.current?.terminate();
          workerRef.current = null;
          void computeInProcess(payload, options, runId).catch(() => {
            if (activeRunIdRef.current !== runId) return;
            setError(nextError);
            setIsRunning(false);
            options.onError?.(nextError);
          });
        };

        worker.onerror = () => {
          workerRef.current?.terminate();
          workerRef.current = null;
          void computeInProcess(payload, options, runId);
        };

        worker.postMessage(payload);
      } catch (workerError) {
        const nextError =
          workerError instanceof Error ? workerError : new Error("Monte Carlo worker initialization failed");
        try {
          await computeInProcess(payload, options, runId);
        } catch {
          if (activeRunIdRef.current !== runId) return;
          setError(nextError);
          setIsRunning(false);
          options.onError?.(nextError);
        }
      }
    },
    [cancel, computeInProcess]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return { progress, isRunning, result, error, cancel, run };
}
