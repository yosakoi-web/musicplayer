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
    id: "saika",
    title: "祭花",
    audioFile: "music/01 祭花.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "jidai-ni-moete-koishigure",
    title: "時代(とき)に燃えて恋しぐれ",
    audioFile: "music/02 時代(とき)に燃えて恋しぐれ.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "toki-make-love-it-2023",
    title: "toki make love it 2023",
    audioFile: "music/03 toki make love it 2023.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "toki-senpuka",
    title: "土岐旋風歌",
    audioFile: "music/04 土岐旋風歌.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "harukoma",
    title: "春駒わっしょい",
    audioFile: "music/05 春駒わっしょい.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "nanchu-soran",
    title: "南中ソーラン",
    audioFile: "music/06 南中ソーラン.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "gifu-ima-kokode",
    title: "GIFU 今ここで",
    audioFile: "music/07 GIFU 今ここで.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "yocchore",
    title: "よっちょれ",
    audioFile: "music/08 よっちょれ.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "minamo-dance",
    title: "ミナモダンス",
    audioFile: "music/09 ミナモダンス.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "dancing-hero",
    title: "ダンシングヒーロー",
    audioFile: "music/10 ダンシングヒーロー.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "uraja-ondo",
    title: "うらじゃ音頭",
    audioFile: "music/11 うらじゃ音頭.mp3",
    sections: createSections([4, 18], [18, 32], [36, 50], [50, 68]),
  },
  {
    id: "sekai-ni-hitotsudake-no-hana",
    title: "世界に一つだけの花",
    audioFile: "music/12 世界に一つだけの花.mp3",
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
const songSelect = document.querySelector("#song-select");
const previousSong = document.querySelector("#previous-song");
const nextSong = document.querySelector("#next-song");
const songPosition = document.querySelector("#song-position");
const musicFolderInput = document.querySelector("#music-folder-input");
const musicFolderButton = document.querySelector("#music-folder-button");
const folderResult = document.querySelector("#folder-result");

let activeSongIndex = 0;
let activeId = "full";
let sectionEnd = null;
let folderHasBeenSelected = false;
let objectUrls = [];
const localAudioSources = new Map();

for (let index = 0; index < 22; index += 1) {
  const bar = document.createElement("i");
  bar.style.setProperty("--bar", index);
  document.querySelector("#sound-bars").append(bar);
}

SONGS.forEach((song, index) => {
  const option = document.createElement("option");
  option.value = String(index);
  option.textContent = `${index + 1}. ${song.title}`;
  songSelect.append(option);
});

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function musicFileName(song) {
  return song.audioFile.split("/").pop() || "";
}

function normalizeFileName(name) {
  return name.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

function audioSource(song) {
  return localAudioSources.get(song.id) || song.audioFile;
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
  document.querySelector("#audio-path").textContent = localAudioSources.has(song.id)
    ? `選択したフォルダ：${musicFileName(song)}`
    : `音源ファイル：${song.audioFile}`;
  audio.src = audioSource(song);
  audio.load();

  songSelect.value = String(activeSongIndex);
  previousSong.disabled = activeSongIndex === 0;
  nextSong.disabled = activeSongIndex === SONGS.length - 1;
  songPosition.textContent = `${activeSongIndex + 1}曲目／全${SONGS.length}曲`;

  renderSections();
  setPlayingUi(false);
  setStatus(initial ? "最初に音楽フォルダを選んでください" : `${song.title}を選択しました`);
}

async function startPlayback(label) {
  if (folderHasBeenSelected && !localAudioSources.has(activeSong().id)) {
    setPlayingUi(false);
    setStatus(`${musicFileName(activeSong())}が選択したフォルダに見つかりません`);
    return;
  }

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

function loadMusicFolder(files) {
  if (!files.length) return;

  audio.pause();
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
  objectUrls = [];
  localAudioSources.clear();

  const selectedFiles = new Map(
    Array.from(files).map((file) => [normalizeFileName(file.name), file]),
  );

  SONGS.forEach((song) => {
    const file = selectedFiles.get(normalizeFileName(musicFileName(song)));
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    localAudioSources.set(song.id, objectUrl);
    objectUrls.push(objectUrl);
  });

  folderHasBeenSelected = true;
  const count = localAudioSources.size;
  folderResult.textContent = count === SONGS.length
    ? "12曲すべて読み込み済みです"
    : `${count}曲読み込み済み／全${SONGS.length}曲`;
  folderResult.classList.toggle("ready", count === SONGS.length);
  folderResult.classList.toggle("warning", count !== SONGS.length);

  selectSong(activeSongIndex, true);
  setStatus(
    count === SONGS.length
      ? "12曲を読み込みました。再生できます"
      : count > 0
        ? `${count}曲を読み込みました。不足している曲名を確認してください`
        : "番号付きの音楽ファイルが見つかりませんでした",
  );
}

fullTrack.addEventListener("click", selectFullTrack);
mainPlay.addEventListener("click", togglePlayback);
songSelect.addEventListener("change", () => selectSong(Number(songSelect.value)));
previousSong.addEventListener("click", () => selectSong(activeSongIndex - 1));
nextSong.addEventListener("click", () => selectSong(activeSongIndex + 1));
seekbar.addEventListener("input", () => seekTo(Number(seekbar.value)));
document.querySelector("#back").addEventListener("click", () => seekTo(audio.currentTime - 10));
document.querySelector("#forward").addEventListener("click", () => seekTo(audio.currentTime + 10));
musicFolderButton.addEventListener("click", () => musicFolderInput.click());
musicFolderInput.addEventListener("change", () => {
  loadMusicFolder(musicFolderInput.files);
  musicFolderInput.value = "";
});

window.addEventListener("beforeunload", () => {
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
});

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || ["INPUT", "BUTTON", "TEXTAREA"].includes(event.target.tagName)) return;
  event.preventDefault();
  togglePlayback();
});

selectSong(0, true);
