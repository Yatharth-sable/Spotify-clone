console.log("Hello world");

let currentsong = new Audio();
let songs;
let currFolder;


function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}


// ✅ get all songs of a folder
async function getsongs(folder) {
  currFolder = folder;
  let response = await fetch(`/${folder}/`);
  let text = await response.text();
  let div = document.createElement("div");
  div.innerHTML = text;

  let anchors = div.getElementsByTagName("a");
  songs = [];

  for (let index = 0; index < anchors.length; index++) {
    const element = anchors[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(element.href.split(`/${folder}/`)[1]);
    }
  }

  let songUL = document.querySelector(".songlist ul");
  songUL.innerHTML = "";

  for (const song of songs) {
    songUL.innerHTML += `
      <li>
        <img class="invert" src="svg/music.svg" alt="">
        <div class="info">
          <div>${song.replaceAll("%20", " ")}</div>
          <div>Unknown Artist</div>
        </div>
        <div class="playnow">
          <span>Play Now</span>
          <img  src="svg/playbutton.svg" alt="playbutton">
        </div>
      </li>`;
  }

  // attach click event to each song
  Array.from(document.querySelectorAll(".songlist li")).forEach((e) => {
    e.addEventListener("click", () => {
      playmusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
    });
  });
}

const playmusic = (track, pause = false) => {
  currentsong.src = `./${currFolder}/` + track;
  if (!pause) {
    currentsong.play();
    play.src = "svg/pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
  let response = await fetch(`/songs/`);
  let text = await response.text();
  let div = document.createElement("div");
  div.innerHTML = text;
  let anchors = div.getElementsByTagName("a");

  let cardContainer = document.querySelector(".cardcontainer");
  cardContainer.innerHTML = "";

  for (let index = 0; index < anchors.length; index++) {
    const e = anchors[index];

    // ✅ skip the root "/songs/" link
    if (e.href.includes("/songs/") && !e.href.endsWith("/songs/")) {
      const parts = e.href.split("/").filter(Boolean);
      const folder = parts[parts.length - 1];
      console.log("this is folder", folder)

      try {
        let a = await fetch(`/songs/${folder}/info.json`);
        let response = await a.json();

        cardContainer.innerHTML += `
          <div data-folder="${folder}" class="card">
            <div class="play">
           <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 512 512">
            <!-- Green Circle -->
            <circle cx="256" cy="256" r="256" fill="#1db954"/>
            <!-- Play Icon -->
            <path d="M200 150v212l160-106z" fill="#000"/>
          </svg>

            </div>
            <img src="./songs/${folder}/cover.jpg" alt="">
            <h2>${response.title}</h2>
            <p>${response.description}</p>
          </div>`;
      } catch (err) {
        console.error(`❌ Missing info.json in /songs/${folder}/`, err);
      }
    }
  }

  // attach event listeners after adding cards
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async () => {
      await getsongs(`songs/${e.dataset.folder}`);
      playmusic(songs[0]);
    });
  });
}
console.log('hell thjgjgjgjg');

async function main() {
  await getsongs("songs/ncs");
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
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // prev button
  previous.addEventListener("click", () => {
    let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
    if (index > 0) {
      playmusic(songs[index - 1]);
    }
  });

  // next button
  next.addEventListener("click", () => {
    let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) {
      playmusic(songs[index + 1]);
    }
  });

 // Add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value, "/ 100")
        currentsong.volume = parseInt(e.target.value) / 100
        if (currentsong.volume >0){
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
        }
    })
    
  // Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e=>{ 
        if(e.target.src.includes("volume.svg")){
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
            currentsong.volume = 0;
              e.target.classList.add("muted"); 
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else{
            e.target.src = e.target.src.replace("mute.svg", "volume.svg")
              e.target.classList.remove("muted"); 
            currentsong.volume = 100;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 20;
        }

    })


  // load albums
  displayAlbums();
}

main();
