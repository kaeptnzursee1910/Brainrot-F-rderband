/* Service Worker: macht das Spiel offline spielbar.
   Bei Änderungen an den Dateien die Versionsnummer erhöhen. */
const CACHE = "brainrot-fliessband-v10";
const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./config.js",
  "./js/vendor/supabase-2.45.4.min.js",
  "./js/game.js",
  "./js/online.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./img/characters/assassino.svg",
  "./img/characters/ballerina.svg",
  "./img/characters/bombardiro.svg",
  "./img/characters/camelini.svg",
  "./img/characters/chimpanzini.svg",
  "./img/characters/gattino.svg",
  "./img/characters/gusini.svg",
  "./img/characters/kosmonaut.svg",
  "./img/characters/leone.svg",
  "./img/characters/piccione.svg",
  "./img/characters/pinguino.svg",
  "./img/characters/ranocchio.svg",
  "./img/characters/reaktor.svg",
  "./img/characters/spaghettosauro.svg",
  "./img/characters/tralalero.svg",
  "./img/characters/trippi.svg",
  "./img/characters/tung.svg",
  "./img/characters/bananita.svg",
  "./img/characters/burbaloni.svg",
  "./img/characters/trulimero.svg",
  "./img/characters/boneca.svg",
  "./img/characters/frigo.svg",
  "./img/characters/glorbo.svg",
  "./img/characters/bobritto.svg",
  "./img/characters/lirili.svg",
  "./img/characters/patapim.svg",
  "./img/characters/vaca.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: sofort aus dem Cache, im Hintergrund aktualisieren
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // Konfiguration immer zuerst frisch aus dem Netz holen
  if (new URL(req.url).pathname.endsWith("/config.js")) {
    e.respondWith(fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cached || (req.mode === "navigate" ? cache.match("./index.html") : undefined));
      return cached || network;
    })
  );
});
