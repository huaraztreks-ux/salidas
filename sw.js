// Service Worker: guarda la app en el celular para que funcione sin señal.
// IMPORTANTE: cada vez que cambies archivos, sube el número de VERSION.
const VERSION = "v2";
const CACHE = "salidas-" + VERSION;
const ARCHIVOS = [
  "./", "./index.html", "./style.css", "./app.js", "./config.js",
  "./datos-ejemplo.js", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero intenta internet (máx. 4 s) para tener la última versión; si no hay, usa lo guardado.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return; // Google Sheets va directo
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await Promise.race([
        fetch(req),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000))
      ]);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      return (await cache.match(req, { ignoreSearch: true })) || (await cache.match("./index.html"));
    }
  })());
});
