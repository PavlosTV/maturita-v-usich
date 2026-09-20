// ==========================================
// MATURITA V UŠÍCH - HLAVNÍ LOGIKA
// ==========================================

// --- 1. REGISTRACE SERVICE WORKERU ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker registrován pro scope:', reg.scope))
            .catch(err => console.error('Registrace SW selhala:', err));
    });
}

// Aktulizace (tlačítko)
const updateBtn = document.getElementById('updateButton');
if (updateBtn) {
    updateBtn.addEventListener('click', () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    reg.update().then(() => {
                        window.location.reload();
                    });
                } else {
                    window.location.reload();
                }
            });
        }
    });
}

// --- 2. OCHRANA DAT (PERSISTENT STORAGE) ---
async function initPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
            const granted = await navigator.storage.persist();
            console.log(granted ? "Trvalé úložiště AKTIVNÍ." : "Trvalé úložiště ZAMÍTNUTO.");
        }
    }
}
initPersistentStorage();

// --- 3. DATABÁZE (INDEXED-DB) PRO STAV TLAČÍTEK ---
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

// --- 4. NAVIGACE A UI ---
const screens = {
    home: document.getElementById('homeScreen'),
    historie: document.getElementById('historieScreen'),
    period: document.getElementById('periodScreen'),
    cetba: document.getElementById('cetbaScreen'),
    ustni: document.getElementById('ustniScreen')
};
const pageTitle = document.getElementById('pageTitle');
const backButton = document.getElementById('backButton');
let historyStack = ['home'];

function showScreen(screenId, title) {
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.add('hidden');
    });
    
    if (screens[screenId]) {
        screens[screenId].classList.remove('hidden');
    }
    if (pageTitle && title) {
        pageTitle.textContent = title;
    }
    
    if (screenId === 'home') {
        backButton.classList.add('hidden');
        historyStack = ['home'];
    } else {
        backButton.classList.remove('hidden');
        if (historyStack[historyStack.length - 1] !== screenId) {
            historyStack.push(screenId);
        }
    }
    window.scrollTo(0, 0);
}

backButton.addEventListener('click', () => {
    historyStack.pop(); 
    const previousScreen = historyStack.pop() || 'home';
    
    let title = "Maturita v uších";
    if (previousScreen === 'historie') title = "Literární kontext";
    else if (previousScreen === 'cetba') title = "Maturitní četba";
    else if (previousScreen === 'ustni') title = "Ústní zkouška";
    
    showScreen(previousScreen, title);
});

// Hlavní menu
document.querySelectorAll('.menu-card[data-section]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const section = btn.getAttribute('data-section');
        if (section === 'historie') {
            showScreen('historie', "Literární kontext");
            loadPeriods();
        } else if (section === 'cetba') {
            showScreen('cetba', "Maturitní četba");
        } else if (section === 'ustni') {
            showScreen('ustni', "Ústní zkouška");
        }
    });
});

