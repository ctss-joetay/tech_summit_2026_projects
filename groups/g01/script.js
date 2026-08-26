// Task Tracker: add tasks, complete (retire) them, and show a reminder banner.

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const completedList = document.getElementById("completed-list");
const banner = document.getElementById("reminder-banner");

let tasks = []; // { id, text, done }
let bannerIndex = 0;
let bannerTimer = null;

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

  tasks.forEach((task) => {
    const li = document.createElement("li");
    if (task.done) li.classList.add("completed");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveTasks();
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

    if (task.done) {
      completedList.appendChild(li);
    } else {
      taskList.appendChild(li);
    }
  });

  updateBanner();
}

function updateBanner() {
  const pending = tasks.filter((t) => !t.done);

  clearInterval(bannerTimer);

  if (pending.length === 0) {
    banner.textContent = "All caught up — no pending tasks!";
    return;
  }

  bannerIndex = 0;
  const show = () => {
    banner.textContent = `Reminder (${bannerIndex + 1}/${pending.length}): ${pending[bannerIndex].text}`;
    bannerIndex = (bannerIndex + 1) % pending.length;
  };
  show();
  if (pending.length > 1) {
    bannerTimer = setInterval(show, 3000);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  tasks.push({ id: Date.now(), text, done: false });
  input.value = "";
  saveTasks();
  render();
});

loadTasks();
