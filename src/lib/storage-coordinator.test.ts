import { describe, expect, it, vi } from "vitest";
import {
  getPersistenceRetryDelay,
  getStorageGeneration,
  nextStorageGeneration,
  storageLockName,
  withStorageKeyLock,
  withStorageLock,
  type StorageLockManager,
} from "@/lib/storage-coordinator";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe("storage coordinator", () => {
  it("serializes overlapping transactions in the same page without Web Locks", async () => {
    const firstMayFinish = deferred();
    const events: string[] = [];

    const first = withStorageLock(
      "same-page",
      async () => {
        events.push("first:start");
        await firstMayFinish.promise;
        events.push("first:end");
      },
      undefined
    );
    const second = withStorageLock(
      "same-page",
      () => {
        events.push("second");
      },
      undefined
    );

    await Promise.resolve();
    expect(events).toEqual(["first:start"]);

    firstMayFinish.resolve();
    await Promise.all([first, second]);
    expect(events).toEqual(["first:start", "first:end", "second"]);
  });

  it("wraps the complete transaction in an exclusive Web Lock", async () => {
    const requests: Array<{ name: string; options: { mode: "exclusive" } }> = [];
    const request: StorageLockManager["request"] = async <T>(
      name: string,
      options: { mode: "exclusive" },
      callback: (lock: unknown) => PromiseLike<T> | T
    ): Promise<T> => {
      requests.push({ name, options });
      return callback({});
    };
    const lockManager: StorageLockManager = { request };

    await expect(withStorageLock("cross-tab", () => "saved", lockManager)).resolves.toBe("saved");
    expect(requests).toEqual([{ name: "cross-tab", options: { mode: "exclusive" } }]);
  });

  it("falls back when a browser exposes but rejects Web Lock requests", async () => {
    const task = vi.fn(() => "saved");
    const request: StorageLockManager["request"] = async <T>(): Promise<T> => {
      throw new DOMException("Locks unavailable", "NotSupportedError");
    };
    const lockManager: StorageLockManager = { request };

    await expect(withStorageLock("rejected-lock", task, lockManager)).resolves.toBe("saved");
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("serializes a settings clear behind a pending write for the same storage key", async () => {
    const writeMayFinish = deferred();
    const events: string[] = [];
    const key = "financial-calc-history";

    const write = withStorageKeyLock(
      key,
      async () => {
        events.push("write:start");
        await writeMayFinish.promise;
        events.push("write:end");
      },
      undefined
    );
    const clear = withStorageKeyLock(
      key,
      () => {
        events.push("clear");
        return true;
      },
      undefined
    );

    await Promise.resolve();
    expect(events).toEqual(["write:start"]);

    writeMayFinish.resolve();
    await Promise.all([write, clear]);
    expect(events).toEqual(["write:start", "write:end", "clear"]);
  });

  it("uses namespaced lock names and bounded exponential retry delays", () => {
    expect(storageLockName("financial-calc-history")).toBe("financial-calc-storage:financial-calc-history");
    expect([0, 1, 2, 10].map((attempt) => getPersistenceRetryDelay(attempt))).toEqual([1_000, 2_000, 4_000, 30_000]);
    expect(getPersistenceRetryDelay(Number.NaN, -1, 0)).toBe(1_000);
    expect(getStorageGeneration("17")).toBe(17);
    expect(getStorageGeneration("-1")).toBe(0);
    expect(nextStorageGeneration("17")).toBe(18);
    expect(nextStorageGeneration(String(Number.MAX_SAFE_INTEGER))).toBe(0);
  });
});
