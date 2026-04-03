import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useValidation, useFormValidation } from "@/hooks/use-validation";

describe("useValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates required fields", () => {
    const { result } = renderHook(() => useValidation({ required: true }));

    act(() => {
      result.current.validate("");
    });

    expect(result.current.error).toBe("This field is required");
  });

  it("validates min constraint", () => {
    const { result } = renderHook(() => useValidation({ min: 10 }));

    act(() => {
      result.current.validate("5");
    });

    expect(result.current.error).toBe("Value must be at least 10");
  });

  it("validates max constraint", () => {
    const { result } = renderHook(() => useValidation({ max: 50 }));

    act(() => {
      result.current.validate("100");
    });

    expect(result.current.error).toBe("Value must be no more than 50");
  });

  it("passes valid number input", () => {
    const { result } = renderHook(() => useValidation());

    act(() => {
      result.current.validate("42");
    });

    expect(result.current.error).toBeNull();
  });

  it("clears error on clearError", () => {
    const { result } = renderHook(() => useValidation({ required: true }));

    act(() => {
      result.current.validate("");
    });
    expect(result.current.error).toBe("This field is required");

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });
});

describe("useFormValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates field with custom options", () => {
    const { result } = renderHook(() => useFormValidation());

    act(() => {
      result.current.validateField("test", "abc", { required: true });
    });

    expect(result.current.errors).toHaveProperty("test");
  });

  it("validates multiple fields with validateAll", () => {
    const { result } = renderHook(() => useFormValidation());

    act(() => {
      const errors = result.current.validateAll({
        field1: { value: "abc", options: { required: true } },
        field2: { value: "42" },
      });

      expect(errors).toBe(false);
    });

    expect(result.current.errors).toHaveProperty("field1");
  });

  it("clears all errors on clearErrors", () => {
    const { result } = renderHook(() => useFormValidation());

    act(() => {
      result.current.validateField("test", "abc", { required: true });
    });
    expect(result.current.errors.test).toBeTruthy();

    act(() => {
      result.current.clearErrors();
    });
    expect(result.current.errors.test).toBeUndefined();
  });
});
