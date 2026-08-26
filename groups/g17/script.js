// Flappy Bird replica using the canvas element.

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const startBtn = document.getElementById("startBtn");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const GRAVITY = 0.45;
const BIRD_RADIUS = 14;
// Flap should lift the bird by about its own height (one diameter).
// Using v = sqrt(2 * gravity * height) so each tap rises ~1 bird-diameter before gravity wins again.
const FLAP_HEIGHT = BIRD_RADIUS * 2;
const FLAP_STRENGTH = -Math.sqrt(2 * GRAVITY * FLAP_HEIGHT);
// Gap is 3 birds wide (3 diameters) so the bird has plenty of room to fit through.
const GAP_SIZE = BIRD_RADIUS * 2 * 3;
const MIN_PIPE_WIDTH = 46;
const MAX_PIPE_WIDTH = 90;
const PIPE_SPEED = 2.5;
const PIPE_SPACING = 240; // horizontal distance between pipe pairs
const CLOUD_SPEED = 0.4;
const CAP_HEIGHT = 18;
const CAP_OVERHANG = 8; // how much wider the cap is than the pipe body
const ZOOM_LEVEL = 1.8; // how much bigger things look when zoomed in

// All pillars are green at the base with a bright yellow rim marking the gap.
const PIPE_STYLE = { body: "#3cb043", edge: "#2e8f35", cap: "#ffd23f" };

let bird, pipes, clouds, score, best, running, gameOver, frame, animationId;
let isZoomed = false;

function resetGame() {
  bird = { x: 80, y: HEIGHT / 2, vy: 0, radius: BIRD_RADIUS };
  pipes = [];
  score = 0;
  frame = 0;
  gameOver = false;
  scoreEl.textContent = "0";
  if (!clouds) initClouds();
}

function initClouds() {
  clouds = [];
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * WIDTH,
      y: 20 + Math.random() * (HEIGHT * 0.5),
      scale: 0.6 + Math.random() * 0.8,
    });
  }
}

function spawnPipe() {
  const gap = GAP_SIZE;
  const width = MIN_PIPE_WIDTH + Math.random() * (MAX_PIPE_WIDTH - MIN_PIPE_WIDTH);
  const margin = 40;
  const gapY = margin + Math.random() * (HEIGHT - margin * 2 - gap);
  pipes.push({ x: WIDTH, gapY, gap, width, style: PIPE_STYLE, passed: false });
}

function flap() {
  if (!running) return;
  bird.vy = FLAP_STRENGTH;
}

function toggleZoom() {
  isZoomed = !isZoomed;
}

function update() {
  bird.vy += GRAVITY;
  bird.y += bird.vy;

  frame++;
  if (frame % Math.round(PIPE_SPACING / PIPE_SPEED) === 0) {
    spawnPipe();
  }

  for (const pipe of pipes) {
    pipe.x -= PIPE_SPEED;
    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      score++;
      scoreEl.textContent = String(score);
    }
  }
  pipes = pipes.filter((p) => p.x + p.width > -5);

  // clouds drift slowly and wrap around
  for (const cloud of clouds) {
    cloud.x -= CLOUD_SPEED;
    if (cloud.x < -60) {
      cloud.x = WIDTH + 60;
      cloud.y = 20 + Math.random() * (HEIGHT * 0.5);
    }
  }

  // collisions: floor/ceiling
  if (bird.y + bird.radius > HEIGHT || bird.y - bird.radius < 0) {
    endGame();
    return;
  }

  // collisions: pipes
  for (const pipe of pipes) {
    const withinX = bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipe.width;
    if (withinX) {
      const hitsTop = bird.y - bird.radius < pipe.gapY;
      const hitsBottom = bird.y + bird.radius > pipe.gapY + pipe.gap;
      if (hitsTop || hitsBottom) {
        endGame();
        return;
      }
    }
  }
}

