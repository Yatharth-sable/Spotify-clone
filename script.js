let currentsong = new Audio();
let songs = [];
let currFolder;

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

// get all songs of a folder from info.json
async function getsongs(folder) {
  currFolder = folder;
  let response = await fetch(`/songs/${folder}/info.json`);
  let data = await response.json();
  songs = data.songs;

  let songUL = document.querySelector(".songlist ul");
  songUL.innerHTML = "";

  for (const song of songs) {
    let songname = song.replace(".mp3","")
    songUL.innerHTML += `
      <li data-file="${song}">
        <img class="invert" src="svg/music.svg" alt="">
        <div class="info">
          <div>${songname}</div>
        </div>
        <div class="playnow">
          <span>Play Now</span>
          <img src="svg/playbutton.svg" alt="playbutton">
        </div>
      </li>`;
  }

  // attach click event to each song
  Array.from(document.querySelectorAll(".songlist li")).forEach((e) => {
    e.addEventListener("click", () => {
      playmusic(e.dataset.file);
    });
  });
}

const playmusic = (track, pause = false) => {
  currentsong.src = `./songs/${currFolder}/` + track;
  if (!pause) {
    currentsong.play();
    play.src = "svg/pause.svg";
  }
  const removeMp3 = track.replace(".mp3","")
  document.querySelector(".songinfo").innerHTML = decodeURI(removeMp3);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

// Load albums from albums.json + each folder’s info.json
async function displayAlbums() {
  let response = await fetch("/albums.json");
  let albums = await response.json();

  let cardContainer = document.querySelector(".cardcontainer");
  cardContainer.innerHTML = "";

  for (const album of albums) {
    try {
      let res = await fetch(`/songs/${album.folder}/info.json`);
      let info = await res.json();

      cardContainer.innerHTML += `
        <div data-folder="${album.folder}" class="card">
          <div class="play">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 512 512">
              <circle cx="256" cy="256" r="256" fill="#1db954"/>
              <path d="M200 150v212l160-106z" fill="#000"/>
            </svg>
          </div>
          <img src="./songs/${album.folder}/${info.cover}" alt="">
          <h2>${info.title}</h2>
          <p>${info.description}</p>
        </div>`;
    } catch (err) {
      console.error(`❌ Missing info.json for album: ${album.folder}`, err);
    }
  }

  // attach event listeners after adding cards
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async () => {
      await getsongs(e.dataset.folder);   // ✅ pass only folder name
      playmusic(songs[0]);
    });
  });
}

async function main() {
  // load first album by default
  await getsongs("ncs");   // ✅ only folder name
  playmusic(songs[0], true);

  // play/pause button
  play.addEventListener("click", () => {
    if (currentsong.paused) {
      currentsong.play();
      play.src = "svg/pause.svg";
    } else {
      currentsong.pause();
      play.src = "svg/play.svg";
    }
  });

  document.addEventListener("keydown", function (event) {
  // Prevent page scrolling when spacebar is pressed
  if (event.code === "Space") {
    event.preventDefault();

    if (currentsong.paused) {
      play.src = "svg/pause.svg";
      currentsong.play();
    } else {
      currentsong.pause();
      play.src = "svg/play.svg";
    }
  }
});

  // update time + seekbar
  currentsong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `
      ${secondsToMinutesSeconds(currentsong.currentTime)} /
      ${secondsToMinutesSeconds(currentsong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentsong.currentTime / currentsong.duration) * 100 + "%";
  });

  // seekbar click
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentsong.currentTime = (currentsong.duration * percent) / 100;
  });

  // hamburger menu
  document.querySelector(".hamburger").addEventListener("click", (e) => {
     e.stopPropagation();
    document.querySelector(".left").style.left = "0";
  });


  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Close menu if click outside
  document.addEventListener("click",(e) => {
     const menu = document.querySelector(".left")
     const hamburger = document.querySelector(".hamburger")

     if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
        menu.style.left="-120%"
     }
  })

  // prev button
  previous.addEventListener("click", () => {
      let currentFile = decodeURI(currentsong.src.split("/").pop());
    let index = songs.indexOf(currentFile);
    if (index > 0) {
      playmusic(songs[index - 1]);
    }
  });

  // next button
  next.addEventListener("click", () => {
   let currentFile = decodeURI(currentsong.src.split("/").pop());
    let index = songs.indexOf(currentFile);
    if (index + 1 < songs.length) {
      playmusic(songs[index + 1]);
    }
  });


  // volume control
  document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
    currentsong.volume = parseInt(e.target.value) / 100;
    if (currentsong.volume > 0) {
      document.querySelector(".volume>img").src =
        document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
    }
  });

  // mute button
  document.querySelector(".volume>img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentsong.volume = 0;
      e.target.classList.add("muted");
      document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      e.target.classList.remove("muted");
      currentsong.volume = 1.0;
      document.querySelector(".range").getElementsByTagName("input")[0].value = 20;
    }
  });

  // load albums
  displayAlbums();
}

main();
