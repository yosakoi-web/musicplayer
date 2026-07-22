"use strict";

const TRACKS = [
  { id: "matsuribana", title: "祭花", file: "01 祭花.mp3" },
  { id: "toki-koishigure", title: "時代(とき)に燃えて恋しぐれ", file: "02 時代(とき)に燃えて恋しぐれ.mp3" },
  { id: "toki-make-love", title: "toki make love it 2023", file: "03 toki make love it 2023.mp3" },
  { id: "toki-senpuka", title: "土岐旋風歌", file: "04 土岐旋風歌.mp3" },
  { id: "harukoma", title: "春駒わっしょい", file: "05 春駒わっしょい.mp3" },
  { id: "nanchu-soran", title: "南中ソーラン", file: "06 南中ソーラン.mp3" },
  { id: "gifu", title: "GIFU 今ここで", file: "07 GIFU 今ここで.mp3" },
  { id: "yocchore", title: "よっちょれ", file: "08 よっちょれ.mp3" },
  { id: "minamo", title: "ミナモダンス", file: "09 ミナモダンス.mp3" },
  { id: "dancing-hero", title: "ダンシングヒーロー", file: "10 ダンシングヒーロー.mp3" },
  { id: "uraja", title: "うらじゃ音頭", file: "11 うらじゃ音頭.mp3" },
  { id: "sekai", title: "世界に一つだけの花", file: "12 世界に一つだけの花.mp3" },
];

const trackGrid = document.querySelector("#track-grid");
const playerLayer = document.querySelector("#player-layer");
const playerDialog = document.querySelector("#player-dialog");
const modalBackdrop = document.querySelector("#modal-backdrop");
const closePlayerButton = document.querySelector("#close-player");
const nowPlayingTitle = document.querySelector("#now-playing-title");
const playToggle = document.querySelector("#play-toggle");
const pauseIcon = document.querySelector(".pause-icon");
const playIcon = document.querySelector(".play-icon");
const seekBar = document.querySelector("#seek-bar");
const currentTime = document.querySelector("#current-time");
const duration = document.querySelector("#duration");
const playerMessage = document.querySelector("#player-message");
const audio = document.querySelector("#audio-player");

let activeTrackId = null;
let lastFocusedTrackId = null;
let isScrubbing = false;

function renderTracks() {
  trackGrid.replaceChildren();

  TRACKS.forEach((track) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "track-button";
    button.dataset.trackId = track.id;
    button.textContent = track.title;
    button.setAttribute("aria-label", `${track.title}を再生`);
    button.classList.add("is-loaded");
    if (track.id === activeTrackId && !audio.paused) button.classList.add("is-playing");

    button.addEventListener("click", () => openTrack(track.id));
    trackGrid.append(button);
  });
}

async function openTrack(trackId) {
  const track = TRACKS.find((item) => item.id === trackId);
  if (!track) return;

  lastFocusedTrackId = trackId;
  activeTrackId = trackId;
  nowPlayingTitle.textContent = track.title;
  playerMessage.textContent = "";
  audio.src = `music/${encodeURIComponent(track.file)}`;
  audio.load();
  playerLayer.hidden = false;
  document.body.classList.add("modal-open");
  closePlayerButton.focus();

  try {
    await audio.play();
  } catch (error) {
    if (error?.name !== "AbortError") {
      playerMessage.textContent = "再生ボタンを押してください";
    }
  }

  updatePlayState();
  renderTracks();
}

function closePlayer() {
  if (playerLayer.hidden) return;

  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  playerLayer.hidden = true;
  document.body.classList.remove("modal-open");
  activeTrackId = null;
  resetTimeline();
  renderTracks();

  const returnTarget = trackGrid.querySelector(`[data-track-id="${lastFocusedTrackId}"]`);
  if (returnTarget) returnTarget.focus();
}

async function togglePlayback() {
  playerMessage.textContent = "";

  if (audio.paused) {
    try {
      await audio.play();
    } catch (error) {
      if (error?.name !== "AbortError") {
        playerMessage.textContent = "この端末では再生を開始できませんでした";
      }
    }
  } else {
    audio.pause();
  }

  updatePlayState();
  renderTracks();
}

function updatePlayState() {
  const isPaused = audio.paused;
  pauseIcon.hidden = isPaused;
  playIcon.hidden = !isPaused;
  playToggle.setAttribute("aria-label", isPaused ? "再生" : "一時停止");
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function updateTimeline() {
  const total = Number.isFinite(audio.duration) ? audio.duration : 0;
  const elapsed = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  seekBar.max = total || 100;
  seekBar.disabled = total <= 0;

  if (!isScrubbing) {
    seekBar.value = elapsed;
    currentTime.textContent = formatTime(elapsed);
  }

  duration.textContent = formatTime(total);
}

function resetTimeline() {
  seekBar.max = 100;
  seekBar.value = 0;
  seekBar.disabled = true;
  currentTime.textContent = "0:00";
  duration.textContent = "0:00";
}

function previewSeekPosition() {
  isScrubbing = true;
  currentTime.textContent = formatTime(Number(seekBar.value));
}

function commitSeekPosition() {
  const target = Number(seekBar.value);

  if (Number.isFinite(audio.duration) && Number.isFinite(target)) {
    audio.currentTime = Math.min(Math.max(target, 0), audio.duration);
  }

  isScrubbing = false;
  updateTimeline();
}

function keepFocusInDialog(event) {
  if (event.key !== "Tab" || playerLayer.hidden) return;

  const focusable = Array.from(
    playerDialog.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'),
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

closePlayerButton.addEventListener("click", closePlayer);
modalBackdrop.addEventListener("click", closePlayer);
playToggle.addEventListener("click", togglePlayback);
seekBar.addEventListener("input", () => {
  previewSeekPosition();
});
seekBar.addEventListener("change", commitSeekPosition);
seekBar.addEventListener("pointercancel", () => {
  isScrubbing = false;
  updateTimeline();
});

audio.addEventListener("loadedmetadata", updateTimeline);
audio.addEventListener("durationchange", updateTimeline);
audio.addEventListener("canplay", updateTimeline);
audio.addEventListener("timeupdate", updateTimeline);
audio.addEventListener("play", () => {
  updatePlayState();
  renderTracks();
});
audio.addEventListener("pause", () => {
  updatePlayState();
  renderTracks();
});
audio.addEventListener("ended", () => {
  updatePlayState();
  renderTracks();
});
audio.addEventListener("error", () => {
  playerMessage.textContent = "この音源を再生できませんでした。MP3形式を確認してください";
  updatePlayState();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !playerLayer.hidden) closePlayer();
  keepFocusInDialog(event);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

renderTracks();
