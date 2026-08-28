/* ============================================
   YOUTUBE MUSIC CONFIGURATION
============================================ */

const YOUTUBE_VIDEO_ID = "__Pb1fO2H2A";

const MUSIC_VOLUME = 25;


/* ============================================
   STORAGE KEYS
============================================ */

const MUSIC_STORAGE = {
  playing: "musicPlaying",
  time: "musicTime",
  initialized: "musicInitialized"
};


/* ============================================
   PLAYER VARIABLES
============================================ */

let player = null;

let isPlayerReady = false;

let isPlaying = false;

let autoplayAttempted = false;

let musicTitle = "Loading music...";

let musicTitleTimeout = null;


/* ============================================
   GET MUSIC ELEMENTS
============================================ */

function getMusicButton() {
  return document.getElementById("musicButton");
}


function getMusicIcon() {
  return document.getElementById("musicIcon");
}


function getMusicTitle() {
  return document.getElementById("musicTitle");
}


/* ============================================
   SHOW MUSIC TITLE
============================================ */

function showMusicTitle() {

  const button = getMusicButton();

  if (!button) {
    return;
  }

  button.classList.add("music-expanded");

  clearTimeout(musicTitleTimeout);

  musicTitleTimeout = setTimeout(function () {

    button.classList.remove("music-expanded");

  }, 2000);

}


/* ============================================
   UPDATE MUSIC TITLE
============================================ */

function updateMusicTitle(title) {

  const titleElement = getMusicTitle();

  if (!titleElement) {
    return;
  }

  if (
    title &&
    typeof title === "string"
  ) {

    const cleanTitle = title.trim();

    if (cleanTitle) {
      musicTitle = cleanTitle;
    }

  }

  titleElement.textContent = musicTitle;

}


/* ============================================
   LOAD YOUTUBE VIDEO TITLE
============================================ */

async function loadMusicTitle() {

  const url =
    "https://www.youtube.com/oembed" +
    "?url=https://www.youtube.com/watch?v=" +
    encodeURIComponent(YOUTUBE_VIDEO_ID) +
    "&format=json";

  try {

    const response = await fetch(url);

    if (!response.ok) {

      throw new Error(
        "YouTube metadata unavailable."
      );

    }

    const data =
      await response.json();

    if (
      data &&
      data.title
    ) {

      updateMusicTitle(
        data.title
      );

      console.log(
        "Music title:",
        data.title
      );

    }

  } catch (error) {

    console.warn(
      "Tidak dapat mengambil judul musik:",
      error
    );

    updateMusicTitle(
      "Our Little Moments"
    );

  }

}


/* ============================================
   UPDATE MUSIC BUTTON
============================================ */

function updateMusicButton() {

  const button =
    getMusicButton();

  const icon =
    getMusicIcon();

  if (
    !button ||
    !icon
  ) {

    return;

  }


  /*
     PLAYING
  */

  if (isPlaying) {

    icon.textContent = "❚❚";

    button.setAttribute(
      "aria-label",
      "Pause music"
    );

    button.setAttribute(
      "title",
      musicTitle
    );

    button.classList.add(
      "music-playing"
    );

  }


  /*
     PAUSED
  */

  else {

    icon.textContent = "♫";

    button.setAttribute(
      "aria-label",
      "Play music"
    );

    button.setAttribute(
      "title",
      musicTitle
    );

    button.classList.remove(
      "music-playing"
    );

  }

}


/* ============================================
   CREATE MUSIC BUTTON
============================================ */

