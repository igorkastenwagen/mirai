/* MIRAI: funciona sin conexión. Los datos (cifrados) y la página se piden primero a la red y, si no hay,
   se usa la última copia guardada. Los iconos y el manifiesto se sirven desde la copia. */
const CACHE = "mirai-v1";
const BASE = ["./", "index.html", "manifest.webmanifest", "icono-192.png", "icono-512.png", "icono-maskable-512.png", "apple-touch-icon.png"];

self.addEventListener("install", (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (ev) => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== "GET" || url.origin !== self.location.origin) return;  // fuentes, GitHub, etc.: sin tocar
  const primeroRed = ev.request.mode === "navigate" || url.pathname.endsWith("datos.enc.json") || url.pathname.endsWith("index.html");
  if (primeroRed) {
    ev.respondWith(fetch(ev.request).then((r) => {
      const copia = r.clone();
      if (r.ok) caches.open(CACHE).then((c) => c.put(ev.request, copia));
      return r;
    }).catch(() => caches.match(ev.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))));
  } else {
    ev.respondWith(caches.match(ev.request).then((r) => r || fetch(ev.request)));
  }
});
