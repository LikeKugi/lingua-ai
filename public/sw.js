const VERSION = "lingva-shell-v4";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("lingva-shell-") && key !== VERSION).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.includes("/chat/completions") || url.pathname.endsWith("/models")) return;
  const isNavigation = request.mode === "navigate";
  const isStatic = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest" || url.pathname === "/favicon.ico";
  if (!isNavigation && !isStatic) return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const response = await fetch(request);
      if (response.ok && response.type === "basic") await cache.put(isNavigation ? request : url.pathname, response.clone());
      return response;
    } catch {
      const cached = await cache.match(isNavigation ? request : url.pathname);
      if (cached) return cached;
      if (isNavigation) return (await cache.match("/")) || Response.error();
      return Response.error();
    }
  })());
});
