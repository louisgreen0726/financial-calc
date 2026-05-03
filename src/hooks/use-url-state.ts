"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { parseOptionalNumber } from "@/lib/input-utils";

type UrlStateValue = string | number | string[];

interface UseUrlStateOptions<T> {
  defaultValues: T;
  prefix?: string;
}

function normalizePathname(pathname: string) {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/$/, "");
}

function serializeUrlValue(value: UrlStateValue) {
  return Array.isArray(value) ? value.join("|") : String(value);
}

export function useUrlState<T extends Record<string, UrlStateValue>>({
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
        } else if (Array.isArray(defaultValue)) {
          (initialState as Record<string, unknown>)[key] = paramValue === "" ? [] : paramValue.split("|");
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
        if (value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0)) {
          params.set(paramKey, serializeUrlValue(value));
        } else {
          params.delete(paramKey);
        }
      }

      const nextQuery = params.toString();
      const normalizedPathname = normalizePathname(pathname);
      return nextQuery ? `${normalizedPathname}?${nextQuery}` : normalizedPathname;
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
