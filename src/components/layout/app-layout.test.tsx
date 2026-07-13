import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppLayout } from "@/components/layout/app-layout";

const mocks = vi.hoisted(() => ({
  toast: { error: vi.fn() },
}));

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock("@/components/layout/sidebar", () => ({
  Sidebar: ({ collapsed }: { collapsed: boolean }) => (
    <div data-testid="sidebar" data-collapsed={collapsed}>
      Sidebar
    </div>
  ),
}));

vi.mock("@/components/layout/header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock("@/components/mobile-nav", () => ({
  MobileNav: () => <div data-testid="mobile-nav">Mobile navigation</div>,
}));

vi.mock("sonner", () => ({ toast: mocks.toast }));

const SIDEBAR_KEY = "financial-calc-sidebar-collapsed";

describe("AppLayout print contract", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks fixed application chrome for exclusion and isolates printable content", () => {
    render(
      <AppLayout>
        <article>Printable report</article>
      </AppLayout>
    );

    const skipLink = screen.getByRole("link", { name: "common.skipToContent" });
    expect(skipLink).toHaveAttribute("data-pdf-exclude", "true");
    expect(skipLink).toHaveClass("no-print");

    ["sidebar", "header", "mobile-nav"].forEach((testId) => {
      const chromeWrapper = screen.getByTestId(testId).parentElement;
      expect(chromeWrapper).toHaveAttribute("data-pdf-exclude", "true");
      expect(chromeWrapper).toHaveClass("no-print");
    });

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("data-print-content", "true");
    expect(main.parentElement).toHaveAttribute("data-app-content", "true");
    expect(main).toHaveTextContent("Printable report");
    expect(screen.getByRole("complementary", { name: "FinCalc Pro" })).toContainElement(screen.getByTestId("sidebar"));
  });

  it("collapses the desktop sidebar, updates content spacing, and persists the preference", async () => {
    render(
      <AppLayout>
        <article>Printable report</article>
      </AppLayout>
    );

    const sidebar = screen.getByTestId("sidebar");
    const sidebarFrame = sidebar.parentElement;
    const content = screen.getByRole("main").parentElement;

    expect(sidebar).toHaveAttribute("data-collapsed", "false");
    expect(sidebarFrame).toHaveClass("w-[17rem]");
    expect(content).toHaveClass("lg:pl-[17rem]");

    fireEvent.click(screen.getByRole("button", { name: "common.collapseSidebar" }));

    expect(sidebar).toHaveAttribute("data-collapsed", "true");
    expect(sidebarFrame).toHaveClass("w-[4.5rem]");
    expect(content).toHaveClass("lg:pl-[4.5rem]");
    await waitFor(() => expect(window.localStorage.getItem(SIDEBAR_KEY)).toBe("true"));
  });

  it("restores a persisted collapsed preference", () => {
    window.localStorage.setItem(SIDEBAR_KEY, "true");

    render(
      <AppLayout>
        <article>Printable report</article>
      </AppLayout>
    );

    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("main").parentElement).toHaveClass("lg:pl-[4.5rem]");
  });

  it("removes a malformed persisted sidebar preference and stays expanded", async () => {
    window.localStorage.setItem(SIDEBAR_KEY, "{not-json");

    render(
      <AppLayout>
        <article>Printable report</article>
      </AppLayout>
    );

    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "false");
    await waitFor(() => expect(window.localStorage.getItem(SIDEBAR_KEY)).toBeNull());
  });

  it.each(["null", "0", '"collapsed"', "[]", "{}"])(
    "removes the invalid JSON sidebar preference %s and stays expanded",
    async (storedValue) => {
      window.localStorage.setItem(SIDEBAR_KEY, storedValue);

      render(
        <AppLayout>
          <article>Printable report</article>
        </AppLayout>
      );

      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "false");
      await waitFor(() => expect(window.localStorage.getItem(SIDEBAR_KEY)).toBeNull());
    }
  );

  it("writes the expanded fallback when removing an invalid preference is blocked", async () => {
    window.localStorage.setItem(SIDEBAR_KEY, '"collapsed"');
    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (this === window.localStorage && key === SIDEBAR_KEY) {
        throw new DOMException("Storage removal blocked", "SecurityError");
      }
      return originalRemoveItem.call(this, key);
    });

    render(
      <AppLayout>
        <article>Printable report</article>
      </AppLayout>
    );

    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "false");
    await waitFor(() => expect(window.localStorage.getItem(SIDEBAR_KEY)).toBe("false"));
  });

  it("stays expanded after total cleanup failure and accepts a later valid storage update", async () => {
    const dirtyValue = '"collapsed"';
    window.localStorage.setItem(SIDEBAR_KEY, dirtyValue);
    const originalRemoveItem = Storage.prototype.removeItem;
    const originalSetItem = Storage.prototype.setItem;
    const removeItem = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (this === window.localStorage && key === SIDEBAR_KEY) {
        throw new DOMException("Storage removal blocked", "SecurityError");
      }
      return originalRemoveItem.call(this, key);
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.localStorage && key === SIDEBAR_KEY) {
        throw new DOMException("Storage writes blocked", "SecurityError");
      }
      return originalSetItem.call(this, key, value);
    });

    render(
      <AppLayout>
        <article>Printable report</article>
      </AppLayout>
    );

    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "false");
    expect(window.localStorage.getItem(SIDEBAR_KEY)).toBe(dirtyValue);

    removeItem.mockRestore();
    setItem.mockRestore();
    window.localStorage.setItem(SIDEBAR_KEY, "true");
    fireEvent(window, new StorageEvent("storage", { key: SIDEBAR_KEY, newValue: "true" }));

    await waitFor(() => expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "true"));
  });

  it("repairs an invalid runtime storage update and follows the next valid value", async () => {
    render(
      <AppLayout>
        <article>Printable report</article>
      </AppLayout>
    );

    window.localStorage.setItem(SIDEBAR_KEY, "true");
    fireEvent(window, new StorageEvent("storage", { key: SIDEBAR_KEY, newValue: "true" }));
    await waitFor(() => expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "true"));

    window.localStorage.setItem(SIDEBAR_KEY, "{broken");
    fireEvent(window, new StorageEvent("storage", { key: SIDEBAR_KEY, newValue: "{broken" }));
    await waitFor(() => {
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "false");
      expect(window.localStorage.getItem(SIDEBAR_KEY)).toBeNull();
    });

    window.localStorage.setItem(SIDEBAR_KEY, "true");
    fireEvent(window, new StorageEvent("storage", { key: SIDEBAR_KEY, newValue: "true" }));
    await waitFor(() => expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "true"));
  });

  it("ignores a stale invalid storage event when the current preference is valid", async () => {
    window.localStorage.setItem(SIDEBAR_KEY, "true");
    render(
      <AppLayout>
        <article>Printable report</article>
      </AppLayout>
    );

    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "true");
    fireEvent(window, new StorageEvent("storage", { key: SIDEBAR_KEY, newValue: "{stale" }));

    await waitFor(() => expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "true"));
    expect(window.localStorage.getItem(SIDEBAR_KEY)).toBe("true");
  });

  it("keeps a failed sidebar change active for the session and allows a persistence retry", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    render(
      <AppLayout>
        <article>Printable report</article>
      </AppLayout>
    );

    fireEvent.click(screen.getByRole("button", { name: "common.collapseSidebar" }));

    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("main").parentElement).toHaveClass("lg:pl-[4.5rem]");
    expect(window.localStorage.getItem(SIDEBAR_KEY)).toBeNull();
    expect(mocks.toast.error).toHaveBeenCalledWith("common.changeNotPersisted");

    setItem.mockRestore();
    fireEvent.click(screen.getByRole("button", { name: "common.expandSidebar" }));

    await waitFor(() => {
      expect(screen.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "false");
      expect(window.localStorage.getItem(SIDEBAR_KEY)).toBe("false");
    });
    expect(mocks.toast.error).toHaveBeenCalledTimes(1);
  });
});
