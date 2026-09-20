// ==========================================
// 1. REGISTRACE SERVICE WORKERU
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker registrován'))
            .catch(err => console.error('Registrace SW selhala:', err));
    });
}

// ==========================================
// 2. OCHRANA DAT (PERSISTENT STORAGE)
// ==========================================
async function initPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
            await navigator.storage.persist();
        }
    }
}
initPersistentStorage();

// ==========================================
// 3. DATABÁZE (INDEXED-DB) PRO STAV TLAČÍTEK
// ==========================================
const DB_NAME = 'MaturitaOfflineDB';
const STORE_NAME = 'song_states';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function isSongOffline(songId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(songId);
        request.onsuccess = () => resolve(request.result === true);
        request.onerror = () => reject(request.error);
    });
}

async function setSongOfflineState(songId, isOffline) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(isOffline, songId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ==========================================
// 4. NAVIGACE A PŘEPÍNÁNÍ OBRAZOVEK
// ==========================================
const screens = {
    home: document.getElementById('homeScreen'),
    historie: document.getElementById('historieScreen'),
    period: document.getElementById('periodScreen'),
    cetba: document.getElementById('cetbaScreen'),
    ustni: document.getElementById('ustniScreen')
};

const backButton = document.getElementById('backButton');
const pageTitle = document.getElementById('pageTitle');
let navigationHistory = ['home'];

function showScreen(screenId, title = 'Maturita v uších') {
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.add('hidden');
    });
    if (screens[screenId]) screens[screenId].classList.remove('hidden');
    if (pageTitle) pageTitle.textContent = title;

    if (screenId === 'home') {
        navigationHistory = ['home'];
        if (backButton) backButton.classList.add('hidden');
    } else {
        if (navigationHistory[navigationHistory.length - 1] !== screenId) {
            navigationHistory.push(screenId);
        }
        if (backButton) backButton.classList.remove('hidden');
    }
}

if (backButton) {
    backButton.addEventListener('click', () => {
        if (navigationHistory.length > 1) {
            navigationHistory.pop();
            const previousScreen = navigationHistory[navigationHistory.length - 1];
            showScreen(previousScreen, previousScreen === 'home' ? 'Maturita v uších' : pageTitle.textContent);
        }
    });
}

// ==========================================
// 5. OFFLINE STAHOVÁNÍ (CACHE + INDEXED-DB)
// ==========================================
const CONTENT_CACHE = 'maturita-content-v1';

async function handleOfflineToggle(songId, audioUrl, jsonUrl, buttonElement) {
    buttonElement.disabled = true;
    try {
        const cache = await caches.open(CONTENT_CACHE);
        const offline = await isSongOffline(songId);

        if (offline) {
            buttonElement.textContent = "Odebírám...";
            await cache.delete(audioUrl);
            if (jsonUrl) await cache.delete(jsonUrl);
            await setSongOfflineState(songId, false);
        } else {
            buttonElement.textContent = "Stahuji audio...";
            const audioRequest = new Request(audioUrl, { cache: "reload" });
            const audioResponse = await fetch(audioRequest);
            if (!audioResponse.ok) throw new Error("Nelze stáhnout audio.");
            
            let lyricsResponse = null;
            if (jsonUrl) {
                buttonElement.textContent = "Stahuji data...";
                const lyricsRequest = new Request(jsonUrl, { cache: "reload" });
                lyricsResponse = await fetch(lyricsRequest);
            }

            await cache.put(audioUrl, audioResponse);
            if (lyricsResponse && lyricsResponse.ok) await cache.put(jsonUrl, lyricsResponse);
            await setSongOfflineState(songId, true);
        }
    } catch (error) {
        console.error("Chyba:", error);
        alert("Nezdařilo se: " + error.message);
    } finally {
        await updateButtonUI(songId, buttonElement);
    }
}

async function updateButtonUI(songId, buttonElement) {
    const offline = await isSongOffline(songId);
    if (offline) {
        buttonElement.textContent = "✓ Uloženo offline";
        buttonElement.classList.add('downloaded');
    } else {
        buttonElement.textContent = "Stáhnout offline";
        buttonElement.classList.remove('downloaded');
    }
    buttonElement.disabled = false;
}

function createDownloadButton(songId, audioUrl, jsonUrl = null) {
    const btn = document.createElement('button');
    btn.className = 'download-btn';
    btn.textContent = 'Načítám...';
    btn.disabled = true;
    
    updateButtonUI(songId, btn);
    btn.addEventListener('click', () => handleOfflineToggle(songId, audioUrl, jsonUrl, btn));
    
    return btn;
}

// ==========================================
// 6. NAČÍTÁNÍ DYNAMICKÉHO OBSAHU A INICIALIZACE
// ==========================================

// Propojení hlavního menu
document.querySelectorAll('.menu-card').forEach(card => {
    card.addEventListener('click', () => {
        const target = card.dataset.section;
        if (target) {
            showScreen(target, card.querySelector('h2').textContent);
            // Pokud jdeme do historie, načteme období
            if (target === 'historie') loadPeriods();
        }
    });
});

// Zde nahraď fetch podle toho, jak máš strukturovaná svá data (předpokládám periods.json)
async function loadPeriods() {
    const container = document.getElementById('periodsContainer');
    // Pokud už jsou načtená, nebudeme je stahovat znovu
    if (container.children.length > 0) return;

    try {
        const response = await fetch('./data/periods.json');
        if (!response.ok) throw new Error('Nelze načíst seznam období.');
        const periods = await response.json();

        container.innerHTML = '';
        periods.forEach(period => {
            const btn = document.createElement('button');
            btn.className = 'menu-card';
            btn.innerHTML = `
                <div>
                    <h2>${period.name}</h2>
                </div>
                <span class="arrow">›</span>
            `;
            btn.addEventListener('click', () => loadPeriodDetail(period));
            container.appendChild(btn);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Nepodařilo se načíst data.</p>';
    }
}

async function loadPeriodDetail(period) {
    showScreen('period', period.name);
    const desc = document.getElementById('periodDescription');
    const songsContainer = document.getElementById('songs');
    
    desc.textContent = period.description || '';
    songsContainer.innerHTML = 'Načítám skladby...';

    // Generování konkrétních skladeb pro dané období
    try {
        // Zde si uprav logiku, podle toho, kde máš uloženy detaily období
        const response = await fetch(`./data/${period.id}.json`);
        const songs = await response.json();
        songsContainer.innerHTML = '';

        songs.forEach(song => {
            const songDiv = document.createElement('div');
            songDiv.className = 'song-card';
            
            songDiv.innerHTML = `
                <h3>${song.title}</h3>
                <audio controls>
                    <source src="${song.audioSrc}" type="audio/mpeg">
                </audio>
            `;
            
            // 💡 Zde kouzlo probíhá: Vygenerujeme PWA offline tlačítko na míru
            const downloadBtn = createDownloadButton(song.id, song.audioSrc, `./data/${song.id}.json`);
            songDiv.appendChild(downloadBtn);
            
            songsContainer.appendChild(songDiv);
        });
    } catch (err) {
        console.error(err);
        songsContainer.innerHTML = '<p>Nebyly nalezeny žádné skladby pro toto období.</p>';
    }
}
