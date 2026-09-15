const songsContainer = document.getElementById("songs");

async function loadSongs() {
    try {
        const response = await fetch("./data/songs.json");

        if (!response.ok) {
            throw new Error("songs.json se nepodařilo načíst.");
        }

        const songs = await response.json();

        renderSongs(songs);

    } catch (error) {
        console.error(error);

        songsContainer.innerHTML =
            "<p>Nepodařilo se načíst skladby.</p>";
    }
}


function renderSongs(songs) {

    songsContainer.innerHTML = "";

    songs.forEach(song => {

        const card = document.createElement("div");

        card.className = "song-card";

        card.innerHTML = `
            <div class="cover">
                <span>ČESKÝ JAZYK</span>
                <strong>${song.title.toUpperCase()}</strong>
            </div>

            <h3>${song.title}</h3>

            <p class="description">
                ${song.description}
            </p>

            <audio
                class="audio"
                controls
                preload="metadata">

                <source
                    src="./${song.audio}"
                    type="audio/mpeg">

            </audio>

            <div class="progress-wrapper">

                <div class="progress">
                    <div class="progress-bar"></div>
                </div>

                <div class="time">
                    <span class="current-time">0:00</span>
                    <span class="duration">0:00</span>
                </div>

            </div>

            <button class="text-button">
                Zobrazit text
            </button>

            <div class="lyrics-container hidden">

                <div class="lyrics">
                    Načítám text...
                </div>

            </div>
        `;

        songsContainer.appendChild(card);

        setupSong(card, song);
    });
}


async function setupSong(card, song) {

    const audio =
        card.querySelector(".audio");

    const textButton =
        card.querySelector(".text-button");

    const lyricsContainer =
        card.querySelector(".lyrics-container");

    const lyrics =
        card.querySelector(".lyrics");

    const progress =
        card.querySelector(".progress");

    const progressBar =
        card.querySelector(".progress-bar");

    const currentTime =
        card.querySelector(".current-time");

    const duration =
        card.querySelector(".duration");

    let lines = [];
    let active = -1;


    try {

        const response =
            await fetch("./" + song.lyrics);

        if (!response.ok) {
            throw new Error("Text se nepodařilo načíst.");
        }

        const data =
            await response.json();

        lines = data.lines;

        lyrics.innerHTML = "";

        lines.forEach((line, index) => {

            const element =
                document.createElement("div");

            element.className =
                "lyric-line";

            element.dataset.index =
                index;

            element.dataset.start =
                line.start;

            element.dataset.end =
                line.end;

            element.textContent =
                line.text;

            lyrics.appendChild(element);
        });

    } catch (error) {

        console.error(error);

        lyrics.innerHTML =
            "Text se nepodařilo načíst.";
    }


    textButton.addEventListener("click", () => {

        const hidden =
            lyricsContainer.classList.contains("hidden");

        if (hidden) {

            lyricsContainer.classList.remove("hidden");

            textButton.textContent =
                "Skrýt text";

        } else {

            lyricsContainer.classList.add("hidden");

            textButton.textContent =
                "Zobrazit text";
        }
    });


    audio.addEventListener("loadedmetadata", () => {

        duration.textContent =
            formatTime(audio.duration);
    });


    audio.addEventListener("timeupdate", () => {

        const time =
            audio.currentTime;

        currentTime.textContent =
            formatTime(time);


        if (audio.duration) {

            const percentage =
                (time / audio.duration) * 100;

            progressBar.style.width =
                percentage + "%";
        }


        let newActive = -1;


        for (let i = 0; i < lines.length; i++) {

            if (
                time >= Number(lines[i].start) &&
                time < Number(lines[i].end)
            ) {

                newActive = i;

                break;
            }
        }


        if (newActive !== active) {

            active = newActive;

            const allLines =
                lyrics.querySelectorAll(".lyric-line");

            allLines.forEach(line => {
                line.classList.remove("active");
            });


            if (active >= 0) {

                const activeElement =
                    allLines[active];

                if (activeElement) {

                    activeElement.classList.add("active");

                    activeElement.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }
            }
        }
    });


    progress.addEventListener("click", event => {

        if (!audio.duration) {
            return;
        }

        const rect =
            progress.getBoundingClientRect();

        const percentage =
            (event.clientX - rect.left) /
            rect.width;

        audio.currentTime =
            percentage * audio.duration;
    });


    audio.addEventListener("error", () => {

        console.error(
            "CHYBA AUDIA:",
            audio.error
        );
    });
}


function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    const minutes =
        Math.floor(seconds / 60);

    const secs =
        Math.floor(seconds % 60)
            .toString()
            .padStart(2, "0");

    return `${minutes}:${secs}`;
}


loadSongs();
