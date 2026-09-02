// ============================================================
// Bag n' Books Organiser
// Data model (all saved together under one Summit key):
//   subjects: { id: { name, items: [string,...] } }
//   weeks:    { id: { name, active: bool, days: { Mon:[subjectId,...], ... } } }
//   tutorialSeen: bool
// ============================================================

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SAVE_KEY = "bnb-data";

// Default starter data so the page isn't empty on first run.
function defaultState() {
  return {
    subjects: {
      math: { name: "Math", items: ["Math textbook", "Calculator"], fixed: true },
      sci: { name: "Science", items: ["Science textbook", "Goggles"], fixed: true },
      mt: { name: "Mother Tongue", items: ["Mother Tongue textbook", "Notebook"], fixed: true },
      eng: { name: "English", items: ["English textbook", "Reader"], fixed: true },
    },
    weeks: {
      week1: {
        name: "Week 1",
        active: true,
        days: { Mon: ["math", "eng"], Tue: ["sci"], Wed: ["math", "mt"], Thu: ["mt"], Fri: ["eng", "sci"] },
      },
    },
    tutorialSeen: false,
    settings: {
      darkMode: false,
      language: "en",
      fadeAlpha: 60, // percent, 0 = fully transparent, 100 = fully solid
    },
  };
}

let state = defaultState();
let selectedWeekId = null; // which week's settings panel is open
let idCounter = 0;
function newId(prefix) { idCounter += 1; return prefix + "_" + Date.now() + "_" + idCounter; }

// ---------- Persistence ----------
async function loadState() {
  try {
    const saved = await Summit.load(SAVE_KEY);
    if (saved) state = saved;
  } catch (err) {
    console.log("Could not load saved data, using defaults.", err);
  }
}
function saveState() {
  Summit.save(SAVE_KEY, state).catch((err) => console.log("Save failed:", err));
}

// ============================================================
// START SCREEN — title grows in, then fades to reveal the app
// ============================================================
function playStartAnimation() {
  const title = document.getElementById("start-title");
  const hint = document.getElementById("start-hint");
  if (window.anime) {
    anime.timeline()
      .add({ targets: title, opacity: [0, 1], scale: [0.6, 1], duration: 900, easing: "easeOutExpo" })
      .add({ targets: hint, opacity: [0, 1], duration: 500 }, "-=200");
  } else {
    // fallback if the CDN library didn't load
    title.style.opacity = 1;
    hint.style.opacity = 1;
  }
}

function enterApp() {
  const startScreen = document.getElementById("start-screen");
  const app = document.getElementById("app");
  const finish = () => {
    startScreen.classList.add("hidden");
    app.classList.remove("hidden");
    maybeShowTutorial();
  };
  if (window.anime) {
    anime({
      targets: startScreen,
      opacity: [1, 0],
      duration: 400,
      easing: "easeInQuad",
      complete: finish,
    });
  } else {
    finish();
  }
}

// ============================================================
// SETTINGS — dark mode, language, faded-text contrast, reset, replay tutorial
// ============================================================

// Small translation table. Add a language by adding a key here and an
// <option> in index.html's #language-select.
const I18N = {
  en: {
    tabWeeks: "📅 Weeks", tabPack: "🎒 Pack Today", tabSettings: "⚙️ Settings",
    settingsHeading: "Settings", darkModeLabel: "Dark mode", languageLabel: "Language",
    fadeLabel: "Faded text transparency", retryTutorialBtn: "▶ Replay tutorial",
    resetBtn: "🗑 Reset everything",
    resetConfirmText: "This deletes all your weeks, subjects and settings for good. Are you sure?",
    resetConfirmYes: "Yes, reset", resetConfirmNo: "Cancel",
  },
  zh: {
    tabWeeks: "📅 周计划", tabPack: "🎒 今日打包", tabSettings: "⚙️ 设置",
    settingsHeading: "设置", darkModeLabel: "深色模式", languageLabel: "语言",
    fadeLabel: "淡化文字透明度", retryTutorialBtn: "▶ 重新观看教程",
    resetBtn: "🗑 重置所有内容",
    resetConfirmText: "这将永久删除您的所有周计划、科目和设置。确定吗？",
    resetConfirmYes: "是，重置", resetConfirmNo: "取消",
  },
  ms: {
    tabWeeks: "📅 Minggu", tabPack: "🎒 Pek Hari Ini", tabSettings: "⚙️ Tetapan",
    settingsHeading: "Tetapan", darkModeLabel: "Mod gelap", languageLabel: "Bahasa",
    fadeLabel: "Kelegapan teks pudar", retryTutorialBtn: "▶ Ulang tutorial",
    resetBtn: "🗑 Set semula semuanya",
    resetConfirmText: "Ini akan memadam semua minggu, subjek dan tetapan anda selama-lamanya. Anda pasti?",
    resetConfirmYes: "Ya, set semula", resetConfirmNo: "Batal",
  },
  ta: {
    tabWeeks: "📅 வாரங்கள்", tabPack: "🎒 இன்று தயார் செய்", tabSettings: "⚙️ அமைப்புகள்",
    settingsHeading: "அமைப்புகள்", darkModeLabel: "இருண்ட பயன்முறை", languageLabel: "மொழி",
    fadeLabel: "மங்கலான உரையின் தெளிவுத்தன்மை", retryTutorialBtn: "▶ பயிற்சியை மீண்டும் பார்",
    resetBtn: "🗑 அனைத்தையும் மீட்டமை",
    resetConfirmText: "இது உங்கள் வாரங்கள், பாடங்கள் மற்றும் அமைப்புகள் அனைத்தையும் நிரந்தரமாக அழிக்கும். உறுதியா?",
    resetConfirmYes: "ஆம், மீட்டமை", resetConfirmNo: "ரத்து செய்",
  },
};

