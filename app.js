const screens = {
    home: document.getElementById("homeScreen"),
    historie: document.getElementById("historieScreen"),
    cetba: document.getElementById("cetbaScreen"),
    ustni: document.getElementById("ustniScreen"),
    period: document.getElementById("periodScreen")
};

const pageTitle = document.getElementById("pageTitle");
const backButton = document.getElementById("backButton");
const periodsContainer = document.getElementById("periodsContainer");
const songsContainer = document.getElementById("songs");
const periodDescription = document.getElementById("periodDescription");

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

    pageTitle.textContent = title;

    currentScreen = screenName;

    if (screenName === "home") {
        backButton.classList.add("hidden");
    } else {
        backButton.classList.remove("hidden");
    }

    window.scrollTo(0, 0);
}


// ========================================
// HLAVNÍ MENU
// ========================================

document.querySelectorAll("[data-section]").forEach(button => {

    button.addEventListener("click", () => {

        const section = button.dataset.section;

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

    periodsContainer.innerHTML = `
        <div class="loading">
            Načítám literární období...
        </div>
    `;

    try {

        const response =
            await fetch("./data/periods.json");

        if (!response.ok) {
            throw new Error("Chyba při načítání periods.json");
        }

        const periods =
            await response.json();

        periodsContainer.innerHTML = "";

        periods.forEach(period => {

            const button =
                document.createElement("button");

            button.className = "menu-card";

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

            button.addEventListener(
                "click",
                () => openPeriod(period)
            );

            periodsContainer.appendChild(button);

        });

    }

    catch (error) {

        console.error(error);

        periodsContainer.innerHTML = `
            <div class="error-card">

                <h2>Nelze načíst období</h2>

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

    periodDescription.innerHTML = "";

    songsContainer.innerHTML = `
        <div class="loading">
            Načítám obsah...
        </div>
    `;


    // ====================================
    // STŘEDOVĚK
    // ====================================

    if (period.content === "stredovek") {

        await loadStredovek();

        return;
    }


    // ====================================
    // OSTATNÍ OBDOBÍ
    // ====================================

    songsContainer.innerHTML = `
        <div class="placeholder-card">

            <h2>
                ${period.title}
            </h2>

            <p>
                Obsah tohoto období zatím připravujeme.
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
                Hus, Kosmas, legendy, kroniky
                a středověká literatura.
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
                    Text
                </h3>

                <div id="lyrics">
                    Načítám text...
                </div>

            </div>

        </div>

    `;


    await loadLyrics();

}


// ========================================
// NAČTENÍ TEXTU
// ========================================

async function loadLyrics() {

    const lyricsContainer =
        document.getElementById("lyrics");

    const audio =
        document.getElementById("stredovekAudio");


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

            lyricsContainer.appendChild(
                element
            );

        });


        const lines =
            lyricsContainer.querySelectorAll(
                ".lyric-line"
            );


        // ====================================
        // SYNCHRONIZACE
        // ====================================

        audio.addEventListener(
            "timeupdate",
            () => {

                const currentTime =
                    audio.currentTime;


                lines.forEach(line => {

                    const start =
                        Number(line.dataset.start);

                    const end =
                        Number(line.dataset.end);


                    if (
                        currentTime >= start &&
                        currentTime < end
                    ) {

                        if (
                            !line.classList.contains(
                                "active"
                            )
                        ) {

                            line.classList.add(
                                "active"
                            );


                            const container =
                                lyricsContainer;


                            const target =
                                line.offsetTop -
                                (
                                    container.clientHeight / 2
                                ) +
                                (
                                    line.offsetHeight / 2
                                );


                            container.scrollTo({
                                top: target,
                                behavior: "smooth"
                            });

                        }

                    }

                    else {

                        line.classList.remove(
                            "active"
                        );

                    }

                });

            }
        );

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
// ZPĚT
// ========================================

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


// ========================================
// START
// ========================================

showScreen(
    "home",
    "Maturita v uších"
);
