// Flappy Bird - simple canvas game

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");

const GRAVITY = 0.35;
const FLAP = -7;
const MAX_FALL_SPEED = 6; // caps how fast the bird can drop
const PIPE_GAP = 140;
const PIPE_WIDTH = 56;
const PIPE_SPEED = 2.4;
const PIPE_SPACING = 200; // horizontal distance between pipes
const GROUND_HEIGHT = 30;

let bird, pipes, frame, score, best, gameOver, started, clouds;

function resetGame() {
  bird = { x: 70, y: canvas.height / 2, vy: 0, r: 14 };
  pipes = [];
  frame = 0;
  score = 0;
  gameOver = false;
  started = false;
  clouds = [
    { x: 60, y: 60, s: 1 },
    { x: 220, y: 100, s: 0.7 },
    { x: 320, y: 50, s: 0.85 },
  ];
  spawnPipe(canvas.width + 40);
}

function spawnPipe(x) {
  const margin = 50;
  const gapY = margin + Math.random() * (canvas.height - PIPE_GAP - margin * 2 - GROUND_HEIGHT);
  pipes.push({ x, gapY, passed: false });
}

function flap() {
  if (gameOver) {
    resetGame();
    return;
  }
  started = true;
  bird.vy = FLAP;
}

function update() {
  if (!started || gameOver) return;

  bird.vy += GRAVITY;
  if (bird.vy > MAX_FALL_SPEED) bird.vy = MAX_FALL_SPEED;
  bird.y += bird.vy;

  for (const pipe of pipes) {
    pipe.x -= PIPE_SPEED;
    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      score++;
    }
  }

  for (const cloud of clouds) {
    cloud.x -= 0.3;
    if (cloud.x < -60) cloud.x = canvas.width + 60;
  }

  if (pipes.length && pipes[0].x < -PIPE_WIDTH) {
    pipes.shift();
  }
  const lastPipe = pipes[pipes.length - 1];
  if (canvas.width - lastPipe.x >= PIPE_SPACING) {
    spawnPipe(canvas.width);
  }

  // collisions
  const groundY = canvas.height - GROUND_HEIGHT;
  if (bird.y + bird.r > groundY || bird.y - bird.r < 0) {
    endGame();
  }
  for (const pipe of pipes) {
    const inX = bird.x + bird.r > pipe.x && bird.x - bird.r < pipe.x + PIPE_WIDTH;
    const inGap = bird.y - bird.r > pipe.gapY && bird.y + bird.r < pipe.gapY + PIPE_GAP;
    if (inX && !inGap) {
      endGame();
    }
  }
}

function endGame() {
  if (gameOver) return;
  gameOver = true;
  if (score > best) {
    best = score;
    Summit.save("flappyBest", best);
    Summit.submitScore("Player", score);
  }
}

function drawSky() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#4ec0e9");
  sky.addColorStop(1, "#bdeaf7");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // clouds
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (const c of clouds) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 22 * c.s, 12 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + 18 * c.s, c.y + 4 * c.s, 16 * c.s, 10 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x - 18 * c.s, c.y + 4 * c.s, 14 * c.s, 9 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround() {
  const y = canvas.height - GROUND_HEIGHT;
  const dirt = ctx.createLinearGradient(0, y, 0, canvas.height);
  dirt.addColorStop(0, "#ded18f");
  dirt.addColorStop(1, "#c2a765");
  ctx.fillStyle = dirt;
  ctx.fillRect(0, y, canvas.width, GROUND_HEIGHT);

  ctx.fillStyle = "#6cbf4a";
  ctx.fillRect(0, y, canvas.width, 6);
  ctx.fillStyle = "#4f9e35";
  for (let x = 0; x < canvas.width; x += 14) {
    ctx.fillRect(x, y, 8, 6);
  }
}

