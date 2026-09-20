// ========================================
// SERVICE WORKER - MATURITA V UŠÍCH
// ========================================

const APP_CACHE = "maturita-v-usich-app-v9"; // Zvýšili jsme verzi
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

// 3. ODCHYTÁVÁNÍ POŽADAVKŮ PRO OFFLINE REŽIM A STREAMOVÁNÍ
self.addEventListener("fetch", event => {
    if (!event.request.url.startsWith("http")) return;

    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(async (cachedResponse) => {
            // Pokud soubor není v cache, stáhneme ho z internetu
            if (!cachedResponse) {
                return fetch(event.request).catch(() => {
                    console.error("Jsi offline a soubor není v cache.");
                });
            }

            // Zkontrolujeme, zda si prohlížeč žádá jen "kousek" souboru (Range request)
            const rangeHeader = event.request.headers.get("range");
            
            // Pokud je to Range požadavek (typicky audio na iOS) a máme ho v cache
            if (rangeHeader) {
                const blob = await cachedResponse.blob();
                const totalSize = blob.size;
                
                // Zjistíme, jaký přesně kousek prohlížeč chce
                const parts = rangeHeader.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

                // Odřízneme požadovaný kus
                const slicedBlob = blob.slice(start, end + 1);
                
                // Vrátíme jako stream (206 Partial Content)
                return new Response(slicedBlob, {
                    status: 206,
                    statusText: "Partial Content",
                    headers: new Headers({
                        "Content-Range": `bytes ${start}-${end}/${totalSize}`,
                        "Content-Length": slicedBlob.size,
                        "Content-Type": cachedResponse.headers.get("Content-Type") || "audio/mpeg",
                        "Accept-Ranges": "bytes"
                    })
                });
            }

            // Pokud to není Range požadavek (nebo jde o běžný soubor jako HTML/JS), vrátíme celý
            return cachedResponse;
        })
    );
});
