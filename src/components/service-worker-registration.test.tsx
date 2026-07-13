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

  it("does not prompt when a service worker first takes control", async () => {
    const containerListeners = new Map<string, EventListener>();
    let controller: object | null = null;
    const registration = {
      scope: "/",
      waiting: null,
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        get controller() {
          return controller;
        },
        addEventListener: vi.fn((type: string, listener: EventListener) => containerListeners.set(type, listener)),
        removeEventListener: vi.fn(),
      },
    });

    render(<ServiceWorkerRegistration reloadPage={vi.fn()} />);

    await waitFor(() => expect(containerListeners.has("controllerchange")).toBe(true));
    controller = {};
    containerListeners.get("controllerchange")?.(new Event("controllerchange"));

    expect(toast.info).not.toHaveBeenCalled();
  });

  it("reloads after this tab confirms activation of a waiting update", async () => {
    const postMessage = vi.fn();
    const reloadPage = vi.fn();
    const containerListeners = new Map<string, EventListener>();
    let controller: object | null = {};
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
        get controller() {
          return controller;
        },
        addEventListener: vi.fn((type: string, listener: EventListener) => containerListeners.set(type, listener)),
        removeEventListener: vi.fn(),
      },
    });

    render(<ServiceWorkerRegistration reloadPage={reloadPage} />);

    await waitFor(() => expect(toast.info).toHaveBeenCalled());
    const toastOptions = vi.mocked(toast.info).mock.calls[0][1];
    expect(toastOptions).toMatchObject({ id: "pwa-update-available", duration: Infinity });
    expect(postMessage).not.toHaveBeenCalled();

    const action = toastOptions?.action as unknown as { onClick: (event: unknown) => void };
    action.onClick({});
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    expect(reloadPage).not.toHaveBeenCalled();
    expect(containerListeners.has("controllerchange")).toBe(true);

    controller = {};
    containerListeners.get("controllerchange")?.(new Event("controllerchange"));
    controller = {};
    containerListeners.get("controllerchange")?.(new Event("controllerchange"));

    expect(reloadPage).toHaveBeenCalledOnce();
    expect(toast.info).toHaveBeenCalledOnce();
  });

  it("ignores controllerchange events that retain the same controller", async () => {
    const reloadPage = vi.fn();
    const containerListeners = new Map<string, EventListener>();
    const controller = {};
    const registration = {
      scope: "/",
      waiting: null,
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        controller,
        addEventListener: vi.fn((type: string, listener: EventListener) => containerListeners.set(type, listener)),
        removeEventListener: vi.fn(),
      },
    });

    render(<ServiceWorkerRegistration reloadPage={reloadPage} />);

    await waitFor(() => expect(containerListeners.has("controllerchange")).toBe(true));
    containerListeners.get("controllerchange")?.(new Event("controllerchange"));

    expect(reloadPage).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("replaces a stale waiting-worker action when another tab activates the update", async () => {
    const postMessage = vi.fn();
    const reloadPage = vi.fn();
    const containerListeners = new Map<string, EventListener>();
    let controller: object | null = {};
    const registration = {
      scope: "/",
      waiting: { postMessage },
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        get controller() {
          return controller;
        },
        addEventListener: vi.fn((type: string, listener: EventListener) => containerListeners.set(type, listener)),
        removeEventListener: vi.fn(),
      },
    });

    render(<ServiceWorkerRegistration reloadPage={reloadPage} />);

    await waitFor(() => expect(toast.info).toHaveBeenCalledOnce());
    controller = {};
    containerListeners.get("controllerchange")?.(new Event("controllerchange"));

    expect(toast.info).toHaveBeenCalledTimes(2);
    const replacementOptions = vi.mocked(toast.info).mock.calls[1][1];
    expect(replacementOptions).toMatchObject({ id: "pwa-update-available", duration: Infinity });

    const replacementAction = replacementOptions?.action as unknown as { onClick: (event: unknown) => void };
    replacementAction.onClick({});

    expect(reloadPage).toHaveBeenCalledOnce();
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("offers a direct reload when control is lost before an external replacement claims the page", async () => {
    const reloadPage = vi.fn();
    const containerListeners = new Map<string, EventListener>();
    let controller: object | null = {};
    const registration = {
      scope: "/",
      waiting: null,
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        get controller() {
          return controller;
        },
        addEventListener: vi.fn((type: string, listener: EventListener) => containerListeners.set(type, listener)),
        removeEventListener: vi.fn(),
      },
    });

    render(<ServiceWorkerRegistration reloadPage={reloadPage} />);

    await waitFor(() => expect(containerListeners.has("controllerchange")).toBe(true));
    controller = null;
    containerListeners.get("controllerchange")?.(new Event("controllerchange"));
    expect(toast.info).not.toHaveBeenCalled();

    controller = {};
    containerListeners.get("controllerchange")?.(new Event("controllerchange"));
    expect(toast.info).toHaveBeenCalledOnce();

    const action = vi.mocked(toast.info).mock.calls[0][1]?.action as unknown as { onClick: () => void };
    action.onClick();
    action.onClick();
    expect(reloadPage).toHaveBeenCalledOnce();
  });

  it("reloads directly when a displayed waiting worker activates before the action is clicked", async () => {
    const postMessage = vi.fn();
    const reloadPage = vi.fn();
    const containerListeners = new Map<string, EventListener>();
    const initialController = {};
    let controller = initialController;
    let waitingWorker: { postMessage: typeof postMessage } | null = { postMessage };
    const registration = {
      scope: "/",
      get waiting() {
        return waitingWorker;
      },
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        get controller() {
          return controller;
        },
        addEventListener: vi.fn((type: string, listener: EventListener) => containerListeners.set(type, listener)),
        removeEventListener: vi.fn(),
      },
    });

    render(<ServiceWorkerRegistration reloadPage={reloadPage} />);

    await waitFor(() => expect(toast.info).toHaveBeenCalledOnce());
    const action = vi.mocked(toast.info).mock.calls[0][1]?.action as unknown as { onClick: () => void };
    waitingWorker = null;
    controller = {};
    action.onClick();

    expect(reloadPage).toHaveBeenCalledOnce();
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("targets the current waiting worker instead of the worker captured by an older prompt", async () => {
    const firstPostMessage = vi.fn();
    const latestPostMessage = vi.fn();
    let waitingWorker = { postMessage: firstPostMessage };
    const registration = {
      scope: "/",
      get waiting() {
        return waitingWorker;
      },
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        controller: {},
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    render(<ServiceWorkerRegistration reloadPage={vi.fn()} />);

    await waitFor(() => expect(toast.info).toHaveBeenCalledOnce());
    const action = vi.mocked(toast.info).mock.calls[0][1]?.action as unknown as { onClick: () => void };
    waitingWorker = { postMessage: latestPostMessage };
    action.onClick();

    expect(firstPostMessage).not.toHaveBeenCalled();
    expect(latestPostMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });

  it("reloads once when a waiting worker rejects the activation message", async () => {
    const activationError = new DOMException("Worker became redundant", "InvalidStateError");
    const postMessage = vi.fn(() => {
      throw activationError;
    });
    const reloadPage = vi.fn();
    const registration = {
      scope: "/",
      waiting: { postMessage },
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        controller: {},
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    render(<ServiceWorkerRegistration reloadPage={reloadPage} />);

    await waitFor(() => expect(toast.info).toHaveBeenCalledOnce());
    const action = vi.mocked(toast.info).mock.calls[0][1]?.action as unknown as { onClick: () => void };
    expect(() => action.onClick()).not.toThrow();
    action.onClick();

    expect(postMessage).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith("[PWA] Waiting Service Worker activation failed:", activationError);
    expect(reloadPage).toHaveBeenCalledOnce();
  });

  it("observes an installing worker even when updatefound fired before registration resolved", async () => {
    const installingListeners = new Map<string, EventListener>();
    const installingWorker = {
      state: "installing",
      addEventListener: vi.fn((type: string, listener: EventListener) => installingListeners.set(type, listener)),
      removeEventListener: vi.fn(),
    };
    const registration = {
      scope: "/",
      waiting: null,
      installing: installingWorker,
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        controller: {},
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    const { unmount } = render(<ServiceWorkerRegistration reloadPage={vi.fn()} />);

    await waitFor(() => expect(installingListeners.has("statechange")).toBe(true));
    installingWorker.state = "installed";
    installingListeners.get("statechange")?.(new Event("statechange"));

    expect(toast.info).toHaveBeenCalledOnce();
    expect(installingWorker.removeEventListener).toHaveBeenCalledWith("statechange", expect.any(Function));
    unmount();
    expect(installingWorker.removeEventListener).toHaveBeenCalledOnce();
  });

  it("stops observing a redundant installing worker without prompting", async () => {
    const installingListeners = new Map<string, EventListener>();
    const installingWorker = {
      state: "installing",
      addEventListener: vi.fn((type: string, listener: EventListener) => installingListeners.set(type, listener)),
      removeEventListener: vi.fn(),
    };
    const registration = {
      scope: "/",
      waiting: null,
      installing: installingWorker,
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        controller: {},
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    render(<ServiceWorkerRegistration reloadPage={vi.fn()} />);

    await waitFor(() => expect(installingListeners.has("statechange")).toBe(true));
    installingWorker.state = "redundant";
    installingListeners.get("statechange")?.(new Event("statechange"));

    expect(installingWorker.removeEventListener).toHaveBeenCalledWith("statechange", expect.any(Function));
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("prompts immediately when the installing worker is already installed", async () => {
    const postMessage = vi.fn();
    const reloadPage = vi.fn();
    const installingWorker = {
      state: "installed",
      postMessage,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const registration = {
      scope: "/",
      waiting: null,
      installing: installingWorker,
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        controller: {},
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    render(<ServiceWorkerRegistration reloadPage={reloadPage} />);

    await waitFor(() => expect(toast.info).toHaveBeenCalledOnce());
    expect(installingWorker.addEventListener).toHaveBeenCalledWith("statechange", expect.any(Function));

    const action = vi.mocked(toast.info).mock.calls[0][1]?.action as unknown as { onClick: () => void };
    action.onClick();
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    expect(reloadPage).not.toHaveBeenCalled();
  });

  it("removes worker listeners and dismisses the update prompt on unmount", async () => {
    const containerListeners = new Map<string, EventListener>();
    const registrationListeners = new Map<string, EventListener>();
    const installingListeners = new Map<string, EventListener>();
    const removeContainerListener = vi.fn();
    const removeRegistrationListener = vi.fn();
    const removeInstallingListener = vi.fn();
    const installingWorker = {
      state: "installing",
      addEventListener: vi.fn((type: string, listener: EventListener) => installingListeners.set(type, listener)),
      removeEventListener: removeInstallingListener,
    };
    const registration = {
      scope: "/",
      waiting: null,
      installing: installingWorker,
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn((type: string, listener: EventListener) => registrationListeners.set(type, listener)),
      removeEventListener: removeRegistrationListener,
    };
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        controller: {},
        addEventListener: vi.fn((type: string, listener: EventListener) => containerListeners.set(type, listener)),
        removeEventListener: removeContainerListener,
      },
    });

    const { unmount } = render(<ServiceWorkerRegistration reloadPage={vi.fn()} />);

    await waitFor(() => expect(registrationListeners.has("updatefound")).toBe(true));
    registrationListeners.get("updatefound")?.(new Event("updatefound"));
    expect(installingListeners.has("statechange")).toBe(true);

    const controllerChangeListener = containerListeners.get("controllerchange");
    const updateFoundListener = registrationListeners.get("updatefound");
    const stateChangeListener = installingListeners.get("statechange");
    unmount();

    expect(removeContainerListener).toHaveBeenCalledWith("controllerchange", controllerChangeListener);
    expect(removeRegistrationListener).toHaveBeenCalledWith("updatefound", updateFoundListener);
    expect(removeInstallingListener).toHaveBeenCalledWith("statechange", stateChangeListener);
    expect(toast.dismiss).toHaveBeenCalledWith("pwa-update-available");
  });
});
