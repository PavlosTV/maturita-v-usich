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
const periodsContainer = document.getElementById("periodsContainer");
const songsContainer = document.getElementById("songs");
const periodDescription = document.getElementById("periodDescription");

// ========================================
// STAV APLIKACE
// ========================================


// Požádá mobilní telefon o trvalé úložiště (zabrání promazávání audia)
async function initPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
            const granted = await navigator.storage.persist();
            console.log(`Trvalé úložiště schváleno: ${granted}`);
        } else {
            console.log("Trvalé úložiště již bylo dříve schváleno.");
        }
    }
}

// Zavolej při spuštění aplikace
initPersistentStorage();
let currentScreen = "home";
let isScrolling = false; // Zámek proti přehlcení animacemi

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

const menuButtons = document.querySelectorAll(".menu-card[data-section]");

menuButtons.forEach(button => {
    button.addEventListener("click", function(event) {
        event.preventDefault();
        const section = button.getAttribute("data-section");

        if (section === "historie") {
            showScreen(historieScreen, "Literární historický kontext");
            loadPeriods();
            return;
        }

        if (section === "cetba") {
            showScreen(cetbaScreen, "Maturitní četba");
            return;
        }

        if (section === "ustni") {
            showScreen(ustniScreen, "Příprava k ústní maturitě");
            return;
        }
    });
});

// ========================================
// NAČTENÍ LITERÁRNÍCH OBDOBÍ
// ========================================

async function loadPeriods() {
    if (!periodsContainer) return;

    periodsContainer.innerHTML = `
        <div class="loading">
            Načítám literární období...
        </div>
    `;

    try {
        const response = await fetch("./data/periods.json");
        if (!response.ok) {
            throw new Error("Soubor periods.json se nepodařilo načíst.");
        }

        const periods = await response.json();
        periodsContainer.innerHTML = "";

        periods.forEach(period => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "menu-card";

            button.innerHTML = `
                <div class="menu-icon">L</div>
                <div>
                    <h2>${period.title}</h2>
                    <p>Otevřít literární období</p>
                </div>
                <span class="arrow">›</span>
            `;

            button.addEventListener("click", function() {
                openPeriod(period);
            });

            periodsContainer.appendChild(button);
        });

    } catch (error) {
        console.error(error);
        periodsContainer.innerHTML = `
            <div class="error-card">
                <h2>Nelze načíst období</h2>
                <p>Zkontroluj soubor <strong>data/periods.json</strong>.</p>
            </div>
        `;
    }
}

// ========================================
// OTEVŘENÍ OBDOBÍ
// ========================================

async function openPeriod(period) {
    showScreen(periodScreen, period.title);

    if (periodDescription) {
        periodDescription.innerHTML = "";
    }

    if (songsContainer) {
        songsContainer.innerHTML = `
            <div class="loading">Načítám obsah...</div>
        `;
    }

    if (period.content === "stredovek") {
        await loadStredovek();
        return;
    }

    if (songsContainer) {
        songsContainer.innerHTML = `
            <div class="placeholder-card">
                <h2>${period.title}</h2>
                <p>Obsah tohoto období zatím připravujeme.</p>
            </div>
        `;
    }
}

// ========================================
// STŘEDOVĚK
// ========================================

async function loadStredovek() {
    if (!songsContainer) return;

    songsContainer.innerHTML = `
        <div class="song-card">
            <div class="cover">
                <span>ČESKÝ JAZYK</span>
                <strong>STŘEDOVĚK</strong>
            </div>
            <h2>Středověk</h2>
            <p class="description">
                Hus, Kosmas, legendy, kroniky a středověká literatura.
            </p>
            <audio id="stredovekAudio" controls preload="metadata">
                <source src="./audio/stredovek.mp3" type="audio/mpeg">
                Tvůj prohlížeč nepodporuje přehrávání audia.
            </audio>
            <button id="downloadStredovek" class="download-button" type="button">
                Stáhnout Středověk offline
            </button>
            <div class="lyrics-container">
                <h3>Text písně</h3>
                <div id="lyrics">
                    <div class="loading">Načítám text...</div>
                </div>
            </div>
        </div>
    `;

    setupOfflineDownload();
    await loadLyrics();
}

