// Canteen Ops Console — simulates students arriving, eating, and leaving,
// printed like a live terminal log, plus a real-time table seating panel
// and a CLI for controlling capacity and table occupancy.

const logWindow = document.getElementById("log-window");
const cliOutput = document.getElementById("cli-output");
const tablesPanel = document.getElementById("tables-panel");
const cliInput = document.getElementById("cli-input");
const capacityReadout = document.getElementById("capacity-readout");
const blockBar = document.getElementById("block-bar");
const statOccupancy = document.getElementById("stat-occupancy");
const statLoad = document.getElementById("stat-load");
const statWait = document.getElementById("stat-wait");
const statServed = document.getElementById("stat-served");
const statStatus = document.getElementById("stat-status");
const rateReadout = document.getElementById("rate-readout");

const TABLE_COUNT = 8;

const RATE_PRESETS = {
  quiet: { label: "QUIET", min: 1500, max: 3000, cls: "" },
  normal: { label: "NORMAL", min: 400, max: 900, cls: "" },
  peak: { label: "PEAK", min: 80, max: 250, cls: "warn" },
  rush: { label: "RUSH", min: 30, max: 100, cls: "danger" },
};

let currentRate = RATE_PRESETS.normal;

const THEMES = {
  matrix: { accent: "#33ff66", accentDim: "#1c8f3d", text: "#c9ffd6", border: "#1f3a26", bg: "#0a0d0a", panel: "#0f1410" },
  amber: { accent: "#ffb000", accentDim: "#8f5f00", text: "#ffe6b3", border: "#3a2a10", bg: "#0d0a06", panel: "#14100a" },
  ocean: { accent: "#33ccff", accentDim: "#1c6f8f", text: "#c9f0ff", border: "#1f3040", bg: "#080b0d", panel: "#0d1216" },
  crimson: { accent: "#ff3355", accentDim: "#8f1c2d", text: "#ffc9d1", border: "#3a1f24", bg: "#0d0808", panel: "#140a0b" },
  mono: { accent: "#e6e6e6", accentDim: "#888888", text: "#dcdcdc", border: "#2a2a2a", bg: "#0a0a0a", panel: "#111111" },
};

let currentThemeName = "matrix";

function applyTheme(name) {
  const t = THEMES[name];
  if (!t) return false;
  const root = document.documentElement.style;
  root.setProperty("--accent", t.accent);
  root.setProperty("--accent-dim", t.accentDim);
  root.setProperty("--text", t.text);
  root.setProperty("--border", t.border);
  root.setProperty("--bg", t.bg);
  root.setProperty("--panel", t.panel);
  currentThemeName = name;
  return true;
}

function renderRateReadout() {
  rateReadout.textContent = `RATE: ${currentRate.label}`;
  rateReadout.classList.remove("warn", "danger");
  if (currentRate.cls) rateReadout.classList.add(currentRate.cls);
}

let tables = Array.from({ length: TABLE_COUNT }, (_, i) => ({
  id: i + 1,
  capacity: 6,
  occ: 0,
}));

let nextTableId = TABLE_COUNT + 1;
let layoutCols = 2;     // how many table boxes per row
let arrangeMode = "id"; // "id" or "load" — live sort order of the table map

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

function cliLine(text, cls = "") {
  const line = document.createElement("div");
  line.className = "log-line" + (cls ? " " + cls : "");
  line.textContent = text;
  cliOutput.appendChild(line);
  cliOutput.scrollTop = cliOutput.scrollHeight;
  while (cliOutput.children.length > 200) {
    cliOutput.removeChild(cliOutput.firstChild);
  }
}

