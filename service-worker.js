const CACHE_NAME = "maturita-v-usich-v4";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",

    "./data/categories.json",
    "./data/periods.json",
    "./data/songs.json",
    "./data/stredovek.json",

    "./audio/stredovek.mp3"
];


// ========================================
// INSTALACE NOVÉ VERZE
// ========================================

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(
                    FILES_TO_CACHE
                );

            })
            .then(() => {

                // Nová verze se aktivuje okamžitě

                return self.skipWaiting();

            })

    );

});


// ========================================
// AKTIVACE
// ========================================

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
            .then(cacheNames => {

                return Promise.all(

                    cacheNames
                        .filter(name =>
                            name !== CACHE_NAME
                        )
                        .map(name =>
                            caches.delete(name)
                        )

                );

            })
            .then(() => {

                // Nový Service Worker začne
                // okamžitě ovládat stránku

                return self.clients.claim();

            })

    );

});


// ========================================
// NAČÍTÁNÍ SOUBORŮ
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
