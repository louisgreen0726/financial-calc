"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { parseOptionalNumber } from "@/lib/input-utils";
import {
  normalizePathname,
  MAX_URL_STATE_VALUE_LENGTH,
  isShareUrlWithinLimit,
  parseUrlArrayValue,
  serializeUrlValue,
  toAbsoluteAppUrl,
  type UrlStateValue,
} from "@/lib/url-state-utils";

interface UseUrlStateOptions<T> {
  defaultValues: T;
  prefix?: string;
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

      if (paramValue === null || paramValue.length > MAX_URL_STATE_VALUE_LENGTH) {
        continue;
      }

      if (typeof defaultValue === "number") {
        const parsed = parseOptionalNumber(paramValue);
        if (parsed !== null) {
          (initialState as Record<string, unknown>)[key] = parsed;
        }
      } else if (Array.isArray(defaultValue)) {
        (initialState as Record<string, unknown>)[key] = parseUrlArrayValue(paramValue);
      } else {
        (initialState as Record<string, unknown>)[key] = paramValue;
      }
    }

    return initialState;
  }, [defaultValues, prefix, searchParams]);

  const derivedState = useMemo(() => readStateFromParams(), [readStateFromParams]);
  const state = derivedState;
  const latestRequestedStateRef = useRef<T>(derivedState);

  useEffect(() => {
    latestRequestedStateRef.current = derivedState;
  }, [derivedState]);

  const buildUrl = useCallback(
    (nextState: T = state, preserveExistingParams = true) => {
      const params = preserveExistingParams ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();

      for (const [key, value] of Object.entries(nextState)) {
        const paramKey = prefix ? `${prefix}_${key}` : key;
        if (value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0)) {
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
      latestRequestedStateRef.current = { ...newState };
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
      const newState = { ...latestRequestedStateRef.current, [key]: value };
      updateUrl(newState);
    },
    [updateUrl]
  );

  const reset = useCallback(() => {
    latestRequestedStateRef.current = { ...defaultValues };
    const params = new URLSearchParams(searchParams.toString());
    for (const key of Object.keys(defaultValues)) {
      params.delete(prefix ? `${prefix}_${key}` : key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [defaultValues, pathname, prefix, router, searchParams]);

  const shareUrl = toAbsoluteAppUrl(buildUrl(state, false));

  return {
    state,
    setState,
    setField,
    reset,
    updateUrl,
    buildUrl,
    shareUrl: isShareUrlWithinLimit(shareUrl) ? shareUrl : "",
  };
}
