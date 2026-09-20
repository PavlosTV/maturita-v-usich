// ==========================================
// MATURITA V UŠÍCH - HLAVNÍ LOGIKA
// ==========================================

// --- 1. REGISTRACE A AKTUALIZACE SERVICE WORKERU ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('SW registrován:', reg.scope))
            .catch(err => console.error('Chyba SW:', err));
    });
}

const updateBtn = document.getElementById('updateButton');
if (updateBtn) {
    updateBtn.addEventListener('click', () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    reg.update().then(() => window.location.reload());
                } else {
                    window.location.reload();
                }
            });
        } else {
            window.location.reload();
        }
    });
}

// --- 2. OCHRANA DAT (PERSISTENT STORAGE) ---
async function initPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
            await navigator.storage.persist();
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
    
    if (screens[screenId]) screens[screenId].classList.remove('hidden');
    if (pageTitle && title) pageTitle.textContent = title;
    
    if (screenId === 'home') {
        if (backButton) backButton.classList.add('hidden');
        historyStack = ['home'];
    } else {
        if (backButton) backButton.classList.remove('hidden');
        if (historyStack[historyStack.length - 1] !== screenId) {
            historyStack.push(screenId);
        }
    }
    window.scrollTo(0, 0);
}

if (backButton) {
    backButton.addEventListener('click', () => {
        historyStack.pop(); 
        const previousScreen = historyStack.pop() || 'home';
        
        let title = "Maturita v uších";
        if (previousScreen === 'historie') title = "Literární kontext";
        else if (previousScreen === 'cetba') title = "Maturitní četba";
        else if (previousScreen === 'ustni') title = "Ústní zkouška";
        
        showScreen(previousScreen, title);
    });
}

document.querySelectorAll('.menu-card[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
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
            // Robustní získání názvu a ID nezávisle na formátu dat
            const title = period.title || period.name || "Neznámé období";
            const id = period.id || period.content || "stredovek";

            const btn = document.createElement('button');
            btn.className = 'menu-card';
            btn.innerHTML = `
                <div class="menu-icon">L</div>
                <div>
                    <h2>${title}</h2>
                    <p>Otevřít období</p>
                </div>
                <span class="arrow">›</span>
            `;
            btn.addEventListener('click', () => {
                showScreen('period', title);
                loadPeriodDetail(id);
            });
            container.appendChild(btn);
        });
    } catch (err) {
        container.innerHTML = '<div class="error">Nepodařilo se načíst období. Zkontroluj data/periods.json.</div>';
    }
}

async function loadPeriodDetail(periodId) {
    const container = document.getElementById('songs');
    const descContainer = document.getElementById('periodDescription');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Načítám skladby...</div>';
    if (descContainer) descContainer.innerHTML = '';
    
    try {
        const response = await fetch(`./data/${periodId}.json`, { cache: 'no-store' });
        if (!response.ok) throw new Error("Chyba sítě");
        const data = await response.json();
        
        container.innerHTML = '';
        
        if (data.lines) {
             renderSong(container, data, periodId);
        } 
        else if (data.songs && Array.isArray(data.songs)) {
             data.songs.forEach((song, index) => renderSong(container, song, `${periodId}_${index}`));
        }
        else if (Array.isArray(data)) {
            data.forEach((song, index) => renderSong(container, song, `${periodId}_${index}`));
        } else {
             container.innerHTML = '<div class="error">Neznámý formát dat.</div>';
        }
    } catch (err) {
        container.innerHTML = `<div class="error">Nepodařilo se načíst ${periodId}.json.</div>`;
    }
}

function renderSong(container, songData, uniqueId) {
    const card = document.createElement('div');
    card.className = 'song-card';
    
    // Záchyt pro audio - pokud v JSONu není, odvodí se z názvu souboru (např. stredovek.mp3)
    const audioUrl = songData.audio || songData.audioSrc || `./audio/${uniqueId.split('_')[0]}.mp3`;
    const title = songData.title || songData.name || "Skladba";
    
    // Generování textů s datovými atributy pro synchronizaci
    let lyricsHTML = "<p>Text není k dispozici.</p>";
    if (songData.lines && Array.isArray(songData.lines)) {
        lyricsHTML = songData.lines.map(line => 
            `<p class="lyric-line" data-start="${line.start || 0}" data-end="${line.end || 0}">${line.text}</p>`
        ).join('');
    }
    
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
            <div class="lyrics-content" id="lyrics_${uniqueId}">
                ${lyricsHTML}
            </div>
        </div>
    `;
    
    container.appendChild(card);
    setupOfflineButton(uniqueId, audioUrl, `./data/${uniqueId.split('_')[0]}.json`);
    setupLyricsSync(uniqueId);
}

// --- 6. SYNCHRONIZACE TEXTU (KARAOKE) ---
function setupLyricsSync(uniqueId) {
    const audio = document.getElementById(`audio_${uniqueId}`);
    const lyricsContainer = document.getElementById(`lyrics_${uniqueId}`);
    
    if (!audio || !lyricsContainer) return;
    const lines = Array.from(lyricsContainer.querySelectorAll('.lyric-line'));
    if (lines.length === 0) return;

    audio.addEventListener('timeupdate', () => {
        const currentTime = audio.currentTime;
        
        lines.forEach(line => {
            const start = parseFloat(line.getAttribute('data-start'));
            const end = parseFloat(line.getAttribute('data-end'));
            
            // Zvýraznění aktivní řádky
            if (currentTime >= start && currentTime < end) {
                line.style.color = '#bb86fc';
                line.style.fontWeight = 'bold';
                line.style.transform = 'scale(1.02)';
            } else {
                line.style.color = '';
                line.style.fontWeight = 'normal';
                line.style.transform = 'scale(1)';
            }
            line.style.transition = 'all 0.2s ease';
        });
    });
}

// --- 7. OFFLINE LOGIKA PRO TLAČÍTKA ---
async function setupOfflineButton(uniqueId, audioUrl, jsonUrl) {
    const btn = document.getElementById(`btn_${uniqueId}`);
    if (!btn) return;

    const CONTENT_CACHE = 'maturita-content-v1';

    async function updateUI() {
        const isOffline = await isSongOffline(uniqueId);
        if (isOffline) {
            btn.textContent = "✓ Odebrat z offline";
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
            btn.textContent = "Chyba sítě/souboru";
            setTimeout(updateUI, 2000);
        }
    });
}
