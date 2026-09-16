// ---- Hand Shape Tracing Game ----
// Uses MediaPipe Hands to find the index fingertip, then checks whether
// the player traces it around a randomly placed shape outline.

const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const ctx = overlay.getContext("2d");
const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const msg = document.getElementById("msg");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const confettiLayer = document.getElementById("confetti-layer");
const scoreForm = document.getElementById("scoreForm");
const nameInput = document.getElementById("nameInput");
const optOut = document.getElementById("optOut");
const leaderboardEl = document.getElementById("leaderboard");
const leaderboardList = document.getElementById("leaderboardList");

const W = overlay.width;
const H = overlay.height;
const MARGIN = 60;
const HIT_RADIUS = 32;       // how close the fingertip must get to a sample point
const COMPLETE_RATIO = 1.0;  // fraction of the outline that must be traced (100%)
const SAMPLE_COUNT = 56;     // points sampled around each shape's perimeter
const STEP_WINDOW = 2;       // how many points ahead in sequence the finger may jump to

let stream = null;
let handsModel = null;
let gameRunning = false;
let score = 0;
let timeLeft = 30;
let timerId = null;
let currentShape = null;
let fingertip = null; // {x, y} in canvas pixel space, or null if no hand seen

// ---------- Shape generation ----------

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function makeCircle() {
  const r = randRange(60, 100);
  const cx = randRange(MARGIN + r, W - MARGIN - r);
  const cy = randRange(MARGIN + r, H - MARGIN - r);
  const pts = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const a = (i / SAMPLE_COUNT) * Math.PI * 2;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return {
    name: "circle",
    points: pts,
    draw() {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    },
  };
}

function sampleEdges(vertices, count) {
  const perim = [];
  const n = vertices.length;
  let totalLen = 0;
  const lens = [];
  for (let i = 0; i < n; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % n];
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    lens.push(l);
    totalLen += l;
  }
  for (let i = 0; i < count; i++) {
    const target = (i / count) * totalLen;
    let acc = 0;
    for (let e = 0; e < n; e++) {
      if (target <= acc + lens[e]) {
        const t = (target - acc) / lens[e];
        const a = vertices[e];
        const b = vertices[(e + 1) % n];
        perim.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        break;
      }
      acc += lens[e];
    }
  }
  return perim;
}

function makeSquare() {
  const s = randRange(110, 160);
  const x = randRange(MARGIN, W - MARGIN - s);
  const y = randRange(MARGIN, H - MARGIN - s);
  const verts = [
    { x, y }, { x: x + s, y }, { x: x + s, y: y + s }, { x, y: y + s },
  ];
  return {
    name: "square",
    points: sampleEdges(verts, SAMPLE_COUNT),
    draw() {
      ctx.strokeRect(x, y, s, s);
    },
  };
}

