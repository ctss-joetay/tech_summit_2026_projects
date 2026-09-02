// ===================================================================
// Grove Console — iPad control dashboard for teachers
// ===================================================================

// The demo password. In a real product this would be checked on a
// server — here there is no server, so anyone who reads this file can
// see it. That's fine for a classroom demo, but don't store real
// secrets this way.
const TEACHER_PASSWORD = "grove2026";

// Our "class" of students. Each one tracks:
//  - locked: whether their iPad is currently locked by the teacher
//  - seconds: how long their iPad has been in active use today
const students = [
  { id: 1, name: "Amara K." },
  { id: 2, name: "Liam T." },
  { id: 3, name: "Priya S." },
  { id: 4, name: "Noah B." },
  { id: 5, name: "Zara M." },
  { id: 6, name: "Ethan D." },
  { id: 7, name: "Maya R." },
  { id: 8, name: "Oscar V." },
].map((s) => ({ ...s, locked: false, seconds: 0 }));

// Playful taunts sent to a student's iPad when the teacher clicks "Taunt".
const TAUNTS = [
  "Eyes up front! 👀",
  "The iPad can wait, the lesson can't.",
  "Nice try. Locked again. 🔒",
  "Your teacher is watching the grove. 🌿",
  "Focus mode: activated.",
];

// ---------- DOM references ----------
const loginScreen = document.getElementById("login-screen");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("login-form");
const passwordInput = document.getElementById("password-input");
const loginError = document.getElementById("login-error");
const studentGrid = document.getElementById("student-grid");
const lockAllBtn = document.getElementById("lock-all-btn");
const unlockAllBtn = document.getElementById("unlock-all-btn");
const logoutBtn = document.getElementById("logout-btn");
const toast = document.getElementById("toast");

// Password confirmation modal (asked again before any lock/unlock action)
const passwordModal = document.getElementById("password-modal");
const passwordModalForm = document.getElementById("password-modal-form");
const passwordModalInput = document.getElementById("password-modal-input");
const passwordModalError = document.getElementById("password-modal-error");
const passwordModalMessage = document.getElementById("password-modal-message");
const passwordModalCancel = document.getElementById("password-modal-cancel");

// ---------- Login flow ----------
loginForm.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the form from trying to submit anywhere
  const entered = passwordInput.value.trim();

  if (entered === TEACHER_PASSWORD) {
    loginError.hidden = true;
    passwordInput.value = "";
    enterDashboard();
  } else {
    loginError.hidden = false;
    // small shake animation with GSAP so a wrong password feels responsive
    if (window.gsap) {
      gsap.fromTo(
        ".login-card",
        { x: -8 },
        { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }
      );
    }
  }
});

logoutBtn.addEventListener("click", () => {
  dashboard.hidden = true;
  loginScreen.hidden = false;
  stopUsageTimer();
});

function enterDashboard() {
  loginScreen.hidden = true;
  dashboard.hidden = false;
  renderStudents();
  startUsageTimer();

  // gentle entrance animation for the cards
  if (window.gsap) {
    gsap.from(".card", {
      opacity: 0,
      y: 20,
      stagger: 0.06,
      duration: 0.5,
      ease: "power2.out",
    });
  }
}

// ---------- Rendering ----------
function renderStudents() {
  studentGrid.innerHTML = ""; // clear previous render

  students.forEach((student) => {
    const card = document.createElement("div");
    card.className = "card" + (student.locked ? " locked" : "");
    card.dataset.id = student.id;

    card.innerHTML = `
      <div class="card-top">
        <span class="card-name"></span>
        <span class="status-pill"></span>
      </div>
      <div class="usage-time"></div>
      <div class="usage-label">time spent on iPad today</div>
      <div class="card-actions">
        <button class="btn small ${student.locked ? "ghost" : "danger"}" data-action="toggle-lock">
          ${student.locked ? "🔓 Unlock" : "🔒 Lock"}
        </button>
        <button class="btn small ghost" data-action="taunt">😏 Taunt</button>
      </div>
    `;

    // Use textContent for the name so a stray "<" in a name can't break the page
    card.querySelector(".card-name").textContent = student.name;
    card.querySelector(".status-pill").textContent = student.locked ? "Locked" : "Active";
    card.querySelector(".usage-time").textContent = formatTime(student.seconds);

    studentGrid.appendChild(card);
  });
}

