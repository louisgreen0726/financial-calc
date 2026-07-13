importScripts("precache-manifest.js");

const manifest = self.__FINANCIAL_CALC_PRECACHE_MANIFEST__ ?? {
  buildId: new URL(self.location.href).searchParams.get("v") || "development",
  assets: [],
  routes: [],
};
const BUILD_ID = String(manifest.buildId).replace(/[^a-zA-Z0-9._-]/g, "_");
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const SCOPE_KEY = encodeURIComponent(BASE_PATH || "/").replace(/%/g, "_");
const CACHE_PREFIX = `financial-calc-${SCOPE_KEY}-`;
const STATIC_CACHE = `${CACHE_PREFIX}static-${BUILD_ID}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-${BUILD_ID}`;
const OWNED_CACHES = new Set([STATIC_CACHE, RUNTIME_CACHE]);
const MAX_RUNTIME_ENTRIES = 40;
const NAVIGATION_TIMEOUT_MS = 5000;
const PRECACHE_BATCH_SIZE = 12;

const withBasePath = (assetPath) => {
  if (assetPath === "/") return `${BASE_PATH || ""}/`;
  return `${BASE_PATH}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
};

const precacheAssets = [...new Set(manifest.assets)].map(withBasePath);
const precacheAssetPaths = new Set(precacheAssets.map((asset) => new URL(asset, self.location.origin).pathname));
const reportedCacheFailures = new Set();

function isQuotaExceededError(error) {
  return typeof error === "object" && error !== null && "name" in error && error.name === "QuotaExceededError";
}

function reportCacheFailure(operation, cacheName, error) {
  const key = `${operation}:${cacheName}`;
  if (reportedCacheFailures.has(key)) return;
  reportedCacheFailures.add(key);
  console.warn(`[PWA] Cache ${operation} failed for ${cacheName}; continuing without this cache update.`, error);
}

function isWithinScope(url) {
  return !BASE_PATH || url.pathname === BASE_PATH || url.pathname.startsWith(`${BASE_PATH}/`);
}

function shouldHandle(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  return url.origin === self.location.origin && isWithinScope(url);
}

function getPrecacheCacheKey(request) {
  const url = new URL(request.url);
  if (!precacheAssetPaths.has(url.pathname)) return null;
  return new Request(new URL(url.pathname, url.origin).toString(), { method: "GET" });
}

function isCacheable(response) {
  return Boolean(response?.ok && response.type === "basic");
}

function toNavigationResponse(response, status = response.status, statusText = response.statusText) {
  if (typeof Response !== "function" || !(response instanceof Response)) return response;
  return new Response(response.body, {
    status,
    statusText,
    headers: response.headers,
  });
}

function canonicalNavigationPath(pathname) {
  if (pathname === BASE_PATH) return `${BASE_PATH || ""}/`;
  if (pathname.endsWith("/") || /\/[^/]+\.[^/]+$/.test(pathname)) return pathname;
  return `${pathname}/`;
}

function navigationCacheKey(url) {
  return new Request(new URL(canonicalNavigationPath(url.pathname), url.origin).toString(), { method: "GET" });
}

function routeAssetPath(pathname) {
  const canonicalPath = canonicalNavigationPath(pathname);
  const relativePath =
    BASE_PATH && canonicalPath.startsWith(BASE_PATH) ? canonicalPath.slice(BASE_PATH.length) : canonicalPath;
  return withBasePath(`${relativePath.startsWith("/") ? relativePath : `/${relativePath}`}index.html`);
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  const excess = keys.length - maxEntries;
  if (excess > 0) {
    await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
  }
}

async function matchCache(cacheName, cacheKey) {
  try {
    const cache = await caches.open(cacheName);
    return await cache.match(cacheKey);
  } catch (error) {
    reportCacheFailure("read", cacheName, error);
    return undefined;
  }
}

async function putResponseInCache(cacheName, cacheKey, response, maxEntries) {
  let cache;
  try {
    cache = await caches.open(cacheName);
  } catch (error) {
    reportCacheFailure("open", cacheName, error);
    return false;
  }

  const write = async () => {
    if (maxEntries !== undefined) {
      const existingResponse = await cache.match(cacheKey);
      if (!existingResponse) {
        await trimCache(cache, Math.max(0, maxEntries - 1));
      }
    }
    await cache.put(cacheKey, response.clone());
    if (maxEntries !== undefined) {
      await trimCache(cache, maxEntries);
    }
  };

  try {
    await write();
    return true;
  } catch (error) {
    if (maxEntries !== undefined && isQuotaExceededError(error)) {
      try {
        await trimCache(cache, Math.floor(maxEntries / 2));
        await cache.put(cacheKey, response.clone());
        await trimCache(cache, maxEntries);
        return true;
      } catch (retryError) {
        reportCacheFailure("quota-recovery", cacheName, retryError);
        return false;
      }
    }

    reportCacheFailure("write", cacheName, error);
    return false;
  }
}

function respondWithLifetime(event, responsePromise) {
  event.respondWith(responsePromise);
  event.waitUntil(
    responsePromise.then(
      () => undefined,
      () => undefined
    )
  );
}

async function populatePrecache(cache) {
  const failedAssets = [];

  for (let index = 0; index < precacheAssets.length; index += PRECACHE_BATCH_SIZE) {
    const batch = precacheAssets.slice(index, index + PRECACHE_BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((asset) => cache.add(asset)));
    results.forEach((result, resultIndex) => {
      if (result.status === "rejected") {
        failedAssets.push(batch[resultIndex]);
      }
    });
  }

  const essentialAssets = [withBasePath("/index.html"), withBasePath("/404.html")];
  const missingEssentialAssets = essentialAssets.filter((asset) => failedAssets.includes(asset));
  if (missingEssentialAssets.length > 0) {
    throw new Error(`Unable to cache essential offline assets: ${missingEssentialAssets.join(", ")}`);
  }

  if (failedAssets.length > 0) {
    console.warn(`[PWA] ${failedAssets.length} optional assets were not precached and will be retried on demand.`);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        await populatePrecache(cache);
      } catch (error) {
        try {
          await caches.delete(STATIC_CACHE);
        } catch (cleanupError) {
          reportCacheFailure("partial-install-cleanup", STATIC_CACHE, cleanupError);
        }
        throw error;
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const staleCacheNames = cacheNames.filter((name) => name.startsWith(CACHE_PREFIX) && !OWNED_CACHES.has(name));
        const deletionResults = await Promise.allSettled(staleCacheNames.map((name) => caches.delete(name)));
        deletionResults.forEach((result, index) => {
          if (result.status === "rejected") {
            reportCacheFailure("stale-delete", staleCacheNames[index], result.reason);
          }
        });
      } catch (error) {
        reportCacheFailure("enumeration", CACHE_PREFIX, error);
      }

      try {
        await self.clients.claim();
      } catch (error) {
        reportCacheFailure("client-claim", CACHE_PREFIX, error);
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function cacheFirst(request, cacheName, cacheKey = request) {
  const cached = await matchCache(cacheName, cacheKey);
  if (cached) return cached;

  const response = await fetch(cacheKey);
  if (isCacheable(response)) {
    await putResponseInCache(cacheName, cacheKey, response);
  }
  return response;
}

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function navigationNetworkFirst(request) {
  const url = new URL(request.url);
  const cacheKey = navigationCacheKey(url);
  let response;

  try {
    response = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
    if (response.type === "error" || response.status === 0) {
      throw new TypeError("Navigation network request returned an error response.");
    }
  } catch {
    const runtimeResponse = await matchCache(RUNTIME_CACHE, cacheKey);
    if (runtimeResponse) return toNavigationResponse(runtimeResponse);

    const routeResponse = await matchCache(STATIC_CACHE, cacheKey);
    if (routeResponse) return toNavigationResponse(routeResponse);

    const routeAssetResponse = await matchCache(STATIC_CACHE, routeAssetPath(url.pathname));
    if (routeAssetResponse) return toNavigationResponse(routeAssetResponse);

    // An unknown offline navigation must not silently render the home page.
    const notFoundResponse = (await matchCache(STATIC_CACHE, withBasePath("/404.html"))) ?? Response.error();
    return notFoundResponse.type === "error"
      ? notFoundResponse
      : toNavigationResponse(notFoundResponse, 404, "Not Found");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (isCacheable(response) && contentType.includes("text/html")) {
    await putResponseInCache(RUNTIME_CACHE, cacheKey, response, MAX_RUNTIME_ENTRIES);
  }
  return response;
}

async function runtimeCacheFirst(request) {
  const cached = await matchCache(RUNTIME_CACHE, request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) {
    await putResponseInCache(RUNTIME_CACHE, request, response, MAX_RUNTIME_ENTRIES);
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (!shouldHandle(event.request)) return;

  const request = event.request;
  if (request.mode === "navigate") {
    respondWithLifetime(event, navigationNetworkFirst(request));
    return;
  }

  const precacheCacheKey = getPrecacheCacheKey(request);
  if (precacheCacheKey) {
    respondWithLifetime(event, cacheFirst(request, STATIC_CACHE, precacheCacheKey));
    return;
  }

  respondWithLifetime(event, runtimeCacheFirst(request));
});
