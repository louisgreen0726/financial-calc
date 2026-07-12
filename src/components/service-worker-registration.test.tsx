import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ServiceWorkerRegistration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("registers the service worker when supported", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const register = vi.fn().mockResolvedValue({ scope: "/", update });
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: { register },
    });

    render(<ServiceWorkerRegistration />);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" });
      expect(update).toHaveBeenCalled();
    });
  });

  it("does nothing when service workers are unsupported", async () => {
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: undefined,
    });

    render(<ServiceWorkerRegistration />);

    await waitFor(() => {
      expect(window.navigator.serviceWorker).toBeUndefined();
    });
  });

  it("unregisters existing service workers during development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const unregister = vi.fn().mockResolvedValue(true);
    const getRegistrations = vi.fn().mockResolvedValue([{ scope: window.location.origin + "/", unregister }]);
    const register = vi.fn();
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: { getRegistrations, register },
    });

    render(<ServiceWorkerRegistration />);

    await waitFor(() => {
      expect(getRegistrations).toHaveBeenCalled();
      expect(unregister).toHaveBeenCalled();
      expect(register).not.toHaveBeenCalled();
    });
  });

  it("logs development cleanup failures without crashing", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const getRegistrations = vi.fn().mockRejectedValue(new Error("cleanup failed"));
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: { getRegistrations, register: vi.fn() },
    });

    render(<ServiceWorkerRegistration />);

    await waitFor(() => {
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  it("logs registration failures without crashing", async () => {
    const register = vi.fn().mockRejectedValue(new Error("register failed"));
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: { register },
    });

    render(<ServiceWorkerRegistration />);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  it("logs update check failures without blocking registration", async () => {
    const update = vi.fn().mockRejectedValue(new Error("update failed"));
    const register = vi.fn().mockResolvedValue({ scope: "/", update });
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: { register },
    });

    render(<ServiceWorkerRegistration />);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" });
      expect(update).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  it("respects a configured static base path", async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/calc/";
    const update = vi.fn().mockResolvedValue(undefined);
    const register = vi.fn().mockResolvedValue({ scope: "/calc/", update });
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: { register },
    });

    render(<ServiceWorkerRegistration />);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith("/calc/sw.js", { scope: "/calc/", updateViaCache: "none" });
    });
  });

  it("offers to activate a waiting update only after user confirmation", async () => {
    const postMessage = vi.fn();
    const containerListeners = new Map<string, EventListener>();
    const registration = {
      scope: "/",
      waiting: { postMessage },
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const register = vi.fn().mockResolvedValue(registration);
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register,
        controller: {},
        addEventListener: vi.fn((type: string, listener: EventListener) => containerListeners.set(type, listener)),
        removeEventListener: vi.fn(),
      },
    });

    render(<ServiceWorkerRegistration />);

    await waitFor(() => expect(toast.info).toHaveBeenCalled());
    const toastOptions = vi.mocked(toast.info).mock.calls[0][1];
    expect(toastOptions).toMatchObject({ id: "pwa-update-available", duration: Infinity });
    expect(postMessage).not.toHaveBeenCalled();

    const action = toastOptions?.action as unknown as { onClick: (event: unknown) => void };
    action.onClick({});
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    expect(containerListeners.has("controllerchange")).toBe(true);
  });
});
