const VERSION = "v0.4.0";
const STATIC_CACHE = `financial-calc-static-${VERSION}`;
const RUNTIME_CACHE = `financial-calc-runtime-${VERSION}`;

const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const withBasePath = (path) => {
  if (path === "/") return `${BASE_PATH || ""}/`;
  return `${BASE_PATH}${path}`;
};

const ROUTE_SHELL = [
  "/",
  "/tvm/",
  "/tvm",
  "/bonds/",
  "/bonds",
  "/cash-flow/",
  "/cash-flow",
  "/equity/",
  "/equity",
  "/loans/",
  "/loans",
  "/macro/",
  "/macro",
  "/options/",
  "/options",
  "/portfolio/",
  "/portfolio",
  "/risk/",
  "/risk",
  "/history/",
  "/history",
  "/settings/",
  "/settings",
  "/help/",
  "/help",
];

const APP_SHELL = [...ROUTE_SHELL, "/manifest.json", "/favicon.ico", "/icon.svg"].map(withBasePath);

function shouldHandle(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  return url.origin === self.location.origin;
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(js|css|png|jpg|jpeg|svg|webp|ico|woff2?|json)$/.test(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => Promise.all(APP_SHELL.map((path) => cache.add(path).catch(() => null))))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.filter((name) => ![STATIC_CACHE, RUNTIME_CACHE].includes(name)).map((name) => caches.delete(name))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (!shouldHandle(event.request)) return;

  const request = event.request;
  const url = new URL(request.url);

  if (isStaticAsset(request)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
    return;
  }

  if (request.mode === "navigate" || url.pathname === "/") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          const cachedPath = await caches.match(url.pathname);
          if (cachedPath) return cachedPath;
          if (!url.pathname.endsWith("/")) {
            const cachedTrailingSlashPath = await caches.match(`${url.pathname}/`);
            if (cachedTrailingSlashPath) return cachedTrailingSlashPath;
          }
          return caches.match(withBasePath("/"));
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        const copy = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
