const CACHE_NAME = "luckin-cn-stable-v15";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./avocado-u.jpg",
  "./avocado-20.jpg",
  "./mango-u.jpg",
  "./mango-20.jpg",
  "./crimson-moon.b64",
  "./.nojekyll",
];

function base64ToBytes(value) {
  const binary = atob(value.trim());
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function crimsonMoonPhotoResponse() {
  return fetch("./crimson-moon.b64", { cache: "reload" })
    .then((response) => response.text())
    .then((base64) =>
      new Response(base64ToBytes(base64), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "no-store",
        },
      })
    );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.endsWith("/crimson-moon.jpg")) {
    event.respondWith(crimsonMoonPhotoResponse().catch(() => fetch(request)));
    return;
  }

  if (request.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", responseClone));
          return networkResponse;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (url.pathname.endsWith("/script.js") || url.pathname.endsWith("/styles.css")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }

          return caches.match("./");
        });
    })
  );
});
