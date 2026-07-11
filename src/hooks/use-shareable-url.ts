"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { parseOptionalNumber } from "@/lib/input-utils";
import {
  normalizePathname,
  isShareUrlWithinLimit,
  parseUrlArrayValue,
  serializeUrlValue,
  toAbsoluteAppUrl,
  type UrlStateValue,
} from "@/lib/url-state-utils";

type ShareValue = UrlStateValue;
type ShareState = Record<string, ShareValue>;

interface UseShareableUrlOptions<T extends ShareState> {
  prefix: string;
  state: T;
  defaults?: T;
  onRestore?: (state: Partial<T>) => void;
}

const LOCATION_SEPARATOR = "\u0000";

function subscribeToLocation(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function getLocationSnapshot() {
  return typeof window === "undefined"
    ? ""
    : `${window.location.pathname}${LOCATION_SEPARATOR}${window.location.search}`;
}

function getServerLocationSnapshot() {
  return "";
}

function parseLocationSnapshot(snapshot: string) {
  const separatorIndex = snapshot.indexOf(LOCATION_SEPARATOR);
  if (separatorIndex < 0) {
    return { pathname: "", search: "" };
  }

  return {
    pathname: snapshot.slice(0, separatorIndex),
    search: snapshot.slice(separatorIndex + LOCATION_SEPARATOR.length),
  };
}

export function buildShareableUrl(pathname: string, prefix: string, state: ShareState) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(state)) {
    const paramKey = `${prefix}_${key}`;
    if (value === "" || (Array.isArray(value) && value.length === 0)) {
      params.delete(paramKey);
    } else {
      params.set(paramKey, serializeUrlValue(value));
    }
  }

  const query = params.toString();
  const normalizedPathname = normalizePathname(pathname);
  const relativeUrl = query ? `${normalizedPathname}?${query}` : normalizedPathname;
  const absoluteUrl = toAbsoluteAppUrl(relativeUrl);
  return isShareUrlWithinLimit(absoluteUrl) ? absoluteUrl : "";
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
      (restored as Record<string, unknown>)[key] = parseUrlArrayValue(paramValue);
    } else {
      (restored as Record<string, unknown>)[key] = paramValue;
    }
  }

  return restored;
}

export function useShareableUrl<T extends ShareState>({
  prefix,
  state,
  defaults,
  onRestore,
}: UseShareableUrlOptions<T>) {
  const lastRestoreSignatureRef = useRef("");
  const [initialDefaults] = useState<T>(() => defaults ?? state);
  const restoreDefaults = defaults ?? initialDefaults;
  const locationSnapshot = useSyncExternalStore(subscribeToLocation, getLocationSnapshot, getServerLocationSnapshot);
  const location = useMemo(() => parseLocationSnapshot(locationSnapshot), [locationSnapshot]);

  useEffect(() => {
    if (!onRestore || !locationSnapshot) {
      return;
    }

    const restoreSignature = `${prefix}${LOCATION_SEPARATOR}${locationSnapshot}`;
    if (lastRestoreSignatureRef.current === restoreSignature) {
      return;
    }

    lastRestoreSignatureRef.current = restoreSignature;
    const restored = readShareableState(location.search, prefix, restoreDefaults);
    onRestore({ ...restoreDefaults, ...restored });
  }, [location.search, locationSnapshot, onRestore, prefix, restoreDefaults]);

  return useMemo(() => {
    if (!location.pathname) {
      return "";
    }

    return buildShareableUrl(location.pathname, prefix, state);
  }, [location.pathname, prefix, state]);
}
