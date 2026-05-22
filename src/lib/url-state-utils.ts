import { MAX_SHARE_URL_LENGTH } from "@/lib/constants";

export type UrlStateValue = string | number | string[];

const ARRAY_VALUE_PREFIX = "json:";

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
  if (paramValue.startsWith(ARRAY_VALUE_PREFIX)) {
    try {
      const parsed = JSON.parse(paramValue.slice(ARRAY_VALUE_PREFIX.length));
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
        return parsed;
      }
    } catch {
      return [];
    }
  }

  return paramValue === "" ? [] : paramValue.split("|");
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
