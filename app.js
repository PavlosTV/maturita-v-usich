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

        screens[screenName].classList.remove(
            "hidden"
        );

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
        behavior: "instant"
    });

}


// ========================================
// HLAVNÍ MENU
// ========================================

document
    .querySelectorAll("[data-section]")
    .forEach(button => {

        button.addEventListener("click", () => {

            const section =
                button.dataset.section;


            // LITERÁRNÍ HISTORICKÝ KONTEXT

            if (section === "historie") {

                showScreen(
                    "historie",
                    "Literární historický kontext"
                );

                loadPeriods();

            }


            // MATURITNÍ ČETBA

            else if (section === "cetba") {

                showScreen(
                    "cetba",
                    "Maturitní četba"
                );

            }


            // ÚSTNÍ MATURITA

            else if (section === "ustni") {

                showScreen(
                    "ustni",
                    "Příprava k ústní maturitě"
                );

            }

        });

    });


// ========================================
// NAČTENÍ LITERÁRNÍCH OBDOBÍ
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

            throw new Error(
                "Nepodařilo se načíst periods.json"
            );

        }


        const periods =
            await response.json();


        periodsContainer.innerHTML = "";


        periods.forEach(period => {

            const button =
                document.createElement("button");


            button.className =
                "menu-card";


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
                () => openPeriod(period)
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
// NAČTENÍ SYNCHRONIZOVANÉHO TEXTU
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
            throw new Error("Nelze načíst stredovek.json");
        }

        const data =
            await response.json();

        lyricsContainer.innerHTML = "";

        // Vytvoření řádků
        data.lines.forEach(line => {

            const element =
                document.createElement("div");

            element.className = "lyric-line";

            element.dataset.start = line.start;
            element.dataset.end = line.end;

            element.textContent = line.text;

            lyricsContainer.appendChild(element);

        });

        const lines =
            Array.from(
                lyricsContainer.querySelectorAll(
                    ".lyric-line"
                )
            );

        let previousIndex = -1;


        // SYNCHRONIZACE

        audio.addEventListener(
            "timeupdate",
            () => {

                const currentTime =
                    audio.currentTime;

                let activeIndex = -1;


                // Najdeme aktuální řádek
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


                // Řádek se nezměnil
                if (
                    activeIndex === previousIndex
                ) {
                    return;
                }


                // Odstraníme staré zvýraznění
                lines.forEach(line => {
                    line.classList.remove("active");
                });


                // Zvýrazníme aktuální řádek
                lines[activeIndex].classList.add("active");


                // POSOUVÁNÍ TEXTU
                // První 3 řádky zůstávají nahoře

                if (activeIndex >= 3) {

                    const activeLine =
                        lines[activeIndex];

                    const container =
                        lyricsContainer;


                    const lineTop =
                        activeLine.offsetTop -
                        container.offsetTop;


                    // Aktuální řádek bude
                    // přibližně v horní třetině

                    const targetScroll =
                        lineTop -
                        container.clientHeight * 0.30;


                    container.scrollTo({

                        top: Math.max(
                            0,
                            targetScroll
                        ),

                        behavior: "smooth"

                    });

                }


                previousIndex =
                    activeIndex;

            }
        );


        // KLIK NA ŘÁDEK

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


    try {

        const response =
            await fetch(
                "./data/stredovek.json"
            );


        if (!response.ok) {

            throw new Error(
                "Nelze načíst stredovek.json"
            );

        }


        const data =
            await response.json();


        lyricsContainer.innerHTML = "";


        // ====================================
        // VYTVOŘENÍ ŘÁDKŮ
        // ====================================

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


        let previousActiveLine = null;


        // ====================================
        // SYNCHRONIZACE S HUDBOU
        // ====================================

        audio.addEventListener(
            "timeupdate",
            () => {

                const currentTime =
                    audio.currentTime;


                let activeLine = null;


                // Najdeme právě aktivní řádek

                lines.forEach(line => {

                    const start =
                        Number(
                            line.dataset.start
                        );


                    const end =
                        Number(
                            line.dataset.end
                        );


                    if (
                        currentTime >= start &&
                        currentTime < end
                    ) {

                        activeLine = line;

                    }

                });


                // Nic aktivního

                if (!activeLine) {
                    return;
                }


                // =================================
                // ZMĚNA AKTIVNÍHO ŘÁDKU
                // =================================

                if (
                    activeLine !==
                    previousActiveLine
                ) {


                    lines.forEach(line => {

                        line.classList.remove(
                            "active"
                        );

                    });


                    activeLine.classList.add(
                        "active"
                    );


                    // První řádek neposouváme

                    if (
                        previousActiveLine !==
                        null
                    ) {

                        const container =
                            lyricsContainer;


                        const target =
                            activeLine.offsetTop
                            -
                            (
                                container.clientHeight
                                / 2
                            )
                            +
                            (
                                activeLine.offsetHeight
                                / 2
                            );


                        container.scrollTo({

                            top: Math.max(
                                0,
                                target
                            ),

                            behavior: "smooth"

                        });

                    }


                    previousActiveLine =
                        activeLine;

                }

            }
        );


        // ====================================
        // KLIK NA ŘÁDEK
        // ====================================

        lines.forEach(line => {

            line.addEventListener(
                "click",
                () => {

                    const start =
                        Number(
                            line.dataset.start
                        );


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

backButton.addEventListener(
    "click",
    () => {


        // Z OBDOBÍ → HISTORICKÝ KONTEXT

        if (currentScreen === "period") {

            showScreen(
                "historie",
                "Literární historický kontext"
            );


            loadPeriods();


            return;

        }


        // Z HLAVNÍCH SEKCÍ → DOMŮ

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
// SPUŠTĚNÍ APLIKACE
// ========================================

showScreen(
    "home",
    "Maturita v uších"
);
