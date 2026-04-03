"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CalcStep {
  label: string;
  value: string;
  formula?: string;
}

interface CalculationStepsProps {
  formula: string;
  inputs: Record<string, number>;
  steps: CalcStep[];
  result: number;
  className?: string;
}

/**
 * Collapsible calculation steps display with formula derivation.
 */
export function CalculationSteps({ formula, inputs, steps, result, className }: CalculationStepsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("rounded-xl border bg-card", className)}>
      <button
        className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-accent/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          {isOpen ? "Hide" : "Show"} calculation steps
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Formula */}
              <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                <div className="text-xs text-muted-foreground mb-1">Formula</div>
                <code className="text-sm font-mono font-medium">{formula}</code>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(inputs).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm p-2 bg-accent/30 rounded-md">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-mono font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {/* Steps */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-medium">Step by Step</div>
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium shrink-0">
                        {i + 1}
                      </div>
                      {i < steps.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="text-sm font-medium">{step.label}</div>
                      <div className="font-mono text-sm mt-0.5">{step.value}</div>
                      {step.formula && <code className="text-xs text-muted-foreground mt-1 block">{step.formula}</code>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Final Result */}
              <div className="p-4 bg-gradient-to-r from-primary/10 to-blue-50/30 dark:from-primary/10 dark:to-blue-950/20 rounded-xl border border-primary/20">
                <div className="text-xs text-muted-foreground mb-1">Final Result</div>
                <div className="text-2xl font-bold">{result.toLocaleString()}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
