// =====================================================
// MATURITA V UŠÍCH
// app.js
// =====================================================

let currentScreen = "home";
let currentPeriodId = null;
let lyricAnimationFrame = null;


// =====================================================
// NAVIGACE
// =====================================================

function showScreen(screen, title = "") {
    const screens = {
        home: document.getElementById("homeScreen"),
        historie: document.getElementById("historieScreen"),
        period: document.getElementById("periodScreen"),
        cetba: document.getElementById("cetbaScreen"),
        ustni: document.getElementById("ustniScreen")
    };

    Object.values(screens).forEach(element => {
        if (element) {
            element.style.display = "none";
        }
    });

    if (screens[screen]) {
        screens[screen].style.display = "";
    }

    currentScreen = screen;

    const pageTitle = document.getElementById("pageTitle");

    if (pageTitle && title) {
        pageTitle.textContent = title;
    }

    const backButton = document.getElementById("backButton");

    if (backButton) {
        backButton.style.display =
            screen === "home" ? "none" : "";
    }
}


function showHome() {
    showScreen("home", "Maturita v uších");
}


// =====================================================
// NAČTENÍ OBDOBÍ
// =====================================================

async function loadPeriods() {

    const container =
        document.getElementById("periodsContainer");

    if (!container) {
        console.error("Chybí #periodsContainer");
        return;
    }

    container.innerHTML =
        '<div class="loading">Načítám období...</div>';

    try {

        const response =
            await fetch("./data/periods.json");

        if (!response.ok) {
            throw new Error(
                `periods.json: HTTP ${response.status}`
            );
        }

        const periods =
            await response.json();

        container.innerHTML = "";

        if (!Array.isArray(periods)) {
            throw new Error(
                "periods.json není pole."
            );
        }

        periods.forEach(period => {

            if (!period || !period.id) {
                return;
            }

            const button =
                document.createElement("button");

            button.className = "menu-card";

            button.innerHTML = `
                <div class="menu-icon">L</div>

                <div>
                    <h2>
                        ${period.title || period.name || period.id}
                    </h2>

                    <p>
                        Otevřít období
                    </p>
                </div>

                <span class="arrow">›</span>
            `;

            button.addEventListener(
                "click",
                () => {

                    openPeriod(
                        period.id,
                        period.title ||
                        period.name ||
                        period.id
                    );
                }
            );

            container.appendChild(button);
        });

    } catch (error) {

        console.error(
            "Chyba při načítání období:",
            error
        );

        container.innerHTML = `
            <div class="error">
                Nepodařilo se načíst období.
            </div>
        `;
    }
}


// =====================================================
// OTEVŘENÍ OBDOBÍ
// =====================================================

function openPeriod(periodId, title) {

    if (
        !periodId ||
        periodId === "undefined" ||
        periodId === "null"
    ) {
        console.error(
            "Neplatné ID období:",
            periodId
        );

        return;
    }

    currentPeriodId = periodId;

    showScreen(
        "period",
        title || periodId
    );

    loadPeriodDetail(periodId);
}


// =====================================================
// NAČTENÍ DETAILU
// =====================================================

