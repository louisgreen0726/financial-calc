"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/lib/logger";

interface UseLocalStorageOptions<T> {
  key: string;
  defaultValue: T;
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
}

export function useLocalStorage<T>({
  key,
  defaultValue,
  serializer = JSON.stringify,
  deserializer = JSON.parse,
}: UseLocalStorageOptions<T>) {
  const [storedValue, setStoredValue] = useState<T>(defaultValue);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadValue = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          return deserializer(item);
        }
      } catch (error) {
        logger.warn(`Error reading localStorage key "${key}":`, error);
      }
      return defaultValue;
    };

    const initialValue = loadValue();
    queueMicrotask(() => {
      setStoredValue(initialValue);
      setIsInitialized(true);
    });
  }, [key, deserializer, defaultValue]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, serializer(valueToStore));
      } catch (error) {
        logger.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serializer, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(defaultValue);
    } catch (error) {
      logger.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return { value: storedValue, setValue, removeValue, isInitialized };
}
