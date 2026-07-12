"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import { logger } from "@/lib/logger";

const UPDATE_TOAST_ID = "pwa-update-available";

/**
 * Client component that registers the service worker.
 * Must be a client component since service workers are browser APIs.
 */
export function ServiceWorkerRegistration() {
  const { t } = useLanguage();
  const translateRef = useRef(t);

  useEffect(() => {
    translateRef.current = t;
  }, [t]);

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
    let disposed = false;
    let refreshRequested = false;
    let registeredWorker: ServiceWorkerRegistration | undefined;
    let removeInstallingListener: (() => void) | undefined;

    const handleControllerChange = () => {
      if (refreshRequested) {
        refreshRequested = false;
        window.location.reload();
      }
    };

    const showUpdatePrompt = (registration: ServiceWorkerRegistration, candidate?: ServiceWorker | null) => {
      const waitingWorker = candidate ?? registration.waiting;
      if (!waitingWorker || !navigator.serviceWorker.controller) {
        return;
      }

      toast.info(translateRef.current("common.updateAvailable"), {
        id: UPDATE_TOAST_ID,
        duration: Infinity,
        action: {
          label: translateRef.current("common.refreshPage"),
          onClick: () => {
            refreshRequested = true;
            waitingWorker.postMessage({ type: "SKIP_WAITING" });
          },
        },
      });
    };

    const handleUpdateFound = () => {
      const installingWorker = registeredWorker?.installing;
      if (!installingWorker) {
        return;
      }

      const handleStateChange = () => {
        if (installingWorker.state === "installed" && registeredWorker) {
          showUpdatePrompt(registeredWorker, installingWorker);
        }
      };

      installingWorker.addEventListener("statechange", handleStateChange);
      removeInstallingListener = () => installingWorker.removeEventListener("statechange", handleStateChange);
    };

    navigator.serviceWorker.addEventListener?.("controllerchange", handleControllerChange);

    navigator.serviceWorker
      .register(serviceWorkerUrl, { scope, updateViaCache: "none" })
      .then((registration) => {
        if (disposed) {
          return;
        }

        registeredWorker = registration;
        logger.info("[PWA] Service Worker registered:", registration.scope);
        registration.addEventListener?.("updatefound", handleUpdateFound);
        showUpdatePrompt(registration);

        registration.update().catch((error) => {
          logger.warn?.("[PWA] Service Worker update check failed:", error);
        });
      })
      .catch((error) => {
        logger.error("[PWA] Service Worker registration failed:", error);
      });

    return () => {
      disposed = true;
      removeInstallingListener?.();
      registeredWorker?.removeEventListener?.("updatefound", handleUpdateFound);
      navigator.serviceWorker.removeEventListener?.("controllerchange", handleControllerChange);
      toast.dismiss(UPDATE_TOAST_ID);
    };
  }, []);

  return null;
}
