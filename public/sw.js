const VERSION = "v0.3.0";
const STATIC_CACHE = `financial-calc-static-${VERSION}`;
const RUNTIME_CACHE = `financial-calc-runtime-${VERSION}`;

const APP_SHELL = [
  "/",
  "/tvm",
  "/bonds",
  "/cash-flow",
  "/equity",
  "/loans",
  "/macro",
  "/options",
  "/portfolio",
  "/risk",
  "/history",
  "/settings",
  "/help",
  "/manifest.json",
  "/favicon.ico",
  "/icon.svg",
];

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
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)));
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
          return caches.match("/");
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
