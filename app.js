// ==========================================
// MATURITA V UŠÍCH
// HLAVNÍ LOGIKA APLIKACE
// ==========================================

const APP_CACHE = 'maturita-app-shell-v2'; // Zvýšena verze pro jistotu načtení nové logiky
const CONTENT_CACHE = 'maturita-content-v1';


// ==========================================
// 1. SERVICE WORKER
// ==========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register(
                './service-worker.js'
            );
            console.log('Service Worker registrován:', registration.scope);
        } catch (error) {
            console.error('Registrace Service Workeru selhala:', error);
        }
    });
}


// ==========================================
// 2. AKTUALIZACE APLIKACE
// ==========================================

const updateButton = document.getElementById('updateButton');

if (updateButton) {
    updateButton.addEventListener('click', async () => {
        updateButton.disabled = true;
        updateButton.textContent = 'Aktualizuji...';

        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.update();
            }
            window.location.reload();
        } catch (error) {
            console.error('Aktualizace selhala:', error);
            window.location.reload();
        }
    });
}


// ==========================================
// 3. PERSISTENT STORAGE
// ==========================================

async function initPersistentStorage() {
    try {
        if (navigator.storage && navigator.storage.persist) {
            const persisted = await navigator.storage.persisted();
            if (!persisted) {
                const granted = await navigator.storage.persist();
                console.log(granted ? 'Persistent Storage aktivní.' : 'Persistent Storage nebylo povoleno.');
            }
        }
    } catch (error) {
        console.warn('Persistent Storage není dostupné:', error);
    }
}

initPersistentStorage();


// ==========================================
// 4. INDEXED DB
// ==========================================

const DB_NAME = 'MaturitaOfflineDB';
const STORE_NAME = 'song_states';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = event => {
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
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(songId);
        request.onsuccess = () => resolve(request.result === true);
        request.onerror = () => reject(request.error);
    });
}

async function setSongOfflineState(songId, state) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(state, songId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}


// ==========================================
// 5. NAVIGACE
// ==========================================

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


// ==========================================
// ZPĚT
// ==========================================

if (backButton) {
    backButton.addEventListener('click', () => {
        if (historyStack.length <= 1) {
            showScreen('home', 'Maturita v uších');
            return;
        }

        historyStack.pop();
        const previousScreen = historyStack[historyStack.length - 1] || 'home';
        let title = 'Maturita v uších';

        if (previousScreen === 'historie') title = 'Literární kontext';
        if (previousScreen === 'cetba') title = 'Maturitní četba';
        if (previousScreen === 'ustni') title = 'Ústní zkouška';

        // Zastavení všech audii při návratu z detailu
        document.querySelectorAll('audio').forEach(audio => audio.pause());

        showScreen(previousScreen, title);
    });
}


// ==========================================
// 6. HLAVNÍ MENU
// ==========================================

document.querySelectorAll('.menu-card[data-section]').forEach(button => {
    button.addEventListener('click', () => {
        const section = button.dataset.section;
        if (section === 'historie') {
            showScreen('historie', 'Literární kontext');
            loadPeriods();
        }
        if (section === 'cetba') {
            showScreen('cetba', 'Maturitní četba');
        }
        if (section === 'ustni') {
            showScreen('ustni', 'Ústní zkouška');
        }
    });
});


// ==========================================
// 7. POMOCNÉ FUNKCE PRO URL
// ==========================================

function absoluteUrl(path) {
    return new URL(path, window.location.href).href;
}


// ==========================================
// 8. NAČTENÍ OBDOBÍ
// ==========================================

