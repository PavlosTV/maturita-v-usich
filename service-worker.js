const APP_CACHE = "maturita-v-usich-app-v1";
const CONTENT_CACHE = "maturita-v-usich-content-v1";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",
    "./data/categories.json",
    "./data/periods.json",
    "./data/songs.json"
];


// ========================================
// INSTALACE
// ========================================

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(APP_CACHE)
            .then(cache => cache.addAll(APP_FILES))
    );

    self.skipWaiting();
});


// ========================================
// AKTIVACE
// ========================================

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames
                    .filter(name =>
                        name !== APP_CACHE &&
                        name !== CONTENT_CACHE
                    )
                    .map(name => caches.delete(name))

            );

        })

    );

    self.clients.claim();
});


// ========================================
// OFFLINE / CACHE
// ========================================

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request);

            })

    );

});