function createMusicButton() {

  let button =
    getMusicButton();


  /*
     Jika tombol belum tersedia
     di HTML, buat otomatis.
  */

  if (!button) {

    button =
      document.createElement(
        "button"
      );

    button.id =
      "musicButton";

    button.className =
      "music-button";

    button.type =
      "button";

    button.setAttribute(
      "aria-label",
      "Play music"
    );

    button.setAttribute(
      "title",
      "Play music"
    );

    button.innerHTML = `
      <span
        id="musicIcon"
        class="music-icon"
      >♫</span>

      <span
        id="musicTitle"
        class="music-title"
      >Loading music...</span>
    `;

    document.body.appendChild(
      button
    );

  }


  /*
     Pastikan class utama tersedia.
  */

  button.classList.add(
    "music-button"
  );


  /*
     Pastikan icon tersedia.
  */

  if (!getMusicIcon()) {

    const icon =
      document.createElement(
        "span"
      );

    icon.id =
      "musicIcon";

    icon.className =
      "music-icon";

    icon.textContent =
      "♫";

    button.prepend(
      icon
    );

  }


  /*
     Pastikan title tersedia.
  */

  if (!getMusicTitle()) {

    const title =
      document.createElement(
        "span"
      );

    title.id =
      "musicTitle";

    title.className =
      "music-title";

    title.textContent =
      musicTitle;

    button.appendChild(
      title
    );

  }


  /*
     Hindari listener dipasang dua kali.
  */

  if (
    button.dataset.musicInitialized ===
    "true"
  ) {

    updateMusicButton();

    return;

  }


  button.dataset.musicInitialized =
    "true";


  /*
     CLICK MUSIC BUTTON
  */

  button.addEventListener(
    "click",
    function () {

      if (
        !isPlayerReady ||
        !player
      ) {

        console.warn(
          "YouTube Player belum siap."
        );

        return;

      }


      /*
         PLAY
      */

      if (!isPlaying) {

        try {

          player.playVideo();

          sessionStorage.setItem(
            MUSIC_STORAGE.playing,
            "true"
          );

          sessionStorage.setItem(
            MUSIC_STORAGE.initialized,
            "true"
          );

          showMusicTitle();

        } catch (error) {

          console.error(
            "Gagal menjalankan musik:",
            error
          );

        }

      }


      /*
         PAUSE
      */

      else {

        try {

          player.pauseVideo();

        } catch (error) {

          console.error(
            "Gagal pause musik:",
            error
          );

        }

      }

    }
  );


  updateMusicButton();

}


/* ============================================
   CREATE HIDDEN YOUTUBE PLAYER
============================================ */

function createYouTubeContainer() {

  let container =
    document.getElementById(
      "youtubePlayer"
    );


  /*
     Jika sudah tersedia di HTML,
     cukup pastikan styling-nya benar.
  */

  if (container) {

    container.style.position =
      "fixed";

    container.style.width =
      "1px";

    container.style.height =
      "1px";

    container.style.left =
      "-9999px";

    container.style.top =
      "-9999px";

    container.style.opacity =
      "0";

    container.style.pointerEvents =
      "none";

    container.style.overflow =
      "hidden";

    return;

  }


  /*
     Jika belum tersedia,
     buat otomatis.
  */

  container =
    document.createElement(
      "div"
    );

  container.id =
    "youtubePlayer";

  container.style.position =
    "fixed";

  container.style.width =
    "1px";

  container.style.height =
    "1px";

  container.style.left =
    "-9999px";

  container.style.top =
    "-9999px";

  container.style.opacity =
    "0";

  container.style.pointerEvents =
    "none";

  container.style.overflow =
    "hidden";


  document.body.appendChild(
    container
  );

}


/* ============================================
   YOUTUBE API READY
============================================ */

window.onYouTubeIframeAPIReady =
  function () {

    console.log(
      "YouTube API READY"
    );

    createYouTubePlayer();

  };


/* ============================================
   CREATE YOUTUBE PLAYER
============================================ */

