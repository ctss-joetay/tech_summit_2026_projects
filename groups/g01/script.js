// Task Tracker: add tasks, complete (retire) them, and show a reminder banner.

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const priorityToggle = document.getElementById("priority-toggle");
const taskList = document.getElementById("task-list");
const completedList = document.getElementById("completed-list");
const banner = document.getElementById("reminder-banner");
const bannerText = document.getElementById("banner-text");
const bannerPauseBtn = document.getElementById("banner-pause");
const focusToggle = document.getElementById("focus-mode");
const celebration = document.getElementById("celebration");
const treeBox = document.getElementById("tree-box");
const treeVisual = document.getElementById("tree-visual");
const treeCaption = document.getElementById("tree-caption");

const mainView = document.getElementById("main-view");
const notesView = document.getElementById("notes-view");
const notesHeading = document.getElementById("notes-heading");
const notesText = document.getElementById("notes-text");
const notesBackBtn = document.getElementById("notes-back");

let tasks = []; // { id, text, done, priority, notes }
let bannerIndex = 0;
let bannerTimer = null;
let bannerPaused = false;
let openTaskId = null;

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const PRIORITY_CYCLE = ["low", "medium", "high"];

// Clicking the priority button cycles low -> medium -> high -> low, instead
// of a dropdown, so adding a task with a priority is a single click.
priorityToggle.addEventListener("click", () => {
  const current = priorityToggle.dataset.priority;
  const next = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(current) + 1) % PRIORITY_CYCLE.length];
  setPriorityButton(next);
});

function setPriorityButton(priority) {
  priorityToggle.dataset.priority = priority;
  priorityToggle.textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
  priorityToggle.classList.remove("priority-btn-low", "priority-btn-medium", "priority-btn-high");
  priorityToggle.classList.add(`priority-btn-${priority}`);
}

// ---- Hand-drawn tree illustrations (inline SVG, sketchy line art) ----
// A single tree grows through 4 stages as tasks are completed: sapling ->
// young -> flowering -> fruiting. Once a tree fully fruits, a brand new
// sapling starts growing beside it, and the process repeats forever.

const COMPLETIONS_PER_TREE = 4; // how many completed tasks it takes to fully fruit one tree
const STAGE_NAMES = ["sapling", "young", "flower", "fruit"];

