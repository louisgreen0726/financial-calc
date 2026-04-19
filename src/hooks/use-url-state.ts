"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface UseUrlStateOptions<T> {
  defaultValues: T;
  prefix?: string;
}

export function useUrlState<T extends Record<string, string | number>>({
  defaultValues,
  prefix = "",
}: UseUrlStateOptions<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const readStateFromParams = useCallback(() => {
    const initialState = { ...defaultValues };

    for (const [key, defaultValue] of Object.entries(defaultValues)) {
      const paramKey = prefix ? `${prefix}_${key}` : key;
      const paramValue = searchParams.get(paramKey);

      if (paramValue !== null) {
        if (typeof defaultValue === "number") {
          const parsed = parseFloat(paramValue);
          if (!isNaN(parsed)) {
            (initialState as Record<string, unknown>)[key] = parsed;
          }
        } else {
          (initialState as Record<string, unknown>)[key] = paramValue;
        }
      }
    }

    return initialState;
  }, [defaultValues, prefix, searchParams]);

  const [pendingState, setPendingState] = useState<T | null>(null);

  const derivedState = useMemo(() => readStateFromParams(), [readStateFromParams]);
  const state = pendingState ?? derivedState;

  const updateUrl = useCallback(
    (newState: T) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(newState)) {
        const paramKey = prefix ? `${prefix}_${key}` : key;
        if (value !== undefined && value !== null && value !== "") {
          params.set(paramKey, String(value));
        } else {
          params.delete(paramKey);
        }
      }

      const nextQuery = params.toString();
      const newUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router, searchParams, prefix]
  );

  const setField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setPendingState((prev) => {
        const baseState = prev ?? derivedState;
        const newState = { ...baseState, [key]: value };
        updateUrl(newState);
        return newState;
      });
    },
    [derivedState, updateUrl]
  );

  const reset = useCallback(() => {
    setPendingState(defaultValues);
    router.replace(pathname, { scroll: false });
  }, [defaultValues, pathname, router]);

  return { state, setField, reset, updateUrl };
}
