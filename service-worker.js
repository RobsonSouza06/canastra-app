const CACHE_NAME = "canastra-v4-complete";
const urlsToCache = ["./", "./index.html", "./style.css", "./script.js", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  e.respondWith(fetch(e.request).then(res => {
    if (res.status === 200) {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
    }
    return res;
  }).catch(() => caches.match(e.request)));
});