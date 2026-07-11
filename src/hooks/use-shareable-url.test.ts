import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildShareableUrl, readShareableState, useShareableUrl } from "@/hooks/use-shareable-url";

describe("shareable URL helpers", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("normalizes trailing slashes and excludes unrelated query parameters", () => {
    window.history.replaceState({}, "", "/cash-flow/?source=recent&token=secret");
    const url = buildShareableUrl("/cash-flow/", "cash", {
      rate: 8,
      flows: ["-1000", "350", "450"],
    });

    const parsed = new URL(url);
    expect(parsed.origin).toBe(window.location.origin);
    expect(parsed.pathname).toBe("/cash-flow");
    expect(parsed.searchParams.get("source")).toBeNull();
    expect(parsed.searchParams.get("token")).toBeNull();
    expect(parsed.searchParams.get("cash_rate")).toBe("8");
    expect(parsed.searchParams.get("cash_flows")).toBe('json:["-1000","350","450"]');
  });

  it("removes empty values from the share query", () => {
    const url = buildShareableUrl("/risk/", "risk", {
      value: "",
      days: 30,
    });

    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/risk");
    expect(parsed.searchParams.get("risk_value")).toBeNull();
    expect(parsed.searchParams.get("risk_days")).toBe("30");
  });

  it("restores numbers, strings, and JSON string arrays from a prefixed query", () => {
    const restored = readShareableState(
      "?cash_rate=7.5&cash_flows=json%3A%5B%22-1000%22%2C%22500%7Cpipe%22%5D&cash_label=base",
      "cash",
      {
        rate: 0,
        flows: [] as string[],
        label: "",
      }
    );

    expect(restored).toEqual({
      rate: 7.5,
      flows: ["-1000", "500|pipe"],
      label: "base",
    });
  });

  it("keeps reading legacy pipe-delimited string arrays", () => {
    const restored = readShareableState("?cash_rate=7.5&cash_flows=-1000%7C500&cash_label=base", "cash", {
      rate: 0,
      flows: [] as string[],
      label: "",
    });

    expect(restored).toEqual({
      rate: 7.5,
      flows: ["-1000", "500"],
      label: "base",
    });
  });

  it("restores again when the same route receives a different search signature", async () => {
    const onRestore = vi.fn();
    const defaults = { days: 10, confidence: 0.95 };
    const state = { days: 10, confidence: 0.95 };
    window.history.replaceState({}, "", "/risk/?risk_days=20");

    const { rerender } = renderHook(() =>
      useShareableUrl({
        prefix: "risk",
        state,
        defaults,
        onRestore,
      })
    );

    await waitFor(() => expect(onRestore).toHaveBeenCalledWith({ days: 20, confidence: 0.95 }));
    rerender();
    expect(onRestore).toHaveBeenCalledTimes(1);

    act(() => {
      window.history.pushState({}, "", "/risk/?risk_days=30&risk_confidence=0.99");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => expect(onRestore).toHaveBeenLastCalledWith({ days: 30, confidence: 0.99 }));
    expect(onRestore).toHaveBeenCalledTimes(2);

    act(() => {
      window.history.pushState({}, "", "/risk/?risk_days=30");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await waitFor(() => expect(onRestore).toHaveBeenLastCalledWith({ days: 30, confidence: 0.95 }));

    act(() => {
      window.history.pushState({}, "", "/risk/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await waitFor(() => expect(onRestore).toHaveBeenLastCalledWith(defaults));
    expect(onRestore).toHaveBeenCalledTimes(4);
  });
});
