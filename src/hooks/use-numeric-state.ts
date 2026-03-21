import { useState, useCallback } from "react";

interface UseNumericStateOptions {
  defaultValue?: string;
  min?: number;
  max?: number;
}

export function useNumericState(options: UseNumericStateOptions = {}) {
  const { defaultValue = "0", min, max } = options;
  const [strValue, setStrValue] = useState<string>(defaultValue);
  const [error, setError] = useState<string | null>(null);

  const setValue = useCallback(
    (input: string) => {
      setStrValue(input);
      if (input === "" || input === "-" || input === ".") {
        setError(null);
        return;
      }
      const num = parseFloat(input);
      if (isNaN(num)) {
        setError("Invalid number");
        return;
      }
      if (min !== undefined && num < min) {
        setError(`Must be at least ${min}`);
        return;
      }
      if (max !== undefined && num > max) {
        setError(`Must be at most ${max}`);
        return;
      }
      setError(null);
    },
    [min, max]
  );

  const value = parseFloat(strValue);
  const numValue = isNaN(value) ? 0 : value;

  return [strValue, setValue, numValue, error] as const;
}