// ========================================
// NAČTENÍ TEXTU
// ========================================

async function loadLyrics() {
    const lyricsContainer = document.getElementById("lyrics");
    const audio = document.getElementById("stredovekAudio");

    if (!lyricsContainer || !audio) return;

    try {
        const response = await fetch("./data/stredovek.json");
        if (!response.ok) {
            throw new Error("Soubor stredovek.json se nepodařilo načíst.");
        }

        const data = await response.json();
        if (!data.lines || !Array.isArray(data.lines)) {
            throw new Error("stredovek.json nemá správný formát.");
        }

        lyricsContainer.innerHTML = "";

        data.lines.forEach(line => {
            const element = document.createElement("div");
            element.className = "lyric-line";
            element.dataset.start = Number(line.start);
            element.dataset.end = Number(line.end);
            element.textContent = line.text;
            lyricsContainer.appendChild(element);
        });

        const lines = Array.from(lyricsContainer.querySelectorAll(".lyric-line"));
        let activeIndex = -1;

        audio.addEventListener("timeupdate", function() {
            const time = audio.currentTime;
            let newIndex = -1;

            for (let i = 0; i < lines.length; i++) {
                const start = Number(lines[i].dataset.start);
                const end = Number(lines[i].dataset.end);

                if (time >= start && time < end) {
                    newIndex = i;
                    break;
                }
            }

            if (newIndex === -1 || newIndex === activeIndex) return;

            activeIndex = newIndex;

            lines.forEach(line => line.classList.remove("active"));
            lines[activeIndex].classList.add("active");

            updateLyricsPosition(lyricsContainer, lines[activeIndex], activeIndex);
        });

        lines.forEach(line => {
            line.addEventListener("click", function() {
                const start = Number(line.dataset.start);
                if (!Number.isNaN(start)) {
                    audio.currentTime = start;
                    audio.play();
                }
            });
        });

    } catch (error) {
        console.error(error);
        lyricsContainer.innerHTML = `
            <div class="error-card">
                <h2>Chyba při načítání textu</h2>
                <p>Zkontroluj soubor <strong>data/stredovek.json</strong>.</p>
            </div>
        `;
    }
}

// ========================================
// POSOUVÁNÍ TEXTU
// ========================================

function updateLyricsPosition(container, activeLine, index) {
    if (index < 2) return;

    const containerTop = container.getBoundingClientRect().top;
    const lineTop = activeLine.getBoundingClientRect().top;
    const lineBottom = activeLine.getBoundingClientRect().bottom;
    const containerHeight = container.clientHeight;

    const desiredTop = containerTop + containerHeight * 0.10;
    const desiredBottom = containerTop + containerHeight * 0.45;

    if (lineTop >= desiredTop && lineBottom <= desiredBottom) return;

    if (lineBottom > desiredBottom) {
        smoothLyricsMove(container, lineBottom - desiredBottom);
        return;
    }

    if (lineTop < desiredTop) {
        smoothLyricsMove(container, lineTop - desiredTop);
    }
}

// ========================================
// PLYNULÝ POSUN TEXTU (OPRAVENO)
// ========================================

function smoothLyricsMove(container, difference) {
    if (isScrolling) return; // Zabrání lavině animací
    isScrolling = true;

    const current = container.scrollTop;
    const max = container.scrollHeight - container.clientHeight;
    const target = Math.max(0, Math.min(current + difference, max));
    const start = performance.now();
    const duration = 350;

    function animate(now) {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        container.scrollTop = current + (target - current) * eased;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isScrolling = false; // Po dokončení odemkneme
        }
    }

    requestAnimationFrame(animate);
}

// ========================================
// TLAČÍTKO ZPĚT
// ========================================

if (backButton) {
    backButton.addEventListener("click", function() {
        if (currentScreen === periodScreen) {
            showScreen(historieScreen, "Literární historický kontext");
            loadPeriods();
            return;
        }

        if (
            currentScreen === historieScreen ||
            currentScreen === cetbaScreen ||
            currentScreen === ustniScreen
        ) {
            showScreen(homeScreen, "Maturita v uších");
        }
    });
}

