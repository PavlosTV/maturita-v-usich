const songs = [];

async function loadSongs() {

    const response =
        await fetch("./data/songs.json");

    const data =
        await response.json();

    songs.push(...data);

    console.log("Načtené skladby:", songs);
}

loadSongs();
