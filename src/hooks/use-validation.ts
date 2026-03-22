"use client";

import { useState, useCallback } from "react";

interface ValidationResult {
  valid: boolean;
  value?: number;
  error?: string;
}

interface UseValidationOptions {
  required?: boolean;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  allowZero?: boolean;
}

export function useValidation(options: UseValidationOptions = {}) {
  const { required = true, min, max, allowNegative = false, allowZero = true } = options;
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(
    (value: string): ValidationResult => {
      // Check if empty
      if (!value || value.trim() === "") {
        if (required) {
          setError("This field is required");
          return { valid: false, error: "This field is required" };
        }
        setError(null);
        return { valid: true, value: 0 };
      }

      // Parse number
      const num = parseFloat(value);
      if (isNaN(num)) {
        setError("Please enter a valid number");
        return { valid: false, error: "Please enter a valid number" };
      }

      if (!isFinite(num)) {
        setError("Number is too large or too small");
        return { valid: false, error: "Number is too large or too small" };
      }

      // Check negative
      if (!allowNegative && num < 0) {
        setError("Value cannot be negative");
        return { valid: false, error: "Value cannot be negative" };
      }

      // Check zero
      if (!allowZero && num === 0) {
        setError("Value cannot be zero");
        return { valid: false, error: "Value cannot be zero" };
      }

      // Check min/max
      if (min !== undefined && num < min) {
        setError(`Value must be at least ${min}`);
        return { valid: false, error: `Value must be at least ${min}` };
      }

      if (max !== undefined && num > max) {
        setError(`Value must be no more than ${max}`);
        return { valid: false, error: `Value must be no more than ${max}` };
      }

      setError(null);
      return { valid: true, value: num };
    },
    [required, min, max, allowNegative, allowZero]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, validate, clearError };
}

// Helper to validate multiple fields at once
export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((name: string, value: string, options: UseValidationOptions = {}) => {
    const { required = true, min, max, allowNegative = false, allowZero = true } = options;

    let error = "";

    if (!value || value.trim() === "") {
      if (required) {
        error = "This field is required";
      }
    } else {
      const num = parseFloat(value);
      if (isNaN(num)) {
        error = "Please enter a valid number";
      } else if (!isFinite(num)) {
        error = "Number is too large or too small";
      } else if (!allowNegative && num < 0) {
        error = "Value cannot be negative";
      } else if (!allowZero && num === 0) {
        error = "Value cannot be zero";
      } else if (min !== undefined && num < min) {
        error = `Value must be at least ${min}`;
      } else if (max !== undefined && num > max) {
        error = `Value must be no more than ${max}`;
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  }, []);

  const validateAll = useCallback((fields: Record<string, { value: string; options?: UseValidationOptions }>) => {
    const newErrors: Record<string, string> = {};
    let allValid = true;

    Object.entries(fields).forEach(([name, { value, options }]) => {
      const { required = true, min, max, allowNegative = false, allowZero = true } = options || {};
      let error = "";

      if (!value || value.trim() === "") {
        if (required) {
          error = "This field is required";
        }
      } else {
        const num = parseFloat(value);
        if (isNaN(num)) {
          error = "Please enter a valid number";
        } else if (!isFinite(num)) {
          error = "Number is too large or too small";
        } else if (!allowNegative && num < 0) {
          error = "Value cannot be negative";
        } else if (!allowZero && num === 0) {
          error = "Value cannot be zero";
        } else if (min !== undefined && num < min) {
          error = `Value must be at least ${min}`;
        } else if (max !== undefined && num > max) {
          error = `Value must be no more than ${max}`;
        }
      }

      if (error) {
        newErrors[name] = error;
        allValid = false;
      }
    });

    setErrors(newErrors);
    return allValid;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((name: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  return { errors, validateField, validateAll, clearErrors, clearFieldError };
}
