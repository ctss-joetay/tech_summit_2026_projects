// ---------- Level select ----------
const strip = document.getElementById("slider-strip");
const hoverLeft = document.getElementById("hover-left");
const hoverRight = document.getElementById("hover-right");
const selectError = document.getElementById("select-error");

const selectScreen = document.getElementById("select-screen");
const levelScreen = document.getElementById("level-screen");
const backBtn = document.getElementById("back-btn");

// Build 10 level cards
for (let i = 1; i <= 10; i++) {
  const card = document.createElement("div");
  card.className = "level-card";
  card.dataset.level = i;
  card.innerHTML = `<span>${i}</span><span class="level-label">Level</span>`;
  card.addEventListener("click", () => startLevel(i));
  strip.appendChild(card);
}

// --- Drag to scroll (mouse + touch) ---
let isDown = false;
let startX = 0;
let startScroll = 0;

strip.addEventListener("mousedown", (e) => {
  isDown = true;
  strip.classList.add("dragging");
  startX = e.pageX;
  startScroll = strip.scrollLeft;
});
window.addEventListener("mouseup", () => {
  isDown = false;
  strip.classList.remove("dragging");
});
window.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  strip.scrollLeft = startScroll - (e.pageX - startX);
});

strip.addEventListener("touchstart", (e) => {
  startX = e.touches[0].pageX;
  startScroll = strip.scrollLeft;
});
strip.addEventListener("touchmove", (e) => {
  strip.scrollLeft = startScroll - (e.touches[0].pageX - startX);
});

// --- Hover-edge auto-scroll ---
let scrollTimer = null;

function startAutoScroll(direction) {
  stopAutoScroll();
  try {
    scrollTimer = setInterval(() => {
      strip.scrollLeft += direction * 12;
    }, 16);
  } catch (err) {
    selectError.textContent = "issue with movement animations";
  }
}

function stopAutoScroll() {
  if (scrollTimer) {
    clearInterval(scrollTimer);
    scrollTimer = null;
  }
}

hoverLeft.addEventListener("mouseenter", () => startAutoScroll(-1));
hoverLeft.addEventListener("mouseleave", stopAutoScroll);
hoverRight.addEventListener("mouseenter", () => startAutoScroll(1));
hoverRight.addEventListener("mouseleave", stopAutoScroll);

// ---------- Level stage ----------
// Actual gameplay (mic, notes, hearts, win/lose) lives in level.js.
// This file just handles switching screens and forwarding the "go" signal.

function startLevel(levelNum) {
  selectScreen.classList.add("hidden");
  levelScreen.classList.remove("hidden");
  if (window.PitchQuest && window.PitchQuest.enterLevel) {
    window.PitchQuest.enterLevel(levelNum);
  }
}

backBtn.addEventListener("click", () => {
  if (window.PitchQuest && window.PitchQuest.stop) window.PitchQuest.stop();
  levelScreen.classList.add("hidden");
  selectScreen.classList.remove("hidden");
});
