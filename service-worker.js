// ========================================
// SERVICE WORKER - MATURITA V UŠÍCH
// ========================================

const APP_CACHE = 'maturita-app-shell-v1';
const CONTENT_CACHE = 'maturita-content-v1'; // Tuto schránku budeme chránit

// Zde definujeme pouze soubory kostry, bez MP3 a JSON
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// 1. INSTALACE - Uložíme kostru do paměti
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(APP_CACHE).then(cache => cache.addAll(ASSETS))
    );
    // Vynutíme okamžitou instalaci bez čekání
    self.skipWaiting();
});

// 2. AKTIVACE - Úklid starého balastu
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Smažeme vše, co není aktuální kostra (APP_CACHE) 
                    // a zachováme obsahovou cache s audiem (CONTENT_CACHE)
                    if (cacheName !== APP_CACHE && cacheName !== CONTENT_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Service Worker okamžitě převezme kontrolu nad stránkou
    self.clients.claim();
});

// 3. FETCH (Získávání dat) - Cache First strategie
self.addEventListener('fetch', event => {
    // Ignorujeme požadavky z jiných webů a pluginů
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        // Díky { ignoreSearch: true } najde soubor i když má za otazníkem parametry
        caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
            // Pokud jsme soubor (audio nebo appku) našli v cache, vrátíme ho
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // Pokud v cache není, stáhneme ho normálně z internetu
            return fetch(event.request).catch(() => {
                // Pokud spadne i internet (jsme offline a soubor není stažený), nic se nestane
                console.log("Zařízení je offline a soubor není v cache.");
            });
        })
    );
});
