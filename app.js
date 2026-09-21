// ========================================
// KONSTANTY A NASTAVENÍ
// ========================================
const CONTENT_CACHE_NAME = 'maturita-v-usich-content-v1';
const DB_NAME = 'MaturitaAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'song_states';

// Globální stav aplikace
let currentView = 'menu';
let currentPeriod = null;

// ========================================
// HELPER FUNKCE (XSS OCHRANA)
// ========================================
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ========================================
// INDEXEDDB (UCHOVÁNÍ STAVU OFFLINE TLAČÍTEK)
// ========================================
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function setSongDownloadedState(id, downloaded) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put({ id: id, downloaded: downloaded, timestamp: Date.now() });
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error('Chyba při zápisu do IndexedDB:', err);
    }
}

async function getSongDownloadedState(id) {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result ? request.result.downloaded : false);
            request.onerror = () => resolve(false);
        });
    } catch (err) {
        console.error('Chyba při čtení z IndexedDB:', err);
        return false;
    }
}

// ========================================
// SYNCHRONIZACE TEXTU (SPOTIFY KARAOKE OKNO)
// ========================================

// 1. Vykreslení řádků textu do samostatného okna #lyrics
function renderLyrics(lyricsData, audioElement) {
    const lyricsContainer = document.getElementById('lyrics');
    if (!lyricsContainer) return;

    lyricsContainer.innerHTML = '';

    if (!lyricsData || lyricsData.length === 0) {
        lyricsContainer.innerHTML = '<div class="error">Text není k dispozici.</div>';
        return;
    }

    lyricsData.forEach(item => {
        const line = document.createElement('div');
        line.className = 'lyric-line';
        line.dataset.time = item.time;
        line.textContent = item.text;

        // Přetočení audia při kliknutí na řádek
        line.addEventListener('click', () => {
            if (audioElement) {
                audioElement.currentTime = parseFloat(item.time);
                audioElement.play().catch(() => {});
            }
        });

        lyricsContainer.appendChild(line);
    });

    lyricsContainer.scrollTop = 0;
}

// 2. Výpočet posunu – udržuje aktivní řádek uprostřed boxu #lyrics
function scrollLyricsBox() {
    const lyricsContainer = document.getElementById('lyrics');
    if (!lyricsContainer) return;

    const activeLine = lyricsContainer.querySelector('.lyric-line.active');
    if (activeLine) {
        const containerHalfHeight = lyricsContainer.clientHeight / 2;
        const lineHalfHeight = activeLine.clientHeight / 2;
        const scrollTo = activeLine.offsetTop - containerHalfHeight + lineHalfHeight;

        lyricsContainer.scrollTo({
            top: scrollTo,
            behavior: 'smooth'
        });
    }
}

// 3. Sledování přehrávání audia a aktivace řádků
function setupLyricsSync(audioElement) {
    if (!audioElement) return;

    audioElement.addEventListener('timeupdate', () => {
        const currentTime = audioElement.currentTime;
        const lines = document.querySelectorAll('.lyric-line');
        let currentLine = null;

        lines.forEach(line => {
            const lineTime = parseFloat(line.dataset.time);
            if (currentTime >= lineTime) {
                currentLine = line;
            }
        });

        if (currentLine && !currentLine.classList.contains('active')) {
            lines.forEach(l => l.classList.remove('active'));
            currentLine.classList.add('active');
            scrollLyricsBox();
        }
    });
}

// ========================================
// OFFLINE STAHOVÁNÍ DO CACHE
// ========================================
async function setupOfflineButton(songId, audioUrl, jsonUrl) {
    const downloadBtn = document.getElementById('downloadBtn');
    if (!downloadBtn) return;

    const isDownloaded = await getSongDownloadedState(songId);
    updateOfflineButtonUI(downloadBtn, isDownloaded);

    downloadBtn.onclick = async () => {
        downloadBtn.disabled = true;
        try {
            const cache = await caches.open(CONTENT_CACHE_NAME);
            const currentState = await getSongDownloadedState(songId);

            if (currentState) {
                // Smazat z offline cache
                await cache.delete(audioUrl);
                if (jsonUrl) await cache.delete(jsonUrl);
                await setSongDownloadedState(songId, false);
                updateOfflineButtonUI(downloadBtn, false);
            } else {
                // Stáhnout do offline cache
                downloadBtn.textContent = 'Stahuje se...';
                await cache.addAll([audioUrl, jsonUrl].filter(Boolean));
                await setSongDownloadedState(songId, true);
                updateOfflineButtonUI(downloadBtn, true);
            }
        } catch (err) {
            console.error('Chyba při offline uložení:', err);
            alert('Nepodařilo se uložit soubory pro offline režim.');
            const currentState = await getSongDownloadedState(songId);
            updateOfflineButtonUI(downloadBtn, currentState);
        } finally {
            downloadBtn.disabled = false;
        }
    };
}

function updateOfflineButtonUI(button, isDownloaded) {
    if (isDownloaded) {
        button.classList.add('downloaded');
        button.textContent = '✓ Uloženo offline (Smazat)';
    } else {
        button.classList.remove('downloaded');
        button.textContent = '⬇ Stáhnout pro offline';
    }
}

