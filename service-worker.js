const CACHE_NAME = "maturita-v-usich-v4";

const FILES_TO_CACHE = [
    "./",
    "./index.html?v2",
    "./style.css?v2",
    "./app.js?v2",
    "./manifest.json?v2",

    "./data/songs.json",
    "./data/stredovek.json",

    "./audio/stredovek.mp3"
];


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


self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)
            .then(response => {

                if (response) {
                    return response;
                }

                return fetch(event.request);

            })

    );

});
