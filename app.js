```javascript
// ========================================
// MATURITA V UŠÍCH
// app.js
// ========================================


// ========================================
// ZÁKLADNÍ PRVKY
// ========================================

const homeScreen =
    document.getElementById("homeScreen");

const historieScreen =
    document.getElementById("historieScreen");

const cetbaScreen =
    document.getElementById("cetbaScreen");

const ustniScreen =
    document.getElementById("ustniScreen");

const periodScreen =
    document.getElementById("periodScreen");

const pageTitle =
    document.getElementById("pageTitle");

const backButton =
    document.getElementById("backButton");

const periodsContainer =
    document.getElementById("periodsContainer");

const songsContainer =
    document.getElementById("songs");

const periodDescription =
    document.getElementById("periodDescription");


// ========================================
// STAV APLIKACE
// ========================================

let currentScreen = "home";


// ========================================
// ZOBRAZENÍ OBRAZOVKY
// ========================================

function showScreen(screen, title) {

    const screens = [
        homeScreen,
        historieScreen,
        cetbaScreen,
        ustniScreen,
        periodScreen
    ];

    screens.forEach(item => {

        if (item) {
            item.classList.add("hidden");
        }

    });


    if (screen) {
        screen.classList.remove("hidden");
    }


    if (pageTitle) {
        pageTitle.textContent = title;
    }


    currentScreen = screen;


    // Zpět je skryté pouze na hlavní stránce

    if (backButton) {

        if (screen === homeScreen) {
            backButton.classList.add("hidden");
        } else {
            backButton.classList.remove("hidden");
        }

    }


    window.scrollTo(0, 0);
}


// ========================================
// ÚVODNÍ STRÁNKA
// ========================================

const menuButtons =
    document.querySelectorAll(
        ".menu-card[data-section]"
    );


menuButtons.forEach(button => {

    button.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            const section =
                button.getAttribute(
                    "data-section"
                );


            // --------------------------------
            // LITERÁRNÍ HISTORICKÝ KONTEXT
            // --------------------------------

            if (section === "historie") {

                showScreen(
                    historieScreen,
                    "Literární historický kontext"
                );

                loadPeriods();

                return;
            }


            // --------------------------------
            // MATURITNÍ ČETBA
            // --------------------------------

            if (section === "cetba") {

                showScreen(
                    cetbaScreen,
                    "Maturitní četba"
                );

                return;
            }


            // --------------------------------
            // ÚSTNÍ MATURITA
            // --------------------------------

            if (section === "ustni") {

                showScreen(
                    ustniScreen,
                    "Příprava k ústní maturitě"
                );

                return;
            }

        }
    );

});


// ========================================
// NAČTENÍ LITERÁRNÍCH OBDOBÍ
// ========================================

async function loadPeriods() {

    if (!periodsContainer) {
        return;
    }


    periodsContainer.innerHTML = `
        <div class="loading">
            Načítám literární období...
        </div>
    `;


    try {

        const response =
            await fetch("./data/periods.json");


        if (!response.ok) {

            throw new Error(
                "Soubor periods.json se nepodařilo načíst."
            );

        }


        const periods =
            await response.json();


        periodsContainer.innerHTML = "";


        // --------------------------------
        // VYTVOŘENÍ TLAČÍTEK
        // --------------------------------

        periods.forEach(period => {

            const button =
                document.createElement("button");


            button.type = "button";

            button.className = "menu-card";


            button.innerHTML = `

                <div class="menu-icon">
                    L
                </div>

                <div>

                    <h2>
                        ${period.title}
                    </h2>

                    <p>
                        Otevřít literární období
                    </p>

                </div>

                <span class="arrow">
                    ›
                </span>

            `;


            button.addEventListener(
                "click",
                function() {

                    openPeriod(period);

                }
            );


            periodsContainer.appendChild(
                button
            );

        });

    }


    catch (error) {

        console.error(error);


        periodsContainer.innerHTML = `

            <div class="error-card">

                <h2>
                    Nelze načíst období
                </h2>

                <p>
                    Zkontroluj soubor
                    <strong>
                        data/periods.json
                    </strong>.
                </p>

            </div>

        `;

    }

}


// ========================================
// OTEVŘENÍ OBDOBÍ
// ========================================

async function openPeriod(period) {

    showScreen(
        periodScreen,
        period.title
    );


    if (periodDescription) {
        periodDescription.innerHTML = "";
    }


    if (songsContainer) {

        songsContainer.innerHTML = `
            <div class="loading">
                Načítám obsah...
            </div>
        `;

    }


    // --------------------------------
    // STŘEDOVĚK
    // --------------------------------

    if (period.content === "stredovek") {

        await loadStredovek();

        return;
    }


    // --------------------------------
    // OSTATNÍ OBDOBÍ
    // --------------------------------

    if (songsContainer) {

        songsContainer.innerHTML = `

            <div class="placeholder-card">

                <h2>
                    ${period.title}
                </h2>

                <p>
                    Obsah tohoto období
                    zatím připravujeme.
                </p>

            </div>

        `;

    }

}


// ========================================
// STŘEDOVĚK
// ========================================

async function loadStredovek() {

    if (!songsContainer) {
        return;
    }


    songsContainer.innerHTML = `

        <div class="song-card">

            <div class="cover">

                <span>
                    ČESKÝ JAZYK
                </span>

                <strong>
                    STŘEDOVĚK
                </strong>

            </div>


            <h2>
                Středověk
            </h2>


            <p class="description">
                Hus, Kosmas, legendy,
                kroniky a středověká
                literatura.
            </p>


            <audio
                id="stredovekAudio"
                controls
                preload="metadata">

                <source
                    src="./audio/stredovek.mp3"
                    type="audio/mpeg">

                Tvůj prohlížeč nepodporuje
                přehrávání audia.

            </audio>


            <button
                id="downloadStredovek"
                class="download-button"
                type="button">

                Stáhnout Středověk offline

            </button>


            <div class="lyrics-container">

                <h3>
                    Text písně
                </h3>


                <div id="lyrics">

                    <div class="loading">
                        Načítám text...
                    </div>

                </div>

            </div>

        </div>

    `;


    // Nastavení offline tlačítka

    setupOfflineDownload();


    // Načtení textu

    await loadLyrics();

}


// ========================================
// NAČTENÍ TEXTU
// ========================================

async function loadLyrics() {

    const lyricsContainer =
        document.getElementById(
            "lyrics"
        );


    const audio =
        document.getElementById(
            "stredovekAudio"
        );


    if (!lyricsContainer || !audio) {
        return;
    }


    try {

        const response =
            await fetch(
                "./data/stredovek.json"
            );


        if (!response.ok) {

            throw new Error(
                "Soubor stredovek.json se nepodařilo načíst."
            );

        }


        const data =
            await response.json();


        if (
            !data.lines ||
            !Array.isArray(data.lines)
        ) {

            throw new Error(
                "stredovek.json nemá správný formát."
            );

        }


        lyricsContainer.innerHTML = "";


        // --------------------------------
        // VYTVOŘENÍ ŘÁDKŮ
        // --------------------------------

        data.lines.forEach(line => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "lyric-line";


            element.dataset.start =
                Number(line.start);


            element.dataset.end =
                Number(line.end);


            element.textContent =
                line.text;


            lyricsContainer.appendChild(
                element
            );

        });


        const lines =
            Array.from(
                lyricsContainer.querySelectorAll(
                    ".lyric-line"
                )
            );


        // ========================================
        // SYNCHRONIZACE
        // ========================================

        let activeIndex = -1;


        audio.addEventListener(
            "timeupdate",
            function() {

                const time =
                    audio.currentTime;


                let newIndex = -1;


                // Najdeme aktuální řádek

                for (
                    let i = 0;
                    i < lines.length;
                    i++
                ) {

                    const start =
                        Number(
                            lines[i].dataset.start
                        );


                    const end =
                        Number(
                            lines[i].dataset.end
                        );


                    if (
                        time >= start &&
                        time < end
                    ) {

                        newIndex = i;

                        break;
                    }

                }


                // Žádný řádek

                if (newIndex === -1) {
                    return;
                }


                // Nic se nezměnilo

                if (
                    newIndex === activeIndex
                ) {
                    return;
                }


                activeIndex =
                    newIndex;


                // --------------------------------
                // AKTIVNÍ ŘÁDEK
                // --------------------------------

                lines.forEach(line => {

                    line.classList.remove(
                        "active"
                    );

                });


                lines[activeIndex]
                    .classList.add("active");


                // --------------------------------
                // POSOUVÁNÍ
                // --------------------------------

                updateLyricsPosition(
                    lyricsContainer,
                    lines[activeIndex],
                    activeIndex
                );

            }
        );


        // ========================================
        // KLIK NA ŘÁDEK
        // ========================================

        lines.forEach(line => {

            line.addEventListener(
                "click",
                function() {

                    const start =
                        Number(
                            line.dataset.start
                        );


                    if (
                        !Number.isNaN(start)
                    ) {

                        audio.currentTime =
                            start;


                        audio.play();

                    }

                }
            );

        });

    }


    catch (error) {

        console.error(error);


        lyricsContainer.innerHTML = `

            <div class="error-card">

                <h2>
                    Chyba při načítání textu
                </h2>

                <p>
                    Zkontroluj soubor
                    <strong>
                        data/stredovek.json
                    </strong>.
                </p>

            </div>

        `;

    }

}


// ========================================
// POSOUVÁNÍ TEXTU
// ========================================

function updateLyricsPosition(
    container,
    activeLine,
    index
) {

    // První dva řádky neposouváme

    if (index < 2) {
        return;
    }


    const containerTop =
        container.getBoundingClientRect()
            .top;


    const lineTop =
        activeLine.getBoundingClientRect()
            .top;


    const lineBottom =
        activeLine.getBoundingClientRect()
            .bottom;


    const containerHeight =
        container.clientHeight;


    // Bezpečná oblast

    const desiredTop =
        containerTop +
        containerHeight * 0.10;


    const desiredBottom =
        containerTop +
        containerHeight * 0.45;


    // Řádek je v bezpečné oblasti

    if (
        lineTop >= desiredTop &&
        lineBottom <= desiredBottom
    ) {

        return;

    }


    // Řádek je příliš nízko

    if (
        lineBottom > desiredBottom
    ) {

        const difference =
            lineBottom -
            desiredBottom;


        smoothLyricsMove(
            container,
            difference
        );


        return;

    }


    // Řádek je příliš nahoře

    if (
        lineTop < desiredTop
    ) {

        const difference =
            lineTop -
            desiredTop;


        smoothLyricsMove(
            container,
            difference
        );

    }

}


// ========================================
// PLYNULÝ POSUN TEXTU
// ========================================

function smoothLyricsMove(
    container,
    difference
) {

    const current =
        container.scrollTop;


    const max =
        container.scrollHeight -
        container.clientHeight;


    const target =
        Math.max(
            0,
            Math.min(
                current + difference,
                max
            )
        );


    const start =
        performance.now();


    const duration = 350;


    function animate(now) {

        const progress =
            Math.min(
                1,
                (now - start) /
                duration
            );


        const eased =
            1 -
            Math.pow(
                1 - progress,
                3
            );


        container.scrollTop =
            current +
            (target - current) *
            eased;


        if (progress < 1) {

            requestAnimationFrame(
                animate
            );

        }

    }


    requestAnimationFrame(
        animate
    );

}


// ========================================
// TLAČÍTKO ZPĚT
// ========================================

if (backButton) {

    backButton.addEventListener(
        "click",
        function() {

            // Z období zpět na období

            if (
                currentScreen ===
                periodScreen
            ) {

                showScreen(
                    historieScreen,
                    "Literární historický kontext"
                );


                loadPeriods();

                return;

            }


            // Z hlavní sekce domů

            if (
                currentScreen ===
                    historieScreen ||
                currentScreen ===
                    cetbaScreen ||
                currentScreen ===
                    ustniScreen
            ) {

                showScreen(
                    homeScreen,
                    "Maturita v uších"
                );

            }

        }
    );

}


// ========================================
// TLAČÍTKO AKTUALIZACE
// ========================================

const updateButton =
    document.getElementById(
        "updateButton"
    );


if (updateButton) {

    updateButton.addEventListener(
        "click",
        async function() {

            updateButton.textContent =
                "Stahuji aktualizaci...";


            updateButton.disabled = true;


            try {

                if (
                    "serviceWorker" in
                    navigator
                ) {

                    const registration =
                        await navigator
                            .serviceWorker
                            .getRegistration();


                    if (registration) {

                        await registration.update();

                    }

                }


                updateButton.textContent =
                    "Aktualizace probíhá...";


                setTimeout(
                    function() {

                        window.location.reload();

                    },
                    3000
                );

            }


            catch (error) {

                console.error(
                    "Aktualizace se nepodařila:",
                    error
                );


                updateButton.textContent =
                    "Aktualizace se nepodařila";


                updateButton.disabled = false;

            }

        }
    );

}


// ========================================
// OFFLINE STAŽENÍ / ODEBRÁNÍ
// STŘEDOVĚKU
// ========================================

async function setupOfflineDownload() {

    const button =
        document.getElementById(
            "downloadStredovek"
        );


    if (!button) {
        return;
    }


    const CONTENT_CACHE =
        "maturita-v-usich-content-v1";


    const AUDIO_FILE =
        "./audio/stredovek.mp3";


    const LYRICS_FILE =
        "./data/stredovek.json";


    // ========================================
    // KONTROLA OFFLINE STAVU
    // ========================================

    async function checkOffline() {

        const cache =
            await caches.open(
                CONTENT_CACHE
            );


        const audio =
            await cache.match(
                AUDIO_FILE
            );


        const lyrics =
            await cache.match(
                LYRICS_FILE
            );


        return !!(
            audio &&
            lyrics
        );

    }


    // ========================================
    // AKTUALIZACE TLAČÍTKA
    // ========================================

    async function updateButton() {

        try {

            const offline =
                await checkOffline();


            if (offline) {

                button.textContent =
                    "Odebrat Středověk z offline";


                button.classList.add(
                    "downloaded"
                );

            } else {

                button.textContent =
                    "Stáhnout Středověk offline";


                button.classList.remove(
                    "downloaded"
                );

            }


            button.disabled = false;

        }


        catch (error) {

            console.error(
                "Kontrola offline stavu selhala:",
                error
            );


            button.textContent =
                "Stáhnout Středověk offline";


            button.disabled = false;

        }

    }


    // ========================================
    // KLIKNUTÍ
    // ========================================

    button.addEventListener(
        "click",
        async function() {

            button.disabled = true;


            try {

                const cache =
                    await caches.open(
                        CONTENT_CACHE
                    );


                const offline =
                    await checkOffline();


                // ========================================
                // ODEBRAT
                // ========================================

                if (offline) {

                    button.textContent =
                        "Odebírám...";


                    await cache.delete(
                        AUDIO_FILE
                    );


                    await cache.delete(
                        LYRICS_FILE
                    );


                    button.textContent =
                        "Středověk byl odebrán";


                    setTimeout(
                        updateButton,
                        800
                    );


                    return;

                }


                // ========================================
                // STÁHNOUT
                // ========================================

                button.textContent =
                    "Stahuji audio...";


                const audioResponse =
                    await fetch(
                        AUDIO_FILE +
                        "?download=" +
                        Date.now(),
                        {
                            cache: "no-store"
                        }
                    );


                if (!audioResponse.ok) {

                    throw new Error(
                        "Audio se nepodařilo stáhnout."
                    );

                }


                button.textContent =
                    "Stahuji text...";


                const lyricsResponse =
                    await fetch(
                        LYRICS_FILE +
                        "?download=" +
                        Date.now(),
                        {
                            cache: "no-store"
                        }
                    );


                if (!lyricsResponse.ok) {

                    throw new Error(
                        "Text se nepodařilo stáhnout."
                    );

                }


                // ========================================
                // ULOŽENÍ
                // ========================================

                await cache.put(
                    AUDIO_FILE,
                    audioResponse
                );


                await cache.put(
                    LYRICS_FILE,
                    lyricsResponse
                );


                button.textContent =
                    "✓ Středověk je offline";


                setTimeout(
                    updateButton,
                    800
                );

            }


            catch (error) {

                console.error(
                    "Offline operace selhala:",
                    error
                );


                button.textContent =
                    "Operace se nepodařila";


                button.disabled = false;


                setTimeout(
                    updateButton,
                    1500
                );

            }

        }
    );


    // ========================================
    // PRVNÍ KONTROLA
    // ========================================

    await updateButton();

}


// ========================================
// START APLIKACE
// ========================================

showScreen(
    homeScreen,
    "Maturita v uších"
);
```