function applySettings() {
  const s = state.settings || { darkMode: false, language: "en", fadeAlpha: 60 };
  document.body.classList.toggle("dark", !!s.darkMode);
  document.documentElement.style.setProperty("--fade-alpha", (s.fadeAlpha ?? 60) / 100);
  applyLanguage(s.language || "en");

  const darkToggle = document.getElementById("dark-mode-toggle");
  if (darkToggle) darkToggle.checked = !!s.darkMode;
  const langSelect = document.getElementById("language-select");
  if (langSelect) langSelect.value = s.language || "en";
  const fadeSlider = document.getElementById("fade-slider");
  if (fadeSlider) fadeSlider.value = s.fadeAlpha ?? 60;
  const fadeValue = document.getElementById("fade-value");
  if (fadeValue) fadeValue.textContent = (s.fadeAlpha ?? 60) + "%";
}

function applyLanguage(lang) {
  const dict = I18N[lang] || I18N.en;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (dict[key]) el.placeholder = dict[key];
  });
}

function setupSettings() {
  const darkToggle = document.getElementById("dark-mode-toggle");
  darkToggle.addEventListener("change", () => {
    state.settings.darkMode = darkToggle.checked;
    saveState();
    applySettings();
  });

  const langSelect = document.getElementById("language-select");
  langSelect.addEventListener("change", () => {
    state.settings.language = langSelect.value;
    saveState();
    applySettings();
  });

  const fadeSlider = document.getElementById("fade-slider");
  fadeSlider.addEventListener("input", () => {
    state.settings.fadeAlpha = Number(fadeSlider.value);
    document.getElementById("fade-value").textContent = fadeSlider.value + "%";
    document.documentElement.style.setProperty("--fade-alpha", fadeSlider.value / 100);
  });
  fadeSlider.addEventListener("change", () => saveState());

  document.getElementById("retry-tutorial-btn").addEventListener("click", () => {
    state.tutorialSeen = false;
    saveState();
    tutorialStep = 0;
    showTutorialStep();
    document.getElementById("tutorial-overlay").classList.remove("hidden");
  });

  const resetBtn = document.getElementById("reset-all-btn");
  const resetConfirm = document.getElementById("reset-confirm");
  resetBtn.addEventListener("click", () => resetConfirm.classList.remove("hidden"));
  document.getElementById("reset-confirm-no").addEventListener("click", () => {
    resetConfirm.classList.add("hidden");
  });
  document.getElementById("reset-confirm-yes").addEventListener("click", () => {
    state = defaultState();
    selectedWeekId = null;
    selectedDay = null;
    saveState();
    resetConfirm.classList.add("hidden");
    applySettings();
    render();
    tutorialStep = 0;
    showTutorialStep();
    document.getElementById("tutorial-overlay").classList.remove("hidden");
  });
}

// ============================================================
// TUTORIAL — quick walk-through shown once
// ============================================================
const TUTORIAL_STEPS = [
  "Welcome! First, open the Weeks tab to build a timetable. Add a week, then switch it ON — only one week can be active at a time.",
  "Tap a week's name to open its settings and tick which subjects happen on each day.",
  "Add any subject you need in the Subjects Catalog, with the items to bring.",
  "When you're ready to pack, go to 'Pack Today', pick a day, and see exactly what to bring!",
];
let tutorialStep = 0;

