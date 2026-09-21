// =====================================================
// MATURITA V UŠÍCH
// app.js
// =====================================================

const homeScreen = document.getElementById("homeScreen");
const historieScreen = document.getElementById("historieScreen");
const periodScreen = document.getElementById("periodScreen");
const cetbaScreen = document.getElementById("cetbaScreen");
const ustniScreen = document.getElementById("ustniScreen");

const pageTitle = document.getElementById("pageTitle");
const backButton = document.getElementById("backButton");

const periodsContainer = document.getElementById("periodsContainer");
const songsContainer = document.getElementById("songs");

const periodDescription = document.getElementById("periodDescription");

let currentScreen = "home";
let currentPeriodId = null;
let currentLyricIndex = -1;
let lyricAnimationFrame = null;


// =====================================================
// ZÁKLADNÍ NAVIGACE
// =====================================================

function hideAllScreens() {
    if (homeScreen) homeScreen.style.display = "none";
    if (historieScreen) historieScreen.style.display = "none";
    if (periodScreen) periodScreen.style.display = "none";
    if (cetbaScreen) cetbaScreen.style.display = "none";
    if (ustniScreen) ustniScreen.style.display = "none";
}


function showHome() {
    hideAllScreens();

    if (homeScreen) {
        homeScreen.style.display = "";
    }

    currentScreen = "home";
    currentPeriodId = null;

    if (pageTitle) {
        pageTitle.textContent = "Maturita v uších";
    }

    if (backButton) {
        backButton.style.display = "none";
    }
}


function showScreen(screen) {
    hideAllScreens();

    if (screen) {
        screen.style.display = "";
    }

    if (backButton) {
        backButton.style.display = "";
    }
}


// =====================================================
// NAČTENÍ OBDOBÍ
// =====================================================

async function loadPeriods() {
    if (!periodsContainer) {
        console.error("Chybí #periodsContainer v index.html");
        return;
    }

    try {
        const response = await fetch("./data/periods.json");

        if (!response.ok) {
            throw new Error(
                `Nepodařilo se načíst periods.json (${response.status})`
            );
        }

        const periods = await response.json();

        periodsContainer.innerHTML = "";

        if (!Array.isArray(periods)) {
            throw new Error("periods.json musí obsahovat pole.");
        }

        periods.forEach(period => {
            if (!period || !period.id) {
                console.warn("Přeskakuji neplatné období:", period);
                return;
            }

            const button = document.createElement("button");

            button.className = "period-button";
            button.textContent =
                period.title ||
                period.name ||
                period.id;

            button.addEventListener("click", () => {
                openPeriod(
                    period.id,
                    period.title || period.name || period.id
                );
            });

            periodsContainer.appendChild(button);
        });

    } catch (error) {
        console.error("Chyba při načítání období:", error);

        periodsContainer.innerHTML = `
            <p>
                Nepodařilo se načíst seznam období.
            </p>
        `;
    }
}


// =====================================================
// OTEVŘENÍ KONKRÉTNÍHO OBDOBÍ
// =====================================================

function openPeriod(periodId, periodTitle) {

    // OCHRANA PROTI undefined.json
    if (
        typeof periodId !== "string" ||
        periodId.trim() === "" ||
        periodId === "undefined" ||
        periodId === "null"
    ) {
        console.error(
            "openPeriod() dostal neplatné ID:",
            periodId
        );

        alert("Chybí ID tohoto období.");
        return;
    }

    currentPeriodId = periodId;

    if (pageTitle) {
        pageTitle.textContent = periodTitle;
    }

    showScreen(periodScreen);

    loadPeriodDetail(periodId, periodTitle);
}


// =====================================================
// NAČTENÍ FINÁLNÍ STRÁNKY OBDOBÍ
// =====================================================

async function loadPeriodDetail(periodId, periodTitle) {

    if (!songsContainer) {
        console.error("Chybí #songs v index.html");
        return;
    }

    // ID už máme ověřené v openPeriod()
    const jsonUrl = `./data/${periodId}.json`;
    const audioUrl = `./audio/${periodId}.mp3`;

    console.log("Načítám období:");
    console.log("ID:", periodId);
    console.log("JSON:", jsonUrl);
    console.log("Audio:", audioUrl);

    songsContainer.innerHTML = `
        <p>Načítám...</p>
    `;

    try {

        const response = await fetch(jsonUrl);

        if (!response.ok) {
            throw new Error(
                `Soubor ${jsonUrl} nebyl nalezen (${response.status}).`
            );
        }

        const data = await response.json();

        console.log("Načtená data:", data);

        renderPeriodData(
            data,
            periodId,
            periodTitle,
            audioUrl
        );

    } catch (error) {

        console.error(
            "Chyba při načítání období:",
            error
        );

        songsContainer.innerHTML = `
            <div class="error-message">
                <h3>Nepodařilo se načíst obsah</h3>

                <p>
                    Nepodařilo se načíst:
                    <strong>${jsonUrl}</strong>
                </p>

                <p>
                    Zkontroluj, že tento soubor existuje
                    ve složce <strong>data</strong>.
                </p>
            </div>
        `;
    }
}


