// ========================================
// MATURITA V UŠÍCH
// Hlavní JavaScript aplikace
// ========================================


// ========================================
// OBRAZOVKY
// ========================================

const screens = {
    home: document.getElementById("homeScreen"),
    historie: document.getElementById("historieScreen"),
    cetba: document.getElementById("cetbaScreen"),
    ustni: document.getElementById("ustniScreen"),
    period: document.getElementById("periodScreen")
};


// ========================================
// PRVKY STRÁNKY
// ========================================

const pageTitle = document.getElementById("pageTitle");
const backButton = document.getElementById("backButton");
const periodsContainer = document.getElementById("periodsContainer");
const songsContainer = document.getElementById("songs");
const periodDescription = document.getElementById("periodDescription");


// ========================================
// STAV
// ========================================

let currentScreen = "home";
let currentPeriod = null;


// ========================================
// PŘEPÍNÁNÍ OBRAZOVEK
// ========================================

function showScreen(screenName, title) {

    Object.values(screens).forEach(screen => {
        if (screen) {
            screen.classList.add("hidden");
        }
    });

    if (screens[screenName]) {
        screens[screenName].classList.remove("hidden");
    }

    if (pageTitle) {
        pageTitle.textContent = title;
    }

    currentScreen = screenName;

    if (backButton) {
        if (screenName === "home") {
            backButton.classList.add("hidden");
        } else {
            backButton.classList.remove("hidden");
        }
    }

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}


// ========================================
// HLAVNÍ MENU
// ========================================

document.querySelectorAll("[data-section]").forEach(button => {

    button.addEventListener("click", function () {

        const section = this.dataset.section;

        if (section === "historie") {

            showScreen(
                "historie",
                "Literární historický kontext"
            );

            loadPeriods();
        }

        else if (section === "cetba") {

            showScreen(
                "cetba",
                "Maturitní četba"
            );
        }

        else if (section === "ustni") {

            showScreen(
                "ustni",
                "Příprava k ústní maturitě"
            );
        }

    });

});


// ========================================
// NAČTENÍ OBDOBÍ
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
            throw new Error("Nelze načíst periods.json");
        }

        const periods =
            await response.json();

        periodsContainer.innerHTML = "";

        periods.forEach(period => {

            const button =
                document.createElement("button");

            button.className = "menu-card";

            button.type = "button";

            button.innerHTML = `
                <div class="menu-icon">
                    L
                </div>

                <div>
                    <h2>${period.title}</h2>

                    <p>
                        Otevřít literární období
                    </p>
                </div>

                <span class="arrow">
                    ›
                </span>
            `;

            button.addEventListener("click", () => {
                openPeriod(period);
            });

            periodsContainer.appendChild(button);

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
                    <strong>data/periods.json</strong>.
                </p>

            </div>
        `;
    }
}


// ========================================
// OTEVŘENÍ OBDOBÍ
// ========================================

async function openPeriod(period) {

    currentPeriod = period;

    showScreen(
        "period",
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


    // STŘEDOVĚK

    if (period.content === "stredovek") {

        await loadStredovek();

        return;
    }


    // OSTATNÍ OBDOBÍ

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


// ========================================
// STŘEDOVĚK
// ========================================

async function loadStredovek() {

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

    await loadLyrics();
}


// ========================================
// TEXT + SYNCHRONIZACE
// ========================================

async function loadLyrics() {

    const lyricsContainer =
        document.getElementById("lyrics");

    const audio =
        document.getElementById("stredovekAudio");

    if (!lyricsContainer || !audio) {
        return;
    }

    try {

        const response =
            await fetch("./data/stredovek.json");

        if (!response.ok) {
            throw new Error(
                "Nelze načíst stredovek.json"
            );
        }

        const data =
            await response.json();

        lyricsContainer.innerHTML = "";


        // ========================================
        // VYTVOŘENÍ ŘÁDKŮ
        // ========================================

        data.lines.forEach(line => {

            const element =
                document.createElement("div");

            element.className =
                "lyric-line";

            element.dataset.start =
                line.start;

            element.dataset.end =
                line.end;

            element.textContent =
                line.text;

            lyricsContainer.appendChild(element);

        });


        const lines =
            Array.from(
                lyricsContainer.querySelectorAll(
                    ".lyric-line"
                )
            );


        let previousIndex = -1;


        // ========================================
        // SYNCHRONIZACE
        // ========================================

        audio.addEventListener(
            "timeupdate",
            () => {

                const currentTime =
                    audio.currentTime;

                let activeIndex = -1;


                for (
                    let i = 0;
                    i < lines.length;
                    i++
                ) {

                    const start =
                        Number(lines[i].dataset.start);

                    const end =
                        Number(lines[i].dataset.end);

                    if (
                        currentTime >= start &&
                        currentTime < end
                    ) {

                        activeIndex = i;
                        break;
                    }
                }


                if (activeIndex === -1) {
                    return;
                }


                // Stejný řádek – nic nedělej

                if (
                    activeIndex === previousIndex
                ) {
                    return;
                }


                // ========================================
                // ZVÝRAZNĚNÍ
                // ========================================

                lines.forEach(line => {
                    line.classList.remove("active");
                });

                lines[activeIndex].classList.add("active");


                // ========================================
                // POSOUVÁNÍ TEXTU
                // ========================================

                /*
                    DŮLEŽITÉ:

                    Text se při spuštění neposouvá.

                    První 3 řádky zůstanou nahoře.

                    Potom se text posune pouze tehdy,
                    když aktuální řádek začne být
                    příliš nízko.
                */

                const activeLine =
                    lines[activeIndex];


                const lineTop =
                    activeLine.offsetTop;

                const lineBottom =
                    lineTop +
                    activeLine.offsetHeight;


                const currentScroll =
                    lyricsContainer.scrollTop;

                const visibleTop =
                    currentScroll + 40;

                const visibleBottom =
                    currentScroll +
                    lyricsContainer.clientHeight -
                    60;


                // Řádek je příliš dole

                if (
                    activeIndex >= 3 &&
                    lineBottom > visibleBottom
                ) {

                    const newScroll =
                        lineBottom -
                        lyricsContainer.clientHeight +
                        80;


                    lyricsContainer.scrollTo({

                        top: Math.max(
                            0,
                            newScroll
                        ),

                        behavior: "smooth"

                    });

                }


                previousIndex =
                    activeIndex;

            }
        );


        // ========================================
        // KLIK NA ŘÁDEK
        // ========================================

        lines.forEach(line => {

            line.addEventListener(
                "click",
                () => {

                    const start =
                        Number(line.dataset.start);

                    audio.currentTime =
                        start;

                    audio.play();

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
// TLAČÍTKO ZPĚT
// ========================================

if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            if (currentScreen === "period") {

                showScreen(
                    "historie",
                    "Literární historický kontext"
                );

                loadPeriods();

                return;
            }


            if (
                currentScreen === "historie" ||
                currentScreen === "cetba" ||
                currentScreen === "ustni"
            ) {

                showScreen(
                    "home",
                    "Maturita v uších"
                );

            }

        }
    );

}


// ========================================
// START
// ========================================

showScreen(
    "home",
    "Maturita v uších"
);
