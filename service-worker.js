const CACHE_NAME = "scoreboard-v1.1.97-elimination-r215";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./r75-update.js",
  "./r76-update.js",
  "./r78-update.js",
  "./r80-update.js",
  "./r81-update.js",
  "./v1.1-language.js",
  "./v1.1.9-bm-patch.js",
  "./r82-update.js",
  "./r83-update.js",
  "./r87-update.js",
  "./r88-update.js",
  "./r89-update.js",
  "./r90-update.js",
  "./r91-update.js",
  "./r92-update.js",
  "./r93-update.js",
  "./r94-update.js",
  "./r97-update.js",
  "./r98-update.js",
  "./r99-update.js",
  "./r109-update.js",
  "./r110-update.js",
  "./r111-update.js",
  "./r112-update.js",
  "./r113-update.js",
  "./r114-update.js",
  "./r115-update.js",
  "./r116-update.js",
  "./r117-update.js",
  "./r118-update.js",
  "./r119-update.js",
  "./r123-update.js",
  "./r124-update.js",
  "./r125-update.js",
  "./r152-update.js",
  "./r153-update.js",
  "./r155-update.js",
  "./r157-update.js",
  "./elimination-guide.js",
  "./manifest.webmanifest",
  "./assets/scoreboard-logo.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png",
  "./assets/referee-whistle.mp3",
  "./manifest.webmanifest?v=1214",
  "./style.css?v=1242",
  "./app.js?v=1243",
  "./r75-update.js?v=1166",
  "./r76-update.js?v=1166",
  "./r78-update.js?v=1166",
  "./r80-update.js?v=1166",
  "./r81-update.js?v=1166",
  "./v1.1-language.js?v=1166",
  "./v1.1.9-bm-patch.js?v=1166",
  "./r82-update.js?v=1192",
  "./r83-update.js?v=1190",
  "./r87-update.js?v=1166",
  "./r88-update.js?v=1166",
  "./r89-update.js?v=1166",
  "./r90-update.js?v=1166",
  "./r91-update.js?v=1166",
  "./r92-update.js?v=1166",
  "./r93-update.js?v=1166",
  "./r94-update.js?v=1166",
  "./r97-update.js?v=1166",
  "./r98-update.js?v=1166",
  "./r99-update.js?v=1196",
  "./r109-update.js?v=1192",
  "./r110-update.js?v=1166",
  "./r111-update.js?v=1166",
  "./r112-update.js?v=1166",
  "./r113-update.js?v=1166",
  "./r114-update.js?v=1166",
  "./r115-update.js?v=1166",
  "./r116-update.js?v=1166",
  "./r117-update.js?v=1166",
  "./r118-update.js?v=1166",
  "./r119-update.js?v=1166",
  "./r123-update.js?v=1166",
  "./r124-update.js?v=1166",
  "./r125-update.js?v=1166",
  "./r152-update.js?v=1243",
  "./r153-update.js?v=1166",
  "./r155-update.js?v=1193",
  "./r157-update.js?v=1166",
  "./elimination-guide.js?v=1243"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL.map(url => new Request(url,{cache:"reload"})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("scoreboard-") && k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request=event.request;
  if(request.method!=="GET"||!request.url.startsWith(self.registration.scope))return;
  const navigation=request.mode==="navigate";
  const fresh=navigation||["script","style","manifest"].includes(request.destination)||/\.(?:js|css|webmanifest)$/.test(new URL(request.url).pathname);
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    try{
      const response=await fetch(request,fresh?{cache:"no-cache"}:undefined);
      if(!response.ok)throw Error("Network response "+response.status);
      try{await cache.put(request,response.clone());}catch(e){}
      return response;
    }catch(e){
      const cached=await cache.match(request);
      if(cached)return cached;
      if(navigation){const home=await cache.match("./index.html");if(home)return home;}
      return Response.error();
    }
  })());
});