// A single hand-drawn tree, at a given "stage": sapling, young, flower, fruit.
// x/scale let us draw several side by side in the grove.
function drawTree(stage, x = 40, scale = 1) {
  const s = scale;
  const gy = 92; // ground line y
  if (stage === "sapling") {
    return `
      <path d="M ${x} ${gy} C ${x - 2 * s} ${gy - 10 * s}, ${x + 3 * s} ${gy - 16 * s}, ${x} ${gy - 26 * s}"
            fill="none" stroke="var(--accent-dark)" stroke-width="${2.2 * s}" stroke-linecap="round"/>
      <path d="M ${x} ${gy - 14 * s} C ${x - 10 * s} ${gy - 20 * s}, ${x - 14 * s} ${gy - 10 * s}, ${x - 4 * s} ${gy - 8 * s}"
            fill="none" stroke="var(--low)" stroke-width="${2 * s}" stroke-linecap="round"/>
      <path d="M ${x} ${gy - 20 * s} C ${x + 10 * s} ${gy - 25 * s}, ${x + 14 * s} ${gy - 15 * s}, ${x + 4 * s} ${gy - 14 * s}"
            fill="none" stroke="var(--low)" stroke-width="${2 * s}" stroke-linecap="round"/>
    `;
  }

  // trunk shared by young/flower/fruit stages, just a bit taller each time
  const trunkTop = stage === "young" ? gy - 34 * s : gy - 40 * s;
  const canopyR = stage === "young" ? 16 * s : 20 * s;
  const canopyCy = trunkTop - canopyR * 0.6;

  let extras = "";
  if (stage === "flower") {
    const dots = [-10, -3, 6, 12, -14, 2];
    extras = dots
      .map((dx, i) => {
        const dy = -6 + (i % 3) * 6;
        return `<circle cx="${x + dx * s}" cy="${canopyCy + dy * s}" r="${2 * s}" fill="var(--flower, #e8b3c0)"/>`;
      })
      .join("");
  } else if (stage === "fruit") {
    const dots = [-9, -1, 8, 13, -13, 3];
    extras = dots
      .map((dx, i) => {
        const dy = -4 + (i % 3) * 7;
        return `<circle cx="${x + dx * s}" cy="${canopyCy + dy * s}" r="${2.4 * s}" fill="var(--high)"/>`;
      })
      .join("");
  }

  // wobbly canopy outline drawn as an irregular closed path, hand-drawn look
  const r = canopyR;
  const canopyPath = `
    M ${x - r} ${canopyCy}
    C ${x - r} ${canopyCy - r * 1.1}, ${x - r * 0.3} ${canopyCy - r * 1.3}, ${x} ${canopyCy - r}
    C ${x + r * 0.5} ${canopyCy - r * 1.25}, ${x + r * 1.05} ${canopyCy - r * 0.4}, ${x + r} ${canopyCy}
    C ${x + r * 1.1} ${canopyCy + r * 0.7}, ${x + r * 0.3} ${canopyCy + r * 1.05}, ${x} ${canopyCy + r * 0.8}
    C ${x - r * 0.4} ${canopyCy + r * 1.1}, ${x - r} ${canopyCy + r * 0.6}, ${x - r} ${canopyCy}
    Z
  `;

  return `
    <path d="M ${x} ${gy} C ${x - 2 * s} ${gy - 15 * s}, ${x + 2 * s} ${gy - 22 * s}, ${x} ${trunkTop}"
          fill="none" stroke="var(--accent-dark)" stroke-width="${3 * s}" stroke-linecap="round"/>
    <path d="${canopyPath}" fill="none" stroke="var(--accent-dark)" stroke-width="${2 * s}" stroke-linejoin="round"/>
    ${extras}
  `;
}

async function loadTasks() {
  const saved = await Summit.load("tasks");
  tasks = Array.isArray(saved) ? saved : [];
  render();
}

function saveTasks() {
  Summit.save("tasks", tasks);
}

function render() {
  taskList.innerHTML = "";
  completedList.innerHTML = "";

  const pending = tasks
    .filter((t) => !t.done)
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));
  const done = tasks.filter((t) => t.done);

  const activeToShow = focusToggle.checked ? pending.slice(0, 1) : pending;

  activeToShow.forEach((task) => taskList.appendChild(buildTaskRow(task)));
  done.forEach((task) => completedList.appendChild(buildTaskRow(task)));

  if (focusToggle.checked && pending.length > 1) {
    const note = document.createElement("li");
    note.className = "focus-note";
    note.textContent = `+${pending.length - 1} more task(s) hidden — focus mode is on`;
    taskList.appendChild(note);
  }

  updateBanner(pending);
  updateTree(done.length);
}

function updateTree(completedCount) {
  const fullTrees = Math.floor(completedCount / COMPLETIONS_PER_TREE);
  const remainder = completedCount % COMPLETIONS_PER_TREE;
  const totalTrees = fullTrees + 1; // fully fruited trees, plus the one currently growing

  // As the grove gets bigger, shrink each tree a bit so they all still fit.
  const scale = totalTrees <= 4 ? 1 : Math.max(0.45, 4 / totalTrees);
  const spacing = 30 * scale;
  const width = spacing * totalTrees + 20;

  let markup = "";
  for (let i = 0; i < fullTrees; i++) {
    markup += drawTree("fruit", 20 + i * spacing, scale);
  }
  markup += drawTree(STAGE_NAMES[remainder], 20 + fullTrees * spacing, scale);

  const isGrove = totalTrees >= 4; // 3+ fruited trees plus a new sapling: let it take over
  const displayWidth = isGrove ? Math.min(width * 1.3, 340) : 70;

  treeVisual.innerHTML = `<svg viewBox="0 0 ${width} 100" width="${displayWidth}" height="90">${markup}</svg>`;

  treeBox.classList.toggle("grove-mode", isGrove);
  treeCaption.hidden = isGrove;
  if (!isGrove) {
    treeCaption.textContent =
      completedCount === 0
        ? "Complete tasks to grow your tree!"
        : `${completedCount} task(s) completed — keep it growing!`;
  }
}

