"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  calculatePortfolioPoint,
  createSeededRandom,
  getMonteCarloSimulationTarget,
  makeDeterministicBaselineWeights,
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
  { type: "progress"; data: number } | { type: "result"; data: MonteCarloResult } | { type: "error"; data: string };

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

      const simulationsTarget = getMonteCarloSimulationTarget(payload.simulations, assets.length);
      const baselineWeights = makeDeterministicBaselineWeights(assets.length);
      const results = baselineWeights.map((weights) => calculatePortfolioPoint(assets, weights, correlation, rf));
      const randomSimulationTarget = simulationsTarget - baselineWeights.length;
      const totalSimulationTarget = baselineWeights.length + randomSimulationTarget;
      const chunkSize = Math.max(50, Math.floor(randomSimulationTarget / 20));

      for (let start = 0; start < randomSimulationTarget; start += chunkSize) {
        if (activeRunIdRef.current !== runId) {
          return;
        }

        const end = Math.min(start + chunkSize, randomSimulationTarget);
        for (let i = start; i < end; i++) {
          const weights = makeRandomWeights(assets.length, random);
          results.push(calculatePortfolioPoint(assets, weights, correlation, rf));
        }

        const nextProgress = Math.round(((baselineWeights.length + end) / totalSimulationTarget) * 100);
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
      let executionPayload = payload;
      const assetCount = payload.assets?.length ?? 0;
      if (assetCount > 0) {
        try {
          executionPayload = {
            ...payload,
            simulations: getMonteCarloSimulationTarget(payload.simulations, assetCount),
          };
        } catch (payloadError) {
          const nextError =
            payloadError instanceof Error ? payloadError : new Error("Invalid Monte Carlo simulation payload");
          setError(nextError);
          setIsRunning(false);
          options.onError?.(nextError);
          return;
        }
      }
      let createdWorker: Worker | null = null;

      try {
        const worker = new Worker(new URL("../workers/monte-carlo.worker.ts", import.meta.url), { type: "module" });
        createdWorker = worker;
        workerRef.current = worker;
        const isActiveWorker = () => activeRunIdRef.current === runId && workerRef.current === worker;
        const terminateWorker = () => {
          worker.terminate();
          if (workerRef.current === worker) {
            workerRef.current = null;
          }
        };

        worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
          if (!isActiveWorker()) {
            return;
          }

          const message = event.data;
          if (message.type === "progress") {
            setProgress(message.data);
            options.onProgress?.(message.data);
            return;
          }

          if (message.type === "result") {
            terminateWorker();
            setError(null);
            setResult(message.data);
            setIsRunning(false);
            setProgress(100);
            options.onComplete?.(message.data);
            return;
          }

          const nextError = new Error(message.data);
          terminateWorker();
          void computeInProcess(executionPayload, options, runId).catch(() => {
            if (activeRunIdRef.current !== runId) return;
            setError(nextError);
            setIsRunning(false);
            options.onError?.(nextError);
          });
        };

        worker.onerror = () => {
          if (!isActiveWorker()) {
            return;
          }

          const nextError = new Error("Monte Carlo worker execution failed");
          terminateWorker();
          void computeInProcess(executionPayload, options, runId).catch((fallbackError) => {
            if (activeRunIdRef.current !== runId) return;
            const finalError = fallbackError instanceof Error ? fallbackError : nextError;
            setError(finalError);
            setIsRunning(false);
            options.onError?.(finalError);
          });
        };

        worker.postMessage(executionPayload);
      } catch (workerError) {
        if (createdWorker) {
          createdWorker.terminate();
          if (workerRef.current === createdWorker) {
            workerRef.current = null;
          }
        }

        const nextError =
          workerError instanceof Error ? workerError : new Error("Monte Carlo worker initialization failed");
        try {
          await computeInProcess(executionPayload, options, runId);
        } catch (fallbackError) {
          if (activeRunIdRef.current !== runId) return;
          const finalError = fallbackError instanceof Error ? fallbackError : nextError;
          setError(finalError);
          setIsRunning(false);
          options.onError?.(finalError);
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