function maybeShowTutorial() {
  if (state.tutorialSeen) return;
  tutorialStep = 0;
  showTutorialStep();
  document.getElementById("tutorial-overlay").classList.remove("hidden");
}
function showTutorialStep() {
  document.getElementById("tutorial-text").textContent = TUTORIAL_STEPS[tutorialStep];
  const btn = document.getElementById("tutorial-next");
  btn.textContent = tutorialStep === TUTORIAL_STEPS.length - 1 ? "Got it!" : "Next";
}

// ============================================================
// RENDERING
// ============================================================

function render() {
  renderWeekList();
  renderSubjectCatalog();
  renderWeekSettings();
  renderPackTab();
}

// ---- Weeks list with on/off switches ----
function renderWeekList() {
  const list = document.getElementById("week-list");
  list.innerHTML = "";
  const ids = Object.keys(state.weeks);
  if (ids.length === 0) {
    list.innerHTML = '<p class="section-intro small">No weeks yet — add one below.</p>';
    return;
  }
  ids.forEach((id) => {
    const week = state.weeks[id];
    const row = document.createElement("div");
    row.className = "week-row" + (id === selectedWeekId ? " selected" : "");

    const name = document.createElement("span");
    name.className = "week-name";
    name.textContent = week.name;
    name.title = "Click to open day settings";
    name.addEventListener("click", () => {
      selectedWeekId = id === selectedWeekId ? null : id;
      renderWeekList();
      renderWeekSettings();
    });

    const rename = document.createElement("button");
    rename.className = "week-rename";
    rename.textContent = "✎";
    rename.title = "Rename week";
    rename.addEventListener("click", (e) => {
      e.stopPropagation();
      startRenameWeek(id, row);
    });

    // Toggle switch: turning one week on turns every other week off,
    // because the brief says only one week can be active at a time.
    const label = document.createElement("label");
    label.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = week.active;
    input.addEventListener("change", () => {
      Object.values(state.weeks).forEach((w) => (w.active = false));
      week.active = input.checked; // allow switching itself off too
      saveState();
      render();
    });
    const slider = document.createElement("span");
    slider.className = "slider";
    label.append(input, slider);

    const del = document.createElement("button");
    del.className = "week-delete";
    del.textContent = "✕";
    del.title = "Delete week";
    del.addEventListener("click", () => {
      delete state.weeks[id];
      if (selectedWeekId === id) selectedWeekId = null;
      saveState();
      render();
    });

    row.append(name, rename, label, del);
    list.appendChild(row);
  });
}

// Swap a week's name span for a text input so the student can rename it
// in place — prompt()/alert() don't work in this sandboxed preview.
function startRenameWeek(id, row) {
  const week = state.weeks[id];
  const nameSpan = row.querySelector(".week-name");
  const input = document.createElement("input");
  input.type = "text";
  input.className = "week-rename-input";
  input.value = week.name;
  nameSpan.replaceWith(input);
  input.focus();
  input.select();

  const commit = () => {
    const val = input.value.trim();
    if (val) week.name = val;
    saveState();
    render();
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") render();
  });
  input.addEventListener("blur", commit);
}

// ---- Week settings: tick subjects per day for the selected week ----
function renderWeekSettings() {
  const panel = document.getElementById("week-settings");
  if (!selectedWeekId || !state.weeks[selectedWeekId]) {
    panel.classList.add("hidden");
    return;
  }
  panel.classList.remove("hidden");
  const week = state.weeks[selectedWeekId];
  document.getElementById("week-settings-title").textContent = "Settings for " + week.name;

  const grid = document.getElementById("week-grid");
  grid.innerHTML = "";
  const subjectIds = Object.keys(state.subjects);

  DAYS.forEach((day) => {
    const label = document.createElement("div");
    label.className = "day-label";
    label.textContent = day;

    const checks = document.createElement("div");
    checks.className = "subject-checks";

    if (subjectIds.length === 0) {
      checks.textContent = "Add a subject first.";
    }
    subjectIds.forEach((sid) => {
      const wrap = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = week.days[day]?.includes(sid) ?? false;
      cb.addEventListener("change", () => {
        if (!week.days[day]) week.days[day] = [];
        if (cb.checked) {
          if (!week.days[day].includes(sid)) week.days[day].push(sid);
        } else {
          week.days[day] = week.days[day].filter((x) => x !== sid);
        }
        saveState();
        renderPackTab();
      });
      wrap.append(cb, document.createTextNode(" " + state.subjects[sid].name));
      checks.appendChild(wrap);
    });

    grid.append(label, checks);
  });
}