// ========================================
// TLAČÍTKO AKTUALIZACE
// ========================================

const updateButton = document.getElementById("updateButton");

if (updateButton) {
    updateButton.addEventListener("click", async function() {
        updateButton.textContent = "Stahuji aktualizaci...";
        updateButton.disabled = true;

        try {
            if ("serviceWorker" in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    await registration.update();
                }
            }

            updateButton.textContent = "Aktualizace probíhá...";
            setTimeout(function() {
                window.location.reload();
            }, 3000);

        } catch (error) {
            console.error("Aktualizace se nepodařila:", error);
            updateButton.textContent = "Aktualizace se nepodařila";
            updateButton.disabled = false;
        }
    });
}

// ========================================
// OFFLINE STAŽENÍ / ODEBRÁNÍ
// STŘEDOVĚKU
// ========================================

async function setupOfflineDownload() {
    const button = document.getElementById("downloadStredovek");
    const audioElement = document.getElementById("stredovekAudio");
    if (!button || !audioElement) return;

    const CONTENT_CACHE = "maturita-v-usich-content-v1";
    
    // Získáme 100% přesnou adresu přímo z přehrávače (vyřeší problémy s lomítky na GitHubu)
    const AUDIO_FILE = audioElement.querySelector("source").src;
    
    // U textu si pomůžeme vytvořením odkazu
    const a = document.createElement("a");
    a.href = "./data/stredovek.json";
    const LYRICS_FILE = a.href;

    async function checkOffline() {
        try {
            const cache = await caches.open(CONTENT_CACHE);
            // Žádné ignoreSearch. Nyní to hledá absolutně přesnou shodu.
            const audio = await cache.match(AUDIO_FILE);
            const lyrics = await cache.match(LYRICS_FILE);
            return !!(audio && lyrics);
        } catch (e) {
            return false;
        }
    }

    async function updateOfflineButtonState() {
        try {
            const offline = await checkOffline();
            if (offline) {
                button.textContent = "Odebrat Středověk z offline";
                button.classList.add("downloaded");
            } else {
                button.textContent = "Stáhnout Středověk offline";
                button.classList.remove("downloaded");
            }
            button.disabled = false;
        } catch (error) {
            button.textContent = "Stáhnout Středověk offline";
            button.disabled = false;
        }
    }

    button.addEventListener("click", async function() {
        button.disabled = true;

        try {
            const cache = await caches.open(CONTENT_CACHE);
            const offline = await checkOffline();

            if (offline) {
                button.textContent = "Odebírám...";
                await cache.delete(AUDIO_FILE);
                await cache.delete(LYRICS_FILE);
                button.textContent = "Středověk byl odebrán";
                setTimeout(updateOfflineButtonState, 800);
                return;
            }

            button.textContent = "Stahuji audio...";
            // Místo lepení otazníků (?download) použijeme { cache: "reload" }
            // Tím získáme aktuální soubor, ale uloží se pod dokonalou, čistou URL
            const audioRequest = new Request(AUDIO_FILE, { cache: "reload" });
            const audioResponse = await fetch(audioRequest);
            if (!audioResponse.ok) throw new Error("Audio se nepodařilo stáhnout.");

            button.textContent = "Stahuji text...";
            const lyricsRequest = new Request(LYRICS_FILE, { cache: "reload" });
            const lyricsResponse = await fetch(lyricsRequest);
            if (!lyricsResponse.ok) throw new Error("Text se nepodařilo stáhnout.");

            await cache.put(AUDIO_FILE, audioResponse);
            await cache.put(LYRICS_FILE, lyricsResponse);

            button.textContent = "✓ Středověk je offline";
            setTimeout(updateOfflineButtonState, 800);

        } catch (error) {
            console.error("Offline operace selhala:", error);
            alert("Detaily chyby: " + error.message); 
            button.textContent = "Operace se nepodařila";
            button.disabled = false;
            setTimeout(updateOfflineButtonState, 1500);
        }
    });

    await updateOfflineButtonState();
}

// ========================================
// START APLIKACE
// ========================================

showScreen(homeScreen, "Maturita v uších");
