"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { parseOptionalNumber } from "@/lib/input-utils";

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
          const parsed = parseOptionalNumber(paramValue);
          if (parsed !== null) {
            (initialState as Record<string, unknown>)[key] = parsed;
          }
        } else {
          (initialState as Record<string, unknown>)[key] = paramValue;
        }
      }
    }

    return initialState;
  }, [defaultValues, prefix, searchParams]);

  const derivedState = useMemo(() => readStateFromParams(), [readStateFromParams]);
  const state = derivedState;

  const buildUrl = useCallback(
    (nextState: T = state) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(nextState)) {
        const paramKey = prefix ? `${prefix}_${key}` : key;
        if (value !== undefined && value !== null && value !== "") {
          params.set(paramKey, String(value));
        } else {
          params.delete(paramKey);
        }
      }

      const nextQuery = params.toString();
      return nextQuery ? `${pathname}?${nextQuery}` : pathname;
    },
    [pathname, prefix, searchParams, state]
  );

  const updateUrl = useCallback(
    (newState: T) => {
      const newUrl = buildUrl(newState);
      router.replace(newUrl, { scroll: false });
    },
    [buildUrl, router]
  );

  const setState = useCallback(
    (nextState: T) => {
      updateUrl(nextState);
    },
    [updateUrl]
  );

  const setField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      const newState = { ...derivedState, [key]: value };
      updateUrl(newState);
    },
    [derivedState, updateUrl]
  );

  const reset = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return { state, setState, setField, reset, updateUrl, buildUrl, shareUrl: buildUrl(state) };
}
