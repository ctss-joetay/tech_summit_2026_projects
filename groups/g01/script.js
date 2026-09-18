// Task Tracker: add tasks, complete (retire) them, and show a reminder banner.

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const micBtn = document.getElementById("mic-btn");
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

const loginView = document.getElementById("login-view");
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username-input");
const currentUserLabel = document.getElementById("current-user-label");
const switchUserBtn = document.getElementById("switch-user-btn");

let tasks = []; // { id, text, done, priority, notes } -- id is now the tasks-table row id
let bannerIndex = 0;
let bannerTimer = null;
let bannerPaused = false;
let openTaskId = null;
let currentUser = null;

// ---- Login: just a name, no password ----
// This only keeps each name's task list separate -- it is not private.
// Anyone who types the same name sees the same tasks, since everything in
// this store is world-readable (see project notes on Summit.save).
function tasksKeyFor(user) {
  return `tasks_${user}`;
}

// ---- Storage tables ----
// Tasks and photos each get their own row instead of one big saved blob per
// user. This means one oversized photo can never break saving of the whole
// task list -- only its own row is affected.
Summit.db.create("tasks", { username: "text", text: "text", done: "bool", priority: "text", notes: "text" }).catch(
  (e) => console.log("table create failed:", e.message)
);
Summit.db.create("photos", { task_id: "int", image: "text" }).catch((e) => console.log("table create failed:", e.message));

// One-time migration: older versions of this app saved a user's whole task
// list (including any photo) as a single Summit.save blob under
// "tasks_<name>". If that old blob still exists for this user and the new
// tasks table is empty for them, copy it over row by row, then clear the
// old blob so this only ever runs once per user.
async function migrateOldTasksIfNeeded(user) {
  const already = await Summit.db.find("tasks", { username: user }, { limit: 1 });
  if (already.length > 0) return; // already migrated (or never needed it)

  const old = await Summit.load(tasksKeyFor(user));
  if (!Array.isArray(old) || old.length === 0) return;

  for (const t of old) {
    const row = await Summit.db.insert("tasks", {
      username: user,
      text: t.text || "",
      done: !!t.done,
      priority: t.priority || "medium",
      notes: t.notes || "",
    });
    if (t.photo) {
      await Summit.db.insert("photos", { task_id: row.id, image: t.photo });
    }
  }
  await Summit.save(tasksKeyFor(user), null); // done -- don't migrate again next login
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = usernameInput.value.trim();
  if (!name) return;
  startSession(name);
});

switchUserBtn.addEventListener("click", () => {
  currentUser = null;
  tasks = [];
  closeNotes();
  mainView.hidden = true;
  loginView.hidden = false;
  usernameInput.value = "";
  usernameInput.focus();
});

async function startSession(name) {
  currentUser = name;
  currentUserLabel.textContent = `👤 ${name}`;
  loginView.hidden = true;
  mainView.hidden = false;
  await migrateOldTasksIfNeeded(name);
  await loadTasks();
}

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
  if (!currentUser) return;
  const rows = await Summit.db.find("tasks", { username: currentUser });
  // Each task also needs its photo, which lives in its own row/table.
  tasks = await Promise.all(
    rows.map(async (r) => {
      const photos = await Summit.db.find("photos", { task_id: r.id }, { limit: 1 });
      return {
        id: r.id,
        text: r.text,
        done: !!r.done,
        priority: r.priority,
        notes: r.notes || "",
        photo: photos[0] ? photos[0].image : "",
      };
    })
  );
  render();
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
    Summit.db.update("tasks", { id: task.id }, { done: task.done });
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

  if (generatingIds.has(task.id)) {
    const thinking = document.createElement("span");
    thinking.className = "note-thinking";
    thinking.textContent = "✨ thinking...";
    span.appendChild(thinking);
  }

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove";
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", () => {
    tasks = tasks.filter((t) => t.id !== task.id);
    Summit.db.remove("tasks", { id: task.id });
    Summit.db.remove("photos", { task_id: task.id });
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
  renderPhotoPreview(task);
  mainView.hidden = true;
  notesView.hidden = false;
}

function closeNotes() {
  mainView.hidden = false;
  notesView.hidden = true;
  openTaskId = null;
}

notesBackBtn.addEventListener("click", closeNotes);