// ========================================
// NAVIGACE A PREPÍNÁNÍ OBRAZOVEK (SPA)
// ========================================
function showView(viewId) {
    const views = ['menuView', 'periodDetailView', 'songView'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === viewId) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });

    const backBtn = document.getElementById('backBtn');
    const pageTitle = document.getElementById('pageTitle');

    if (viewId === 'menuView') {
        if (backBtn) backBtn.classList.add('hidden');
        if (pageTitle) pageTitle.textContent = 'Maturita v uších';
        currentView = 'menu';
    } else if (viewId === 'periodDetailView') {
        if (backBtn) backBtn.classList.remove('hidden');
        if (pageTitle) pageTitle.textContent = currentPeriod ? currentPeriod.title : 'Přehled období';
        currentView = 'periodDetail';
    } else if (viewId === 'songView') {
        if (backBtn) backBtn.classList.remove('hidden');
        currentView = 'song';
    }
}

function handleBackNavigation() {
    if (currentView === 'song') {
        const audio = document.querySelector('audio');
        if (audio) audio.pause();
        showView('periodDetailView');
    } else if (currentView === 'periodDetail') {
        showView('menuView');
    }
}

// ========================================
// NAČÍTÁNÍ OBSAHU Z JSON DATA
// ========================================
async function loadPeriods() {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    try {
        const response = await fetch('./data/periods.json');
        if (!response.ok) throw new Error('Chyba při načítání periods.json');
        const periods = await response.json();

        menuGrid.innerHTML = '';
        periods.forEach(period => {
            const card = document.createElement('div');
            card.className = 'menu-card';
            card.innerHTML = `
                <div class="menu-icon">${escapeHTML(period.icon || '🎵')}</div>
                <div>
                    <h2>${escapeHTML(period.title)}</h2>
                    <p>${escapeHTML(period.subtitle || '')}</p>
                </div>
                <div class="arrow">›</div>
            `;
            card.addEventListener('click', () => loadPeriodDetail(period));
            menuGrid.appendChild(card);
        });
    } catch (err) {
        console.error('Chyba při načítání seznamu období:', err);
        menuGrid.innerHTML = '<div class="error">Nepodařilo se načíst seznam období. Zkontrolujte připojení.</div>';
    }
}

async function loadPeriodDetail(period) {
    currentPeriod = period;
    showView('periodDetailView');

    const periodContent = document.getElementById('periodContent');
    if (!periodContent) return;

    periodContent.innerHTML = '<div class="loading">Načítání obsahu...</div>';

    try {
        const response = await fetch(`./data/${period.id}.json`);
        if (!response.ok) throw new Error(`Chyba při načítání ${period.id}.json`);
        const data = await response.json();

        renderSongDetail(data, period.id);
    } catch (err) {
        console.error('Chyba při načítání detailu obdobu:', err);
        periodContent.innerHTML = '<div class="error">Obsah pro toto období není k dispozici nebo chybí offline uložení.</div>';
    }
}

function renderSongDetail(songData, periodId) {
    showView('songView');

    const songContainer = document.getElementById('songContainer');
    if (!songContainer) return;

    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = songData.title || 'Skladba';

    const songId = `${periodId}_${songData.id || '0'}`;
    const audioUrl = songData.audio || `./audio/${periodId}.mp3`;
    const jsonUrl = `./data/${periodId}.json`;

    songContainer.innerHTML = `
        <div class="song-card">
            <div class="cover">
                <span class="app-label">${escapeHTML(songData.category || 'Česká literatura')}</span>
                <span class="author">${escapeHTML(songData.author || '')}</span>
            </div>
            <h2>${escapeHTML(songData.title)}</h2>
            
            <audio controls src="${escapeHTML(audioUrl)}"></audio>
            
            <button id="downloadBtn" class="download-button">⬇ Stáhnout pro offline</button>
        </div>

        <div class="lyrics-container">
            <h3>Synchronizovaný text</h3>
            <div id="lyrics"></div>
        </div>
    `;

    const audioElement = songContainer.querySelector('audio');

    // Nastavení tlačítka offline stahování
    setupOfflineButton(songId, audioUrl, jsonUrl);

    // Inicializace Spotify karaoke okna a synchronizace
    renderLyrics(songData.lyrics || [], audioElement);
    setupLyricsSync(audioElement);
}

// ========================================
// INICIALIZACE APLIKACE A REGISTRACE SW
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Registrace Service Workeru
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(() => console.log('Service Worker úspěšně zaregistrován.'))
            .catch(err => console.error('Chyba registrace SW:', err));
    }

    // 2. Vyžádání trvalého úložiště od prohlížeče
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then(granted => {
            if (granted) {
                console.log('Trvalé úložiště udeleno – systém nebude offline data mazat.');
            }
        });
    }

    // 3. Navigace – tlačítko Zpět v hlavičce
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', handleBackNavigation);
    }

    // 4. Manuální aktualizace (pokud existuje tlačítko #updateBtn)
    const updateBtn = document.getElementById('updateBtn');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            window.location.reload(true);
        });
    }

    // 5. Spuštění aplikace – načtení hlavního menu
    loadPeriods();
});
