const CACHE_NAME = "maturita-v-usich-v6";

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
            .then(cache => {

                return cache.addAll(
                    FILES_TO_CACHE
                );

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

                return self.clients.claim();

            })

    );

});


// ========================================
// OFFLINE CACHE
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


// ========================================
// RUČNÍ AKTUALIZACE
// ========================================

self.addEventListener("message", event => {

    if (
        event.data &&
        event.data.type === "UPDATE_CACHE"
    ) {

        event.waitUntil(

            caches.open(CACHE_NAME)
                .then(cache => {

                    return Promise.all(

                        FILES_TO_CACHE.map(
                            async file => {

                                try {

                                    const response =
                                        await fetch(
                                            file,
                                            {
                                                cache: "no-store"
                                            }
                                        );

                                    if (response.ok) {

                                        await cache.put(
                                            file,
                                            response
                                        );

                                    }

                                } catch (error) {

                                    console.error(
                                        "Nelze stáhnout:",
                                        file,
                                        error
                                    );

                                }

                            }
                        )

                    );

                })

        );

    }

});