// --- 5. NAČÍTÁNÍ DAT A GENEROVÁNÍ OBSAHU ---
async function loadPeriods() {
    const container = document.getElementById('periodsContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Načítám období...</div>';
    
    try {
        const response = await fetch('./data/periods.json', { cache: 'no-store' });
        if (!response.ok) throw new Error("Chyba sítě");
        const periods = await response.json();
        
        container.innerHTML = '';
        periods.forEach(period => {
            const btn = document.createElement('button');
            btn.className = 'menu-card';
            btn.innerHTML = `
                <div class="menu-icon">L</div>
                <div>
                    <h2>${period.title}</h2>
                    <p>Otevřít období</p>
                </div>
                <span class="arrow">›</span>
            `;
            btn.addEventListener('click', () => {
                showScreen('period', period.title);
                loadPeriodDetail(period.id);
            });
            container.appendChild(btn);
        });
    } catch (err) {
        container.innerHTML = '<div class="error">Nepodařilo se načíst období. Jsi online?</div>';
    }
}

async function loadPeriodDetail(periodId) {
    const container = document.getElementById('songs');
    const descContainer = document.getElementById('periodDescription');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Načítám skladby...</div>';
    descContainer.innerHTML = '';
    
    try {
        const response = await fetch(`./data/${periodId}.json`, { cache: 'no-store' });
        if (!response.ok) throw new Error("Chyba sítě");
        const data = await response.json();
        
        container.innerHTML = '';
        
        // Chytrý parser: Pokud je v datech rovnou klíč 'lines', jde o jedinou skladbu (Středověk)
        if (data.lines) {
             renderSong(container, data, periodId);
        } 
        // Pokud je v datech pole skladeb (např. { songs: [...] })
        else if (data.songs && Array.isArray(data.songs)) {
             data.songs.forEach((song, index) => {
                 renderSong(container, song, `${periodId}_${index}`);
             });
        }
        // Pokud je JSON strukturovaný jako kategorie
        else if (Array.isArray(data)) {
            data.forEach((song, index) => {
                renderSong(container, song, `${periodId}_${index}`);
            });
        } else {
             container.innerHTML = '<div class="error">Neznámý formát dat.</div>';
        }
        
    } catch (err) {
        container.innerHTML = '<div class="error">Nepodařilo se načíst detail. Jsi online?</div>';
    }
}

function renderSong(container, songData, uniqueId) {
    const card = document.createElement('div');
    card.className = 'song-card';
    
    const audioUrl = songData.audio || `./audio/${uniqueId.split('_')[0]}.mp3`;
    const title = songData.title || songData.name || "Skladba";
    
    card.innerHTML = `
        <div class="cover">
            <span>ČESKÝ JAZYK</span>
            <strong>${title.toUpperCase()}</strong>
        </div>
        <h2>${title}</h2>
        <audio id="audio_${uniqueId}" controls preload="metadata">
            <source src="${audioUrl}" type="audio/mpeg">
        </audio>
        <button id="btn_${uniqueId}" class="download-button" type="button">
            Načítám stav...
        </button>
        <div class="lyrics-container">
            <h3>Text</h3>
            <div class="lyrics-content">
                ${generateLyricsHTML(songData.lines)}
            </div>
        </div>
    `;
    
    container.appendChild(card);
    setupOfflineButton(uniqueId, audioUrl, `./data/${uniqueId.split('_')[0]}.json`);
}

function generateLyricsHTML(lines) {
    if (!lines || !Array.isArray(lines)) return "<p>Text není k dispozici.</p>";
    return lines.map(line => `<p data-time="${line.time}">${line.text}</p>`).join('');
}

// --- 6. OFFLINE LOGIKA PRO TLAČÍTKA ---
async function setupOfflineButton(uniqueId, audioUrl, jsonUrl) {
    const btn = document.getElementById(`btn_${uniqueId}`);
    if (!btn) return;

    const CONTENT_CACHE = 'maturita-content-v1';

    // Aktualizace UI podle IndexedDB
    async function updateUI() {
        const isOffline = await isSongOffline(uniqueId);
        if (isOffline) {
            btn.textContent = "Odebrat z offline";
            btn.classList.add('downloaded');
        } else {
            btn.textContent = "Stáhnout offline";
            btn.classList.remove('downloaded');
        }
        btn.disabled = false;
    }

    await updateUI();

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const cache = await caches.open(CONTENT_CACHE);
            const isOffline = await isSongOffline(uniqueId);

            if (isOffline) {
                btn.textContent = "Odebírám...";
                await cache.delete(audioUrl);
                await cache.delete(jsonUrl);
                await setSongOfflineState(uniqueId, false);
                await updateUI();
            } else {
                btn.textContent = "Stahuji...";
                const [audioRes, jsonRes] = await Promise.all([
                    fetch(audioUrl, { cache: 'no-store' }),
                    fetch(jsonUrl, { cache: 'no-store' })
                ]);

                if (!audioRes.ok || !jsonRes.ok) throw new Error("Chyba stahování");

                await cache.put(audioUrl, audioRes);
                await cache.put(jsonUrl, jsonRes);
                await setSongOfflineState(uniqueId, true);
                
                btn.textContent = "✓ Staženo";
                setTimeout(updateUI, 1000);
            }
        } catch (err) {
            console.error(err);
            btn.textContent = "Chyba stahování";
            setTimeout(updateUI, 2000);
        }
    });
}
