function createSections(
  verseA = [4, 18],
  chorusA = [18, 32],
  verseB = [36, 50],
  chorusB = [50, 68],
) {
  return [
    { id: "verse-a", label: "メロA", start: verseA[0], end: verseA[1] },
    { id: "chorus-a", label: "サビA", start: chorusA[0], end: chorusA[1] },
    { id: "verse-b", label: "メロB", start: verseB[0], end: verseB[1] },
    { id: "chorus-b", label: "サビB", start: chorusB[0], end: chorusB[1] },
  ];
}

const SONGS = [
  {
    id: "toki-senpuka",
    title: "土岐旋風歌",
    audioFile: "music/土岐旋風歌.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "toki-make-love-it-2023",
    title: "toki make love it 2023",
    audioFile: "music/toki make love it 2023.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "jidai-ni-moete-koishigure",
    title: "時代(とき)に燃えて恋しぐれ",
    audioFile: "music/時代(とき)に燃えて恋しぐれ.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "minamo-dance",
    title: "ミナモダンス",
    audioFile: "music/ミナモダンス.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "harukoma",
    title: "春駒",
    audioFile: "music/春駒.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
];

const audio = document.querySelector("#audio");
const seekbar = document.querySelector("#seekbar");
const currentTimeText = document.querySelector("#current-time");
const durationText = document.querySelector("#duration");
const activeLabel = document.querySelector("#active-label");
const status = document.querySelector("#status");
const artwork = document.querySelector("#artwork");
const fullTrack = document.querySelector("#full-track");
const mainPlay = document.querySelector("#main-play");
const sectionGrid = document.querySelector("#section-grid");
const songSelector = document.querySelector("#song-selector");

let activeSongIndex = 0;
let activeId = "full";
let sectionEnd = null;

for (let index = 0; index < 22; index += 1) {
  const bar = document.createElement("i");
  bar.style.setProperty("--bar", index);
  document.querySelector("#sound-bars").append(bar);
}

SONGS.forEach((song, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.songIndex = index;
  button.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${song.title}</strong>`;
  button.addEventListener("click", () => selectSong(index));
  songSelector.append(button);
});

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function activeSong() {
  return SONGS[activeSongIndex];
}

function currentSection() {
  return activeSong().sections.find((section) => section.id === activeId) || {
    id: "full",
    label: "フル音源",
    start: 0,
    end: null,
  };
}

function setStatus(text, playing = false) {
  status.lastChild.textContent = text;
  status.querySelector("span").classList.toggle("pulse", playing);
}

function renderSections() {
  sectionGrid.replaceChildren();

  activeSong().sections.forEach((section, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "section-button";
    button.dataset.sectionId = section.id;
    button.innerHTML = `
      <span class="section-topline">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <span class="mini-play" aria-hidden="true"><i class="play-icon"></i></span>
      </span>
      <strong>${section.label}</strong>
      <small>${formatTime(section.start)} ～ ${formatTime(section.end)}</small>
      <span class="section-progress" aria-hidden="true"><i></i></span>
    `;
    button.setAttribute("aria-label", `${section.label} ${formatTime(section.start)}から${formatTime(section.end)}`);
    button.addEventListener("click", () => selectSection(section));
    sectionGrid.append(button);
  });
}

function setPlayingUi(playing) {
  artwork.classList.toggle("is-playing", playing);
  mainPlay.innerHTML = playing ? '<i class="pause-icon"></i>' : '<i class="play-icon"></i>';
  mainPlay.setAttribute("aria-label", playing ? "一時停止" : "再生");

  document.querySelectorAll(".section-button, #full-track").forEach((button) => {
    const isActive = button.id === "full-track" ? activeId === "full" : button.dataset.sectionId === activeId;
    button.classList.toggle("active", isActive);
    const icon = button.querySelector(".round-play i, .mini-play i");
    if (icon) icon.className = playing && isActive ? "pause-icon" : "play-icon";
  });
}

function selectSong(index, initial = false) {
  if (!initial && index === activeSongIndex) return;

  audio.pause();
  activeSongIndex = index;
  activeId = "full";
  sectionEnd = null;
  currentTimeText.textContent = "0:00";
  durationText.textContent = "0:00";
  activeLabel.textContent = "フル音源";
  seekbar.value = 0;
  seekbar.style.setProperty("--progress", "0%");

  const song = activeSong();
  document.querySelector("#song-title").textContent = song.title;
  document.querySelector("#song-subtitle").textContent = "パート確認用プレイヤー";
  document.querySelector("#audio-path").textContent = `音源ファイル：${song.audioFile}`;
  audio.src = song.audioFile;
  audio.load();

  document.querySelectorAll("#song-selector button").forEach((button) => {
    const selected = Number(button.dataset.songIndex) === activeSongIndex;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  renderSections();
  setPlayingUi(false);
  setStatus(initial ? "再生する音源を選んでください" : `${song.title}を選択しました`);
}

async function startPlayback(label) {
  try {
    await audio.play();
    setPlayingUi(true);
    setStatus(`${label}を再生中`, true);
  } catch {
    setPlayingUi(false);
    setStatus("音源を再生できませんでした");
  }
}

async function selectSection(section) {
  if (activeId === section.id && !audio.paused) {
    audio.pause();
    setPlayingUi(false);
    setStatus(`${section.label}を一時停止中`);
    return;
  }

  const inside =
    activeId === section.id &&
    audio.currentTime >= section.start &&
    audio.currentTime < section.end;

  if (!inside) audio.currentTime = section.start;
  activeId = section.id;
  sectionEnd = section.end;
  activeLabel.textContent = section.label;
  setPlayingUi(false);
  await startPlayback(section.label);
}

async function selectFullTrack() {
  if (activeId === "full" && !audio.paused) {
    audio.pause();
    setPlayingUi(false);
    setStatus("フル音源を一時停止中");
    return;
  }

  if (activeId !== "full" || audio.ended) audio.currentTime = 0;
  activeId = "full";
  sectionEnd = null;
  activeLabel.textContent = "フル音源";
  setPlayingUi(false);
  await startPlayback("フル音源");
}

async function togglePlayback() {
  const section = currentSection();
  if (!audio.paused) {
    audio.pause();
    setPlayingUi(false);
    setStatus(`${section.label}を一時停止中`);
    return;
  }

  if (section.end !== null && (audio.currentTime < section.start || audio.currentTime >= section.end)) {
    audio.currentTime = section.start;
  }
  await startPlayback(section.label);
}

function seekTo(seconds) {
  audio.currentTime = Math.min(Math.max(seconds, 0), audio.duration || 0);
  activeId = "full";
  sectionEnd = null;
  activeLabel.textContent = "フル音源";
  setPlayingUi(!audio.paused);
  setStatus(audio.paused ? "フル音源を一時停止中" : "フル音源を再生中", !audio.paused);
}

audio.addEventListener("loadedmetadata", () => {
  seekbar.max = audio.duration;
  durationText.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  if (sectionEnd !== null && audio.currentTime >= sectionEnd) {
    const label = currentSection().label;
    const endingTime = sectionEnd;
    audio.pause();
    audio.currentTime = endingTime;
    sectionEnd = null;
    setPlayingUi(false);
    setStatus(`${label}の再生が終わりました`);
  }

  seekbar.value = audio.currentTime;
  seekbar.style.setProperty("--progress", `${(audio.currentTime / (audio.duration || 1)) * 100}%`);
  currentTimeText.textContent = formatTime(audio.currentTime);
});

audio.addEventListener("ended", () => {
  setPlayingUi(false);
  setStatus(`${activeSong().title}の再生が終わりました`);
});

audio.addEventListener("error", () => {
  setPlayingUi(false);
  setStatus("musicフォルダの音源を確認してください");
});

fullTrack.addEventListener("click", selectFullTrack);
mainPlay.addEventListener("click", togglePlayback);
seekbar.addEventListener("input", () => seekTo(Number(seekbar.value)));
document.querySelector("#back").addEventListener("click", () => seekTo(audio.currentTime - 10));
document.querySelector("#forward").addEventListener("click", () => seekTo(audio.currentTime + 10));

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || ["INPUT", "BUTTON", "TEXTAREA"].includes(event.target.tagName)) return;
  event.preventDefault();
  togglePlayback();
});

selectSong(0, true);
