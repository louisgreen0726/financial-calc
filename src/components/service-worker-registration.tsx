"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

/**
 * Client component that registers the service worker.
 * Must be a client component since service workers are browser APIs.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker) {
      return;
    }

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const normalizedBasePath = basePath.replace(/\/$/, "");
    const scope = `${normalizedBasePath || ""}/`;

    if (process.env.NODE_ENV !== "production") {
      const expectedScope = new URL(scope, window.location.origin).href;

      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(
            registrations
              .filter((registration) => registration.scope === expectedScope)
              .map((registration) => registration.unregister())
          )
        )
        .catch((error) => {
          logger.warn?.("[PWA] Service Worker cleanup failed:", error);
        });
      return;
    }

    const serviceWorkerUrl = `${normalizedBasePath}/sw.js`;

    navigator.serviceWorker
      .register(serviceWorkerUrl, { scope, updateViaCache: "none" })
      .then((registration) => {
        logger.info("[PWA] Service Worker registered:", registration.scope);

        registration.update().catch((error) => {
          logger.warn?.("[PWA] Service Worker update check failed:", error);
        });
      })
      .catch((error) => {
        logger.error("[PWA] Service Worker registration failed:", error);
      });
  }, []);

  return null;
}
