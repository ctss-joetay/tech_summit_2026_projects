// --- Digimon data (Digidex) ---
const DIGIMON = [
  { name: "Botamon", emoji: "🥚", stage: "Baby", desc: "A tiny, round in-training Digimon that hatches from a Digitama." },
  { name: "Koromon", emoji: "🟠", stage: "In-Training", desc: "Bounces around cheerfully; digivolves into Agumon." },
  { name: "Agumon", emoji: "🦖", stage: "Rookie", desc: "A small dinosaur Digimon with a fiery Pepper Breath attack." },
  { name: "Gabumon", emoji: "🐺", stage: "Rookie", desc: "Wears the fur of a Garurumon; shy but loyal." },
  { name: "Biyomon", emoji: "🐦", stage: "Rookie", desc: "A pink bird Digimon known for its Spiral Twister move." },
  { name: "Tentomon", emoji: "🪲", stage: "Rookie", desc: "An insect Digimon that fires Super Shocker bolts." },
  { name: "Palmon", emoji: "🌵", stage: "Rookie", desc: "A plant Digimon that whips enemies with Poison Ivy." },
  { name: "Gomamon", emoji: "🦭", stage: "Rookie", desc: "A playful seal Digimon that loves to swim." },
  { name: "Greymon", emoji: "🦕", stage: "Champion", desc: "Agumon's evolved form, with a mighty Nova Blast." },
  { name: "Garurumon", emoji: "🐺", stage: "Champion", desc: "A wolf Digimon that howls Howling Blaster." },
  { name: "Birdramon", emoji: "🔥", stage: "Champion", desc: "A fiery phoenix-like Digimon." },
  { name: "Kabuterimon", emoji: "🐞", stage: "Champion", desc: "A giant beetle Digimon with electric horns." },
  { name: "MetalGreymon", emoji: "🤖", stage: "Ultimate", desc: "Cybernetic upgrade of Greymon with a Giga Blaster." },
  { name: "WereGarurumon", emoji: "🐾", stage: "Ultimate", desc: "A werewolf-like Digimon, fast and fierce." },
  { name: "Angewomon", emoji: "😇", stage: "Ultimate", desc: "An angelic Digimon wielding holy arrows." },
  { name: "WarGreymon", emoji: "🛡️", stage: "Mega", desc: "One of the strongest Digimon, wielding the Dramon Killer claws." },
  { name: "MetalGarurumon", emoji: "🧊", stage: "Mega", desc: "A cyborg wolf Digimon with Giga Missiles." },
  { name: "Omnimon", emoji: "⚔️", stage: "Mega", desc: "The fused ultimate form of WarGreymon and MetalGarurumon." },
];

const CATCH_CHANCE = {
  Baby: 0.9,
  "In-Training": 0.85,
  Rookie: 0.7,
  Champion: 0.5,
  Ultimate: 0.3,
  Mega: 0.15,
};

// --- State ---
const STARTING_GOAL = 35;
let remaining = STARTING_GOAL;
let goal = STARTING_GOAL;
let totalSteps = 0;
let currentDigimon = null;
let collection = [];

// --- Elements ---
const stepBtn = document.getElementById("simulate-shake");
const distanceBar = document.getElementById("distance-bar");
const distanceValue = document.getElementById("distance-value");
const shakeMeter = document.getElementById("shake-meter");
const totalStepsEl = document.getElementById("total-steps");
const encounterSection = document.getElementById("encounter");
const critterEmoji = document.getElementById("critter-emoji");
const critterName = document.getElementById("critter-name");
const catchBtn = document.getElementById("catch-btn");
const catchResult = document.getElementById("catch-result");
const collectionGrid = document.getElementById("collection-grid");
const collectionEmpty = document.getElementById("collection-empty");
const digidexGrid = document.getElementById("digidex-grid");

// --- Load saved collection ---
async function loadCollection() {
  const saved = await Summit.load("collection");
  if (Array.isArray(saved)) {
    collection = saved;
    renderCollection();
  }
  renderDigidex();
}

function renderCollection() {
  collectionGrid.innerHTML = "";
  if (collection.length === 0) {
    collectionEmpty.classList.remove("hidden");
    return;
  }
  collectionEmpty.classList.add("hidden");
  collection.forEach((c) => {
    const div = document.createElement("div");
    div.className = "collection-item";
    div.textContent = c.emoji;
    const label = document.createElement("span");
    label.textContent = c.name;
    div.appendChild(label);
    collectionGrid.appendChild(div);
  });
}

// --- Digidex (reference book) ---
function renderDigidex() {
  digidexGrid.innerHTML = "";
  const caughtNames = new Set(collection.map((c) => c.name));
  DIGIMON.forEach((d) => {
    const discovered = caughtNames.has(d.name);
    const div = document.createElement("div");
    div.className = "digidex-entry" + (discovered ? "" : " undiscovered");
    const emoji = document.createElement("span");
    emoji.className = "digidex-emoji";
    emoji.textContent = discovered ? d.emoji : "❔";
    const name = document.createElement("p");
    name.className = "digidex-name";
    name.textContent = discovered ? d.name : "???";
    const stage = document.createElement("p");
    stage.className = "digidex-stage";
    stage.textContent = d.stage;
    const desc = document.createElement("p");
    desc.className = "digidex-desc";
    desc.textContent = discovered ? d.desc : "Not yet discovered. Go find it!";
    div.appendChild(emoji);
    div.appendChild(name);
    div.appendChild(stage);
    div.appendChild(desc);
    digidexGrid.appendChild(div);
  });
}

// --- Distance / encounter logic ---
function updateDistanceDisplay() {
  distanceValue.textContent = Math.max(0, Math.ceil(remaining));
  totalStepsEl.textContent = totalSteps;
  const pct = Math.min(100, ((goal - remaining) / goal) * 100);
  distanceBar.style.width = pct + "%";
}

function takeStep() {
  if (currentDigimon) return; // pause progress during an encounter
  const stepPower = 1 + Math.random() * 4; // random amount of step power
  shakeMeter.textContent = stepPower.toFixed(1);
  totalSteps++;
  remaining -= stepPower;
  updateDistanceDisplay();
  if (remaining <= 0) {
    goal += 5;
    remaining = goal;
    spawnDigimon();
  }
}

function spawnDigimon() {
  currentDigimon = DIGIMON[Math.floor(Math.random() * DIGIMON.length)];
  critterEmoji.textContent = currentDigimon.emoji;
  critterName.textContent = `${currentDigimon.name} (${currentDigimon.stage})`;
  catchResult.textContent = "";
  catchBtn.disabled = false;
  encounterSection.classList.remove("hidden");
  updateDistanceDisplay();
}

catchBtn.addEventListener("click", async () => {
  if (!currentDigimon) return;
  const chance = CATCH_CHANCE[currentDigimon.stage] ?? 0.5;
  const success = Math.random() < chance;
  if (success) {
    catchResult.textContent = `Caught ${currentDigimon.name}! 🎉`;
    collection.push(currentDigimon);
    renderCollection();
    renderDigidex();
    await Summit.save("collection", collection);
    catchBtn.disabled = true;
    setTimeout(() => {
      encounterSection.classList.add("hidden");
      currentDigimon = null;
    }, 1200);
  } else {
    catchResult.textContent = `${currentDigimon.name} broke free! Try again.`;
  }
});

stepBtn.addEventListener("click", takeStep);

// --- Init ---
updateDistanceDisplay();
loadCollection();
