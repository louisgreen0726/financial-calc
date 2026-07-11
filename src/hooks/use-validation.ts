"use client";

import { useState, useCallback, useMemo } from "react";
import { parseOptionalNumber } from "@/lib/input-utils";

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

interface FormValidationMessages {
  required: string;
  invalidNumber: string;
  negative: string;
  zero: string;
  min: (value: number) => string;
  max: (value: number) => string;
}

const DEFAULT_FORM_VALIDATION_MESSAGES: FormValidationMessages = {
  required: "This field is required",
  invalidNumber: "Please enter a valid number",
  negative: "Value cannot be negative",
  zero: "Value cannot be zero",
  min: (value) => `Value must be at least ${value}`,
  max: (value) => `Value must be no more than ${value}`,
};

type FormValidationIssue =
  | { type: "required" }
  | { type: "invalidNumber" }
  | { type: "negative" }
  | { type: "zero" }
  | { type: "min"; value: number }
  | { type: "max"; value: number };

function getFormValidationIssue(value: string, options: UseValidationOptions = {}): FormValidationIssue | null {
  const { required = true, min, max, allowNegative = false, allowZero = true } = options;

  if (!value || value.trim() === "") return required ? { type: "required" } : null;

  const num = parseOptionalNumber(value);
  if (num === null) return { type: "invalidNumber" };
  if (!allowNegative && num < 0) return { type: "negative" };
  if (!allowZero && num === 0) return { type: "zero" };
  if (min !== undefined && num < min) return { type: "min", value: min };
  if (max !== undefined && num > max) return { type: "max", value: max };
  return null;
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
      const num = parseOptionalNumber(value);
      if (num === null) {
        setError("Please enter a valid number");
        return { valid: false, error: "Please enter a valid number" };
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
export function useFormValidation(messages: Partial<FormValidationMessages> = {}) {
  const [issues, setIssues] = useState<Record<string, FormValidationIssue>>({});
  const requiredMessage = messages.required ?? DEFAULT_FORM_VALIDATION_MESSAGES.required;
  const invalidNumberMessage = messages.invalidNumber ?? DEFAULT_FORM_VALIDATION_MESSAGES.invalidNumber;
  const negativeMessage = messages.negative ?? DEFAULT_FORM_VALIDATION_MESSAGES.negative;
  const zeroMessage = messages.zero ?? DEFAULT_FORM_VALIDATION_MESSAGES.zero;
  const minMessage = messages.min ?? DEFAULT_FORM_VALIDATION_MESSAGES.min;
  const maxMessage = messages.max ?? DEFAULT_FORM_VALIDATION_MESSAGES.max;

  const errors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(issues).map(([name, issue]) => {
          switch (issue.type) {
            case "required":
              return [name, requiredMessage];
            case "invalidNumber":
              return [name, invalidNumberMessage];
            case "negative":
              return [name, negativeMessage];
            case "zero":
              return [name, zeroMessage];
            case "min":
              return [name, minMessage(issue.value)];
            case "max":
              return [name, maxMessage(issue.value)];
          }
        })
      ),
    [invalidNumberMessage, issues, maxMessage, minMessage, negativeMessage, requiredMessage, zeroMessage]
  );

  const validateField = useCallback((name: string, value: string, options: UseValidationOptions = {}) => {
    const issue = getFormValidationIssue(value, options);
    setIssues((previous) => {
      if (issue) return { ...previous, [name]: issue };
      const next = { ...previous };
      delete next[name];
      return next;
    });
    return issue === null;
  }, []);

  const validateAll = useCallback((fields: Record<string, { value: string; options?: UseValidationOptions }>) => {
    const newIssues: Record<string, FormValidationIssue> = {};
    let allValid = true;

    Object.entries(fields).forEach(([name, { value, options }]) => {
      const issue = getFormValidationIssue(value, options);
      if (issue) {
        newIssues[name] = issue;
        allValid = false;
      }
    });

    setIssues(newIssues);
    return allValid;
  }, []);

  const clearErrors = useCallback(() => {
    setIssues({});
  }, []);

  const clearFieldError = useCallback((name: string) => {
    setIssues((previous) => {
      const next = { ...previous };
      delete next[name];
      return next;
    });
  }, []);

  return { errors, validateField, validateAll, clearErrors, clearFieldError };
}
