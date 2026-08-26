// --- 2D Sandbox: block world + a walking player ---

const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");

const CELL = 24;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;

// 0 = air, 1 grass, 2 dirt, 3 stone, 4 wood, 5 seed, 6 leaves, 7 water
const COLORS = { 1: "#4caf50", 2: "#8b5a2b", 3: "#888888", 4: "#c68642", 5: "#dcd48e", 6: "#2e7d32", 7: "#3aa0e6" };

// Blocks that fall when unsupported. Stone and wood are sturdy and stay put once placed.
const FALLS = new Set([2, 5, 7]);

let grid = makeStartingGrid();

function makeStartingGrid() {
  const g = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(r >= ROWS - 3 ? 2 : 0); // a dirt floor to start on
    }
    g.push(row);
  }
  return g;
}

function isSolid(col, row) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return true; // world edges block
  const v = grid[row][col];
  return v !== 0 && v !== 5 && v !== 6 && v !== 7; // seeds, leaves and water don't block the player
}

// ---- Painting blocks ----
let currentBlock = 1;
let painting = null; // "place" or "erase"

document.querySelectorAll(".block-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".block-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    currentBlock = Number(btn.dataset.block);
  });
});
document.querySelector(".block-btn").classList.add("selected");

function cellFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  return { col: Math.floor(x / CELL), row: Math.floor(y / CELL) };
}

function paintAt(e) {
  if (!painting) return;
  const { col, row } = cellFromEvent(e);
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
  const key = `${row},${col}`;
  // Right-click always erases. Left-click erases too if the Erase tool (block 0) is selected.
  if (painting === "erase" || currentBlock === 0) {
    grid[row][col] = 0;
    growTimers.delete(key);
  } else {
    grid[row][col] = currentBlock;
  }
}

canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("mousedown", (e) => {
  painting = e.button === 2 ? "erase" : "place";
  paintAt(e);
});
window.addEventListener("mouseup", () => (painting = null));
canvas.addEventListener("mousemove", paintAt);

// ---- Block gravity: loose blocks (dirt, seeds, water) fall when unsupported. ----
// Stone and wood are sturdy and stay exactly where placed, so building doesn't collapse.
// Water also spreads sideways into empty space when it can't fall any further, like a simple liquid.
const FALL_INTERVAL = 0.08; // seconds between falling steps, so it's visible not instant
let fallTimer = 0;
let spreadFlip = false; // alternate which side water tries first, so it doesn't always favour one direction

function applyBlockGravity() {
  // Work from the bottom row up so a whole falling stack shifts down cleanly in one pass.
  for (let r = ROWS - 2; r >= 0; r--) {
    for (let c = 0; c < COLS; c++) {
      const v = grid[r][c];
      if (!FALLS.has(v)) continue;
      if (grid[r + 1][c] === 0) {
        grid[r + 1][c] = v;
        grid[r][c] = 0;
      } else if (v === 7) {
        // Water that can't fall further tries to spread sideways.
        const dirs = spreadFlip ? [-1, 1] : [1, -1];
        for (const d of dirs) {
          const nc = c + d;
          if (nc >= 0 && nc < COLS && grid[r][nc] === 0) {
            grid[r][nc] = 7;
            grid[r][c] = 0;
            break;
          }
        }
      }
    }
  }
  spreadFlip = !spreadFlip;
}

// ---- Seeds growing into trees (need to be on grass, near water) ----
const GROW_TIME = 4; // seconds a seed needs, resting on grass near water, before it grows
const TRUNK_HEIGHT = 3;
const WATER_RANGE = 2; // how many cells away water can be and still count
const growTimers = new Map(); // "row,col" -> seconds accumulated

function hasNearbyWater(r, c) {
  for (let dr = -WATER_RANGE; dr <= WATER_RANGE; dr++) {
    for (let dc = -WATER_RANGE; dc <= WATER_RANGE; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && grid[rr][cc] === 7) return true;
    }
  }
  return false;
}

function updateSeeds(dt) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== 5) continue;
      const key = `${r},${c}`;
      const onGrass = r + 1 < ROWS && grid[r + 1][c] === 1;
      if (!onGrass || !hasNearbyWater(r, c)) {
        growTimers.delete(key);
        continue;
      }
      const t = (growTimers.get(key) || 0) + dt;
      if (t >= GROW_TIME) {
        growTimers.delete(key);
        growTree(r, c);
      } else {
        growTimers.set(key, t);
      }
    }
  }
}

function growTree(r, c) {
  // Only grow if there's clear air above for the trunk + leaves.
  let top = r;
  for (let i = 1; i <= TRUNK_HEIGHT; i++) {
    if (r - i < 0 || grid[r - i][c] !== 0) return; // not enough room, stay a seed
    top = r - i;
  }
  for (let i = 1; i <= TRUNK_HEIGHT; i++) {
    grid[r - i][c] = 4; // trunk
  }
  // A little leafy crown around the top of the trunk.
  for (let dr = -1; dr <= 0; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const lr = top - 1 + dr;
      const lc = c + dc;
      if (lr >= 0 && lr < ROWS && lc >= 0 && lc < COLS && grid[lr][lc] === 0) {
        grid[lr][lc] = 6;
      }
    }
  }
}