async function loadPeriodDetail(periodId) {

    const container =
        document.getElementById("songs");

    const descContainer =
        document.getElementById(
            "periodDescription"
        );

    if (!container) {
        console.error("Chybí #songs");
        return;
    }

    container.innerHTML =
        '<div class="loading">Načítám text...</div>';

    if (descContainer) {
        descContainer.innerHTML = "";
    }

    const jsonUrl =
        `./data/${periodId}.json`;

    console.log(
        "Načítám:",
        jsonUrl
    );

    try {

        let response;

        try {

            response =
                await fetch(
                    jsonUrl,
                    { cache: "no-store" }
                );

        } catch (networkError) {

            // Offline záloha přes Cache API
            const cached =
                await caches.match(jsonUrl);

            if (!cached) {
                throw networkError;
            }

            response = cached;
        }

        if (!response.ok) {
            throw new Error(
                `${jsonUrl}: HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        console.log(
            "Načtená data:",
            data
        );

        container.innerHTML = "";

        // ---------------------------------------------
        // JEDNA SKLADBA
        // ---------------------------------------------

        if (
            data &&
            Array.isArray(data.lines)
        ) {

            renderSong(
                container,
                data,
                periodId
            );

            return;
        }

        // ---------------------------------------------
        // VÍCE SKLADEB
        // ---------------------------------------------

        if (
            data &&
            Array.isArray(data.songs)
        ) {

            data.songs.forEach(
                (song, index) => {

                    renderSong(
                        container,
                        song,
                        `${periodId}_${index}`
                    );
                }
            );

            return;
        }

        // ---------------------------------------------
        // PŘÍMÉ POLE
        // ---------------------------------------------

        if (Array.isArray(data)) {

            data.forEach(
                (song, index) => {

                    renderSong(
                        container,
                        song,
                        `${periodId}_${index}`
                    );
                }
            );

            return;
        }

        throw new Error(
            "Neznámá struktura JSON."
        );

    } catch (error) {

        console.error(
            "Chyba při načítání detailu:",
            error
        );

        container.innerHTML = `
            <div class="error">
                Nepodařilo se načíst
                ${periodId}.json.
            </div>
        `;
    }
}


// =====================================================
// VYKRESLENÍ SKLADBY
// =====================================================

function renderSong(
    container,
    songData,
    uniqueId
) {

    const card =
        document.createElement("div");

    card.className = "song-card";


    // ---------------------------------------------
    // AUDIO
    // ---------------------------------------------

    const audioUrl =
        songData.audio ||
        songData.audioSrc ||
        `./audio/${uniqueId.split("_")[0]}.mp3`;


    const title =
        songData.title ||
        songData.name ||
        "Skladba";


    // ---------------------------------------------
    // HLAVIČKA
    // ---------------------------------------------

    const cover =
        document.createElement("div");

    cover.className = "cover";

    cover.innerHTML = `
        <span>ČESKÝ JAZYK</span>
        <strong>
            ${title.toUpperCase()}
        </strong>
    `;


    const heading =
        document.createElement("h2");

    heading.textContent = title;


    // ---------------------------------------------
    // AUDIO
    // ---------------------------------------------

    const audio =
        document.createElement("audio");

    audio.id =
        `audio_${uniqueId}`;

    audio.controls = true;
    audio.preload = "metadata";
    audio.src = audioUrl;


    // ---------------------------------------------
    // LYRICS
    // ---------------------------------------------

    const lyricsContainer =
        document.createElement("div");

    lyricsContainer.className =
        "lyrics-container";


    const lyricsTitle =
        document.createElement("h3");

    lyricsTitle.textContent = "Text";


    const lyrics =
        document.createElement("div");

    lyrics.id =
        `lyrics_${uniqueId}`;

    lyrics.className = "lyrics-content";


    const lines =
        Array.isArray(songData.lines)
            ? songData.lines
            : [];


    lines.forEach(
        (line, index) => {

            const element =
                document.createElement("p");

            element.className =
                "lyric-line";

            element.dataset.index =
                index;


            // Podporujeme start/end
            if (line.start !== undefined) {

                element.dataset.start =
                    Number(line.start);
            }

            if (line.end !== undefined) {

                element.dataset.end =
                    Number(line.end);
            }


            // Podporujeme i starší formát "time"
            if (
                line.start === undefined &&
                line.time !== undefined
            ) {

                element.dataset.start =
                    Number(line.time);
            }


            element.textContent =
                line.text || "";


            // Kliknutí na text
            element.addEventListener(
                "click",
                () => {

                    const start =
                        Number(
                            element.dataset.start
                        );

                    if (!Number.isNaN(start)) {

                        audio.currentTime =
                            start;
                    }
                }
            );


            lyrics.appendChild(element);
        }
    );


    lyricsContainer.appendChild(
        lyricsTitle
    );

    lyricsContainer.appendChild(
        lyrics
    );


    // ---------------------------------------------
    // SESTAVENÍ
    // ---------------------------------------------

    card.appendChild(cover);
    card.appendChild(heading);
    card.appendChild(audio);
    card.appendChild(lyricsContainer);

    container.appendChild(card);


    // ---------------------------------------------
    // SYNCHRONIZACE
    // ---------------------------------------------

    setupLyricsSync(
        audio,
        lyrics,
        lines
    );


    // ---------------------------------------------
    // OFFLINE
    // ---------------------------------------------

    setupOfflineButton(
        uniqueId,
        audioUrl,
        `./data/${uniqueId.split("_")[0]}.json`
    );
}


// =====================================================
// SYNCHRONIZACE TEXTU
// =====================================================

function setupLyricsSync(
    audio,
    lyrics,
    lines
) {

    let currentIndex = -1;


    audio.addEventListener(
        "timeupdate",
        () => {

            if (!lines.length) {
                return;
            }


            const currentTime =
                audio.currentTime;


            let newIndex = -1;


            for (
                let i = 0;
                i < lines.length;
                i++
            ) {

                const start =
                    Number(
                        lines[i].start ??
                        lines[i].time ??
                        0
                    );


                let end;

                if (
                    lines[i].end !== undefined
                ) {

                    end =
                        Number(
                            lines[i].end
                        );

                } else if (
                    i < lines.length - 1
                ) {

                    end =
                        Number(
                            lines[i + 1].start ??
                            lines[i + 1].time
                        );

                } else {

                    end = Infinity;
                }


                if (
                    currentTime >= start &&
                    currentTime < end
                ) {

                    newIndex = i;
                    break;
                }
            }


            // Nic se nezměnilo
            if (
                newIndex === currentIndex
            ) {
                return;
            }


            currentIndex =
                newIndex;


            const allLines =
                lyrics.querySelectorAll(
                    ".lyric-line"
                );


            allLines.forEach(
                line => {

                    line.classList.remove(
                        "active"
                    );
                }
            );


            if (newIndex < 0) {
                return;
            }


            const activeLine =
                allLines[newIndex];


            if (!activeLine) {
                return;
            }


            activeLine.classList.add(
                "active"
            );


            // První 3 řádky
            // neposouváme
            if (newIndex < 3) {
                return;
            }


            moveLyricsSmoothly(
                lyrics,
                activeLine
            );
        }
    );
}


// =====================================================
// POSUN TEXTU UVNITŘ BOXU
// =====================================================

function moveLyricsSmoothly(
    container,
    activeLine
) {

    const containerRect =
        container.getBoundingClientRect();

    const lineRect =
        activeLine.getBoundingClientRect();


    const height =
        containerRect.height;


    // Aktivní řádek
    // chceme v horní části
    const desiredTop =
        containerRect.top +
        height * 0.10;


    const desiredBottom =
        containerRect.top +
        height * 0.35;


    let target =
        container.scrollTop;


    if (
        lineRect.top < desiredTop
    ) {

        target +=
            lineRect.top -
            desiredTop;

    } else if (
        lineRect.bottom >
        desiredBottom
    ) {

        target +=
            lineRect.bottom -
            desiredBottom;
    }


    target =
        Math.max(
            0,
            Math.min(
                target,
                container.scrollHeight -
                container.clientHeight
            )
        );


    if (
        Math.abs(
            target -
            container.scrollTop
        ) < 1
    ) {

        return;
    }


    animateLyricsScroll(
        container,
        target
    );
}


// =====================================================
// ANIMACE
// =====================================================

function animateLyricsScroll(
    container,
    target
) {

    if (lyricAnimationFrame) {

        cancelAnimationFrame(
            lyricAnimationFrame
        );
    }


    const start =
        container.scrollTop;

    const distance =
        target - start;

    const duration = 350;

    const startTime =
        performance.now();


    function ease(t) {

        return t < 0.5
            ? 2 * t * t
            : 1 -
              Math.pow(
                  -2 * t + 2,
                  2
              ) / 2;
    }


    function frame(now) {

        const progress =
            Math.min(
                (now - startTime) /
                duration,
                1
            );


        container.scrollTop =
            start +
            distance *
            ease(progress);


        if (progress < 1) {

            lyricAnimationFrame =
                requestAnimationFrame(
                    frame
                );

        } else {

            lyricAnimationFrame =
                null;
        }
    }


    lyricAnimationFrame =
        requestAnimationFrame(frame);
}


// =====================================================
// OFFLINE TLAČÍTKO
// =====================================================

async function setupOfflineButton(
    uniqueId,
    audioUrl,
    jsonUrl
) {

    const btn =
        document.getElementById(
            `btn_${uniqueId}`
        );

    // Tlačítko nemusí existovat
    if (!btn) {
        return;
    }

    const CONTENT_CACHE =
        "maturita-content-v1";


    async function updateUI() {

        try {

            const cache =
                await caches.open(
                    CONTENT_CACHE
                );

            const audio =
                await cache.match(
                    audioUrl
                );

            const json =
                await cache.match(
                    jsonUrl
                );


            if (audio && json) {

                btn.textContent =
                    "Odebrat z offline";

                btn.classList.add(
                    "downloaded"
                );

            } else {

                btn.textContent =
                    "Stáhnout offline";

                btn.classList.remove(
                    "downloaded"
                );
            }

        } catch (error) {

            btn.textContent =
                "Stáhnout offline";
        }


        btn.disabled = false;
    }


    await updateUI();


    btn.addEventListener(
        "click",
        async () => {

            btn.disabled = true;


            try {

                const cache =
                    await caches.open(
                        CONTENT_CACHE
                    );


                const existingAudio =
                    await cache.match(
                        audioUrl
                    );


                const existingJson =
                    await cache.match(
                        jsonUrl
                    );


                if (
                    existingAudio &&
                    existingJson
                ) {

                    btn.textContent =
                        "Odebírám...";


                    await cache.delete(
                        audioUrl
                    );

                    await cache.delete(
                        jsonUrl
                    );


                } else {

                    btn.textContent =
                        "Stahuji...";


                    const [
                        audioResponse,
                        jsonResponse
                    ] = await Promise.all([

                        fetch(
                            audioUrl,
                            {
                                cache:
                                    "no-store"
                            }
                        ),

                        fetch(
                            jsonUrl,
                            {
                                cache:
                                    "no-store"
                            }
                        )
                    ]);


                    if (
                        !audioResponse.ok ||
                        !jsonResponse.ok
                    ) {

                        throw new Error(
                            "Nepodařilo se stáhnout obsah."
                        );
                    }


                    await cache.put(
                        audioUrl,
                        audioResponse
                    );

                    await cache.put(
                        jsonUrl,
                        jsonResponse
                    );
                }


                await updateUI();

            } catch (error) {

                console.error(
                    "Offline chyba:",
                    error
                );

                btn.textContent =
                    "Chyba";

                setTimeout(
                    updateUI,
                    1500
                );
            }
        }
    );
}


// =====================================================
// ZPĚT
// =====================================================

const backButton =
    document.getElementById(
        "backButton"
    );

if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            showHome();
        }
    );
}


// =====================================================
// HLAVNÍ MENU
// =====================================================

document
    .querySelectorAll(".menu-card")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const section =
                    card.dataset.section;


                if (
                    section === "historie"
                ) {

                    showScreen(
                        "historie",
                        "Literární historický kontext"
                    );

                    loadPeriods();


                } else if (
                    section === "cetba"
                ) {

                    showScreen(
                        "cetba",
                        "Maturitní četba"
                    );


                } else if (
                    section === "ustni"
                ) {

                    showScreen(
                        "ustni",
                        "Ústní zkoušení"
                    );
                }
            }
        );
    });


// =====================================================
// START
// =====================================================

showHome();

console.log(
    "Maturita v uších – aplikace spuštěna."
);