// ---- Subject catalog ----
function renderSubjectCatalog() {
  const box = document.getElementById("subject-catalog");
  box.innerHTML = "";
  const ids = Object.keys(state.subjects);
  if (ids.length === 0) {
    box.innerHTML = '<p class="section-intro small">No subjects yet.</p>';
    return;
  }
  ids.forEach((sid) => {
    const subj = state.subjects[sid];
    const chip = document.createElement("span");
    chip.className = "subject-chip";
    chip.textContent = subj.name + ": " + subj.items.join(", ") + " ";
    // The four core subjects (Math, Science, Mother Tongue, English) are
    // fixed and can't be deleted, so no ✕ button is shown for them.
    if (!subj.fixed) {
      const del = document.createElement("button");
      del.textContent = "✕";
      del.addEventListener("click", () => {
        delete state.subjects[sid];
        // also remove this subject from every week/day that used it
        Object.values(state.weeks).forEach((w) => {
          DAYS.forEach((d) => {
            if (w.days[d]) w.days[d] = w.days[d].filter((x) => x !== sid);
          });
        });
        saveState();
        render();
      });
      chip.appendChild(del);
    }
    box.appendChild(chip);
  });
}

// ---- Pack Today tab ----
let selectedDay = null;

function renderPackTab() {
  const activeWeekId = Object.keys(state.weeks).find((id) => state.weeks[id].active);
  const label = document.getElementById("pack-active-week-label");
  const dayButtons = document.getElementById("day-buttons");
  const result = document.getElementById("pack-result");

  if (!activeWeekId) {
    label.textContent = "No week is switched on yet. Go to Weeks and turn one on.";
    dayButtons.innerHTML = "";
    result.classList.add("hidden");
    return;
  }
  const week = state.weeks[activeWeekId];
  label.textContent = "Referencing: " + week.name;

  dayButtons.innerHTML = "";
  DAYS.forEach((day) => {
    const btn = document.createElement("button");
    btn.className = "day-btn" + (day === selectedDay ? " active" : "");
    btn.textContent = day;
    btn.addEventListener("click", () => {
      selectedDay = day;
      renderPackTab();
    });
    dayButtons.appendChild(btn);
  });

  if (!selectedDay) {
    result.classList.add("hidden");
    return;
  }

  const subjectIds = week.days[selectedDay] || [];
  result.classList.remove("hidden");
  if (subjectIds.length === 0) {
    result.innerHTML = "<h3>" + selectedDay + "</h3><p>No subjects set for this day — nothing to pack!</p>";
    return;
  }
  let html = "<h3>" + selectedDay + " — bring this:</h3>";
  subjectIds.forEach((sid) => {
    const subj = state.subjects[sid];
    if (!subj) return;
    html += "<p><strong>" + subj.name + "</strong></p><ul>";
    subj.items.forEach((item) => (html += "<li>" + item + "</li>"));
    html += "</ul>";
  });
  result.innerHTML = html;
  if (window.anime) {
    anime({ targets: result, opacity: [0, 1], translateY: [8, 0], duration: 300, easing: "easeOutQuad" });
  }
}

// ============================================================
// EVENT WIRING
// ============================================================

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
      document.getElementById("tab-" + btn.dataset.tab).classList.remove("hidden");
    });
  });
}

function setupAddWeek() {
  document.getElementById("add-week-btn").addEventListener("click", () => {
    const id = newId("week");
    const count = Object.keys(state.weeks).length + 1;
    state.weeks[id] = {
      name: "Week " + count,
      active: false,
      days: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] },
    };
    selectedWeekId = id;
    saveState();
    render();
  });
}

function setupAddSubject() {
  document.getElementById("add-subject-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("subject-name");
    const itemsInput = document.getElementById("subject-items");
    const name = nameInput.value.trim();
    const items = itemsInput.value.split(",").map((s) => s.trim()).filter(Boolean);
    if (!name || items.length === 0) return;
    const id = newId("subj");
    state.subjects[id] = { name, items };
    nameInput.value = "";
    itemsInput.value = "";
    saveState();
    render();
  });
}

function setupTutorial() {
  document.getElementById("tutorial-next").addEventListener("click", () => {
    tutorialStep += 1;
    if (tutorialStep >= TUTORIAL_STEPS.length) {
      state.tutorialSeen = true;
      saveState();
      document.getElementById("tutorial-overlay").classList.add("hidden");
    } else {
      showTutorialStep();
    }
  });
}

function setupStartScreen() {
  document.getElementById("start-screen").addEventListener("click", enterApp, { once: true });
  playStartAnimation();
}

// ============================================================
// INIT
// ============================================================
async function init() {
  await loadState();
  setupStartScreen();
  setupTabs();
  setupAddWeek();
  setupAddSubject();
  setupTutorial();
  setupSettings();
  applySettings();
  render();
}

init();