function clearCliOutput() {
  cliOutput.innerHTML = "";
  cliLine("cli output cleared", "boot");
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

// Draws each table as a small Unicode box, arranged live in a grid whose
// column count and sort order can both be changed from the CLI.
function renderTables() {
  const boxWidth = 13; // inside width
  const ordered = [...tables].sort((a, b) => {
    if (arrangeMode === "load") {
      const loadA = a.capacity > 0 ? a.occ / a.capacity : 0;
      const loadB = b.capacity > 0 ? b.occ / b.capacity : 0;
      return loadB - loadA; // busiest first
    }
    return a.id - b.id;
  });

  const boxes = ordered.map((t) => {
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

  const cols = Math.max(1, layoutCols);
  let output = "";
  for (let i = 0; i < boxes.length; i += cols) {
    const row = boxes.slice(i, i + cols);
    for (let line = 0; line < row[0].length; line++) {
      output += row.map((box) => box[line]).join("  ") + "\n";
    }
    output += "\n";
  }
  tablesPanel.textContent = output;
}

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
  "available commands:  (append -o to any command to list its options)",
  "  help                     show this list",
  "  clear                    clear the cli output pane",
  "  clear-log                clear the event log pane",
  "  set-capacity <#> <n>     set table <#>'s capacity to n (1-20)",
  "  occ <#> <n>              manually set table <#>'s occupancy to n",
  "  list                     print current state of all tables",
  "  rate <quiet|normal|peak|rush>  set arrival flow rate",
  "  add-table <capacity>     add a new table (default capacity 6)",
  "  remove-table <#>         remove a table (its students leave)",
  "  cols <n>                 set table map columns (layout width)",
  "  arrange <id|load>        sort table map by id or by live load",
  "  theme <name>             change the console colour palette",
  "  reset                    clear all tables and stats",
  "",
  "  try: rate -o, theme -o, arrange -o, cols -o",
];

// per-command option lists, shown when a command is run with '-o'
const OPTIONS = {
  rate: Object.keys(RATE_PRESETS),
  theme: Object.keys(THEMES),
  arrange: ["id", "load"],
  cols: ["1", "2", "3", "4", "5", "6", "7", "8"],
};

// Prints a line of colored Unicode blocks (████) next to a theme's name so
// its palette can be previewed before switching to it.
function cliThemeSwatchLine(name) {
  const t = THEMES[name];
  const line = document.createElement("div");
  line.className = "log-line boot";

  const label = document.createElement("span");
  label.textContent = `  ${name.padEnd(8, " ")} `;
  line.appendChild(label);

  const swatchColors = [t.accent, t.accentDim, t.text, t.panel, t.bg];
  swatchColors.forEach((color) => {
    const swatch = document.createElement("span");
    swatch.textContent = "████";
    swatch.style.color = color;
    line.appendChild(swatch);
  });

  cliOutput.appendChild(line);
  cliOutput.scrollTop = cliOutput.scrollHeight;
  while (cliOutput.children.length > 200) {
    cliOutput.removeChild(cliOutput.firstChild);
  }
}

function printOptions(cmd) {
  const opts = OPTIONS[cmd];
  if (!opts) {
    cliLine(`"${cmd}" takes no fixed set of options — see 'help'`, "warn");
    return;
  }
  cliLine(`options for ${cmd}:`, "boot");
  if (cmd === "theme") {
    opts.forEach((o) => cliThemeSwatchLine(o));
    return;
  }
  opts.forEach((o) => cliLine(`  ${o}`, "boot"));
}

function runCommand(raw) {
  const input = raw.trim();
  if (!input) return;
  cliLine(`> ${input}`, "boot");
  const parts = input.split(/\s+/);
  const cmd = parts[0].toLowerCase();

  if (parts[1] === "-o" || parts[1] === "--options") {
    printOptions(cmd);
    return;
  }

  if (cmd === "help") {
    HELP_TEXT.forEach((line) => cliLine(line, "boot"));
    return;
  }

  if (cmd === "clear") {
    clearCliOutput();
    return;
  }

  if (cmd === "clear-log") {
    clearLog();
    return;
  }

  if (cmd === "list") {
    tables.forEach((t) => cliLine(`table ${t.id}: ${t.occ}/${t.capacity}`, "boot"));
    return;
  }

  if (cmd === "reset") {
    tables = Array.from({ length: TABLE_COUNT }, (_, i) => ({ id: i + 1, capacity: 6, occ: 0 }));
    students = [];
    servedTotal = 0;
    eatTimeSum = 0;
    eatTimeCount = 0;
    cliLine(`[${timestamp()}] simulation reset`, "boot");
    updateStats();
    return;
  }

  if (cmd === "set-capacity") {
    const tableId = Number(parts[1]);
    const n = Number(parts[2]);
    const table = tables.find((t) => t.id === tableId);
    if (!table || !Number.isFinite(n) || n < 1 || n > 20) {
      cliLine(`usage: set-capacity <table id> <capacity 1-20> — try 'list' for valid ids`, "warn");
      return;
    }
    table.capacity = Math.round(n);
    if (table.occ > table.capacity) table.occ = table.capacity;
    cliLine(`[${timestamp()}] table ${table.id} capacity set to ${table.capacity}`, "boot");
    updateStats();
    return;
  }

  if (cmd === "occ") {
    const tableId = Number(parts[1]);
    const n = Number(parts[2]);
    const table = tables.find((t) => t.id === tableId);
    if (!table || !Number.isFinite(n) || n < 0) {
      cliLine(`usage: occ <table id> <occupancy> — try 'list' for valid ids`, "warn");
      return;
    }
    table.occ = Math.min(Math.round(n), table.capacity);
    cliLine(`[${timestamp()}] table ${table.id} occupancy set to ${table.occ}/${table.capacity}`, "boot");
    updateStats();
    return;
  }

  if (cmd === "rate") {
    const key = (parts[1] || "").toLowerCase();
    const preset = RATE_PRESETS[key];
    if (!preset) {
      cliLine("usage: rate <quiet|normal|peak|rush>", "warn");
      return;
    }
    currentRate = preset;
    renderRateReadout();
    cliLine(`[${timestamp()}] arrival rate set to ${preset.label}`, "boot");
    return;
  }

  if (cmd === "add-table") {
    const cap = Number(parts[1]) || 6;
    if (cap < 1 || cap > 20) {
      cliLine("usage: add-table <capacity 1-20>", "warn");
      return;
    }
    const table = { id: nextTableId++, capacity: Math.round(cap), occ: 0 };
    tables.push(table);
    cliLine(`[${timestamp()}] table ${table.id} added (capacity ${table.capacity})`, "boot");
    updateStats();
    return;
  }

  if (cmd === "remove-table") {
    const tableId = Number(parts[1]);
    const idx = tables.findIndex((t) => t.id === tableId);
    if (idx === -1) {
      cliLine("usage: remove-table <table id> — try 'list' for valid ids", "warn");
      return;
    }
    students = students.filter((s) => s.tableId !== tableId);
    tables.splice(idx, 1);
    cliLine(`[${timestamp()}] table ${tableId} removed`, "boot");
    updateStats();
    return;
  }

  if (cmd === "cols") {
    const n = Number(parts[1]);
    if (!Number.isFinite(n) || n < 1 || n > 8) {
      cliLine("usage: cols <1-8>  (table map columns)", "warn");
      return;
    }
    layoutCols = Math.round(n);
    cliLine(`[${timestamp()}] table map now ${layoutCols} column(s) wide`, "boot");
    updateStats();
    return;
  }

  if (cmd === "arrange") {
    const mode = (parts[1] || "").toLowerCase();
    if (mode !== "id" && mode !== "load") {
      cliLine("usage: arrange <id|load>", "warn");
      return;
    }
    arrangeMode = mode;
    cliLine(`[${timestamp()}] table map now arranged by ${mode}`, "boot");
    updateStats();
    return;
  }

  if (cmd === "theme") {
    const name = (parts[1] || "").toLowerCase();
    if (!applyTheme(name)) {
      cliLine(`usage: theme <${Object.keys(THEMES).join("|")}>  (try 'theme -o')`, "warn");
      return;
    }
    cliLine(`[${timestamp()}] theme switched to ${name}`, "boot");
    return;
  }

  cliLine(`unknown command: "${cmd}" — type 'help' for a list, or '<command> -o' for its options`, "warn");
}

cliInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  runCommand(cliInput.value);
  cliInput.value = "";
});

function scheduleArrivals() {
  tryArrival();
  const nextIn = currentRate.min + Math.random() * (currentRate.max - currentRate.min);
  setTimeout(scheduleArrivals, nextIn);
}

setInterval(() => tick(1), 1000);
scheduleArrivals();
renderRateReadout();
logLine("type 'help' for a list of commands", "boot");
updateStats();

console.log("Canteen Ops Console running — try 'theme -o' or 'rate -o' in the CLI");
