export type PersistenceResult = "persisted" | "pending";

export type PersistenceStatus = "idle" | "pending" | "saving" | "failed";

export interface StorageLockManager {
  request<T>(name: string, options: { mode: "exclusive" }, callback: (lock: unknown) => PromiseLike<T> | T): Promise<T>;
}

const localLockTails = new Map<string, Promise<void>>();

function getBrowserLockManager(): StorageLockManager | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  return (navigator as unknown as { locks?: StorageLockManager }).locks;
}

function withLocalLock<T>(name: string, task: () => Promise<T> | T): Promise<T> {
  const previous = localLockTails.get(name);
  if (previous) {
    const result = previous.catch(() => undefined).then(task);
    const settled = result.then(
      () => undefined,
      () => undefined
    );
    localLockTails.set(name, settled);

    return result.finally(() => {
      if (localLockTails.get(name) === settled) {
        localLockTails.delete(name);
      }
    });
  }

  let release!: () => void;
  const ownTail = new Promise<void>((resolve) => {
    release = resolve;
  });
  // Install the tail before invoking task so a synchronous reentrant caller queues behind it.
  localLockTails.set(name, ownTail);

  let result: Promise<T>;
  try {
    result = Promise.resolve(task());
  } catch (error) {
    result = Promise.reject(error);
  }

  void result.then(release, release);
  return result.finally(() => {
    if (localLockTails.get(name) === ownTail) {
      localLockTails.delete(name);
    }
  });
}

/**
 * Serializes a storage transaction in this page and, where supported, across tabs.
 * The callback must contain the complete read -> apply -> write transaction.
 */
export function withStorageLock<T>(
  name: string,
  task: () => Promise<T> | T,
  lockManager: StorageLockManager | undefined = getBrowserLockManager()
): Promise<T> {
  return withLocalLock(name, async () => {
    if (!lockManager || typeof lockManager.request !== "function") {
      return task();
    }

    let taskStarted = false;
    try {
      return await lockManager.request(name, { mode: "exclusive" }, () => {
        taskStarted = true;
        return task();
      });
    } catch (error) {
      // Some embedded browsers expose navigator.locks but reject requests. Fall back only
      // when the transaction itself never started, otherwise rerunning could duplicate it.
      if (!taskStarted) {
        return task();
      }
      throw error;
    }
  });
}

export function storageLockName(storageKey: string): string {
  return `financial-calc-storage:${storageKey}`;
}

export function withStorageKeyLock<T>(
  storageKey: string,
  task: () => Promise<T> | T,
  lockManager: StorageLockManager | undefined = getBrowserLockManager()
): Promise<T> {
  return withStorageLock(storageLockName(storageKey), task, lockManager);
}

export function getStorageGeneration(value: string | null): number {
  if (value === null || !/^\d+$/.test(value)) {
    return 0;
  }

  const generation = Number(value);
  return Number.isSafeInteger(generation) && generation >= 0 ? generation : 0;
}

export function nextStorageGeneration(value: string | null): number {
  const current = getStorageGeneration(value);
  return current >= Number.MAX_SAFE_INTEGER ? 0 : current + 1;
}

export function getPersistenceRetryDelay(attempt: number, baseDelayMs = 1_000, maxDelayMs = 30_000): number {
  const normalizedAttempt = Number.isInteger(attempt) && attempt > 0 ? attempt : 0;
  const normalizedBase = Number.isFinite(baseDelayMs) && baseDelayMs > 0 ? baseDelayMs : 1_000;
  const normalizedMax = Number.isFinite(maxDelayMs) && maxDelayMs >= normalizedBase ? maxDelayMs : normalizedBase;

  return Math.min(normalizedBase * 2 ** Math.min(normalizedAttempt, 30), normalizedMax);
}