function makeRectangle() {
  const w = randRange(150, 220);
  const h = randRange(90, 130);
  const x = randRange(MARGIN, W - MARGIN - w);
  const y = randRange(MARGIN, H - MARGIN - h);
  const verts = [
    { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
  ];
  return {
    name: "rectangle",
    points: sampleEdges(verts, SAMPLE_COUNT),
    draw() {
      ctx.strokeRect(x, y, w, h);
    },
  };
}

function makeTriangle() {
  const size = randRange(120, 180);
  const cx = randRange(MARGIN + size / 2, W - MARGIN - size / 2);
  const cy = randRange(MARGIN + size / 2, H - MARGIN - size / 2);
  const verts = [
    { x: cx, y: cy - size / 2 },
    { x: cx + size / 2, y: cy + size / 2 },
    { x: cx - size / 2, y: cy + size / 2 },
  ];
  return {
    name: "triangle",
    points: sampleEdges(verts, SAMPLE_COUNT),
    draw() {
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      ctx.lineTo(verts[1].x, verts[1].y);
      ctx.lineTo(verts[2].x, verts[2].y);
      ctx.closePath();
      ctx.stroke();
    },
  };
}

const SHAPE_MAKERS = [makeCircle, makeSquare, makeRectangle, makeTriangle];

function nextShape() {
  const maker = SHAPE_MAKERS[Math.floor(Math.random() * SHAPE_MAKERS.length)];
  currentShape = maker();
  currentShape.hit = currentShape.points.map(() => false);
  currentShape.cursor = null;      // index of the last point traced in sequence
  currentShape.direction = null;   // +1 or -1 once the player commits to a direction
  currentShape.hitCount = 0;
}

// ---------- Drawing ----------

function drawFrame() {
  ctx.clearRect(0, 0, W, H);
  if (currentShape) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = "white";
    currentShape.draw();

    // show traced progress as green dots
    ctx.fillStyle = "#4ade80";
    currentShape.points.forEach((p, i) => {
      if (currentShape.hit[i]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
  if (fingertip) {
    ctx.beginPath();
    ctx.fillStyle = "#f472b6";
    ctx.arc(fingertip.x, fingertip.y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- Scoring ----------

// Tracing must move around the outline in order, one step at a time, in a
// single consistent direction. This stops a player from just scrubbing their
// finger back and forth ("mopping") to light up every dot out of sequence.
function checkProgress() {
  if (!currentShape || !fingertip) return;
  const pts = currentShape.points;
  const n = pts.length;
  const near = (i) => Math.hypot(pts[i].x - fingertip.x, pts[i].y - fingertip.y) < HIT_RADIUS;

  if (currentShape.cursor === null) {
    // Not started yet: touch any point on the outline to begin.
    for (let i = 0; i < n; i++) {
      if (near(i)) {
        currentShape.cursor = i;
        currentShape.hit[i] = true;
        currentShape.hitCount = 1;
        break;
      }
    }
    return;
  }

  if (currentShape.direction === null) {
    // First move commits the direction: must go to an immediate neighbour.
    const fwd = (currentShape.cursor + 1) % n;
    const back = (currentShape.cursor - 1 + n) % n;
    if (near(fwd)) {
      currentShape.direction = 1;
      currentShape.cursor = fwd;
      currentShape.hit[fwd] = true;
      currentShape.hitCount++;
    } else if (near(back)) {
      currentShape.direction = -1;
      currentShape.cursor = back;
      currentShape.hit[back] = true;
      currentShape.hitCount++;
    }
  } else {
    // Only the next few points ahead in the committed direction can be hit.
    // A small window forgives fast motion skipping a sample point, but
    // going backwards or jumping around the shape does nothing.
    for (let step = 1; step <= STEP_WINDOW; step++) {
      const idx = (currentShape.cursor + currentShape.direction * step + n * 2) % n;
      if (near(idx) && !currentShape.hit[idx]) {
        // mark every point from cursor up to idx (in direction) as traced
        for (let s = 1; s <= step; s++) {
          const markIdx = (currentShape.cursor + currentShape.direction * s + n * 2) % n;
          if (!currentShape.hit[markIdx]) {
            currentShape.hit[markIdx] = true;
            currentShape.hitCount++;
          }
        }
        currentShape.cursor = idx;
        break;
      }
    }
  }

  if (currentShape.hitCount >= n * COMPLETE_RATIO) {
    score++;
    scoreEl.textContent = score;
    spawnConfetti();
    nextShape();
  }
}

function spawnConfetti() {
  const colors = ["#4f46e5", "#f472b6", "#4ade80", "#facc15", "#38bdf8"];
  for (let i = 0; i < 14; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    const dx = randRange(-40, 40);
    const dy = randRange(-40, 10);
    piece.style.setProperty("--dx", dx + "px");
    piece.style.setProperty("--dy", dy + "px");
    confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 700);
  }
}

// ---------- Hand tracking ----------

let gotFirstResult = false;
let watchdogId = null;

function onResults(results) {
  gotFirstResult = true;
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const lm = results.multiHandLandmarks[0][8]; // index fingertip
    fingertip = { x: lm.x * W, y: lm.y * H };
  } else {
    fingertip = null;
  }
  drawFrame();
  checkProgress();
}

function initHands() {
  if (handsModel) return handsModel;
  handsModel = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });
  handsModel.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
  });
  handsModel.onResults(onResults);
  return handsModel;
}

let detectLoopId = null;
let consecutiveSendFailures = 0;

async function detectLoop() {
  if (!gameRunning) return;
  try {
    await handsModel.send({ image: video });
    consecutiveSendFailures = 0;
  } catch (e) {
    consecutiveSendFailures++;
    console.error("Hand tracking error:", e);
    if (consecutiveSendFailures === 5) {
      // Don't spam on every frame, but tell the player once it's clearly stuck.
      msg.textContent =
        "Hand tracking keeps failing (see console for details: " + (e && e.message ? e.message : e) + ").";
    }
  }
  detectLoopId = requestAnimationFrame(detectLoop);
}

// ---------- Game flow ----------

async function startGame() {
  msg.textContent = "";
  startBtn.disabled = true;
  startBtn.textContent = "Starting...";
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
    });
  } catch (e) {
    msg.textContent = "Could not access the camera. Please allow camera access and try again.";
    startBtn.disabled = false;
    startBtn.textContent = "Start Game";
    return;
  }

  video.srcObject = stream;
  try {
    await video.play();
  } catch (e) {
    console.error("Video play failed:", e);
    msg.textContent = "Could not start the camera video. Try reloading the page.";
    startBtn.disabled = false;
    startBtn.textContent = "Start Game";
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
    return;
  }

  score = 0;
  timeLeft = 30;
  scoreEl.textContent = score;
  timerEl.textContent = timeLeft;
  nextShape();
  drawFrame(); // show the shape immediately, don't wait on hand tracking

  startOverlay.classList.add("hidden");
  gameRunning = true;

  if (typeof Hands === "undefined") {
    msg.textContent =
      "Hand tracking library failed to load (MediaPipe 'Hands' is undefined). " +
      "Check the browser console for a failed network request to cdn.jsdelivr.net, and reload.";
  } else {
    try {
      initHands();
      gotFirstResult = false;
      detectLoop();
      // Watchdog: if MediaPipe never calls onResults at all within 5s, the
      // model itself failed silently (e.g. its .wasm/.data files 404'd from
      // the CDN). Say so loudly instead of leaving a game that looks stuck.
      clearTimeout(watchdogId);
      watchdogId = setTimeout(() => {
        if (gameRunning && !gotFirstResult) {
          msg.textContent =
            "Hand tracking never produced a result after 5s — the MediaPipe model " +
            "likely failed to download its files. Check the console Network tab for " +
            "404s under cdn.jsdelivr.net/npm/@mediapipe/hands/ and reload.";
        }
      }, 5000);
    } catch (e) {
      console.error("Hand tracking failed to start:", e);
      msg.textContent =
        "Hand tracking failed to start: " + (e && e.message ? e.message : e) +
        ". You can still see the shapes, but tracing won't register.";
    }
  }

  timerId = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  gameRunning = false;
  clearInterval(timerId);
  clearTimeout(watchdogId);
  if (detectLoopId) cancelAnimationFrame(detectLoopId);
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  currentShape = null;
  fingertip = null;
  ctx.clearRect(0, 0, W, H);

  startOverlay.classList.remove("hidden");
  startBtn.disabled = false;
  startBtn.textContent = "Play Again";
  msg.textContent = `Game over! Final score: ${score}`;

  // Let the player add their score to the leaderboard, or opt out.
  nameInput.value = "";
  optOut.checked = false;
  scoreForm.classList.remove("hidden");
  refreshLeaderboard();
}

async function refreshLeaderboard() {
  try {
    const list = await Summit.leaderboard({ limit: 10 });
    leaderboardList.innerHTML = "";
    list.forEach((entry) => {
      const li = document.createElement("li");
      const scoreSpan = document.createElement("span");
      scoreSpan.textContent = entry.score;
      const nameSpan = document.createElement("span");
      nameSpan.className = "name";
      nameSpan.textContent = entry.nick;
      li.appendChild(nameSpan);
      li.appendChild(scoreSpan);
      leaderboardList.appendChild(li);
    });
    leaderboardEl.classList.remove("hidden");
  } catch (e) {
    console.error("Could not load leaderboard:", e);
  }
}

scoreForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  scoreForm.classList.add("hidden");
  if (optOut.checked) return; // player chose not to be listed
  const name = nameInput.value.trim() || "Anonymous";
  try {
    await Summit.submitScore(name, score);
  } catch (err) {
    console.error("Could not submit score:", err);
  }
  refreshLeaderboard();
});

startBtn.addEventListener("click", startGame);
refreshLeaderboard();
