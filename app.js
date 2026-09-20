// ==========================================
// 1. REGISTRACE SERVICE WORKERU A AKTUALIZACE
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => {
                console.log('Service Worker registrován');
                
                // Oživení tlačítka Aktualizovat
                const updateBtn = document.getElementById('updateButton');
                if (updateBtn) {
                    updateBtn.addEventListener('click', () => {
                        updateBtn.textContent = "Aktualizuji...";
                        reg.update().then(() => {
                            window.location.reload(true);
                        }).catch(err => {
                            updateBtn.textContent = "Chyba aktualizace";
                            setTimeout(() => updateBtn.textContent = "Aktualizovat", 2000);
                        });
                    });
                }
            })
            .catch(err => console.error('Registrace SW selhala:', err));
    });
} else {
    // Pokud prohlížeč nepodporuje SW, tlačítko alespoň natvrdo obnoví stránku
    const updateBtn = document.getElementById('updateButton');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => window.location.reload(true));
    }
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
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(songId);
            request.onsuccess = () => resolve(request.result === true);
            request.onerror = () => resolve(false);
        });
    } catch(e) {
        return false;
    }
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
            // Předejdeme chybě s neexistujícím textem pomocí jednoduché logiky
            showScreen(previousScreen, previousScreen === 'home' ? 'Maturita v uších' : 'Maturita v uších');
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
            if (!audioResponse.ok) throw new Error("Nelze stáhnout audio ze serveru.");
            
            let lyricsResponse = null;
            if (jsonUrl) {
                buttonElement.textContent = "Stahuji texty...";
                const lyricsRequest = new Request(jsonUrl, { cache: "reload" });
                lyricsResponse = await fetch(lyricsRequest);
            }

            await cache.put(audioUrl, audioResponse);
            // Pokud json chybí (404), ignorujeme to a pokračujeme (aby šlo stáhnout aspoň audio)
            if (lyricsResponse && lyricsResponse.ok) await cache.put(jsonUrl, lyricsResponse);
            
            await setSongOfflineState(songId, true);
        }
    } catch (error) {
        console.error("Chyba stahování:", error);
        alert("Operace se nezdařila: " + error.message);
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

document.querySelectorAll('.menu-card').forEach(card => {
    card.addEventListener('click', () => {
        const target = card.dataset.section;
        if (target) {
            const heading = card.querySelector('h2');
            const title = heading ? heading.textContent : 'Maturita v uších';
            showScreen(target, title);
            
            if (target === 'historie') loadPeriods();
        }
    });
});

async function loadPeriods() {
    const container = document.getElementById('periodsContainer');
    if (!container) return; // Ochrana proti zamrznutí, pokud div chybí

    if (container.children.length > 0) return;

    try {
        const response = await fetch('./data/periods.json');
        if (!response.ok) throw new Error('Nelze načíst soubor periods.json ze serveru.');
        const periods = await response.json();

        container.innerHTML = '';
        periods.forEach(period => {
            // Ochrana proti "undefined": Vyzkouší se různé názvy klíčů, pokud tvůj JSON vypadá jinak
            const periodName = period.name || period.title || period.id || 'Neznámé období';
            const periodId = period.id || periodName.toLowerCase().replace(/\s+/g, '');

            const btn = document.createElement('button');
            btn.className = 'menu-card';
            btn.innerHTML = `
                <div>
                    <h2>${periodName}</h2>
                </div>
                <span class="arrow">›</span>
            `;
            btn.addEventListener('click', () => loadPeriodDetail(periodId, periodName, period.description));
            container.appendChild(btn);
        });
    } catch (err) {
        console.error("Chyba při načítání historie:", err);
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #ff6b6b;">
                <p>Nedaří se načíst data období. Zkontroluj, zda existuje soubor <b>./data/periods.json</b> a zda má správný formát.</p>
            </div>
            <button class="menu-card" onclick="loadPeriodDetail('stredovek', 'Středověk', 'Záložní tlačítko')">
                <div><h2>Nouzový režim: Zkusit načíst Středověk</h2></div>
            </button>
        `;
    }
}

async function loadPeriodDetail(periodId, periodName, periodDescription) {
    showScreen('period', periodName);
    const desc = document.getElementById('periodDescription');
    const songsContainer = document.getElementById('songs');
    
    if (desc) desc.textContent = periodDescription || '';
    if (songsContainer) songsContainer.innerHTML = 'Načítám skladby...';

    try {
        const response = await fetch(`./data/${periodId}.json`);
        if (!response.ok) throw new Error(`Nenalezen soubor ${periodId}.json`);
        const songs = await response.json();
        
        if (songsContainer) songsContainer.innerHTML = '';

        songs.forEach(song => {
            // Ochrana pro případ různě strukturovaného JSON souboru s písničkami
            const songTitle = song.title || song.name || 'Neznámá skladba';
            const songId = song.id || songTitle.toLowerCase().replace(/\s+/g, '');
            const audioUrl = song.audioSrc || song.url || `./audio/${songId}.mp3`;
            
            const songDiv = document.createElement('div');
            songDiv.className = 'song-card';
            
            songDiv.innerHTML = `
                <h3>${songTitle}</h3>
                <audio controls preload="none">
                    <source src="${audioUrl}" type="audio/mpeg">
                </audio>
            `;
            
            const downloadBtn = createDownloadButton(songId, audioUrl, `./data/${songId}.json`);
            songDiv.appendChild(downloadBtn);
            
            if (songsContainer) songsContainer.appendChild(songDiv);
        });
    } catch (err) {
        console.error("Chyba při načítání detailu období:", err);
        if (songsContainer) {
            songsContainer.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <p>Nebyly nalezeny žádné skladby (soubor <b>./data/${periodId}.json</b> chybí nebo je poškozený).</p>
                </div>
            `;
        }
    }
}
