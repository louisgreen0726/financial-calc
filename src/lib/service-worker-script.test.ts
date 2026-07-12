import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

class TestRequest {
  readonly method: string;
  readonly url: string;

  constructor(input: string | URL | TestRequest, init: { method?: string } = {}) {
    this.url = input instanceof TestRequest ? input.url : String(input);
    this.method = init.method ?? (input instanceof TestRequest ? input.method : "GET");
  }
}

function createCache(matchValue?: unknown) {
  return {
    match: vi.fn().mockResolvedValue(matchValue),
    put: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockResolvedValue(undefined),
    addAll: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(true),
  };
}

async function loadServiceWorker({
  assets = [],
  routes = [],
  scope = "https://example.test/",
  response = Response,
  fetchMock,
  runtimeCache = createCache(),
  staticCache = createCache(),
}: {
  assets?: string[];
  routes?: string[];
  scope?: string;
  response?: typeof Response;
  fetchMock: ReturnType<typeof vi.fn>;
  runtimeCache?: ReturnType<typeof createCache>;
  staticCache?: ReturnType<typeof createCache>;
}) {
  const scopeUrl = new URL(scope);
  const listeners = new Map<string, (event: unknown) => void>();
  const caches = {
    open: vi.fn((name: string) => Promise.resolve(name.includes("runtime") ? runtimeCache : staticCache)),
    keys: vi.fn<() => Promise<string[]>>().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(true),
  };
  const workerGlobal = {
    __FINANCIAL_CALC_PRECACHE_MANIFEST__: { buildId: "test-build", assets, routes },
    location: { href: new URL("sw.js", scopeUrl).href, origin: scopeUrl.origin },
    registration: { scope: scopeUrl.href },
    clients: { claim: vi.fn().mockResolvedValue(undefined) },
    skipWaiting: vi.fn(),
    addEventListener: vi.fn((type: string, listener: (event: unknown) => void) => listeners.set(type, listener)),
  };
  const source = await readFile(path.resolve(process.cwd(), "public", "sw.js"), "utf8");

  vm.runInNewContext(source, {
    self: workerGlobal,
    importScripts: vi.fn(),
    caches,
    fetch: fetchMock,
    Request: TestRequest,
    URL,
    AbortController,
    Response: response,
    setTimeout,
    clearTimeout,
  });

  return { listeners, caches, runtimeCache, staticCache, workerGlobal };
}

function getRequestUrl(request: string | TestRequest) {
  return typeof request === "string" ? request : request.url;
}

async function dispatchFetch(
  listener: ((event: unknown) => void) | undefined,
  request: { method: string; mode: string; url: string }
) {
  let responsePromise: Promise<unknown> | undefined;
  const waitUntil = vi.fn();
  listener?.({
    request,
    respondWith: (promise: Promise<unknown>) => {
      responsePromise = promise;
    },
    waitUntil,
  });

  if (!responsePromise) throw new Error("The service worker did not handle the fetch request.");
  return { responsePromise, waitUntil };
}

