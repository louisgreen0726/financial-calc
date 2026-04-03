"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export function useServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          logger.info("Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          logger.error("Service Worker registration failed:", error);
        });
    }
  }, []);
}
