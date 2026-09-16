const CACHE_NAME = "maturita-v-usich-v5";

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
// INSTALACE
// ========================================

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))

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

    );

});


// ========================================
// OFFLINE / CACHE
// ========================================

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)
            .then(cachedResponse => {

                // Máme soubor v cache?
                // Použijeme ho i bez internetu.

                if (cachedResponse) {
                    return cachedResponse;
                }


                // Pokud není v cache,
                // zkusíme internet.

                return fetch(event.request);

            })

    );

});
