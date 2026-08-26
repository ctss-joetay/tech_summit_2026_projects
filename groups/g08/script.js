// Sleep Tracker
// Data shape: { goal: number (hours), entries: [{id, date, bed, wake, hours}] }

let goal = 8;
let entries = [];

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Compute hours slept, handling sleep that crosses midnight
function computeHours(bed, wake) {
  const [bh, bm] = bed.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  let bedMinutes = bh * 60 + bm;
  let wakeMinutes = wh * 60 + wm;
  if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60; // crossed midnight
  return Math.round(((wakeMinutes - bedMinutes) / 60) * 100) / 100;
}

async function loadData() {
  const savedGoal = await Summit.load("sleepGoal");
  const savedEntries = await Summit.load("sleepEntries");
  if (typeof savedGoal === "number") goal = savedGoal;
  if (Array.isArray(savedEntries)) entries = savedEntries;

  const goalInput = document.getElementById("goal-input");
  if (goalInput) goalInput.value = goal;

  const dateInput = document.getElementById("sleep-date");
  if (dateInput) dateInput.value = todayKey();

  render();
}

function saveGoal() {
  Summit.save("sleepGoal", goal);
}

function saveEntries() {
  Summit.save("sleepEntries", entries);
}

function sortedEntries() {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

function render() {
  renderLog();
  renderSummary();
}

function renderLog() {
  const list = document.getElementById("sleep-log");
  const empty = document.getElementById("log-empty");
  if (!list || !empty) return;

  list.innerHTML = "";
  const sorted = sortedEntries().slice().reverse(); // newest first

  if (sorted.length === 0) {
    empty.classList.remove("hidden");
  } else {
    empty.classList.add("hidden");
  }

  sorted.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "log-item";

    const info = document.createElement("span");
    info.className = "log-info";
    info.textContent = `${entry.date} — bed ${entry.bed}, wake ${entry.wake} (${entry.hours}h)`;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => removeEntry(entry.id));

    li.appendChild(info);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

function renderSummary() {
  const lastEl = document.getElementById("last-night");
  const avgEl = document.getElementById("avg-sleep");
  const statusEl = document.getElementById("goal-status");
  const fillEl = document.getElementById("progress-fill");
  if (!lastEl || !avgEl || !statusEl || !fillEl) return;

  const sorted = sortedEntries();
  const last = sorted[sorted.length - 1];

  if (last) {
    lastEl.textContent = `Last night: ${last.hours}h (${last.date})`;
  } else {
    lastEl.textContent = "Last night: —";
  }

  const recent = sorted.slice(-7);
  if (recent.length > 0) {
    const avg = recent.reduce((sum, e) => sum + e.hours, 0) / recent.length;
    avgEl.textContent = `${recent.length}-night average: ${Math.round(avg * 100) / 100}h`;
  } else {
    avgEl.textContent = "7-night average: —";
  }

  if (goal > 0 && last) {
    const pct = Math.min(100, (last.hours / goal) * 100);
    fillEl.style.width = pct + "%";

    if (last.hours < goal) {
      statusEl.textContent = `${Math.round((goal - last.hours) * 100) / 100}h short of your ${goal}h goal last night.`;
      fillEl.classList.remove("over");
    } else {
      statusEl.textContent = `You met your ${goal}h goal last night.`;
      fillEl.classList.add("over");
    }
  } else {
    fillEl.style.width = "0%";
    statusEl.textContent = "Set a goal and log a night to see progress.";
  }
}

function addEntry(date, bed, wake) {
  const hours = computeHours(bed, wake);
  entries.push({
    id: Date.now() + Math.random(),
    date,
    bed,
    wake,
    hours,
  });
  saveEntries();
  render();
}

function removeEntry(id) {
  entries = entries.filter((e) => e.id !== id);
  saveEntries();
  render();
}

function clearAll() {
  entries = [];
  saveEntries();
  render();
}

function init() {
  const form = document.getElementById("sleep-form");
  const goalBtn = document.getElementById("save-goal-btn");
  const clearBtn = document.getElementById("clear-log-btn");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const dateInput = document.getElementById("sleep-date");
      const bedInput = document.getElementById("bed-time");
      const wakeInput = document.getElementById("wake-time");
      if (!dateInput || !bedInput || !wakeInput) return;

      const date = dateInput.value;
      const bed = bedInput.value;
      const wake = wakeInput.value;
      if (!date || !bed || !wake) return;

      addEntry(date, bed, wake);
    });
  }

  if (goalBtn) {
    goalBtn.addEventListener("click", () => {
      const goalInput = document.getElementById("goal-input");
      if (!goalInput) return;
      const value = Number(goalInput.value);
      if (value >= 0) {
        goal = value;
        saveGoal();
        renderSummary();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", clearAll);
  }

  loadData();
}

init();
