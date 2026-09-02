// ============================================================
// CCA Feedback — script.js
// Data is stored with Summit.save/Summit.load, which is shared
// by everyone who opens this page (it's scoped to this project,
// not to one person) — so feedback a student sends is instantly
// visible to a teacher who opens the teacher view.
// ============================================================

// List of CCA courses students can rate. Add/remove freely.
const COURSES = [
  "AI Workshop",
  "Robotics",
  "Dance",
  "Art & Craft",
  "Sports",
  "Music",
];

// Keys used in the shared Summit store.
const KEY_RATINGS = "cca_ratings";   // { courseName: [1..5, 1..5, ...] }
const KEY_FEEDBACK = "cca_feedback"; // [ { name, type, text, time } ]

// Current chosen star rating on the student screen (0 = none yet).
let selectedStars = 0;

// -------------------- helpers --------------------

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.add("active");
  // Fade the screen in with anime.js so switching feels smooth.
  if (window.anime) {
    anime({ targets: target, opacity: [0, 1], duration: 350, easing: "easeOutQuad" });
  }
}

async function getRatings() {
  const data = await Summit.load(KEY_RATINGS);
  return data || {};
}

async function getFeedback() {
  const data = await Summit.load(KEY_FEEDBACK);
  return data || [];
}

// -------------------- login screen --------------------

document.getElementById("btn-student").addEventListener("click", () => login("student"));
document.getElementById("btn-teacher").addEventListener("click", () => login("teacher"));

function login(role) {
  const nameInput = document.getElementById("name-input");
  const name = nameInput.value.trim();
  const errorEl = document.getElementById("login-error");

  if (!name) {
    errorEl.textContent = "Please enter your name to sign in.";
    return;
  }
  errorEl.textContent = "";

  if (role === "student") {
    document.getElementById("student-welcome").textContent = `🧑‍🎓 Hi, ${name}!`;
    populateCourseSelect();
    resetStars();
    showScreen("screen-student");
  } else {
    document.getElementById("teacher-welcome").textContent = `🧑‍🏫 Welcome, ${name}`;
    renderTeacherView();
    showScreen("screen-teacher");
  }
}

document.getElementById("student-logout").addEventListener("click", () => showScreen("screen-login"));
document.getElementById("teacher-logout").addEventListener("click", () => showScreen("screen-login"));

// -------------------- student: rate a course --------------------

function populateCourseSelect() {
  const select = document.getElementById("course-select");
  select.innerHTML = "";
  COURSES.forEach((course) => {
    const opt = document.createElement("option");
    opt.value = course;
    opt.textContent = course;
    select.appendChild(opt);
  });
}

function resetStars() {
  selectedStars = 0;
  const picker = document.getElementById("star-picker");
  picker.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.className = "star";
    star.textContent = "★";
    star.dataset.value = i;
    star.addEventListener("click", () => setStars(i));
    picker.appendChild(star);
  }
}

function setStars(value) {
  selectedStars = value;
  const stars = document.querySelectorAll("#star-picker .star");
  stars.forEach((star, index) => {
    star.classList.toggle("filled", index < value);
  });
  // Little pop animation on the star just clicked, for feedback.
  if (window.anime) {
    anime({
      targets: stars[value - 1],
      scale: [1.4, 1],
      duration: 250,
      easing: "easeOutBack",
    });
  }
}

document.getElementById("submit-rating").addEventListener("click", async () => {
  const course = document.getElementById("course-select").value;
  const msg = document.getElementById("rating-msg");

  if (selectedStars === 0) {
    msg.style.color = "var(--error)";
    msg.textContent = "Pick at least one star first!";
    return;
  }

  const ratings = await getRatings();
  if (!ratings[course]) ratings[course] = [];
  ratings[course].push(selectedStars);
  await Summit.save(KEY_RATINGS, ratings);

  msg.style.color = "var(--success)";
  msg.textContent = `Thanks! You rated ${course} ${selectedStars}★.`;
  resetStars();
});

// -------------------- student: general feedback --------------------

