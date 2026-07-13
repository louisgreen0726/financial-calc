"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import { logger } from "@/lib/logger";

const UPDATE_TOAST_ID = "pwa-update-available";

interface ServiceWorkerRegistrationProps {
  reloadPage?: () => void;
}

const reloadCurrentPage = () => window.location.reload();

/**
 * Client component that registers the service worker.
 * Must be a client component since service workers are browser APIs.
 */
export function ServiceWorkerRegistration({ reloadPage = reloadCurrentPage }: ServiceWorkerRegistrationProps = {}) {
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
    let activationRequested = false;
    let reloadScheduled = false;
    let controlledWorker = navigator.serviceWorker.controller ?? null;
    let hasBeenControlled = controlledWorker !== null;
    let registeredWorker: ServiceWorkerRegistration | undefined;
    const installingListenerCleanups = new Map<ServiceWorker, () => void>();
    const promptedWorkers = new WeakSet<ServiceWorker>();

    const reloadOnce = () => {
      if (disposed || reloadScheduled) {
        return;
      }

      reloadScheduled = true;
      activationRequested = false;
      reloadPage();
    };

    const showReloadPrompt = () => {
      toast.info(translateRef.current("common.updateAvailable"), {
        id: UPDATE_TOAST_ID,
        duration: Infinity,
        action: {
          label: translateRef.current("common.refreshPage"),
          onClick: reloadOnce,
        },
      });
    };

    const handleControllerChange = () => {
      if (disposed || reloadScheduled) {
        return;
      }

      const nextController = navigator.serviceWorker.controller ?? null;
      if (nextController === controlledWorker) {
        return;
      }

      controlledWorker = nextController;

      if (nextController === null) {
        return;
      }

      if (!hasBeenControlled) {
        hasBeenControlled = true;
        return;
      }

      if (activationRequested) {
        reloadOnce();
      } else {
        // Another tab activated the update. Replace the stale waiting-worker action
        // with a direct reload action for this still-running document.
        showReloadPrompt();
      }
    };

    const showUpdatePrompt = (registration: ServiceWorkerRegistration, candidate?: ServiceWorker | null) => {
      const waitingWorker = candidate ?? registration.waiting;
      if (!waitingWorker || !navigator.serviceWorker.controller) {
        return;
      }
      if (promptedWorkers.has(waitingWorker)) {
        return;
      }
      promptedWorkers.add(waitingWorker);

      toast.info(translateRef.current("common.updateAvailable"), {
        id: UPDATE_TOAST_ID,
        duration: Infinity,
        action: {
          label: translateRef.current("common.refreshPage"),
          onClick: () => {
            if (disposed || reloadScheduled) {
              return;
            }

            const currentController = navigator.serviceWorker.controller ?? null;
            if (currentController !== null && currentController !== controlledWorker) {
              controlledWorker = currentController;
              hasBeenControlled = true;
              reloadOnce();
              return;
            }

            const currentWaitingWorker =
              registration.waiting ?? (waitingWorker.state === "installed" ? waitingWorker : null);
            if (!currentWaitingWorker) {
              // The displayed worker was activated elsewhere before this click.
              reloadOnce();
              return;
            }

            activationRequested = true;
            currentWaitingWorker.postMessage({ type: "SKIP_WAITING" });
          },
        },
      });
    };

    const observeInstallingWorker = (installingWorker: ServiceWorker) => {
      if (installingListenerCleanups.has(installingWorker)) {
        return;
      }

      const cleanup = () => {
        if (!installingListenerCleanups.delete(installingWorker)) {
          return;
        }
        installingWorker.removeEventListener("statechange", handleStateChange);
      };
      const handleStateChange = () => {
        if (!disposed && installingWorker.state === "installed" && registeredWorker) {
          showUpdatePrompt(registeredWorker, installingWorker);
        }
        if (installingWorker.state === "installed" || installingWorker.state === "redundant") {
          cleanup();
        }
      };

      installingWorker.addEventListener("statechange", handleStateChange);
      installingListenerCleanups.set(installingWorker, cleanup);
      // Inspect after subscribing so an install that completed during registration
      // cannot fall between the initial state read and listener attachment.
      handleStateChange();
    };

    const handleUpdateFound = () => {
      const installingWorker = registeredWorker?.installing;
      if (!installingWorker) {
        return;
      }

      observeInstallingWorker(installingWorker);
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
        if (registration.installing) {
          observeInstallingWorker(registration.installing);
        }
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
      installingListenerCleanups.forEach((cleanup) => cleanup());
      installingListenerCleanups.clear();
      registeredWorker?.removeEventListener?.("updatefound", handleUpdateFound);
      navigator.serviceWorker.removeEventListener?.("controllerchange", handleControllerChange);
      toast.dismiss(UPDATE_TOAST_ID);
    };
  }, [reloadPage]);

  return null;
}
