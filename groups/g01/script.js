// --- Leaderboard (sorted by age, oldest first) ---
const ageForm = document.getElementById("age-form");
const nameInput = document.getElementById("name-input");
const ageInput = document.getElementById("age-input");
const leaderboardList = document.getElementById("leaderboard-list");

async function setupLeaderboardTable() {
  try {
    await Summit.db.create("leaderboard", { name: "text", age: "real" });
  } catch (e) {
    console.log("leaderboard table:", e.message);
  }
}

async function loadLeaderboard() {
  if (!leaderboardList) return;
  try {
    const rows = await Summit.db.find("leaderboard", null, { sort: "age", dir: "desc", limit: 50 });
    leaderboardList.innerHTML = "";
    for (const row of rows) {
      const li = document.createElement("li");
      li.textContent = row.name + " — " + row.age;
      leaderboardList.appendChild(li);
    }
  } catch (e) {
    console.log("load leaderboard failed:", e.message);
  }
}

if (ageForm) {
  ageForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    const age = parseFloat(ageInput.value);
    if (!name || isNaN(age)) return;
    try {
      await Summit.db.insert("leaderboard", { name: name, age: age });
      nameInput.value = "";
      ageInput.value = "";
      await loadLeaderboard();
    } catch (e) {
      console.log("insert failed:", e.message);
    }
  });
}

// --- Poll (coffee vs tea) ---
const coffeeBtn = document.getElementById("vote-coffee");
const teaBtn = document.getElementById("vote-tea");
const pollResults = document.getElementById("poll-results");

async function setupVotesTable() {
  try {
    await Summit.db.create("votes", { option: "text" });
  } catch (e) {
    console.log("votes table:", e.message);
  }
}

async function loadPoll() {
  if (!pollResults) return;
  try {
    const counts = await Summit.db.tally("votes", "option");
    const coffee = counts.coffee || 0;
    const tea = counts.tea || 0;
    const total = coffee + tea;
    pollResults.innerHTML = "";
    pollResults.appendChild(buildBar("☕ Coffee", coffee, total));
    pollResults.appendChild(buildBar("🍵 Tea", tea, total));
  } catch (e) {
    console.log("load poll failed:", e.message);
  }
}

function buildBar(label, count, total) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const row = document.createElement("div");
  row.className = "poll-bar-row";
  row.innerHTML =
    '<div class="poll-bar-label"><span>' + label + '</span><span>' + count + ' (' + pct + '%)</span></div>' +
    '<div class="poll-bar-bg"><div class="poll-bar-fill" style="width:' + pct + '%"></div></div>';
  return row;
}

async function vote(option) {
  try {
    await Summit.db.insert("votes", { option: option });
    await loadPoll();
  } catch (e) {
    console.log("vote failed:", e.message);
  }
}

if (coffeeBtn) coffeeBtn.addEventListener("click", function () { vote("coffee"); });
if (teaBtn) teaBtn.addEventListener("click", function () { vote("tea"); });

// --- Init ---
async function init() {
  await setupLeaderboardTable();
  await setupVotesTable();
  await loadLeaderboard();
  await loadPoll();
}
init();
