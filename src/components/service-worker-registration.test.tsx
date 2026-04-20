import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { logger } from "@/lib/logger";

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
      expect(register).toHaveBeenCalledWith("/sw.js");
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

  it("logs registration failures without crashing", async () => {
    const register = vi.fn().mockRejectedValue(new Error("register failed"));
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: { register },
    });

    render(<ServiceWorkerRegistration />);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith("/sw.js");
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
      expect(register).toHaveBeenCalledWith("/sw.js");
      expect(update).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
