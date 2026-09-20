// ---------- Grandkid House: front page + shared room ----------

const joinScreen = document.getElementById("join-screen");
const homeScreen = document.getElementById("home-screen");
const nameInput = document.getElementById("name-input");
const joinBtn = document.getElementById("join-btn");
const joinError = document.getElementById("join-error");
const whoAmI = document.getElementById("who-am-i");
const room = document.getElementById("room");
const avatarLayer = document.getElementById("avatar-layer");
const homeStatus = document.getElementById("home-status");

// Statuses that keep a sprite standing still. Anything else (including no
// status set yet) is "free" and lets the sprite wander the floor.
const STILL_STATUSES = ["working", "sleeping", "chores", "playing games", "exercising"];

// All choosable statuses, with a small icon shown on the sprite.
const STATUSES = [
  { name: "working", icon: "💼" },
  { name: "sleeping", icon: "😴" },
  { name: "chores", icon: "🧹" },
  { name: "playing games", icon: "🎮" },
  { name: "relaxing", icon: "🌿" },
  { name: "exercising", icon: "🏃" },
  { name: "free to chat", icon: "💬" }
];

function iconFor(status) {
  const s = STATUSES.find(function (x) { return x.name === status; });
  return s ? s.icon : "";
}

const statusPicker = document.getElementById("status-picker");
const statusOptions = document.getElementById("status-options");
const statusCancel = document.getElementById("status-cancel");

function openStatusPicker() {
  statusOptions.innerHTML = "";
  STATUSES.forEach(function (s) {
    const btn = document.createElement("button");
    btn.textContent = s.icon + " " + s.name;
    if (liveAvatars[myName] && liveAvatars[myName].status === s.name) {
      btn.classList.add("selected");
    }
    btn.addEventListener("click", function () { chooseStatus(s.name); });
    statusOptions.appendChild(btn);
  });
  statusPicker.classList.remove("hidden");
}

function closeStatusPicker() {
  statusPicker.classList.add("hidden");
}

async function chooseStatus(status) {
  try {
    await Summit.db.update("avatars", { name: myName }, { status: status });
    closeStatusPicker();
    renderRoom();
  } catch (e) {
    homeStatus.textContent = "Could not set status: " + e.message;
  }
}

statusCancel.addEventListener("click", closeStatusPicker);
statusPicker.addEventListener("click", function (e) {
  if (e.target === statusPicker) closeStatusPicker();
});

// Elements already on screen, keyed by name, so a poll updates them in
// place instead of rebuilding the room (which would reset any wander).
const liveAvatars = {};

// Pick a random point inside the floor rhombus (percent coordinates).
// The floor's four corners are (50,100) (100,75) (50,50) (0,75), so any
// point with |s| + |t| <= 1 mapped from the diamond's own axes stays inside.
function randomFloorSpot() {
  let s, t;
  do {
    s = Math.random() * 2 - 1;
    t = Math.random() * 2 - 1;
  } while (Math.abs(s) + Math.abs(t) > 1);
  return { x: 50 + s * 48, y: 75 + t * 23 };
}

function scheduleWander(entry) {
  clearTimeout(entry.wanderTimer);
  entry.wanderTimer = setTimeout(function () {
    if (STILL_STATUSES.indexOf(entry.status) !== -1) {
      scheduleWander(entry);
      return;
    }
    const spot = randomFloorSpot();
    entry.el.style.left = spot.x + "%";
    entry.el.style.top = spot.y + "%";
    scheduleWander(entry);
  }, 3000 + Math.random() * 3000);
}

const PASTEL_COLORS = [
  "#F9C6C9", "#FDE68A", "#BBF7D0", "#BAE6FD",
  "#DDD6FE", "#FBCFE8", "#FEF3C7", "#A7F3D0"
];

let myName = null;
let myColor = null;
let pollTimer = null;

// Make sure the shared "avatars" table exists (name, color, status).
async function ensureTable() {
  await Summit.db.create("avatars", {
    name: "text",
    color: "text",
    status: "text"
  });
}

function showError(msg) {
  joinError.textContent = msg;
}

async function handleJoin() {
  const name = nameInput.value.trim();
  if (!name) {
    showError("Please type your name before joining.");
    return;
  }
  showError("");
  joinBtn.disabled = true;
  joinBtn.textContent = "Joining…";

  try {
    await ensureTable();
    myName = name;
    myColor = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];

    // Remove any earlier entry with the same name (fresh join each time),
    // then add this visitor to the shared room.
    await Summit.db.remove("avatars", { name: myName });
    await Summit.db.insert("avatars", {
      name: myName,
      color: myColor,
      status: "relaxing"
    });

    joinScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");
    whoAmI.textContent = "You are: " + myName;

    renderRoom();
    pollTimer = setInterval(renderRoom, 2000);
  } catch (e) {
    showError("Could not join right now: " + e.message);
    joinBtn.disabled = false;
    joinBtn.textContent = "Join the house";
  }
}

async function renderRoom() {
  try {
    const everyone = await Summit.db.find("avatars", null, { sort: "ts", dir: "asc" });
    const seen = {};

    everyone.forEach(function (person) {
      seen[person.name] = true;
      let entry = liveAvatars[person.name];

      if (!entry) {
        const avatar = document.createElement("div");
        avatar.className = "avatar";

        const body = document.createElement("div");
        body.className = "avatar-body";

        const badge = document.createElement("div");
        badge.className = "avatar-badge";

        const label = document.createElement("div");
        label.className = "avatar-name";

        body.appendChild(badge);
        avatar.appendChild(body);
        avatar.appendChild(label);
        avatarLayer.appendChild(avatar);

        const spot = randomFloorSpot();
        avatar.style.left = spot.x + "%";
        avatar.style.top = spot.y + "%";

        entry = { el: avatar, body: body, badge: badge, label: label, status: person.status };
        liveAvatars[person.name] = entry;
        scheduleWander(entry);

        if (person.name === myName) {
          avatar.classList.add("mine");
          body.addEventListener("click", openStatusPicker);
        }
      }

      entry.status = person.status;
      entry.body.style.background = person.color || "#BAE6FD";
      entry.badge.textContent = iconFor(person.status);
      entry.label.textContent = person.name + (person.status ? " (" + person.status + ")" : "");
    });

    // Remove sprites for anyone who left.
    Object.keys(liveAvatars).forEach(function (name) {
      if (!seen[name]) {
        clearTimeout(liveAvatars[name].wanderTimer);
        liveAvatars[name].el.remove();
        delete liveAvatars[name];
      }
    });

    homeStatus.textContent = everyone.length + " in the house right now.";
  } catch (e) {
    homeStatus.textContent = "Could not load the house: " + e.message;
  }
}

joinBtn.addEventListener("click", handleJoin);
nameInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") handleJoin();
});
