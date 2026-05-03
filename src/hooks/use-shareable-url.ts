"use client";

import { useEffect, useMemo, useRef } from "react";
import { parseOptionalNumber } from "@/lib/input-utils";

type ShareValue = string | number | string[];
type ShareState = Record<string, ShareValue>;

interface UseShareableUrlOptions<T extends ShareState> {
  prefix: string;
  state: T;
  defaults?: T;
  onRestore?: (state: Partial<T>) => void;
}

function normalizePathname(pathname: string) {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/$/, "");
}

function encodeShareValue(value: ShareValue) {
  return Array.isArray(value) ? value.join("|") : String(value);
}

export function buildShareableUrl(pathname: string, search: string, prefix: string, state: ShareState) {
  const params = new URLSearchParams(search);

  for (const [key, value] of Object.entries(state)) {
    const paramKey = `${prefix}_${key}`;
    if (value === "" || (Array.isArray(value) && value.length === 0)) {
      params.delete(paramKey);
    } else {
      params.set(paramKey, encodeShareValue(value));
    }
  }

  const query = params.toString();
  const normalizedPathname = normalizePathname(pathname);
  return query ? `${normalizedPathname}?${query}` : normalizedPathname;
}

export function readShareableState<T extends ShareState>(search: string, prefix: string, defaults: T) {
  const params = new URLSearchParams(search);
  const restored: Partial<T> = {};

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const paramValue = params.get(`${prefix}_${key}`);
    if (paramValue === null) {
      continue;
    }

    if (typeof defaultValue === "number") {
      const parsed = parseOptionalNumber(paramValue);
      if (parsed !== null) {
        (restored as Record<string, unknown>)[key] = parsed;
      }
    } else if (Array.isArray(defaultValue)) {
      (restored as Record<string, unknown>)[key] = paramValue === "" ? [] : paramValue.split("|");
    } else {
      (restored as Record<string, unknown>)[key] = paramValue;
    }
  }

  return restored;
}

export function useShareableUrl<T extends ShareState>({
  prefix,
  state,
  defaults = state,
  onRestore,
}: UseShareableUrlOptions<T>) {
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!onRestore || restoredRef.current || typeof window === "undefined") {
      return;
    }

    restoredRef.current = true;
    const restored = readShareableState(window.location.search, prefix, defaults);
    if (Object.keys(restored).length > 0) {
      onRestore(restored);
    }
  }, [defaults, onRestore, prefix]);

  return useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return buildShareableUrl(window.location.pathname, window.location.search, prefix, state);
  }, [prefix, state]);
}
