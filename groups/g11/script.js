// Canteen Ops Console — simulates students arriving, eating, and leaving,
// printed like a live terminal log, plus a real-time table seating panel
// and a CLI for controlling capacity and table occupancy.

const logWindow = document.getElementById("log-window");
const tablesPanel = document.getElementById("tables-panel");
const cliInput = document.getElementById("cli-input");
const capacityReadout = document.getElementById("capacity-readout");
const blockBar = document.getElementById("block-bar");
const statOccupancy = document.getElementById("stat-occupancy");
const statLoad = document.getElementById("stat-load");
const statWait = document.getElementById("stat-wait");
const statServed = document.getElementById("stat-served");
const statStatus = document.getElementById("stat-status");

const TABLE_COUNT = 8;

let tables = Array.from({ length: TABLE_COUNT }, (_, i) => ({
  id: i + 1,
  capacity: 6,
  occ: 0,
}));

let students = []; // { id, eatSeconds, remaining, tableId }
let nextId = 1;
let servedTotal = 0;
let eatTimeSum = 0;
let eatTimeCount = 0;

function maxOccupancy() {
  return tables.reduce((sum, t) => sum + t.capacity, 0);
}

function totalOcc() {
  return tables.reduce((sum, t) => sum + t.occ, 0);
}

function logLine(text, cls = "") {
  const line = document.createElement("div");
  line.className = "log-line" + (cls ? " " + cls : "");
  line.textContent = text;
  logWindow.appendChild(line);
  logWindow.scrollTop = logWindow.scrollHeight;
  while (logWindow.children.length > 200) {
    logWindow.removeChild(logWindow.firstChild);
  }
}

function clearLog() {
  logWindow.innerHTML = "";
  logLine("log cleared", "boot");
}