// ---- Player ----
const player = {
  x: CELL * 2,
  y: CELL * (ROWS - 4),
  w: CELL * 0.8,
  h: CELL * 1.6,
  vx: 0,
  vy: 0,
  onGround: false,
  facing: 1, // 1 = right, -1 = left
};

const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === "f" || e.key === "F") breakTargetBlock();
  if (e.key === "g" || e.key === "G") placeTargetBlock();
});
window.addEventListener("keyup", (e) => (keys[e.key] = false));

const GRAVITY = 1200; // px/s^2
const MOVE_SPEED = 180;
const JUMP_SPEED = 480;

function rectHitsSolid(x, y, w, h) {
  const left = Math.floor(x / CELL);
  const right = Math.floor((x + w - 1) / CELL);
  const top = Math.floor(y / CELL);
  const bottom = Math.floor((y + h - 1) / CELL);
  for (let r = top; r <= bottom; r++) {
    for (let c = left; c <= right; c++) {
      if (isSolid(c, r)) return true;
    }
  }
  return false;
}

// The cell just in front of the player, at chest height - what F/G act on.
function targetCell() {
  const centerRow = Math.floor((player.y + player.h / 2) / CELL);
  const col = Math.floor((player.x + player.w / 2) / CELL) + player.facing;
  return { row: centerRow, col };
}

function breakTargetBlock() {
  const { row, col } = targetCell();
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
  if (grid[row][col] === 0) return;
  grid[row][col] = 0;
  growTimers.delete(`${row},${col}`);
  statusEl.textContent = "Broke a block.";
}

function placeTargetBlock() {
  const { row, col } = targetCell();
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
  if (currentBlock === 0) return; // Erase tool selected - nothing to place
  if (grid[row][col] !== 0) return; // already something there
  // Don't let the player place a block on top of themselves.
  if (rectHitsSolidWithValue(player.x, player.y, player.w, player.h, col, row, currentBlock)) return;
  grid[row][col] = currentBlock;
  statusEl.textContent = "Placed a block.";
}

function rectHitsSolidWithValue(x, y, w, h, testCol, testRow, testValue) {
  if (testValue === 0 || testValue === 5 || testValue === 6 || testValue === 7) return false;
  const left = Math.floor(x / CELL);
  const right = Math.floor((x + w - 1) / CELL);
  const top = Math.floor(y / CELL);
  const bottom = Math.floor((y + h - 1) / CELL);
  return testRow >= top && testRow <= bottom && testCol >= left && testCol <= right;
}

function updatePlayer(dt) {
  player.vx = 0;
  if (keys["a"] || keys["ArrowLeft"]) {
    player.vx = -MOVE_SPEED;
    player.facing = -1;
  }
  if (keys["d"] || keys["ArrowRight"]) {
    player.vx = MOVE_SPEED;
    player.facing = 1;
  }
  if ((keys[" "] || keys["Spacebar"]) && player.onGround) {
    player.vy = -JUMP_SPEED;
    player.onGround = false;
  }

  player.vy += GRAVITY * dt;

  let newX = player.x + player.vx * dt;
  if (!rectHitsSolid(newX, player.y, player.w, player.h)) {
    player.x = newX;
  }

  let newY = player.y + player.vy * dt;
  if (!rectHitsSolid(player.x, newY, player.w, player.h)) {
    player.y = newY;
    player.onGround = false;
  } else {
    if (player.vy > 0) player.onGround = true;
    player.vy = 0;
  }

  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
}

// ---- Drawing ----
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = grid[r][c];
      if (v !== 0) {
        ctx.fillStyle = COLORS[v];
        ctx.globalAlpha = v === 7 ? 0.75 : 1;
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
      }
    }
  }

  // Highlight the cell the player can interact with.
  const { row, col } = targetCell();
  if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
    ctx.strokeStyle = "rgba(255,255,0,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(col * CELL + 1, row * CELL + 1, CELL - 2, CELL - 2);
    ctx.lineWidth = 1;
  }

  ctx.fillStyle = "#e63946";
  ctx.fillRect(player.x, player.y, player.w, player.h);
}

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  fallTimer += dt;
  if (fallTimer >= FALL_INTERVAL) {
    fallTimer = 0;
    applyBlockGravity();
  }

  updateSeeds(dt);
  updatePlayer(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---- Save / load with Summit runtime ----
document.getElementById("save-btn").addEventListener("click", async () => {
  await Summit.save("sandboxWorld", grid);
  statusEl.textContent = "World saved!";
});

document.getElementById("load-btn").addEventListener("click", async () => {
  const saved = await Summit.load("sandboxWorld");
  if (saved) {
    grid = saved;
    statusEl.textContent = "World loaded!";
  } else {
    statusEl.textContent = "No saved world found.";
  }
});

document.getElementById("clear-btn").addEventListener("click", () => {
  grid = makeStartingGrid();
  growTimers.clear();
  statusEl.textContent = "World cleared.";
});
</content>
</invoke>