// =====================================================
// ZPRACOVÁNÍ DAT
// =====================================================

function renderPeriodData(
    data,
    periodId,
    periodTitle,
    audioUrl
) {

    if (!songsContainer) {
        return;
    }

    songsContainer.innerHTML = "";

    // -------------------------------------------------
    // VARIANTA 1:
    // { lines: [...] }
    // -------------------------------------------------

    if (
        data &&
        typeof data === "object" &&
        Array.isArray(data.lines)
    ) {

        renderSong(
            {
                id: periodId,
                title: data.title || periodTitle,
                lines: data.lines
            },
            audioUrl
        );

        return;
    }


    // -------------------------------------------------
    // VARIANTA 2:
    // { songs: [...] }
    // -------------------------------------------------

    if (
        data &&
        typeof data === "object" &&
        Array.isArray(data.songs)
    ) {

        data.songs.forEach((song, index) => {

            if (!song) {
                return;
            }

            const songId =
                song.id ||
                `${periodId}_${index}`;

            const songAudio =
                song.audio ||
                song.audioUrl ||
                `./audio/${periodId}.mp3`;

            renderSong(
                {
                    ...song,
                    id: songId
                },
                songAudio
            );
        });

        return;
    }


    // -------------------------------------------------
    // VARIANTA 3:
    // [...]
    // -------------------------------------------------

    if (Array.isArray(data)) {

        data.forEach((song, index) => {

            if (!song) {
                return;
            }

            const songId =
                song.id ||
                `${periodId}_${index}`;

            const songAudio =
                song.audio ||
                song.audioUrl ||
                `./audio/${periodId}.mp3`;

            renderSong(
                {
                    ...song,
                    id: songId
                },
                songAudio
            );
        });

        return;
    }


    // -------------------------------------------------
    // NEZNÁMÝ FORMÁT
    // -------------------------------------------------

    songsContainer.innerHTML = `
        <div class="error-message">
            <h3>Neznámý formát dat</h3>

            <p>
                Soubor <strong>${periodId}.json</strong>
                byl nalezen, ale jeho struktura není podporována.
            </p>
        </div>
    `;
}


// =====================================================
// VYKRESLENÍ SKLADBY
// =====================================================

function renderSong(song, audioUrl) {

    const songDiv = document.createElement("div");

    songDiv.className = "song";

    const title = document.createElement("h3");

    title.textContent =
        song.title ||
        "Maturitní skladba";

    songDiv.appendChild(title);


    // -------------------------------------------------
    // AUDIO
    // -------------------------------------------------

    const audio = document.createElement("audio");

    audio.controls = true;
    audio.preload = "metadata";
    audio.src = audioUrl;

    songDiv.appendChild(audio);


    // -------------------------------------------------
    // LYRICS BOX
    // -------------------------------------------------

    const lyricsContainer =
        document.createElement("div");

    lyricsContainer.className =
        "lyrics-container";


    const lyrics =
        document.createElement("div");

    lyrics.id = "lyrics";


    song.lines = Array.isArray(song.lines)
        ? song.lines
        : [];


    song.lines.forEach((line, index) => {

        const lineElement =
            document.createElement("div");

        lineElement.className =
            "lyric-line";

        lineElement.textContent =
            line.text || "";

        lineElement.dataset.index =
            index;

        if (line.start !== undefined) {
            lineElement.dataset.start =
                line.start;
        }

        if (line.end !== undefined) {
            lineElement.dataset.end =
                line.end;
        }


        // Kliknutí na řádek přesune audio
        lineElement.addEventListener(
            "click",
            () => {

                if (line.start !== undefined) {
                    audio.currentTime =
                        Number(line.start);
                }

                audio.play().catch(() => {});
            }
        );


        lyrics.appendChild(lineElement);
    });


    lyricsContainer.appendChild(lyrics);
    songDiv.appendChild(lyricsContainer);


    // -------------------------------------------------
    // SYNCHRONIZACE
    // -------------------------------------------------

    setupLyricSync(
        audio,
        lyrics,
        song.lines
    );


    songsContainer.appendChild(songDiv);
}