// Update just the numbers/status without rebuilding every card (keeps animations smooth)
function refreshStudentCard(student) {
  const card = studentGrid.querySelector(`.card[data-id="${student.id}"]`);
  if (!card) return;

  card.classList.toggle("locked", student.locked);
  card.querySelector(".status-pill").textContent = student.locked ? "Locked" : "Active";
  card.querySelector(".usage-time").textContent = formatTime(student.seconds);

  const lockBtn = card.querySelector('[data-action="toggle-lock"]');
  lockBtn.textContent = student.locked ? "🔓 Unlock" : "🔒 Lock";
  lockBtn.className = "btn small " + (student.locked ? "ghost" : "danger");
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

// ---------- Password confirmation modal ----------
// Any lock/unlock action asks for the teacher password again, so a student
// who wanders up to an unattended dashboard can't just click to unlock.
let pendingResolve = null;

function askForPassword(message) {
  passwordModalMessage.textContent = message;
  passwordModalError.hidden = true;
  passwordModalInput.value = "";
  passwordModal.hidden = false;
  passwordModalInput.focus();

  return new Promise((resolve) => {
    pendingResolve = resolve;
  });
}

function closePasswordModal(result) {
  passwordModal.hidden = true;
  if (pendingResolve) {
    pendingResolve(result);
    pendingResolve = null;
  }
}

passwordModalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const entered = passwordModalInput.value.trim();
  if (entered === TEACHER_PASSWORD) {
    closePasswordModal(true);
  } else {
    passwordModalError.hidden = false;
    if (window.gsap) {
      gsap.fromTo(
        ".modal-card",
        { x: -8 },
        { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }
      );
    }
  }
});

passwordModalCancel.addEventListener("click", () => closePasswordModal(false));

// ---------- Card button clicks (event delegation) ----------
studentGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const card = button.closest(".card");
  const student = students.find((s) => s.id === Number(card.dataset.id));
  if (!student) return;

  if (button.dataset.action === "toggle-lock") {
    const action = student.locked ? "unlock" : "lock";
    const ok = await askForPassword(
      `Enter password to ${action} ${student.name}'s iPad.`
    );
    if (!ok) return;
    student.locked = !student.locked;
    refreshStudentCard(student);
    saveState();
  }

  if (button.dataset.action === "taunt") {
    showToast(`To ${student.name}: "${randomTaunt()}"`);
  }
});

function randomTaunt() {
  return TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
}

// ---------- Lock all / unlock all ----------
lockAllBtn.addEventListener("click", async () => {
  const ok = await askForPassword("Enter password to lock ALL iPads.");
  if (!ok) return;
  students.forEach((s) => (s.locked = true));
  students.forEach(refreshStudentCard);
  saveState();
  showToast("🔒 All iPads locked.");
});

unlockAllBtn.addEventListener("click", async () => {
  const ok = await askForPassword("Enter password to unlock ALL iPads.");
  if (!ok) return;
  students.forEach((s) => (s.locked = false));
  students.forEach(refreshStudentCard);
  saveState();
  showToast("🔓 All iPads unlocked.");
});

// ---------- Toast messages ----------
let toastTimer = null;
function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;

  if (window.gsap) {
    gsap.fromTo(toast, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 });
  }

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

// ---------- Usage timer ----------
// Every second, any student whose iPad is NOT locked gains one more
// second of "usage". This simulates the class using their iPads live.
let usageInterval = null;
function startUsageTimer() {
  if (usageInterval) return; // already running
  usageInterval = setInterval(() => {
    let changed = false;
    students.forEach((student) => {
      if (!student.locked) {
        student.seconds += 1;
        changed = true;
      }
    });
    if (changed) {
      students.forEach(refreshStudentCard);
    }
  }, 1000);
}
function stopUsageTimer() {
  clearInterval(usageInterval);
  usageInterval = null;
}

// ---------- Persistence (Summit runtime) ----------
// Save lock states + usage seconds so a reload doesn't lose the class's data.
let saveTimer = null;
function saveState() {
  // Debounce so rapid clicks don't spam the save API
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const snapshot = students.map((s) => ({ id: s.id, locked: s.locked, seconds: s.seconds }));
    await Summit.save("classState", snapshot);
  }, 400);
}

async function loadState() {
  const saved = await Summit.load("classState");
  if (!saved) return;
  saved.forEach((entry) => {
    const student = students.find((s) => s.id === entry.id);
    if (student) {
      student.locked = entry.locked;
      student.seconds = entry.seconds;
    }
  });
}

// Load any saved class state as soon as the page opens, so it's ready
// by the time the teacher logs in.
loadState();

// Periodically persist usage seconds even without a click, so ticking
// time isn't lost on reload.
setInterval(saveState, 5000);
