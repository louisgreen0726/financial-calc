import { MAX_CASH_FLOWS, MAX_SHARE_URL_LENGTH } from "@/lib/constants";

export type UrlStateValue = string | number | string[];

const ARRAY_VALUE_PREFIX = "json:";
export const MAX_URL_STATE_ARRAY_ITEMS = MAX_CASH_FLOWS;
export const MAX_URL_STATE_VALUE_LENGTH = MAX_SHARE_URL_LENGTH;

export function normalizePathname(pathname: string) {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/$/, "");
}

export function serializeUrlValue(value: UrlStateValue) {
  return Array.isArray(value) ? `${ARRAY_VALUE_PREFIX}${JSON.stringify(value)}` : String(value);
}

export function parseUrlArrayValue(paramValue: string) {
  if (paramValue.length > MAX_URL_STATE_VALUE_LENGTH) {
    return [];
  }

  if (paramValue.startsWith(ARRAY_VALUE_PREFIX)) {
    try {
      const parsed = JSON.parse(paramValue.slice(ARRAY_VALUE_PREFIX.length));
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
        return parsed.slice(0, MAX_URL_STATE_ARRAY_ITEMS);
      }
    } catch {
      return [];
    }

    return [];
  }

  return paramValue === "" ? [] : paramValue.split("|").slice(0, MAX_URL_STATE_ARRAY_ITEMS);
}

export function toAbsoluteAppUrl(relativeUrl: string) {
  if (!relativeUrl || typeof window === "undefined") {
    return relativeUrl;
  }

  if (/^[a-z][a-z\d+\-.]*:/i.test(relativeUrl)) {
    return relativeUrl;
  }

  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  let appUrl = relativeUrl.startsWith("/") ? relativeUrl : `/${relativeUrl}`;

  if (basePath && appUrl !== basePath && !appUrl.startsWith(`${basePath}/`)) {
    appUrl = `${basePath}${appUrl}`;
  }

  return new URL(appUrl, window.location.origin).toString();
}

export function isShareUrlWithinLimit(url: string) {
  return url.length <= MAX_SHARE_URL_LENGTH;
}
