import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResponsiveDisclosure } from "@/components/responsive-disclosure";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

describe("ResponsiveDisclosure", () => {
  it("opens when defaultOpen becomes true after render", async () => {
    const { rerender } = render(
      <ResponsiveDisclosure title="Chart" defaultOpen={false}>
        <div>Frontier chart</div>
      </ResponsiveDisclosure>
    );

    const summary = screen.getByText("Chart");
    const details = summary.closest("details");
    expect(details).not.toHaveAttribute("open");

    rerender(
      <ResponsiveDisclosure title="Chart" defaultOpen>
        <div>Frontier chart</div>
      </ResponsiveDisclosure>
    );

    await waitFor(() => {
      expect(details).toHaveAttribute("open");
    });
  });

  it("keeps the same content node when crossing the desktop breakpoint", async () => {
    let matches = false;
    const listeners = new Set<() => void>();
    window.matchMedia = vi.fn().mockReturnValue({
      get matches() {
        return matches;
      },
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
    });

    render(
      <ResponsiveDisclosure title="Chart">
        <div data-testid="chart-content">Frontier chart</div>
      </ResponsiveDisclosure>
    );

    const details = screen.getByText("Chart").closest("details");
    const content = screen.getByTestId("chart-content");

    act(() => {
      matches = true;
      listeners.forEach((listener) => listener());
    });

    await waitFor(() => expect(details).toHaveAttribute("open"));
    expect(screen.getByTestId("chart-content")).toBe(content);

    act(() => {
      matches = false;
      listeners.forEach((listener) => listener());
    });

    await waitFor(() => expect(details).not.toHaveAttribute("open"));
    expect(screen.getByTestId("chart-content")).toBe(content);
  });
});
