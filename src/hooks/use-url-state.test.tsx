/// <reference types="vitest/globals" />

import { act, renderHook } from "@testing-library/react";
import { useUrlState } from "@/hooks/use-url-state";
import { MAX_URL_STATE_VALUE_LENGTH } from "@/lib/url-state-utils";

const navigationMock = vi.hoisted(() => ({
  pathname: "/tvm",
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
  useRouter: () => ({ replace: navigationMock.replace }),
  useSearchParams: () => navigationMock.searchParams,
}));

describe("useUrlState", () => {
  beforeEach(() => {
    navigationMock.pathname = "/tvm";
    navigationMock.replace.mockClear();
    navigationMock.searchParams = new URLSearchParams();
  });

  it("updates a full prefixed state in one router replace", () => {
    navigationMock.searchParams = new URLSearchParams("source=share&fc_rate=5");

    const { result } = renderHook(() =>
      useUrlState({
        defaultValues: { rate: "5", nper: "10", pmt: "0" },
        prefix: "fc",
      })
    );

    act(() => {
      result.current.setState({ rate: "7", nper: "20", pmt: "-100" });
    });

    expect(navigationMock.replace).toHaveBeenCalledTimes(1);
    expect(navigationMock.replace).toHaveBeenCalledWith("/tvm?source=share&fc_rate=7&fc_nper=20&fc_pmt=-100", {
      scroll: false,
    });
  });

  it("merges consecutive updates against the latest requested state", () => {
    const { result } = renderHook(() =>
      useUrlState({
        defaultValues: { rate: "5", nper: "10", pmt: "0" },
        prefix: "tvm",
      })
    );

    act(() => {
      result.current.setState({ rate: "7", nper: "20", pmt: "-100" });
      result.current.setField("rate", "8");
      result.current.setField("nper", "24");
    });

    expect(navigationMock.replace).toHaveBeenNthCalledWith(2, "/tvm?tvm_rate=8&tvm_nper=20&tvm_pmt=-100", {
      scroll: false,
    });
    expect(navigationMock.replace).toHaveBeenNthCalledWith(3, "/tvm?tvm_rate=8&tvm_nper=24&tvm_pmt=-100", {
      scroll: false,
    });
  });

  it("yields the optimistic state to an externally observed URL change", () => {
    const defaultValues = { rate: "5", nper: "10" };
    const { result, rerender } = renderHook(() => useUrlState({ defaultValues, prefix: "tvm" }));

    act(() => result.current.setField("rate", "8"));
    navigationMock.searchParams = new URLSearchParams("tvm_rate=9&tvm_nper=18");
    rerender();
    act(() => result.current.setField("nper", "24"));

    expect(navigationMock.replace).toHaveBeenLastCalledWith("/tvm?tvm_rate=9&tvm_nper=24", { scroll: false });
  });

  it("resets only its own prefixed parameters", () => {
    navigationMock.searchParams = new URLSearchParams("utm_source=review&fc_rate=7&fc_nper=20&other_value=keep");
    const { result } = renderHook(() => useUrlState({ defaultValues: { rate: "5", nper: "10" }, prefix: "fc" }));

    act(() => result.current.reset());

    expect(navigationMock.replace).toHaveBeenCalledWith("/tvm?utm_source=review&other_value=keep", { scroll: false });
  });

  it("preserves empty string values so controlled inputs can stay blank", () => {
    navigationMock.searchParams = new URLSearchParams("source=share&fc_rate=5&fc_nper=10");

    const { result } = renderHook(() =>
      useUrlState({
        defaultValues: { rate: "5", nper: "10" },
        prefix: "fc",
      })
    );

    act(() => {
      result.current.setState({ rate: "", nper: "15" });
    });

    expect(navigationMock.replace).toHaveBeenCalledWith("/tvm?source=share&fc_rate=&fc_nper=15", { scroll: false });
  });

  it("serializes arrays and normalizes trailing slashes", () => {
    navigationMock.pathname = "/cash-flow/";
    navigationMock.searchParams = new URLSearchParams("source=share");

    const { result } = renderHook(() =>
      useUrlState({
        defaultValues: { flows: ["-1000", "500"], rate: "8" },
        prefix: "cash",
      })
    );

    act(() => {
      result.current.setField("flows", ["-2000", "700", "900"]);
    });

    expect(navigationMock.replace).toHaveBeenCalledWith(
      "/cash-flow?source=share&cash_flows=json%3A%5B%22-2000%22%2C%22700%22%2C%22900%22%5D&cash_rate=8",
      { scroll: false }
    );
  });

  it("exposes an absolute share URL containing only calculator state", () => {
    navigationMock.pathname = "/tvm/";
    navigationMock.searchParams = new URLSearchParams("source=share&token=secret&fc_rate=4");

    const { result } = renderHook(() =>
      useUrlState({
        defaultValues: { rate: "5", nper: "10" },
        prefix: "fc",
      })
    );

    expect(result.current.shareUrl).toBe(`${window.location.origin}/tvm?fc_rate=4&fc_nper=10`);
  });

  it("does not leak unrelated parameters from loan calculator links", () => {
    navigationMock.pathname = "/loans/";
    navigationMock.searchParams = new URLSearchParams(
      "utm_source=newsletter&token=secret&loans_amount=250000&loans_rate=4.25"
    );

    const { result } = renderHook(() =>
      useUrlState({
        defaultValues: { method: "CPM", amount: "500000", rate: "4.5", years: "30" },
        prefix: "loans",
      })
    );

    expect(result.current.shareUrl).toBe(
      `${window.location.origin}/loans?loans_method=CPM&loans_amount=250000&loans_rate=4.25&loans_years=30`
    );
  });

  it("ignores oversized restored values without replacing defaults", () => {
    navigationMock.searchParams = new URLSearchParams("fc_nper=24");
    navigationMock.searchParams.set("fc_rate", "9".repeat(MAX_URL_STATE_VALUE_LENGTH + 1));
    navigationMock.searchParams.set("fc_flows", "x".repeat(MAX_URL_STATE_VALUE_LENGTH + 1));

    const { result } = renderHook(() =>
      useUrlState({
        defaultValues: { rate: "5", nper: "10", flows: ["-1000", "600"] },
        prefix: "fc",
      })
    );

    expect(result.current.state).toEqual({ rate: "5", nper: "24", flows: ["-1000", "600"] });
  });
});