function timestamp() {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

function renderBlockBar() {
  const max = maxOccupancy();
  const count = Math.min(totalOcc(), max);
  const filled = "█".repeat(count);
  const empty = "░".repeat(Math.max(max - count, 0));
  blockBar.textContent = filled + empty;
  blockBar.classList.remove("warn", "danger");
  const load = max > 0 ? (count / max) * 100 : 0;
  if (load >= 100) blockBar.classList.add("danger");
  else if (load >= 80) blockBar.classList.add("warn");
  capacityReadout.textContent = String(max);
}

// Draws each table as a small Unicode box, two per row, side by side.
function renderTables() {
  const boxWidth = 13; // inside width
  const boxes = tables.map((t) => {
    const label = `TABLE ${String(t.id).padStart(2, "0")}`;
    const barLen = boxWidth - 2;
    const filledCount = t.capacity > 0 ? Math.round((t.occ / t.capacity) * barLen) : 0;
    const bar = "█".repeat(filledCount) + "░".repeat(Math.max(barLen - filledCount, 0));
    const top = "┌" + "─".repeat(boxWidth) + "┐";
    const l1 = "│" + center(label, boxWidth) + "│";
    const l2 = "│" + center(`${t.occ}/${t.capacity}`, boxWidth) + "│";
    const l3 = "│" + center(bar, boxWidth) + "│";
    const bottom = "└" + "─".repeat(boxWidth) + "┘";
    return [top, l1, l2, l3, bottom];
  });

  let output = "";
  for (let i = 0; i < boxes.length; i += 2) {
    const left = boxes[i];
    const right = boxes[i + 1];
    for (let row = 0; row < left.length; row++) {
      output += left[row] + "  " + (right ? right[row] : "") + "\n";
    }
    output += "\n";
  }
  tablesPanel.textContent = output;
}

function occLineFudge() { return 0; }

function center(text, width) {
  const pad = width - text.length;
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return " ".repeat(Math.max(left, 0)) + text + " ".repeat(Math.max(right, 0));
}

function updateStats() {
  const count = totalOcc();
  const max = maxOccupancy();
  const load = max > 0 ? Math.round((count / max) * 100) : 0;
  statOccupancy.textContent = `${count} / ${max}`;
  statLoad.textContent = `${load}%`;
  statServed.textContent = String(servedTotal);
  const avgWait = eatTimeCount > 0 ? (eatTimeSum / eatTimeCount) : 0;
  statWait.textContent = `${avgWait.toFixed(1)}s`;

  statStatus.classList.remove("warn", "danger");
  if (load >= 100) {
    statStatus.textContent = "OVERCROWDED";
    statStatus.classList.add("danger");
  } else if (load >= 80) {
    statStatus.textContent = "NEAR CAPACITY";
    statStatus.classList.add("warn");
  } else {
    statStatus.textContent = "NOMINAL";
  }

  renderBlockBar();
  renderTables();
}

function findOpenTable() {
  return tables.find((t) => t.occ < t.capacity);
}

function tryArrival() {
  const table = findOpenTable();
  if (!table) {
    logLine(`[${timestamp()}] ARRIVAL REJECTED — all tables full (${totalOcc()}/${maxOccupancy()})`, "warn");
    return;
  }
  const id = nextId++;
  const eatSeconds = 8 + Math.random() * 12;
  students.push({ id, eatSeconds, remaining: eatSeconds, tableId: table.id });
  table.occ++;
  logLine(`[${timestamp()}] Student_${String(id).padStart(3, "0")} seated @ table ${table.id} — est. ${eatSeconds.toFixed(1)}s`, "seat");
}

function tick(deltaSeconds) {
  const stillEating = [];
  for (const s of students) {
    s.remaining -= deltaSeconds;
    if (s.remaining <= 0) {
      servedTotal++;
      eatTimeSum += s.eatSeconds;
      eatTimeCount++;
      const table = tables.find((t) => t.id === s.tableId);
      if (table && table.occ > 0) table.occ--;
      logLine(`[${timestamp()}] Student_${String(s.id).padStart(3, "0")} finished @ table ${s.tableId} and left`, "leave");
    } else {
      stillEating.push(s);
    }
  }
  students = stillEating;

  if (totalOcc() >= maxOccupancy()) {
    logLine(`[${timestamp()}] WARNING: canteen at full capacity`, "danger");
  }

  updateStats();
}

const HELP_TEXT = [
  "available commands:",
  "  help                     show this list",
  "  clear                    clear the log window",
  "  set-capacity <#> <n>     set table <#>'s capacity to n (1-20)",
  "  occ <#> <n>              manually set table <#>'s occupancy to n",
  "  list                     print current state of all tables",
  "  reset                    clear all tables and stats",
];

function runCommand(raw) {
  const input = raw.trim();
  if (!input) return;
  logLine(`> ${input}`, "boot");
  const parts = input.split(/\s+/);
  const cmd = parts[0].toLowerCase();

  if (cmd === "help") {
    HELP_TEXT.forEach((line) => logLine(line, "boot"));
    return;
  }

  if (cmd === "clear") {
    clearLog();
    return;
  }

  if (cmd === "list") {
    tables.forEach((t) => logLine(`table ${t.id}: ${t.occ}/${t.capacity}`, "boot"));
    return;
  }

  if (cmd === "reset") {
    tables = Array.from({ length: TABLE_COUNT }, (_, i) => ({ id: i + 1, capacity: 6, occ: 0 }));
    students = [];
    servedTotal = 0;
    eatTimeSum = 0;
    eatTimeCount = 0;
    logLine(`[${timestamp()}] simulation reset`, "boot");
    updateStats();
    return;
  }

  if (cmd === "set-capacity") {
    const tableId = Number(parts[1]);
    const n = Number(parts[2]);
    const table = tables.find((t) => t.id === tableId);
    if (!table || !Number.isFinite(n) || n < 1 || n > 20) {
      logLine(`usage: set-capacity <table 1-${TABLE_COUNT}> <capacity 1-20>`, "warn");
      return;
    }
    table.capacity = Math.round(n);
    if (table.occ > table.capacity) table.occ = table.capacity;
    logLine(`[${timestamp()}] table ${table.id} capacity set to ${table.capacity}`, "boot");
    updateStats();
    return;
  }

  if (cmd === "occ") {
    const tableId = Number(parts[1]);
    const n = Number(parts[2]);
    const table = tables.find((t) => t.id === tableId);
    if (!table || !Number.isFinite(n) || n < 0) {
      logLine(`usage: occ <table 1-${TABLE_COUNT}> <occupancy>`, "warn");
      return;
    }
    table.occ = Math.min(Math.round(n), table.capacity);
    logLine(`[${timestamp()}] table ${table.id} occupancy set to ${table.occ}/${table.capacity}`, "boot");
    updateStats();
    return;
  }

  logLine(`unknown command: "${cmd}" — type 'help' for a list`, "warn");
}

cliInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  runCommand(cliInput.value);
  cliInput.value = "";
});

function scheduleArrivals() {
  tryArrival();
  const nextIn = 400 + Math.random() * 900;
  setTimeout(scheduleArrivals, nextIn);
}

setInterval(() => tick(1), 1000);
scheduleArrivals();
logLine("type 'help' for a list of commands", "boot");
updateStats();

console.log("Canteen Ops Console running");
