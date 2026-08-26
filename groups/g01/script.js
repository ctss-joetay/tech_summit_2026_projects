// Task Tracker: add tasks, complete (retire) them, and show a reminder banner.

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const priorityInput = document.getElementById("priority-input");
const taskList = document.getElementById("task-list");
const completedList = document.getElementById("completed-list");
const banner = document.getElementById("reminder-banner");
const bannerText = document.getElementById("banner-text");
const bannerPauseBtn = document.getElementById("banner-pause");
const focusToggle = document.getElementById("focus-mode");
const celebration = document.getElementById("celebration");

let tasks = []; // { id, text, done, priority }
let bannerIndex = 0;
let bannerTimer = null;
let bannerPaused = false;

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

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

  tasks.push({ id: Date.now(), text, done: false, priority: priorityInput.value });
  input.value = "";
  input.focus();
  saveTasks();
  render();
});

loadTasks();