async function loadPeriods() {
    const container = document.getElementById('periodsContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading">Načítám období...</div>';

    try {
        const url = './data/periods.json';
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const periods = await response.json();
        
        if (!Array.isArray(periods)) throw new Error('periods.json není pole.');
        
        renderPeriods(container, periods);
    } catch (error) {
        console.error('Načtení periods.json selhalo:', error);

        // OFFLINE FALLBACK
        try {
            const cached = await caches.match(absoluteUrl('./data/periods.json'));
            if (cached) {
                const periods = await cached.json();
                renderPeriods(container, periods);
                return;
            }
        } catch (cacheError) {
            console.error('Offline cache selhala:', cacheError);
        }

        container.innerHTML = `
            <div class="error">
                <h3>Nepodařilo se načíst období.</h3>
                <p>Soubor periods.json není dostupný ani online, ani offline.</p>
            </div>
        `;
    }
}


// ==========================================
// 9. VYKRESLENÍ OBDOBÍ
// ==========================================

function renderPeriods(container, periods) {
    container.innerHTML = '';
    periods.forEach(period => {
        const id = period.id || period.content || period.slug;
        const title = period.title || period.name || id;

        if (!id) {
            console.error('Období nemá ID:', period);
            return;
        }

        const button = document.createElement('button');
        button.className = 'menu-card';
        button.innerHTML = `
            <div class="menu-icon">L</div>
            <div>
                <h2>${title}</h2>
                <p>Otevřít období</p>
            </div>
            <span class="arrow">›</span>
        `;
        button.addEventListener('click', () => openPeriod(id, title));
        container.appendChild(button);
    });
}


// ==========================================
// 10. OTEVŘENÍ KONKRÉTNÍHO OBDOBÍ
// ==========================================

async function openPeriod(periodId, periodTitle) {
    if (!periodId || periodId === 'undefined' || periodId === 'null') {
        console.error('Neplatné ID období:', periodId);
        return;
    }
    showScreen('period', periodTitle);
    await loadPeriodDetail(periodId, periodTitle);
}


// ==========================================
// 11. NAČTENÍ DETAILU OBDOBÍ
// ==========================================

async function loadPeriodDetail(periodId, periodTitle) {
    const container = document.getElementById('songs');
    const description = document.getElementById('periodDescription');

    if (!container) return;
    container.innerHTML = '<div class="loading">Načítám obsah...</div>';
    if (description) description.innerHTML = '';

    if (!periodId || periodId === 'undefined' || periodId === 'null') {
        container.innerHTML = '<div class="error">Neplatné ID období.</div>';
        return;
    }

    const jsonUrl = `./data/${periodId}.json`;
    console.log('Načítám období:', jsonUrl);

    try {
        const response = await fetch(jsonUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        renderPeriodData(container, data, periodId, periodTitle);
    } catch (error) {
        console.error(`Načtení ${jsonUrl} selhalo:`, error);

        // OFFLINE FALLBACK
        try {
            const cached = await caches.match(absoluteUrl(jsonUrl));
            if (cached) {
                const data = await cached.json();
                renderPeriodData(container, data, periodId, periodTitle);
                return;
            }
        } catch (cacheError) {
            console.error('Offline detail selhal:', cacheError);
        }

        container.innerHTML = `
            <div class="error">
                <h3>Nepodařilo se načíst období.</h3>
                <p>Soubor <strong>${periodId}.json</strong> není dostupný.</p>
            </div>
        `;
    }
}


// ==========================================
// 12. VYKRESLENÍ DAT OBDOBÍ
// ==========================================

function renderPeriodData(container, data, periodId, periodTitle) {
    container.innerHTML = '';

    if (data && Array.isArray(data.lines)) {
        renderSong(container, data, periodId);
        return;
    }

    if (data && Array.isArray(data.songs)) {
        data.songs.forEach((song, index) => {
            const songId = song.id || `${periodId}_${index}`;
            renderSong(container, song, songId);
        });
        return;
    }

    if (Array.isArray(data)) {
        data.forEach((song, index) => {
            const songId = song.id || `${periodId}_${index}`;
            renderSong(container, song, songId);
        });
        return;
    }

    container.innerHTML = `
        <div class="error">
            <h3>Neznámý formát dat.</h3>
            <p>${periodId}.json neobsahuje očekávaná data.</p>
        </div>
    `;
}


// ==========================================
// 13. VYKRESLENÍ SKLADBY (Upraveno pro Spotify Karaoke)
// ==========================================

function renderSong(container, songData, uniqueId) {
    const card = document.createElement('div');
    card.className = 'song-card';

    const audioUrl = songData.audio || songData.audioSrc || `./audio/${uniqueId.split('_')[0]}.mp3`;
    const title = songData.title || songData.name || 'Skladba';

    let lyricsHTML = '<p>Text není k dispozici.</p>';
    if (Array.isArray(songData.lines)) {
        lyricsHTML = songData.lines.map((line, index) => {
            const start = Number(line.start ?? line.time ?? 0);
            const end = Number(line.end ?? (start + 5));

            return `
                <div 
                    class="lyric-line" 
                    data-index="${index}" 
                    data-start="${start}" 
                    data-end="${end}"
                >
                    ${escapeHTML(line.text || '')}
                </div>
            `;
        }).join('');
    }

    // Všimněte si třídy "spotify-lyrics-box", která je nezbytná pro CSS níže!
    card.innerHTML = `
        <div class="cover">
            <span>ČESKÝ JAZYK</span>
            <strong>${escapeHTML(title.toUpperCase())}</strong>
        </div>
        <h2>${escapeHTML(title)}</h2>

        <audio id="audio_${uniqueId}" controls preload="metadata">
            <source src="${audioUrl}" type="audio/mpeg">
            Tvůj prohlížeč nepodporuje audio.
        </audio>

        <button id="btn_${uniqueId}" class="download-button" type="button">Načítám stav...</button>

        <div class="lyrics-container">
            <h3>Text</h3>
            <div class="lyrics-content spotify-lyrics-box" id="lyrics_${uniqueId}">
                ${lyricsHTML}
            </div>
        </div>
    `;

    container.appendChild(card);
    setupOfflineButton(uniqueId, audioUrl, `./data/${uniqueId.split('_')[0]}.json`);
    setupLyricsSync(uniqueId);
}


// ==========================================
// 14. OCHRANA HTML
// ==========================================

function escapeHTML(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


// ==========================================
// 15. SYNCHRONIZACE TEXTU (Spotify Style Okno)
// ==========================================

function setupLyricsSync(uniqueId) {
    const audio = document.getElementById(`audio_${uniqueId}`);
    const lyricsContainer = document.getElementById(`lyrics_${uniqueId}`);

    if (!audio || !lyricsContainer) return;

    const lines = Array.from(lyricsContainer.querySelectorAll('.lyric-line'));
    if (!lines.length) return;

    // 1. KLIKNUTÍ NA ŘÁDEK PŘETOČÍ AUDIO
    lines.forEach((line) => {
        line.addEventListener('click', () => {
            const start = Number(line.dataset.start);
            if (!isNaN(start)) {
                audio.currentTime = start;
                audio.play().catch(() => {});
            }
        });
    });

    let activeIndex = -1;

    // 2. LOGIKA SLEDOVÁNÍ ČASU A SKROLOVÁNÍ
    audio.addEventListener('timeupdate', () => {
        const currentTime = audio.currentTime;
        let newIndex = -1;

        // Najdeme aktivní řádek podle času
        lines.forEach((line, index) => {
            const start = Number(line.dataset.start);
            const end = Number(line.dataset.end);
            if (currentTime >= start && currentTime < end) {
                newIndex = index;
            }
        });

        // Pokud se řádek nezměnil, neděláme nic
        if (newIndex === activeIndex) return;
        activeIndex = newIndex;

        // Změna třídy 'active'
        lines.forEach((line, index) => {
            line.classList.toggle('active', index === activeIndex);
        });

        // VÝPOČET PRO PLYNULÉ SKROLOVÁNÍ POUZE UVNITŘ OKNA
        if (activeIndex >= 0) {
            const activeLine = lines[activeIndex];
            
            // Střed okna a střed řádku
            const containerHalfHeight = lyricsContainer.clientHeight / 2;
            const lineHalfHeight = activeLine.clientHeight / 2;
            
            // Výpočet pozice: Vzdálenost řádku od vrchu boxu - polovina boxu + polovina řádku
            const scrollTo = activeLine.offsetTop - containerHalfHeight + lineHalfHeight;

            // Zascrolluje POUZE kontejnerem s textem, zbytek stránky zůstane na místě
            lyricsContainer.scrollTo({
                top: scrollTo,
                behavior: 'smooth'
            });
        }
    });
}


// ==========================================
// 16. OFFLINE TLAČÍTKO
// ==========================================

async function setupOfflineButton(uniqueId, audioUrl, jsonUrl) {
    const button = document.getElementById(`btn_${uniqueId}`);
    if (!button) return;

    const audioAbsolute = absoluteUrl(audioUrl);
    const jsonAbsolute = absoluteUrl(jsonUrl);

    async function updateButton() {
        try {
            const offline = await isSongOffline(uniqueId);
            if (offline) {
                button.textContent = '✓ Odebrat z offline';
                button.classList.add('downloaded');
            } else {
                button.textContent = 'Stáhnout offline';
                button.classList.remove('downloaded');
            }
            button.disabled = false;
        } catch (error) {
            console.error('Stav offline:', error);
            button.textContent = 'Stáhnout offline';
            button.disabled = false;
        }
    }

    await updateButton();

    button.addEventListener('click', async () => {
        button.disabled = true;

        try {
            const cache = await caches.open(CONTENT_CACHE);
            const offline = await isSongOffline(uniqueId);

            if (offline) {
                button.textContent = 'Odebírám...';
                await cache.delete(audioAbsolute);
                await cache.delete(jsonAbsolute);
                await setSongOfflineState(uniqueId, false);
                await updateButton();
                return;
            }

            button.textContent = 'Stahuji...';
            const audioResponse = await fetch(audioAbsolute);
            if (!audioResponse.ok) throw new Error(`Audio HTTP ${audioResponse.status}`);
            const jsonResponse = await fetch(jsonAbsolute);
            if (!jsonResponse.ok) throw new Error(`JSON HTTP ${jsonResponse.status}`);

            await cache.put(audioAbsolute, audioResponse.clone());
            await cache.put(jsonAbsolute, jsonResponse.clone());

            try {
                const periodsUrl = absoluteUrl('./data/periods.json');
                const periodsResponse = await fetch(periodsUrl);
                if (periodsResponse.ok) {
                    await cache.put(periodsUrl, periodsResponse.clone());
                }
            } catch (error) {
                console.warn('periods.json se nepodařilo uložit:', error);
            }

            await setSongOfflineState(uniqueId, true);
            button.textContent = '✓ Staženo';
            setTimeout(updateButton, 1000);

        } catch (error) {
            console.error('Offline download error:', error);
            button.textContent = 'Chyba stahování';
            setTimeout(updateButton, 2000);
        }
    });
}
