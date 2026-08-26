// Arena Bots — simple top-down shooter vs AI, single player (no networking possible in-browser).
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hudEl = document.getElementById("hud");
const bestEl = document.getElementById("best");
const messageEl = document.getElementById("message");

const W = canvas.width;
const H = canvas.height;

let player, bullets, bots, score, hp, gameRunning, best;
const keys = {};
let mouseX = W / 2;
let mouseY = H / 2;

// The canvas is scaled with CSS to fit smaller screens (like an iPad), but its
// internal drawing resolution stays 600x500. This converts a real screen
// coordinate (from a tap or click) into that internal game coordinate.
function getGamePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function resetGame() {
  player = { x: W / 2, y: H / 2, r: 14, speed: 3 };
  bullets = [];
  bots = [];
  score = 0;
  hp = 100;
  gameRunning = true;
  messageEl.textContent = "";
  spawnBot();
}

function spawnBot() {
  // Bots get slightly tougher/faster as score rises — simple difficulty "matchmaking".
  const difficulty = Math.floor(score / 5);
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) { x = 0; y = Math.random() * H; }
  else if (edge === 1) { x = W; y = Math.random() * H; }
  else if (edge === 2) { x = Math.random() * W; y = 0; }
  else { x = Math.random() * W; y = H; }

  bots.push({
    x, y, r: 13,
    speed: 1 + Math.min(difficulty * 0.15, 2),
    hp: 2 + Math.min(difficulty, 4),
    cooldown: 0,
  });
}

function update() {
  if (!gameRunning) return;

  // Player movement
  let dx = 0, dy = 0;
  if (keys["arrowup"] || keys["w"]) dy -= 1;
  if (keys["arrowdown"] || keys["s"]) dy += 1;
  if (keys["arrowleft"] || keys["a"]) dx -= 1;
  if (keys["arrowright"] || keys["d"]) dx += 1;
  const len = Math.hypot(dx, dy) || 1;
  player.x += (dx / len) * player.speed;
  player.y += (dy / len) * player.speed;
  player.x = Math.max(player.r, Math.min(W - player.r, player.x));
  player.y = Math.max(player.r, Math.min(H - player.r, player.y));

  // Bullets
  bullets.forEach((b) => {
    b.x += b.vx;
    b.y += b.vy;
  });
  bullets = bullets.filter((b) => b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);

  // Bots chase player and shoot
  bots.forEach((bot) => {
    const angle = Math.atan2(player.y - bot.y, player.x - bot.x);
    bot.x += Math.cos(angle) * bot.speed;
    bot.y += Math.sin(angle) * bot.speed;

    bot.cooldown--;
    if (bot.cooldown <= 0 && Math.hypot(player.x - bot.x, player.y - bot.y) < 300) {
      bullets.push({
        x: bot.x, y: bot.y,
        vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
        fromBot: true,
      });
      bot.cooldown = 90;
    }
  });

  // Bullet vs bot / player collisions
  bullets.forEach((b) => {
    if (b.fromBot) {
      if (Math.hypot(b.x - player.x, b.y - player.y) < player.r) {
        hp -= 8;
        b.hit = true;
      }
    } else {
      bots.forEach((bot) => {
        if (!bot.dead && Math.hypot(b.x - bot.x, b.y - bot.y) < bot.r) {
          bot.hp -= 1;
          b.hit = true;
          if (bot.hp <= 0) bot.dead = true;
        }
      });
    }
  });
  bullets = bullets.filter((b) => !b.hit);

  const killed = bots.filter((bot) => bot.dead).length;
  if (killed > 0) {
    score += killed;
    bots = bots.filter((bot) => !bot.dead);
  }

  // Keep at least one bot on screen, add more as score grows
  const wanted = 1 + Math.floor(score / 5);
  while (bots.length < wanted) spawnBot();

  if (hp <= 0) endGame();
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Player — drawn as an arrow pointing toward the aim direction
  const aimAngle = Math.atan2(mouseY - player.y, mouseX - player.x);
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(aimAngle);
  ctx.fillStyle = "#4fc3f7";
  ctx.beginPath();
  ctx.moveTo(player.r + 6, 0);        // tip
  ctx.lineTo(-player.r, player.r);    // back-left
  ctx.lineTo(-player.r * 0.4, 0);     // notch in the back
  ctx.lineTo(-player.r, -player.r);   // back-right
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Aim line
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(mouseX, mouseY);
  ctx.stroke();

  // Bots
  ctx.fillStyle = "#ff5722";
  bots.forEach((bot) => {
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, bot.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Bullets
  bullets.forEach((b) => {
    ctx.fillStyle = b.fromBot ? "#ffeb3b" : "#ffffff";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  hudEl.textContent = `Score: ${score} | HP: ${Math.max(hp, 0)}`;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function endGame() {
  gameRunning = false;
  messageEl.textContent = `Game over! Score: ${score}. Tap to try again.`;
  if (score > best) {
    best = score;
    bestEl.textContent = `Best score: ${best}`;
    Summit.save("arenaBotsBest", best);
    Summit.submitScore("Player", best);
  }
}

// Tapping/clicking the canvas shoots toward the tap/click position.
// This works the same with a mouse or a finger on a touchscreen (iPad, etc.),
// and getGamePos() accounts for the canvas being scaled smaller on tablets.
canvas.addEventListener("pointerdown", (e) => {
  const pos = getGamePos(e);
  mouseX = pos.x;
  mouseY = pos.y;

  if (!gameRunning) {
    resetGame();
    return;
  }
  const angle = Math.atan2(pos.y - player.y, pos.x - player.x);
  bullets.push({
    x: player.x, y: player.y,
    vx: Math.cos(angle) * 7, vy: Math.sin(angle) * 7,
    fromBot: false,
  });
});

// pointermove covers mouse movement AND a finger dragging on touch devices,
// so the aim line follows a finger on an iPad too.
canvas.addEventListener("pointermove", (e) => {
  const pos = getGamePos(e);
  mouseX = pos.x;
  mouseY = pos.y;
});

canvas.style.touchAction = "none";

window.addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

async function init() {
  best = (await Summit.load("arenaBotsBest")) || 0;
  bestEl.textContent = `Best score: ${best}`;
  gameRunning = false;
  player = { x: W / 2, y: H / 2, r: 14, speed: 3 };
  bots = [];
  bullets = [];
  score = 0;
  hp = 100;
  draw();
}

init();
loop();
