"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  calculatePortfolioPoint,
  createSeededRandom,
  makeRandomWeights,
  summarizePortfolioSimulations,
  type PortfolioPoint,
} from "@/lib/portfolio-math";

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
  seed?: string | number;
}

interface MonteCarloResult {
  simulations: PortfolioPoint[];
  optimal: PortfolioPoint | null;
  minVol: PortfolioPoint | null;
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
      const random = createSeededRandom(payload.seed ?? "portfolio-default");

      if (assets.length === 0) {
        const emptyResult: MonteCarloResult = { simulations: [], optimal: null, minVol: null };
        setResult(emptyResult);
        setIsRunning(false);
        setProgress(100);
        options.onComplete?.(emptyResult);
        return;
      }

      const results: PortfolioPoint[] = [];
      const chunkSize = Math.max(50, Math.floor(simulationsTarget / 20));

      for (let start = 0; start < simulationsTarget; start += chunkSize) {
        if (activeRunIdRef.current !== runId) {
          return;
        }

        const end = Math.min(start + chunkSize, simulationsTarget);
        for (let i = start; i < end; i++) {
          const weights = makeRandomWeights(assets.length, random);
          results.push(calculatePortfolioPoint(assets, weights, correlation, rf));
        }

        const nextProgress = Math.round((end / simulationsTarget) * 100);
        setProgress(nextProgress);
        options.onProgress?.(nextProgress);

        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      if (activeRunIdRef.current !== runId) {
        return;
      }

      const final: MonteCarloResult = summarizePortfolioSimulations(results);
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