function drawBird() {
  const r = bird.r;
  const tilt = Math.max(-0.5, Math.min(0.9, bird.vy / 10));

  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(tilt);

  // body with gradient for a rounded, feathered look
  const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r * 1.1);
  bodyGrad.addColorStop(0, "#ffd23f");
  bodyGrad.addColorStop(1, "#f2a900");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();

  // pale belly
  ctx.fillStyle = "#fff3d0";
  ctx.beginPath();
  ctx.ellipse(-r * 0.1, r * 0.35, r * 0.6, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // wing
  const wingGrad = ctx.createLinearGradient(-r, 0, r * 0.3, r * 0.5);
  wingGrad.addColorStop(0, "#e08b00");
  wingGrad.addColorStop(1, "#c97800");
  ctx.fillStyle = wingGrad;
  ctx.beginPath();
  ctx.ellipse(-r * 0.15, r * 0.1, r * 0.55, r * 0.36, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#a86300";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, r * 0.05);
  ctx.lineTo(r * 0.1, r * 0.25);
  ctx.stroke();

  // tail feathers
  ctx.fillStyle = "#d98c00";
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, -r * 0.1);
  ctx.lineTo(-r * 1.35, -r * 0.25);
  ctx.lineTo(-r * 1.3, r * 0.05);
  ctx.closePath();
  ctx.fill();

  // eye
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(r * 0.38, -r * 0.28, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(r * 0.46, -r * 0.28, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(r * 0.5, -r * 0.33, r * 0.05, 0, Math.PI * 2);
  ctx.fill();

  // beak
  const beakGrad = ctx.createLinearGradient(r * 0.7, 0, r * 1.4, 0.3);
  beakGrad.addColorStop(0, "#ff8c1a");
  beakGrad.addColorStop(1, "#e35d00");
  ctx.fillStyle = beakGrad;
  ctx.beginPath();
  ctx.moveTo(r * 0.8, -r * 0.05);
  ctx.lineTo(r * 1.45, r * 0.08);
  ctx.lineTo(r * 0.8, r * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#b34700";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawPipe(x, topHeight, bottomY, bottomHeight) {
  const capHeight = 24;
  const capOverhang = 7;

  const bodyGrad = ctx.createLinearGradient(x, 0, x + PIPE_WIDTH, 0);
  bodyGrad.addColorStop(0, "#2c8f3c");
  bodyGrad.addColorStop(0.35, "#4fc75f");
  bodyGrad.addColorStop(0.55, "#78e087");
  bodyGrad.addColorStop(0.75, "#4fc75f");
  bodyGrad.addColorStop(1, "#2c8f3c");

  const capGrad = ctx.createLinearGradient(x - capOverhang, 0, x + PIPE_WIDTH + capOverhang, 0);
  capGrad.addColorStop(0, "#256b30");
  capGrad.addColorStop(0.35, "#3fae4e");
  capGrad.addColorStop(0.55, "#8ef29a");
  capGrad.addColorStop(0.75, "#3fae4e");
  capGrad.addColorStop(1, "#256b30");

  ctx.strokeStyle = "#1f5c2a";
  ctx.lineWidth = 2;

  // top pipe body
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(x, 0, PIPE_WIDTH, topHeight - capHeight);
  ctx.strokeRect(x, 0, PIPE_WIDTH, topHeight - capHeight);
  // top pipe cap
  ctx.fillStyle = capGrad;
  ctx.fillRect(x - capOverhang, topHeight - capHeight, PIPE_WIDTH + capOverhang * 2, capHeight);
  ctx.strokeRect(x - capOverhang, topHeight - capHeight, PIPE_WIDTH + capOverhang * 2, capHeight);

  // bottom pipe cap
  ctx.fillStyle = capGrad;
  ctx.fillRect(x - capOverhang, bottomY, PIPE_WIDTH + capOverhang * 2, capHeight);
  ctx.strokeRect(x - capOverhang, bottomY, PIPE_WIDTH + capOverhang * 2, capHeight);
  // bottom pipe body
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(x, bottomY + capHeight, PIPE_WIDTH, bottomHeight - capHeight);
  ctx.strokeRect(x, bottomY + capHeight, PIPE_WIDTH, bottomHeight - capHeight);
}

function draw() {
  drawSky();

  // pipes
  for (const pipe of pipes) {
    const bottomY = pipe.gapY + PIPE_GAP;
    drawPipe(pipe.x, pipe.gapY, bottomY, canvas.height - GROUND_HEIGHT - bottomY);
  }

  drawGround();
  drawBird();

  if (!started) {
    ctx.fillStyle = "#000";
    ctx.font = "18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Click or press Space to start", canvas.width / 2, canvas.height / 2);
  }

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Click or press Space to try again", canvas.width / 2, canvas.height / 2 + 18);
  }

  statusEl.textContent = `Score: ${score} | Best: ${best}`;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

canvas.addEventListener("click", flap);
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    flap();
  }
});

async function init() {
  best = (await Summit.load("flappyBest")) || 0;
  resetGame();
  loop();
}

init();