// =====================================================
// SYNCHRONIZACE TEXTU
// =====================================================

function setupLyricSync(
    audio,
    lyrics,
    lines
) {

    let activeIndex = -1;


    audio.addEventListener(
        "timeupdate",
        () => {

            if (!lines.length) {
                return;
            }

            const time =
                audio.currentTime;

            let newIndex = -1;


            for (
                let i = 0;
                i < lines.length;
                i++
            ) {

                const start =
                    Number(lines[i].start);

                const end =
                    lines[i].end !== undefined
                        ? Number(lines[i].end)
                        : Infinity;


                if (
                    time >= start &&
                    time <= end
                ) {

                    newIndex = i;
                    break;
                }
            }


            if (
                newIndex === -1 ||
                newIndex === activeIndex
            ) {
                return;
            }


            activeIndex = newIndex;

            const allLines =
                lyrics.querySelectorAll(
                    ".lyric-line"
                );


            allLines.forEach(line => {
                line.classList.remove("active");
            });


            const activeLine =
                allLines[activeIndex];

            if (!activeLine) {
                return;
            }


            activeLine.classList.add("active");


            // První tři řádky
            // zbytečně neposouváme.
            if (activeIndex < 3) {
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
// PLYNULÝ POSUN TEXTU
// =====================================================

function moveLyricsSmoothly(
    container,
    line
) {

    const containerRect =
        container.getBoundingClientRect();

    const lineRect =
        line.getBoundingClientRect();


    const containerHeight =
        containerRect.height;


    // Aktivní řádek chceme
    // spíše v horní části boxu.
    const desiredTop =
        containerRect.top +
        containerHeight * 0.10;


    const desiredBottom =
        containerRect.top +
        containerHeight * 0.35;


    let targetScroll =
        container.scrollTop;


    if (
        lineRect.top < desiredTop
    ) {

        targetScroll +=
            lineRect.top -
            desiredTop;

    } else if (
        lineRect.bottom >
        desiredBottom
    ) {

        targetScroll +=
            lineRect.bottom -
            desiredBottom;
    }


    targetScroll =
        Math.max(
            0,
            Math.min(
                targetScroll,
                container.scrollHeight -
                container.clientHeight
            )
        );


    if (
        Math.abs(
            targetScroll -
            container.scrollTop
        ) < 1
    ) {
        return;
    }


    animateLyricsScroll(
        container,
        targetScroll
    );
}


// =====================================================
// VLASTNÍ ANIMACE SCROLLU
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


    function easeInOut(t) {

        return t < 0.5
            ? 2 * t * t
            : 1 -
              Math.pow(
                  -2 * t + 2,
                  2
              ) / 2;
    }


    function animate(now) {

        const progress =
            Math.min(
                (now - startTime) /
                duration,
                1
            );


        const eased =
            easeInOut(progress);


        container.scrollTop =
            start +
            distance * eased;


        if (progress < 1) {

            lyricAnimationFrame =
                requestAnimationFrame(
                    animate
                );

        } else {

            lyricAnimationFrame = null;
        }
    }


    lyricAnimationFrame =
        requestAnimationFrame(
            animate
        );
}


// =====================================================
// ZPĚT
// =====================================================

if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            if (
                currentScreen === "period"
            ) {
                showHome();
                return;
            }

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

                    currentScreen =
                        "historie";

                    showScreen(
                        historieScreen
                    );

                    if (pageTitle) {
                        pageTitle.textContent =
                            "Literární kontext";
                    }

                    loadPeriods();

                } else if (
                    section === "cetba"
                ) {

                    currentScreen =
                        "cetba";

                    showScreen(
                        cetbaScreen
                    );

                    if (pageTitle) {
                        pageTitle.textContent =
                            "Maturitní četba";
                    }

                } else if (
                    section === "ustni"
                ) {

                    currentScreen =
                        "ustni";

                    showScreen(
                        ustniScreen
                    );

                    if (pageTitle) {
                        pageTitle.textContent =
                            "Ústní zkoušení";
                    }
                }
            }
        );
    });


// =====================================================
// START APLIKACE
// =====================================================

showHome();

console.log(
    "Maturita v uších – app.js načten."
);
