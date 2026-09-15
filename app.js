// ========================================
// MATURITA V UŠÍCH
// app.js
// ========================================


// ========================================
// ZÁKLADNÍ PRVKY
// ========================================

const homeScreen = document.getElementById("homeScreen");
const historieScreen = document.getElementById("historieScreen");
const cetbaScreen = document.getElementById("cetbaScreen");
const ustniScreen = document.getElementById("ustniScreen");
const periodScreen = document.getElementById("periodScreen");

const pageTitle = document.getElementById("pageTitle");
const backButton = document.getElementById("backButton");

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
// POMOCNÁ FUNKCE
// ZOBRAZÍ JEDNU OBRAZOVKU
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


    // Vždy začneme nahoře

    window.scrollTo(0, 0);
}


// ========================================
// ÚVODNÍ STRÁNKA
// ========================================

const menuButtons =
    document.querySelectorAll(".menu-card[data-section]");


menuButtons.forEach(button => {

    button.addEventListener("click", function(event) {

        event.preventDefault();

        const section =
            button.getAttribute("data-section");


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

    });

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
        // VYTVOŘENÍ TLAČÍTEK OBDOBÍ
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
// NAČTENÍ TEXTU
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
                document.createElement("div");


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

                if (newIndex === activeIndex) {
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
                        Number(line.dataset.start);


                    if (!Number.isNaN(start)) {

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
//
// Tady je záměrně jiný systém.
//
// Nepoužíváme:
// scrollIntoView()
// scrollTo({ behavior: "smooth" })
// ani automatické centrování.
//
// Aktivní řádek zůstává přibližně
// ve stejné oblasti obrazovky.
// ========================================

function updateLyricsPosition(
    container,
    activeLine,
    index
) {


    // První tři řádky:
    // vůbec neposouváme.

    if (index < 2) {
        return;
    }


    const containerTop =
        container.getBoundingClientRect().top;


    const lineTop =
        activeLine.getBoundingClientRect().top;


    const lineBottom =
        activeLine.getBoundingClientRect().bottom;


    const containerHeight =
        container.clientHeight;


    /*
        Aktivní řádek chceme mít
        přibližně zde:

        35 % výšky textového okna.
    */

    const desiredTop =
        containerTop +
        containerHeight * 0.10;


    const desiredBottom =
        containerTop +
        containerHeight * 0.45;


    /*
        Pokud je řádek příliš nahoře,
        neposouváme.

        Pokud je uvnitř bezpečné zóny,
        neposouváme.

        Posouváme pouze tehdy,
        když skutečně opouští bezpečnou zónu.
    */

    if (
        lineTop >= desiredTop &&
        lineBottom <= desiredBottom
    ) {

        return;
    }


    /*
        Řádek je příliš nízko.
        Posuneme obsah pouze o rozdíl.

        Ne na pevnou absolutní pozici.
        Pouze o potřebnou vzdálenost.
    */

    if (lineBottom > desiredBottom) {

        const difference =
            lineBottom -
            desiredBottom;


        smoothLyricsMove(
            container,
            difference
        );


        return;
    }


    /*
        Řádek je příliš nahoře.

        To může nastat například při kliknutí
        na starší řádek.

        Posuneme pouze o nutný rozdíl.
    */

    if (lineTop < desiredTop) {

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
// PLYNULÝ POSUN
// ========================================

function smoothLyricsMove(
    container,
    difference
) {

    /*
        Nepoužíváme CSS smooth scroll.

        Uděláme jeden malý posun.

        Další změna přijde až při dalším
        přechodu řádku.

        Tím zabráníme řetězení animací
        a následnému skákání.
    */


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


    const duration =
        350;


    function animate(now) {

        const progress =
            Math.min(
                1,
                (now - start) / duration
            );


        /*
            Jemné zpomalení na konci.
        */

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

            if (currentScreen === periodScreen) {

                showScreen(
                    historieScreen,
                    "Literární historický kontext"
                );

                loadPeriods();

                return;
            }


            // Z hlavní sekce domů

            if (
                currentScreen === historieScreen ||
                currentScreen === cetbaScreen ||
                currentScreen === ustniScreen
            ) {

                showScreen(
                    homeScreen,
                    "Maturita v uších"
                );

            }

        }
    );

}
const updateButton =
    document.getElementById("updateButton");

if (updateButton) {

    updateButton.addEventListener(
        "click",
        async function () {

            updateButton.textContent =
                "Aktualizuji...";

            updateButton.disabled = true;

            try {

                // Pokud existuje Service Worker,
                // požádáme ho o aktualizaci.

                if ("serviceWorker" in navigator) {

                    const registration =
                        await navigator.serviceWorker.getRegistration();

                    if (registration) {
                        await registration.update();
                    }
                }

            } catch (error) {

                console.log(
                    "Aktualizace service workeru:",
                    error
                );

            }


            // Tvrdé obnovení stránky

            window.location.reload(true);

        }
    );

}

// ========================================
// START APLIKACE
// ========================================

showScreen(
    homeScreen,
    "Maturita v uších"
);