function createYouTubePlayer() {

  if (
    typeof YT === "undefined" ||
    typeof YT.Player === "undefined"
  ) {

    console.warn(
      "YouTube API belum tersedia."
    );

    return;

  }


  /*
     Jangan membuat player kedua.
  */

  if (player) {

    return;

  }


  const container =
    document.getElementById(
      "youtubePlayer"
    );


  if (!container) {

    console.error(
      "Element #youtubePlayer tidak ditemukan."
    );

    return;

  }


  player =
    new YT.Player(
      "youtubePlayer",
      {

        width: "1",

        height: "1",

        videoId:
          YOUTUBE_VIDEO_ID,

        playerVars: {

          autoplay: 1,

          controls: 0,

          disablekb: 1,

          fs: 0,

          modestbranding: 1,

          playsinline: 1,

          rel: 0,

          loop: 1,

          playlist:
            YOUTUBE_VIDEO_ID

        },

        events: {

          onReady:
            onPlayerReady,

          onStateChange:
            onPlayerStateChange,

          onError:
            onPlayerError

        }

      }
    );

}


/* ============================================
   PLAYER READY
============================================ */

function onPlayerReady() {

  console.log(
    "YouTube PLAYER READY"
  );


  isPlayerReady = true;


  /*
     Set volume.
  */

  try {

    player.setVolume(
      MUSIC_VOLUME
    );

  } catch (error) {

    console.warn(
      "Tidak dapat mengatur volume.",
      error
    );

  }


  /*
     Restore posisi musik.
  */

  restoreMusicPosition();


  /*
     Ambil judul musik.
  */

  loadMusicTitle();


  /*
     Update tombol.
  */

  updateMusicButton();


  /*
     Cek apakah musik
     perlu dilanjutkan.
  */

  attemptAutoplay();

}


/* ============================================
   CHECK PREVIOUS MUSIC STATE
============================================ */

function getPreviousMusicState() {

  const savedPlaying =
    sessionStorage.getItem(
      MUSIC_STORAGE.playing
    );


  const sessionInitialized =
    sessionStorage.getItem(
      MUSIC_STORAGE.initialized
    );


  /*
     FIRST LOAD
  */

  if (
    sessionInitialized !== "true"
  ) {

    return {

      hasPreviousState: false,

      shouldPlay: true

    };

  }


  /*
     EXISTING SESSION
  */

  return {

    hasPreviousState: true,

    shouldPlay:
      savedPlaying === "true"

  };

}


/* ============================================
   AUTOPLAY / CONTINUE MUSIC
============================================ */

function attemptAutoplay() {

  if (autoplayAttempted) {

    return;

  }


  autoplayAttempted = true;


  if (
    !player ||
    !isPlayerReady
  ) {

    return;

  }


  const musicState =
    getPreviousMusicState();


  console.log(
    "Previous music state:",
    musicState
  );


  /*
     Tandai bahwa sesi musik
     sudah dimulai.
  */

  sessionStorage.setItem(
    MUSIC_STORAGE.initialized,
    "true"
  );


  /*
     Jika sebelumnya PAUSE,
     jangan jalankan autoplay.
  */

  if (
    musicState.hasPreviousState &&
    !musicState.shouldPlay
  ) {

    console.log(
      "Music sebelumnya PAUSED. Tetap pause."
    );


    isPlaying = false;


    updateMusicButton();


    return;

  }


  /*
     FIRST LOAD atau sebelumnya PLAY.
  */

  console.log(
    "Trying to continue music..."
  );


  try {

    player.playVideo();

  } catch (error) {

    console.warn(
      "Autoplay diblokir browser.",
      error
    );

  }

}


/* ============================================
   PLAYER STATE CHANGE
============================================ */

