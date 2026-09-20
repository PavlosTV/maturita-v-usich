const APP_CACHE = 'maturita-app-shell-v2';
const CONTENT_CACHE = 'maturita-content-v1'; // Zde budeme v app.js ukládat audio

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
    // Ignorujeme požadavky z rozšíření prohlížeče atd.
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
            // Pokud soubor najdeme v jakékoliv cache (kostra i audio), vrátíme ho
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // Jinak ho normálně stáhneme z internetu
            return fetch(event.request).catch(() => {
                // Pokud selže i síť (člověk je offline a soubor nemá)
                console.log("Zařízení je offline a soubor není v cache.");
            });
        })
    );
});
