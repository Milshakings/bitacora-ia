// Cambia "v1" por "v2" (o un número mayor cada vez que actualices el código)
const CACHE_NAME = "bitacora-ia-v2";

self.addEventListener("install", (e) => {
  self.skipWaiting(); // Fuerza a activar la nueva versión inmediatamente
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/", "/manifest.json"]);
    })
  );
});

self.addEventListener("activate", (e) => {
  // Elimina las cachés antiguas automáticas
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});