function onPlayerStateChange(event) {

  console.log(
    "YouTube State:",
    event.data
  );


  /*
     PLAYING
  */

  if (
    event.data ===
    YT.PlayerState.PLAYING
  ) {

    isPlaying = true;


    sessionStorage.setItem(
      MUSIC_STORAGE.playing,
      "true"
    );


    sessionStorage.setItem(
      MUSIC_STORAGE.initialized,
      "true"
    );


    updateMusicButton();


    console.log(
      "Music is PLAYING"
    );

  }


  /*
     PAUSED
  */

  if (
    event.data ===
    YT.PlayerState.PAUSED
  ) {

    isPlaying = false;


    sessionStorage.setItem(
      MUSIC_STORAGE.playing,
      "false"
    );


    sessionStorage.setItem(
      MUSIC_STORAGE.initialized,
      "true"
    );


    saveMusicPosition();


    updateMusicButton();


    console.log(
      "Music is PAUSED"
    );

  }


  /*
     ENDED
  */

  if (
    event.data ===
    YT.PlayerState.ENDED
  ) {

    console.log(
      "Music ended. Restarting..."
    );


    isPlaying = false;


    try {

      player.seekTo(
        0,
        true
      );


      player.playVideo();

    } catch (error) {

      console.warn(
        "Gagal restart musik.",
        error
      );

    }

  }


  /*
     BUFFERING
  */

  if (
    event.data ===
    YT.PlayerState.BUFFERING
  ) {

    console.log(
      "Music buffering..."
    );

  }


  /*
     CUED
  */

  if (
    event.data ===
    YT.PlayerState.CUED
  ) {

    console.log(
      "Music cued."
    );

  }

}


/* ============================================
   YOUTUBE ERROR
============================================ */

function onPlayerError(event) {

  console.error(
    "YouTube Player Error:",
    event.data
  );


  if (
    event.data === 101 ||
    event.data === 150
  ) {

    console.error(
      "Video YouTube tidak mengizinkan embedding."
    );

  }

}


/* ============================================
   RESTORE MUSIC POSITION
============================================ */

function restoreMusicPosition() {

  if (
    !player ||
    !isPlayerReady
  ) {

    return;

  }


  const savedMusicTime =
    sessionStorage.getItem(
      MUSIC_STORAGE.time
    );


  if (!savedMusicTime) {

    return;

  }


  const savedTime =
    Number(savedMusicTime);


  if (
    Number.isNaN(savedTime) ||
    savedTime < 0
  ) {

    return;

  }


  console.log(
    "Restoring music position:",
    savedTime
  );


  try {

    player.seekTo(
      savedTime,
      true
    );

  } catch (error) {

    console.warn(
      "Tidak dapat restore posisi musik.",
      error
    );

  }

}


/* ============================================
   SAVE MUSIC POSITION
============================================ */

function saveMusicPosition() {

  if (
    !player ||
    !isPlayerReady
  ) {

    return;

  }


  try {

    const currentTime =
      player.getCurrentTime();


    if (
      typeof currentTime === "number" &&
      !Number.isNaN(currentTime) &&
      currentTime >= 0
    ) {

      sessionStorage.setItem(
        MUSIC_STORAGE.time,
        currentTime.toString()
      );


      console.log(
        "Music position saved:",
        currentTime
      );

    }

  } catch (error) {

    console.warn(
      "Tidak dapat menyimpan posisi musik.",
      error
    );

  }

}


/* ============================================
   SAVE BEFORE LEAVING
============================================ */

window.addEventListener(
  "pagehide",
  function () {

    saveMusicPosition();

  }
);


window.addEventListener(
  "beforeunload",
  function () {

    saveMusicPosition();

  }
);


/* ============================================
   SAVE POSITION PERIODICALLY
============================================ */

setInterval(
  function () {

    if (
      isPlaying &&
      player &&
      isPlayerReady
    ) {

      saveMusicPosition();

    }

  },
  1000
);


/* ============================================
   INITIALIZE MUSIC
============================================ */

function initializeMusic() {

  console.log(
    "Initializing music system..."
  );


  /*
     Buat floating music button.
  */

  createMusicButton();


  /*
     Buat hidden YouTube player.
  */

  createYouTubeContainer();


  /*
     Ambil judul musik.
  */

  loadMusicTitle();


  /*
     Jika API sudah tersedia,
     langsung buat player.
  */

  if (
    typeof YT !== "undefined" &&
    typeof YT.Player !== "undefined"
  ) {

    createYouTubePlayer();

  }

}


/* ============================================
   DOM READY
============================================ */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeMusic
  );

} else {

  initializeMusic();

}