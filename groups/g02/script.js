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

// --- Hover-edge auto-scroll (frame-synced, not a fixed timer) ---
let scrollDirection = 0;
let scrollRafId = null;
let lastFrameTime = null;

function autoScrollStep(time) {
  if (lastFrameTime === null) lastFrameTime = time;
  const dt = time - lastFrameTime;
  lastFrameTime = time;
  try {
    if (scrollDirection !== 0) {
      // pixels per second, scaled by real elapsed time so speed
      // stays constant even if a frame is slow
      strip.scrollLeft += scrollDirection * 0.6 * dt;
      scrollRafId = requestAnimationFrame(autoScrollStep);
    } else {
      scrollRafId = null;
      lastFrameTime = null;
    }
  } catch (err) {
    selectError.textContent = "issue with movement animations";
  }
}

function startAutoScroll(direction) {
  scrollDirection = direction;
  if (scrollRafId === null) {
    lastFrameTime = null;
    scrollRafId = requestAnimationFrame(autoScrollStep);
  }
}

function stopAutoScroll() {
  scrollDirection = 0;
}

hoverLeft.addEventListener("mouseenter", () => startAutoScroll(-1));
hoverLeft.addEventListener("mouseleave", stopAutoScroll);
hoverRight.addEventListener("mouseenter", () => startAutoScroll(1));
hoverRight.addEventListener("mouseleave", stopAutoScroll);

// --- Scale cards by distance from the strip's center: middle 3 are
// biggest, cards shrink toward the left/right edges ---
let scaleRafId = null;

function updateCardScales() {
  const stripRect = strip.getBoundingClientRect();
  const centerX = stripRect.left + stripRect.width / 2;
  const cards = strip.querySelectorAll(".level-card");
  const maxDist = stripRect.width / 2 + 80;

  cards.forEach((card) => {
    const cardRect = card.getBoundingClientRect();
    const cardCenter = cardRect.left + cardRect.width / 2;
    const dist = Math.abs(cardCenter - centerX);
    const t = Math.min(dist / maxDist, 1);
    // 1.15 at center, down to 0.6 at the edges
    const scale = 1.15 - t * 0.55;
    card.style.transform = `scale(${scale})`;
    card.style.zIndex = String(Math.round((1 - t) * 100));
  });
  scaleRafId = null;
}

function requestScaleUpdate() {
  if (scaleRafId === null) {
    scaleRafId = requestAnimationFrame(updateCardScales);
  }
}

strip.addEventListener("scroll", requestScaleUpdate, { passive: true });
window.addEventListener("resize", requestScaleUpdate);
requestScaleUpdate();

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