// ---- Photo proof/reminder: take a photo with the device camera ----
// Uses a file input with capture="environment" so it opens the phone's own
// camera app (no getUserMedia/live video needed for a single snapshot).
// The photo is shrunk down before saving because Summit.save caps each
// record at 4KB, and a full-size photo would blow well past that.
const photoInput = document.getElementById("photo-input");
const photoBtn = document.getElementById("photo-btn");
const photoRemoveBtn = document.getElementById("photo-remove");
const photoPreview = document.getElementById("photo-preview");

photoBtn.addEventListener("click", () => photoInput.click());

photoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    const maxDim = 240;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
    const task = tasks.find((t) => t.id === openTaskId);
    if (!task) return;
    task.photo = dataUrl;
    // Photos live in their own table/row so one large photo can never break
    // saving of a task's text or notes.
    Summit.db.remove("photos", { task_id: task.id });
    Summit.db.insert("photos", { task_id: task.id, image: dataUrl }).catch((e) => console.log(e.message));
    renderPhotoPreview(task);
  };
  img.src = URL.createObjectURL(file);
  photoInput.value = ""; // allow retaking the same photo again
});

photoRemoveBtn.addEventListener("click", () => {
  const task = tasks.find((t) => t.id === openTaskId);
  if (!task) return;
  task.photo = "";
  Summit.db.remove("photos", { task_id: task.id });
  renderPhotoPreview(task);
});

function renderPhotoPreview(task) {
  if (task && task.photo) {
    photoPreview.innerHTML = `<img src="${task.photo}" alt="Photo for ${task.text}">`;
    photoRemoveBtn.hidden = false;
  } else {
    photoPreview.innerHTML = "";
    photoRemoveBtn.hidden = true;
  }
}

notesText.addEventListener("input", () => {
  const task = tasks.find((t) => t.id === openTaskId);
  if (!task) return;
  task.notes = notesText.value;
  Summit.db.update("tasks", { id: task.id }, { notes: task.notes });
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

  const task = { id: Date.now(), text, done: false, priority: priorityToggle.dataset.priority, notes: "" };
  tasks.push(task);
  input.value = "";
  input.focus();
  setPriorityButton("medium");
  saveTasks();
  render();
  suggestStepsFor(task);
});

// ---- AI: auto-suggest numbered steps for a new task ----
// Uses Summit.generate to write a short numbered plan straight into the
// task's notes, so opening a task's notes page already has a starting point.
// generatingIds tracks tasks currently waiting on a reply, so the task row
// can show a "thinking" indicator instead of looking broken while it waits.
const generatingIds = new Set();

async function suggestStepsFor(task) {
  generatingIds.add(task.id);
  render();

  const prompt =
    `Give a short numbered list (3-5 steps) of concrete steps to get this ` +
    `to-do task done: "${task.text}". Just the numbered steps, no extra text.`;

  let result;
  try {
    result = await Summit.generate(prompt);
  } catch (e) {
    generatingIds.delete(task.id);
    render();
    // Show the failure where a person will actually see it, without
    // overwriting notes the student may have already started typing.
    if (openTaskId === task.id) notesText.placeholder = e.message;
    return;
  }

  generatingIds.delete(task.id);

  const current = tasks.find((t) => t.id === task.id);
  if (!current) return; // task was deleted while we were waiting

  if (result && result.blocked) {
    current.notes = result.message; // show the safety message exactly as written
  } else if (!current.notes) {
    // Only fill in notes if the student hasn't already written their own.
    current.notes = result;
  }
  saveTasks();
  render();

  if (openTaskId === current.id) {
    notesText.value = current.notes || "";
  }
}

// ---- Speech-to-text: dictate a task using the device microphone ----
// Uses the browser's built-in Web Speech API (no server, no API key needed).
// Not every browser supports it, so the mic button only appears if it does.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  micBtn.hidden = false;

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let listening = false;

  recognition.addEventListener("start", () => {
    listening = true;
    micBtn.classList.add("mic-listening");
    micBtn.textContent = "🔴";
    input.placeholder = "Listening...";
  });

  recognition.addEventListener("end", () => {
    listening = false;
    micBtn.classList.remove("mic-listening");
    micBtn.textContent = "🎤";
    input.placeholder = "What needs doing?";
  });

  recognition.addEventListener("result", (event) => {
    const spoken = event.results[0][0].transcript.trim();
    if (spoken) {
      input.value = spoken;
      input.focus();
    }
  });

  recognition.addEventListener("error", (event) => {
    input.placeholder = "Didn't catch that — try again?";
    console.log("Speech recognition error:", event.error);
  });

  micBtn.addEventListener("click", () => {
    if (listening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });
}

setPriorityButton("medium");
