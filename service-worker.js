const APP_CACHE = 'maturita-app-v5';
const CONTENT_CACHE = 'maturita-content-v1';

const APP_FILES = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './data/periods.json'
];


// INSTALL
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(APP_CACHE).then(cache => {
            return cache.addAll(APP_FILES);
        })
    );

    self.skipWaiting();
});


// ACTIVATE
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {

                    // NIKDY NEMAŽEME OFFLINE OBSAH
                    if (cacheName === CONTENT_CACHE) {
                        return null;
                    }

                    // Aktuální cache aplikace necháváme
                    if (cacheName === APP_CACHE) {
                        return null;
                    }

                    return caches.delete(cacheName);
                })
            );
        })
    );

    self.clients.claim();
});


// FETCH
self.addEventListener('fetch', event => {

    if (event.request.method !== 'GET') {
        return;
    }

    const request = event.request;

    event.respondWith(
        caches.match(request).then(cachedResponse => {

            // Pokud je soubor v cache, použijeme ho
            if (cachedResponse) {
                return cachedResponse;
            }

            // Jinak zkusíme internet
            return fetch(request);

        }).catch(() => {

            // Offline a stránka není v cache
            if (request.mode === 'navigate') {

                return caches.match('./index.html');
            }

            return new Response(
                'Offline – tento obsah není stažený.',
                {
                    status: 503,
                    headers: {
                        'Content-Type':
                            'text/plain; charset=utf-8'
                    }
                }
            );
        })
    );
});
