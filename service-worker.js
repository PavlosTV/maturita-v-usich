// ========================================
// SERVICE WORKER - MATURITA V UŠÍCH
// ========================================

const APP_CACHE = "maturita-v-usich-app-v5"; // Zvýšili jsme verzi
const CONTENT_CACHE = "maturita-v-usich-content-v1"; // Tuto schránku budeme chránit

// Seznam chráněných schránek (tyto se nesmí smazat)
const CACHE_WHITELIST = [APP_CACHE, CONTENT_CACHE];

// 1. INSTALACE APLIKACE
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(APP_CACHE).then(cache => {
            // Zde se ukládá jen "kostra" aplikace, data se stahují až tlačítkem
            return cache.addAll([
                "./",
                "./index.html",
                "./style.css",
                "./app.js",
                "./manifest.json",
                "./icon-192.png",
                "./icon-512.png",
                "./data/periods.json"
            ]);
        })
    );
    self.skipWaiting(); // Ihned převezme kontrolu
});

// 2. AKTIVACE A ÚKLID (Zde byla dříve chyba, která mazala audio)
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Pokud schránka NENÍ na našem seznamu povolených (WHITELIST), smaže se
                    if (!CACHE_WHITELIST.includes(cacheName)) {
                        console.log("Mažu starou cache:", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. ODCHYTÁVÁNÍ POŽADAVKŮ PRO OFFLINE REŽIM
self.addEventListener("fetch", event => {
    // Ignorujeme požadavky z jiných webů a pluginů
    if (!event.request.url.startsWith("http")) return;

    event.respondWith(
        // Díky { ignoreSearch: true } najde soubor i když má za otazníkem parametry
        caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
            // Pokud jsme soubor (audio nebo appku) našli v cache, vrátíme ho
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // Pokud v cache není, stáhneme ho normálně z internetu
            return fetch(event.request);
        }).catch(() => {
            // Pokud spadne i internet (jsme offline a soubor není stažený), nic se nestane
            console.error("Jsi offline a soubor není v cache.");
        })
    );
});
