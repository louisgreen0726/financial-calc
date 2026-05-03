/// <reference types="vitest/globals" />

import { act, renderHook } from "@testing-library/react";
import { useUrlState } from "@/hooks/use-url-state";

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

  it("drops empty values while preserving unrelated parameters", () => {
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

    expect(navigationMock.replace).toHaveBeenCalledWith("/tvm?source=share&fc_nper=15", { scroll: false });
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
      "/cash-flow?source=share&cash_flows=-2000%7C700%7C900&cash_rate=8",
      { scroll: false }
    );
  });
});