function drawCloud(cx, cy, scale) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.arc(16, -6, 12, 0, Math.PI * 2);
  ctx.arc(30, 0, 14, 0, Math.PI * 2);
  ctx.arc(15, 8, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPillar(pipe) {
  const { x, width, gapY, gap, style } = pipe;
  const topHeight = gapY;
  const bottomY = gapY + gap;
  const bottomHeight = HEIGHT - bottomY;

  // pillar bodies (green base)
  ctx.fillStyle = style.body;
  ctx.fillRect(x, 0, width, topHeight);
  ctx.fillRect(x, bottomY, width, bottomHeight);

  // shaded edge strip for a bit of depth
  ctx.fillStyle = style.edge;
  ctx.fillRect(x, 0, 6, topHeight);
  ctx.fillRect(x, bottomY, 6, bottomHeight);

  // bright yellow rim around the gap so it's obvious where to fly through
  const capX = x - CAP_OVERHANG / 2;
  const capW = width + CAP_OVERHANG;
  ctx.fillStyle = style.cap;
  ctx.fillRect(capX, topHeight - CAP_HEIGHT, capW, CAP_HEIGHT);
  ctx.fillRect(capX, bottomY, capW, CAP_HEIGHT);

  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(capX, topHeight - CAP_HEIGHT, capW, CAP_HEIGHT);
  ctx.strokeRect(capX, bottomY, capW, CAP_HEIGHT);
}

function drawBird(x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // body
  ctx.fillStyle = "#f5a623";
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // wing
  ctx.fillStyle = "#e0891a";
  ctx.beginPath();
  ctx.ellipse(-2, 3, 7, 5, Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // tail
  ctx.fillStyle = "#e0891a";
  ctx.beginPath();
  ctx.moveTo(-13, -2);
  ctx.lineTo(-20, -6);
  ctx.lineTo(-20, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // eye
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(6, -4, 2, 0, Math.PI * 2);
  ctx.fill();

  // beak
  ctx.fillStyle = "#e8542a";
  ctx.beginPath();
  ctx.moveTo(12, -1);
  ctx.lineTo(20, 1);
  ctx.lineTo(12, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  if (isZoomed) {
    // Zoom the camera in, centered on the bird, so the bird stays in view.
    ctx.translate(WIDTH / 2, HEIGHT / 2);
    ctx.scale(ZOOM_LEVEL, ZOOM_LEVEL);
    ctx.translate(-bird.x, -bird.y);
  }

  // clouds (background)
  for (const cloud of clouds) {
    drawCloud(cloud.x, cloud.y, cloud.scale);
  }

  // pillars (obstacles)
  for (const pipe of pipes) {
    drawPillar(pipe);
  }

  // bird, tilted based on vertical speed
  const angle = Math.max(-0.5, Math.min(0.9, bird.vy / 10));
  drawBird(bird.x, bird.y, angle);

  ctx.restore();
}

function loop() {
  if (!running) return;
  update();
  draw();
  if (running) {
    animationId = requestAnimationFrame(loop);
  }
}

function endGame() {
  running = false;
  gameOver = true;
  cancelAnimationFrame(animationId);
  statusEl.textContent = `Game over! Score: ${score}. Click Start to try again.`;
  startBtn.textContent = "Start";
  if (score > best) {
    best = score;
    bestEl.textContent = String(best);
    Summit.save("flappyBest", best).catch(() => {});
  }
}

function startGame() {
  resetGame();
  running = true;
  statusEl.textContent = "Flap with Space, click, or tap! Press E to zoom.";
  startBtn.textContent = "Restart";
  draw();
  animationId = requestAnimationFrame(loop);
}

startBtn.addEventListener("click", startGame);

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (running) flap();
    else if (gameOver) startGame();
  } else if (e.code === "KeyE") {
    toggleZoom();
    if (!running) draw();
  }
});

canvas.addEventListener("mousedown", () => {
  if (running) flap();
});
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (running) flap();
});

async function init() {
  best = (await Summit.load("flappyBest").catch(() => 0)) || 0;
  bestEl.textContent = String(best);
  initClouds();
  resetGame();
  draw();
}

init();
