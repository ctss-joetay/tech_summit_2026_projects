// ---- Wanderland: a small open-world roguelike/RPG ----
// The world is a grid of tiles you can walk around freely (open world).
// Walking on grass has a chance to trigger a random monster battle.
// Movement is via on-screen ▲◀▼▶ buttons (physical controls) since
// keyboard input isn't reliable in this preview sandbox.

const TILE = 32;
const COLS = 15;
const ROWS = 15;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Tile types: 0 grass, 1 tree (blocked), 2 water (blocked), 3 path, 4 town (heals)
let world = [];

function generateWorld() {
  world = [];
  for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) {
      const r = Math.random();
      if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) {
        row.push(1); // border trees
      } else if (r < 0.08) {
        row.push(1); // tree
      } else if (r < 0.12) {
        row.push(2); // water
      } else {
        row.push(0); // grass
      }
    }
    world.push(row);
  }
  // Clear a starting area and place a town
  world[7][7] = 4;
  for (let y = 6; y <= 8; y++) {
    for (let x = 6; x <= 8; x++) {
      if (world[y][x] !== 4) world[y][x] = 3;
    }
  }
}

const player = {
  x: 7,
  y: 7,
  level: 1,
  hp: 20,
  maxHp: 20,
  xp: 0,
  xpNext: 10,
  gold: 0,
};

let inBattle = false;
let enemy = null;

const monsterTypes = [
  { name: "Slime", hp: 8, atk: 2, xp: 5, gold: 3 },
  { name: "Wolf", hp: 14, atk: 4, xp: 9, gold: 6 },
  { name: "Goblin", hp: 18, atk: 5, xp: 12, gold: 10 },
];

const logEl = document.getElementById("log");
function log(msg) {
  logEl.textContent = msg;
}

function tileColor(t) {
  switch (t) {
    case 0: return "#3a6b35";
    case 1: return "#1f3d1a";
    case 2: return "#2a5d8a";
    case 3: return "#8a7452";
    case 4: return "#c9a34e";
    default: return "#000";
  }
}

function draw() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      ctx.fillStyle = tileColor(world[y][x]);
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
  // player
  ctx.fillStyle = "#e8e8e8";
  ctx.beginPath();
  ctx.arc(player.x * TILE + TILE / 2, player.y * TILE + TILE / 2, TILE / 3, 0, Math.PI * 2);
  ctx.fill();
}

function updateHud() {
  document.getElementById("level").textContent = player.level;
  document.getElementById("hp").textContent = player.hp;
  document.getElementById("maxHp").textContent = player.maxHp;
  document.getElementById("xp").textContent = player.xp;
  document.getElementById("xpNext").textContent = player.xpNext;
  document.getElementById("gold").textContent = player.gold;
}

function isBlocked(x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  const t = world[y][x];
  return t === 1 || t === 2;
}

function tryMove(dx, dy) {
  if (inBattle) return;
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (isBlocked(nx, ny)) return;
  player.x = nx;
  player.y = ny;
  draw();

  const tile = world[ny][nx];
  if (tile === 4) {
    if (player.hp < player.maxHp) {
      player.hp = player.maxHp;
      log("You rest in town. HP fully restored.");
      updateHud();
    } else {
      log("A peaceful town. Nothing to heal here.");
    }
    return;
  }

  if (tile === 0 && Math.random() < 0.15) {
    startBattle();
  } else {
    log("You wander the open fields...");
  }
  save();
}

function startBattle() {
  inBattle = true;
  const template = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
  enemy = { ...template, maxHp: template.hp };
  document.getElementById("battle").classList.remove("hidden");
  document.getElementById("battleTitle").textContent = `A wild ${enemy.name} appears!`;
  document.getElementById("enemyName").textContent = enemy.name;
  refreshBattleUI();
  document.getElementById("battleLog").textContent = "";
}

function refreshBattleUI() {
  document.getElementById("battleHp").textContent = player.hp;
  document.getElementById("enemyHp").textContent = enemy.hp;
}

function battleLog(msg) {
  document.getElementById("battleLog").textContent = msg;
}

function attack() {
  if (!inBattle) return;
  const dmg = 3 + Math.floor(Math.random() * 4) + Math.floor(player.level / 2);
  enemy.hp -= dmg;
  let msg = `You hit the ${enemy.name} for ${dmg}.`;

  if (enemy.hp <= 0) {
    player.xp += enemy.xp;
    player.gold += enemy.gold;
    msg += ` ${enemy.name} defeated! +${enemy.xp} XP, +${enemy.gold} gold.`;
    if (player.xp >= player.xpNext) {
      player.level++;
      player.xp -= player.xpNext;
      player.xpNext = Math.floor(player.xpNext * 1.5);
      player.maxHp += 5;
      player.hp = player.maxHp;
      msg += ` Level up! You are now level ${player.level}.`;
    }
    endBattle(msg);
    return;
  }

  const enemyDmg = enemy.atk + Math.floor(Math.random() * 3);
  player.hp -= enemyDmg;
  msg += ` ${enemy.name} hits back for ${enemyDmg}.`;

  if (player.hp <= 0) {
    player.hp = player.maxHp;
    player.gold = Math.max(0, player.gold - 5);
    msg += " You were defeated! You wake up in town, losing some gold.";
    player.x = 7;
    player.y = 7;
    endBattle(msg);
    return;
  }

  battleLog(msg);
  refreshBattleUI();
  updateHud();
}

function flee() {
  if (!inBattle) return;
  if (Math.random() < 0.5) {
    endBattle("You fled successfully.");
  } else {
    const enemyDmg = enemy.atk;
    player.hp -= enemyDmg;
    if (player.hp <= 0) {
      player.hp = player.maxHp;
      player.x = 7;
      player.y = 7;
      endBattle("Fleeing failed and you were knocked out! Back to town.");
      return;
    }
    battleLog(`Fleeing failed! ${enemy.name} hits you for ${enemyDmg}.`);
    refreshBattleUI();
    updateHud();
  }
}

function endBattle(msg) {
  inBattle = false;
  enemy = null;
  document.getElementById("battle").classList.add("hidden");
  log(msg);
  updateHud();
  draw();
  save();
}

document.getElementById("attackBtn").addEventListener("click", attack);
document.getElementById("fleeBtn").addEventListener("click", flee);

// Physical on-screen controls — the primary way to move.
document.getElementById("upBtn").addEventListener("click", () => tryMove(0, -1));
document.getElementById("downBtn").addEventListener("click", () => tryMove(0, 1));
document.getElementById("leftBtn").addEventListener("click", () => tryMove(-1, 0));
document.getElementById("rightBtn").addEventListener("click", () => tryMove(1, 0));

async function save() {
  try {
    await Summit.save("wanderland", { player, worldSeed: world });
  } catch (err) {
    console.log("Save failed:", err);
  }
}

async function load() {
  try {
    const data = await Summit.load("wanderland");
    if (data && data.player) {
      Object.assign(player, data.player);
      if (data.worldSeed) world = data.worldSeed;
      log("Welcome back, wanderer. Your progress was restored.");
    }
  } catch (err) {
    console.log("Load failed:", err);
  }
}

async function init() {
  generateWorld();
  await load();
  updateHud();
  draw();
}

init();
