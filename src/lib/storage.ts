"use client";

export function isLocalStorageEventForKey(event: StorageEvent, key: string): boolean {
  if (event.key !== null && event.key !== key) {
    return false;
  }

  // Synthetic storage events commonly omit storageArea. Real events must come
  // from localStorage so a sessionStorage clear cannot reset persisted state.
  if (event.storageArea === null) {
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (event.storageArea === window.sessionStorage) {
      return false;
    }
    return event.storageArea === window.localStorage;
  } catch {
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveOrReplaceItem(key: string, replacement: string): boolean {
  return safeRemoveItem(key) || safeSetItem(key, replacement);
}

export function safeGetJSON<T>(key: string, fallback: T): T {
  const stored = safeGetItem(key);
  if (!stored) {
    return fallback;
  }

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

export function safeSetJSON(key: string, value: unknown): boolean {
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? false : safeSetItem(key, serialized);
  } catch {
    return false;
  }
}

export function safeGetSessionJSON<T>(key: string, fallback: T): T {
  const stored = safeGetSessionItem(key);
  if (!stored) return fallback;

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

export function safeGetSessionItem(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetSessionJSON(key: string, value: unknown): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      return false;
    }

    window.sessionStorage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveSessionItem(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
