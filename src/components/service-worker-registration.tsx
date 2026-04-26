"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

/**
 * Client component that registers the service worker.
 * Must be a client component since service workers are browser APIs.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      const serviceWorkerUrl = `${basePath}/sw.js` || "/sw.js";
      const scope = `${basePath}/` || "/";

      navigator.serviceWorker
        .register(serviceWorkerUrl, { scope })
        .then((registration) => {
          logger.info("[PWA] Service Worker registered:", registration.scope);

          registration.update().catch((error) => {
            logger.warn?.("[PWA] Service Worker update check failed:", error);
          });
        })
        .catch((error) => {
          logger.error("[PWA] Service Worker registration failed:", error);
        });
    }
  }, []);

  return null;
}
