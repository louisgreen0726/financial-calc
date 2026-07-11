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

const withBasePath = (assetPath) => {
  if (assetPath === "/") return `${BASE_PATH || ""}/`;
  return `${BASE_PATH}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
};

const precacheAssets = [...new Set(manifest.assets)].map(withBasePath);
const precacheAssetPaths = new Set(precacheAssets.map((asset) => new URL(asset, self.location.origin).pathname));
const routePaths = new Set(manifest.routes.map(withBasePath));

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

function respondWithLifetime(event, responsePromise) {
  event.respondWith(responsePromise);
  event.waitUntil(
    responsePromise.then(
      () => undefined,
      () => undefined
    )
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(precacheAssets);

      for (const routePath of routePaths) {
        const routeUrl = new URL(routePath, self.location.origin);
        const routeResponse = await cache.match(routeAssetPath(routeUrl.pathname));
        if (routeResponse) {
          await cache.put(navigationCacheKey(routeUrl), routeResponse);
        }
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith(CACHE_PREFIX) && !OWNED_CACHES.has(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function cacheFirst(request, cacheName, cacheKey = request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const response = await fetch(cacheKey);
  if (isCacheable(response)) {
    await cache.put(cacheKey, response.clone());
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
  const runtimeCache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
    const contentType = response.headers.get("content-type") ?? "";
    if (isCacheable(response) && contentType.includes("text/html")) {
      await runtimeCache.put(cacheKey, response.clone());
      await trimCache(runtimeCache, MAX_RUNTIME_ENTRIES);
    }
    return response;
  } catch {
    const runtimeResponse = await runtimeCache.match(cacheKey);
    if (runtimeResponse) return runtimeResponse;

    const staticCache = await caches.open(STATIC_CACHE);
    const routeResponse = await staticCache.match(cacheKey);
    if (routeResponse) return routeResponse;

    const routeAssetResponse = await staticCache.match(routeAssetPath(url.pathname));
    if (routeAssetResponse) return routeAssetResponse;

    // An unknown offline navigation must not silently render the home page.
    return (await staticCache.match(withBasePath("/404.html"))) ?? Response.error();
  }
}

async function runtimeCacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) {
    await cache.put(request, response.clone());
    await trimCache(cache, MAX_RUNTIME_ENTRIES);
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
