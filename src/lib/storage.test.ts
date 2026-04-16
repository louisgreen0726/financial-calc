/// <reference types="vitest/globals" />

import {
  safeGetItem,
  safeGetJSON,
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
    safeSetItem("plain-key", "value");
    expect(safeGetItem("plain-key")).toBe("value");

    safeRemoveItem("plain-key");
    expect(safeGetItem("plain-key")).toBeNull();
  });

  it("reads and writes JSON localStorage values with fallback", () => {
    safeSetJSON("json-key", { enabled: true, count: 2 });
    expect(safeGetJSON("json-key", { enabled: false, count: 0 })).toEqual({ enabled: true, count: 2 });

    window.localStorage.setItem("json-key", "not-json");
    expect(safeGetJSON("json-key", { enabled: false, count: 0 })).toEqual({ enabled: false, count: 0 });
  });

  it("reads and writes JSON sessionStorage values with fallback", () => {
    safeSetSessionJSON("session-json-key", { page: "tvm", inputs: { rate: "5" } });
    expect(safeGetSessionJSON("session-json-key", null)).toEqual({ page: "tvm", inputs: { rate: "5" } });

    safeRemoveSessionItem("session-json-key");
    expect(safeGetSessionJSON("session-json-key", { page: "fallback" })).toEqual({ page: "fallback" });
  });
});
