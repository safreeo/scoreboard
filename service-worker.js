const CACHE_NAME = "scoreboard-v1.1.44-r112";
const APP_SHELL = [
  "./", "./index.html", "./style.css", "./app.js", "./r75-update.js", "./r76-update.js", "./r78-update.js", "./r80-update.js", "./r81-update.js", "./v1.1-language.js", "./v1.1.9-bm-patch.js", "./r82-update.js", "./r83-update.js", "./r87-update.js", "./r88-update.js", "./r89-update.js", "./r90-update.js", "./r91-update.js", "./r92-update.js", "./r93-update.js", "./r94-update.js", "./r97-update.js", "./r98-update.js", "./r99-update.js", "./r109-update.js", "./r110-update.js", "./r111-update.js", "./r112-update.js", "./manifest.webmanifest",
  "./assets/scoreboard-logo.png", "./assets/icon-192.png", "./assets/icon-512.png",
  "./assets/icon-maskable-512.png", "./assets/referee-whistle.mp3"
];
self.addEventListener("install", event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", event => { if (event.request.method !== "GET") return; event.respondWith(fetch(event.request).then(response => { const copy=response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request,copy)); return response; }).catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))); });
