/// <reference types="vitest/globals" />

import {
  safeGetItem,
  safeGetJSON,
  safeGetSessionItem,
  safeGetSessionJSON,
  safeRemoveItem,
  safeRemoveSessionItem,
  safeSetItem,
  safeSetJSON,
  safeSetSessionJSON,
} from "@/lib/storage";

describe("storage utilities", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("reads and writes plain localStorage values safely", () => {
    expect(safeSetItem("plain-key", "value")).toBe(true);
    expect(safeGetItem("plain-key")).toBe("value");

    expect(safeRemoveItem("plain-key")).toBe(true);
    expect(safeGetItem("plain-key")).toBeNull();
  });

  it("reads and writes JSON localStorage values with fallback", () => {
    safeSetJSON("json-key", { enabled: true, count: 2 });
    expect(safeGetJSON("json-key", { enabled: false, count: 0 })).toEqual({ enabled: true, count: 2 });

    window.localStorage.setItem("json-key", "not-json");
    expect(safeGetJSON("json-key", { enabled: false, count: 0 })).toEqual({ enabled: false, count: 0 });
  });

  it("ignores localStorage JSON serialization failures", () => {
    expect(safeSetJSON("undefined-key", undefined)).toBe(false);
    expect(safeSetJSON("bigint-key", { value: BigInt(1) })).toBe(false);

    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(safeSetJSON("circular-key", circular)).toBe(false);
    expect(safeGetItem("bigint-key")).toBeNull();
    expect(safeGetItem("circular-key")).toBeNull();
    expect(safeGetItem("undefined-key")).toBeNull();
  });

  it("reads and writes JSON sessionStorage values with fallback", () => {
    safeSetSessionJSON("session-json-key", { page: "tvm", inputs: { rate: "5" } });
    expect(safeGetSessionItem("session-json-key")).toContain('"page":"tvm"');
    expect(safeGetSessionJSON("session-json-key", null)).toEqual({ page: "tvm", inputs: { rate: "5" } });

    safeRemoveSessionItem("session-json-key");
    expect(safeGetSessionJSON("session-json-key", { page: "fallback" })).toEqual({ page: "fallback" });
  });

  it("ignores sessionStorage JSON serialization failures", () => {
    expect(safeSetSessionJSON("undefined-session-key", undefined)).toBe(false);
    expect(safeSetSessionJSON("bigint-session-key", { value: BigInt(1) })).toBe(false);
    expect(window.sessionStorage.getItem("undefined-session-key")).toBeNull();
    expect(window.sessionStorage.getItem("bigint-session-key")).toBeNull();
  });

  it("reports storage API failures without throwing", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    expect(safeSetItem("blocked-key", "value")).toBe(false);
    expect(safeSetJSON("blocked-json", { value: true })).toBe(false);
    expect(safeSetSessionJSON("blocked-session", { value: true })).toBe(false);

    setItem.mockRestore();
  });
});
