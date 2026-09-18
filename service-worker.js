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
                    .map(name =>
                        caches.delete(name)
                    )

            );

        })

    );

    self.clients.claim();
});


// ========================================
// OFFLINE / CACHE
// ========================================

self.addEventListener("fetch", event => {

    const request = event.request;


    // ========================================
    // AUDIO S RANGE REQUESTEM
    // ========================================

    if (
        request.url.includes("/audio/") &&
        request.headers.get("range")
    ) {

        event.respondWith(
            handleAudioRangeRequest(request)
        );

        return;
    }


    // ========================================
    // BĚŽNÉ REQUESTY
    // ========================================

    event.respondWith(

        caches.match(request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request);

            })

    );

});


// ========================================
// OFFLINE PŘEHRÁVÁNÍ AUDIO RANGE
// ========================================

async function handleAudioRangeRequest(request) {

    const cache =
        await caches.open(CONTENT_CACHE);


    // Najdeme kompletní MP3 v cache

    const cachedResponse =
        await cache.match(
            "./audio/stredovek.mp3"
        );


    // MP3 není offline

    if (!cachedResponse) {

        return fetch(request);

    }


    // ========================================
    // NAČTENÍ CELÉHO SOUBORU
    // ========================================

    const buffer =
        await cachedResponse.arrayBuffer();


    const range =
        request.headers.get("range");


    const match =
        range.match(/bytes=(\d+)-(\d*)/);


    // Pokud Range není ve správném formátu,
    // vrátíme celou MP3.

    if (!match) {

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": buffer.byteLength.toString(),
                "Accept-Ranges": "bytes"
            }
        });

    }


    const start =
        Number(match[1]);


    let end;


    if (match[2]) {

        end =
            Number(match[2]);

    } else {

        end =
            buffer.byteLength - 1;

    }


    // Bezpečnostní kontrola

    if (
        start >= buffer.byteLength ||
        start > end
    ) {

        return new Response(null, {
            status: 416,
            headers: {
                "Content-Range":
                    `bytes */${buffer.byteLength}`
            }
        });

    }


    end =
        Math.min(
            end,
            buffer.byteLength - 1
        );


    const chunk =
        buffer.slice(
            start,
            end + 1
        );


    return new Response(chunk, {

        status: 206,

        headers: {

            "Content-Type":
                "audio/mpeg",

            "Content-Length":
                chunk.byteLength.toString(),

            "Content-Range":
                `bytes ${start}-${end}/${buffer.byteLength}`,

            "Accept-Ranges":
                "bytes"

        }

    });

}
