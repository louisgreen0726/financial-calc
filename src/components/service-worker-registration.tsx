"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

/**
 * Client component that registers the service worker.
 * Must be a client component since service workers are browser APIs.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          logger.info("[PWA] Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          logger.error("[PWA] Service Worker registration failed:", error);
        });
    }
  }, []);

  return null;
}