document.getElementById("submit-feedback").addEventListener("click", async () => {
  const textEl = document.getElementById("feedback-text");
  const text = textEl.value.trim();
  const type = document.querySelector('input[name="fbtype"]:checked').value;
  const msg = document.getElementById("feedback-msg");
  const name = document.getElementById("name-input").value.trim() || "Anonymous";

  if (!text) {
    msg.style.color = "var(--error)";
    msg.textContent = "Write something before sending.";
    return;
  }

  const feedback = await getFeedback();
  feedback.push({ name, type, text, time: new Date().toLocaleString() });
  await Summit.save(KEY_FEEDBACK, feedback);

  msg.style.color = "var(--success)";
  msg.textContent = "Sent! Thanks for speaking up.";
  textEl.value = "";
});

// -------------------- teacher view --------------------

async function renderTeacherView() {
  await renderRatingsSummary();
  await renderFeedbackList();
}

async function renderRatingsSummary() {
  const ratings = await getRatings();
  const container = document.getElementById("ratings-summary");
  container.innerHTML = "";

  const courses = Object.keys(ratings);
  if (courses.length === 0) {
    container.innerHTML = '<p class="empty-text">No ratings submitted yet.</p>';
    return;
  }

  courses.forEach((course) => {
    const scores = ratings[course];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const row = document.createElement("div");
    row.className = "rating-row";
    row.innerHTML = `
      <span class="course-name">${course}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${(avg / 5) * 100}%"></span></span>
      <span class="rating-avg">${avg.toFixed(1)}★ (${scores.length})</span>
    `;
    container.appendChild(row);
  });
}

async function renderFeedbackList() {
  const feedback = await getFeedback();
  const container = document.getElementById("feedback-list");
  container.innerHTML = "";

  if (feedback.length === 0) {
    container.innerHTML = '<p class="empty-text">No feedback submitted yet.</p>';
    document.getElementById("ai-summary").textContent = "Nothing to summarise yet.";
    return;
  }

  // Newest first.
  feedback.slice().reverse().forEach((item) => {
    const div = document.createElement("div");
    div.className = `feedback-item ${item.type}`;
    const tagLabel = item.type === "complaint" ? "⚠️ Complaint" : "💡 Suggestion";
    div.innerHTML = `
      <span class="tag">${tagLabel}</span>${escapeText(item.text)}
      <div class="meta">— ${escapeText(item.name)} · ${item.time}</div>
    `;
    container.appendChild(div);
  });

  renderAiSummary(feedback);
}

// Use textContent-style escaping so a name/message with < or > can't break the page.
function escapeText(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// A lightweight stand-in for an "AI summary": counts common keywords
// across all feedback text and reports the topics mentioned most.
// (No real AI model is called — the sandboxed preview can't reach one —
// this is a simple, transparent keyword scan instead.)
function renderAiSummary(feedback) {
  const keywords = {
    "AI / AI workshops": ["ai", "artificial intelligence", "workshop"],
    "venue / space": ["venue", "hall", "room", "space", "small"],
    "variety of activities": ["variety", "boring", "repeat", "same", "different"],
    "timing / schedule": ["time", "schedule", "clash", "late"],
    "instructors / teachers": ["teacher", "instructor", "coach"],
  };

  const allText = feedback.map((f) => f.text.toLowerCase()).join(" ");
  const suggestionCount = feedback.filter((f) => f.type === "suggestion").length;
  const complaintCount = feedback.filter((f) => f.type === "complaint").length;

  const hits = [];
  for (const [topic, words] of Object.entries(keywords)) {
    const count = words.reduce((total, word) => total + (allText.split(word).length - 1), 0);
    if (count > 0) hits.push({ topic, count });
  }
  hits.sort((a, b) => b.count - a.count);

  let summary = `${feedback.length} response(s): ${suggestionCount} suggestion(s), ${complaintCount} complaint(s). `;
  if (hits.length > 0) {
    summary += "Most mentioned topics: " + hits.slice(0, 3).map((h) => h.topic).join(", ") + ".";
  } else {
    summary += "No strong recurring topic detected yet.";
  }

  document.getElementById("ai-summary").textContent = summary;
}

// Start on the login screen.
showScreen("screen-login");