describe("service worker navigation strategy", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("aborts a stalled navigation and returns the cached route", async () => {
    vi.useFakeTimers();
    const cachedResponse = { source: "runtime-cache" };
    const runtimeCache = createCache(cachedResponse);
    let fetchSignal: AbortSignal | undefined;
    const fetchMock = vi.fn(
      (_request: unknown, options?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          fetchSignal = options?.signal;
          options?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        })
    );
    const { listeners } = await loadServiceWorker({
      fetchMock,
      runtimeCache,
    });
    const { responsePromise, waitUntil } = await dispatchFetch(listeners.get("fetch"), {
      method: "GET",
      mode: "navigate",
      url: "https://example.test/tvm/?source=share",
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(fetchSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(5000);
    await expect(responsePromise).resolves.toBe(cachedResponse);
    expect(fetchSignal?.aborted).toBe(true);
    expect(runtimeCache.match).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://example.test/tvm/", method: "GET" })
    );
    expect(waitUntil).toHaveBeenCalledTimes(1);
  });

  it("returns the precached static 404 page for an unknown offline navigation", async () => {
    const notFoundResponse = { source: "static-404" };
    const staticCache = createCache();
    staticCache.match.mockImplementation((request: string | TestRequest) =>
      Promise.resolve(getRequestUrl(request) === "/404.html" ? notFoundResponse : undefined)
    );
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("offline"));
    const { listeners } = await loadServiceWorker({ fetchMock, staticCache });

    const { responsePromise } = await dispatchFetch(listeners.get("fetch"), {
      method: "GET",
      mode: "navigate",
      url: "https://example.test/unknown-route/",
    });

    await expect(responsePromise).resolves.toBe(notFoundResponse);
    expect(staticCache.match).toHaveBeenCalledWith("/404.html");
    expect(staticCache.match).not.toHaveBeenCalledWith("/index.html");
  });

  it("returns a network error instead of the home page when the static 404 page is unavailable", async () => {
    const responseError = vi.fn(() => ({ source: "network-error" }));
    const response = { error: responseError } as unknown as typeof Response;
    const staticCache = createCache();
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("offline"));
    const { listeners } = await loadServiceWorker({ fetchMock, response, staticCache });

    const { responsePromise } = await dispatchFetch(listeners.get("fetch"), {
      method: "GET",
      mode: "navigate",
      url: "https://example.test/unknown-route/",
    });

    await expect(responsePromise).resolves.toEqual({ source: "network-error" });
    expect(staticCache.match).toHaveBeenCalledWith("/404.html");
    expect(staticCache.match).not.toHaveBeenCalledWith("/index.html");
    expect(responseError).toHaveBeenCalledTimes(1);
  });

  it("uses base-path-prefixed cache keys and ignores requests outside its scope", async () => {
    const response = {
      ok: true,
      type: "basic",
      clone: vi.fn(() => ({ clone: "response" })),
    };
    const fetchMock = vi.fn().mockResolvedValue(response);
    const staticCache = createCache();
    const { listeners } = await loadServiceWorker({
      assets: ["/_next/static/chunks/app.js"],
      scope: "https://example.test/calc/",
      fetchMock,
      staticCache,
    });

    const { responsePromise } = await dispatchFetch(listeners.get("fetch"), {
      method: "GET",
      mode: "cors",
      url: "https://example.test/calc/_next/static/chunks/app.js?cache-bust=one",
    });

    await expect(responsePromise).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://example.test/calc/_next/static/chunks/app.js", method: "GET" })
    );
    expect(staticCache.put).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://example.test/calc/_next/static/chunks/app.js", method: "GET" }),
      { clone: "response" }
    );

    const respondWith = vi.fn();
    listeners.get("fetch")?.({
      request: {
        method: "GET",
        mode: "cors",
        url: "https://example.test/_next/static/chunks/app.js",
      },
      respondWith,
      waitUntil: vi.fn(),
    });
    expect(respondWith).not.toHaveBeenCalled();
  });

  it("uses query-free static keys only for precached paths and bounds all other assets", async () => {
    const response = {
      ok: true,
      type: "basic",
      clone: vi.fn(() => ({ clone: "response" })),
    };
    const fetchMock = vi.fn().mockResolvedValue(response);
    const runtimeCache = createCache();
    const staticCache = createCache();
    const { listeners, caches } = await loadServiceWorker({
      assets: ["/_next/static/chunks/app.js"],
      fetchMock,
      runtimeCache,
      staticCache,
    });

    const knownRequest = {
      method: "GET",
      mode: "cors",
      url: "https://example.test/_next/static/chunks/app.js?cache-bust=one",
    };
    await expect((await dispatchFetch(listeners.get("fetch"), knownRequest)).responsePromise).resolves.toBe(response);
    expect(staticCache.put).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://example.test/_next/static/chunks/app.js", method: "GET" }),
      { clone: "response" }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ url: "https://example.test/_next/static/chunks/app.js", method: "GET" })
    );
    expect(runtimeCache.put).not.toHaveBeenCalled();

    const unknownRequest = {
      method: "GET",
      mode: "cors",
      url: "https://example.test/_next/static/chunks/pdf-lazy.js?cache-bust=two",
    };
    const oldestRuntimeEntry = new TestRequest("https://example.test/runtime-0.js");
    runtimeCache.keys.mockResolvedValue([
      oldestRuntimeEntry,
      ...Array.from({ length: 40 }, (_, index) => new TestRequest(`https://example.test/runtime-${index + 1}.js`)),
    ]);
    await expect((await dispatchFetch(listeners.get("fetch"), unknownRequest)).responsePromise).resolves.toBe(response);
    expect(runtimeCache.put).toHaveBeenCalledWith(unknownRequest, { clone: "response" });
    expect(runtimeCache.keys).toHaveBeenCalled();
    expect(runtimeCache.delete).toHaveBeenCalledWith(oldestRuntimeEntry);
    expect(caches.open).toHaveBeenCalledWith(expect.stringContaining("runtime"));
  });

  it("deletes only stale caches owned by the active service-worker scope", async () => {
    const fetchMock = vi.fn();
    const { listeners, caches, workerGlobal } = await loadServiceWorker({ fetchMock });
    const currentStatic = "financial-calc-_2F-static-test-build";
    const currentRuntime = "financial-calc-_2F-runtime-test-build";
    const staleStatic = "financial-calc-_2F-static-old-build";
    const staleRuntime = "financial-calc-_2F-runtime-old-build";
    const otherScope = "financial-calc-_2Fcalc-static-old-build";
    const unrelated = "another-app-static-cache";
    caches.keys.mockResolvedValue([currentStatic, currentRuntime, staleStatic, staleRuntime, otherScope, unrelated]);

    let activationPromise: Promise<unknown> | undefined;
    listeners.get("activate")?.({
      waitUntil: (promise: Promise<unknown>) => {
        activationPromise = promise;
      },
    });

    await expect(activationPromise).resolves.toBeUndefined();
    expect(caches.delete).toHaveBeenCalledTimes(2);
    expect(caches.delete).toHaveBeenCalledWith(staleStatic);
    expect(caches.delete).toHaveBeenCalledWith(staleRuntime);
    expect(caches.delete).not.toHaveBeenCalledWith(currentStatic);
    expect(caches.delete).not.toHaveBeenCalledWith(currentRuntime);
    expect(caches.delete).not.toHaveBeenCalledWith(otherScope);
    expect(caches.delete).not.toHaveBeenCalledWith(unrelated);
    expect(workerGlobal.clients.claim).toHaveBeenCalledTimes(1);
  });

  it("keeps installing when an optional precache asset fails", async () => {
    const staticCache = createCache();
    staticCache.add.mockImplementation((asset: string) =>
      asset.endsWith("optional.js") ? Promise.reject(new TypeError("weak connection")) : Promise.resolve()
    );
    const { listeners } = await loadServiceWorker({
      assets: ["/index.html", "/404.html", "/optional.js"],
      routes: ["/"],
      fetchMock: vi.fn(),
      staticCache,
    });
    let installationPromise: Promise<unknown> | undefined;

    listeners.get("install")?.({
      waitUntil: (promise: Promise<unknown>) => {
        installationPromise = promise;
      },
    });

    await expect(installationPromise).resolves.toBeUndefined();
    expect(staticCache.add).toHaveBeenCalledTimes(3);
  });

  it("rejects installation when an essential offline fallback cannot be cached", async () => {
    const staticCache = createCache();
    staticCache.add.mockImplementation((asset: string) =>
      asset.endsWith("404.html") ? Promise.reject(new TypeError("offline")) : Promise.resolve()
    );
    const { listeners } = await loadServiceWorker({
      assets: ["/index.html", "/404.html"],
      fetchMock: vi.fn(),
      staticCache,
    });
    let installationPromise: Promise<unknown> | undefined;

    listeners.get("install")?.({
      waitUntil: (promise: Promise<unknown>) => {
        installationPromise = promise;
      },
    });

    await expect(installationPromise).rejects.toThrow("Unable to cache essential offline assets");
  });
});