function buildTaskRow(task) {
  const li = document.createElement("li");
  li.classList.add(`priority-${task.priority || "medium"}`);
  if (task.done) li.classList.add("completed");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.done;
  checkbox.addEventListener("change", () => {
    task.done = checkbox.checked;
    saveTasks();
    if (task.done) showCelebration();
    render();
  });

  const span = document.createElement("span");
  span.textContent = task.text;
  span.classList.add("task-text");
  span.title = "Click to open notes for this task";
  span.addEventListener("click", () => openNotes(task.id));

  if (task.notes && task.notes.trim()) {
    const noteIcon = document.createElement("span");
    noteIcon.className = "note-icon";
    noteIcon.title = "This task has notes";
    noteIcon.innerHTML = PENCIL_ICON_SVG;
    span.appendChild(noteIcon);
  }

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove";
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", () => {
    tasks = tasks.filter((t) => t.id !== task.id);
    saveTasks();
    render();
  });

  li.append(checkbox, span, removeBtn);
  return li;
}

function openNotes(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  openTaskId = taskId;
  notesHeading.textContent = task.text;
  notesText.value = task.notes || "";
  mainView.hidden = true;
  notesView.hidden = false;
}

function closeNotes() {
  mainView.hidden = false;
  notesView.hidden = true;
  openTaskId = null;
}

notesBackBtn.addEventListener("click", closeNotes);

notesText.addEventListener("input", () => {
  const task = tasks.find((t) => t.id === openTaskId);
  if (!task) return;
  task.notes = notesText.value;
  saveTasks();
});

// Small pencil icon shown next to a task's name when it has notes saved.
const PENCIL_ICON_SVG = `<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 1.5 14.5 5 5 14.5 1.5 15.5 2.5 12 12 2.5Z"/><path d="M9.5 3 13 6.5"/></svg>`;

const CELEBRATIONS = ["Nice work! 🎉", "Task down! 💪", "You did it! ✅", "One less thing to think about!"];

function showCelebration() {
  celebration.textContent = CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
  celebration.hidden = false;
  celebration.classList.add("show");
  clearTimeout(showCelebration._timer);
  showCelebration._timer = setTimeout(() => {
    celebration.classList.remove("show");
    celebration.hidden = true;
  }, 1800);
}

function updateBanner(pending) {
  clearInterval(bannerTimer);

  if (pending.length === 0) {
    bannerText.textContent = "All caught up — no pending tasks!";
    return;
  }

  if (bannerIndex >= pending.length) bannerIndex = 0;

  const show = () => {
    const t = pending[bannerIndex];
    bannerText.textContent = `Reminder (${bannerIndex + 1}/${pending.length}) [${t.priority || "medium"}]: ${t.text}`;
    bannerIndex = (bannerIndex + 1) % pending.length;
  };
  show();

  if (pending.length > 1 && !bannerPaused) {
    bannerTimer = setInterval(show, 3000);
  }
}

bannerPauseBtn.addEventListener("click", () => {
  bannerPaused = !bannerPaused;
  bannerPauseBtn.textContent = bannerPaused ? "▶" : "⏸";
  render();
});

focusToggle.addEventListener("change", render);

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  tasks.push({ id: Date.now(), text, done: false, priority: priorityToggle.dataset.priority, notes: "" });
  input.value = "";
  input.focus();
  setPriorityButton("medium");
  saveTasks();
  render();
});

setPriorityButton("medium");
loadTasks();
