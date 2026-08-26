// Gene Survival Simulation
// Every person has `numGenes` genes. Each gene is one specific named trait
// drawn from the pool of traits the dashboard has enabled. Each trait maps
// to one underlying mechanic ("kind") AND has its own unique strength, so
// genes that share a mechanic still behave differently from each other.

const EFFECT_INFO = {
  "none": { kind: "none", value: 0 },

  // disease-resistance: value = % disease chance removed per copy
  "Thick Skin": { kind: "disease-resistance", value: 10 },
  "Antibody Boost": { kind: "disease-resistance", value: 9 },
  "Pathogen Shield": { kind: "disease-resistance", value: 8 },
  "Robust Cells": { kind: "disease-resistance", value: 7 },
  "Toxin Tolerance": { kind: "disease-resistance", value: 6 },
  "Scar Tissue": { kind: "disease-resistance", value: 5 },
  "Iron Gut": { kind: "disease-resistance", value: 4 },

  // immunity: stronger version of the same mechanic, still each unique
  "Super Immunity": { kind: "immunity", value: 16 },
  "Viral Defense": { kind: "immunity", value: 14 },
  "Fever Response": { kind: "immunity", value: 12 },
  "Immune Memory": { kind: "immunity", value: 10 },
  "White Cell Surge": { kind: "immunity", value: 8 },
  "Antiviral Enzyme": { kind: "immunity", value: 6 },
  "Pathogen Purge": { kind: "immunity", value: 4 },

  // food-efficiency: extra weight added when competing for food
  "Slow Metabolism": { kind: "food-efficiency", value: 0.7 },
  "Nutrient Absorption": { kind: "food-efficiency", value: 0.6 },
  "Fat Storage": { kind: "food-efficiency", value: 0.5 },
  "Efficient Digestion": { kind: "food-efficiency", value: 0.4 },
  "Low Energy Use": { kind: "food-efficiency", value: 0.35 },
  "Lean Frame": { kind: "food-efficiency", value: 0.25 },
  "Calorie Saver": { kind: "food-efficiency", value: 0.15 },

  // foraging: bigger weight bonus, still each a different amount
  "Keen Eyesight": { kind: "foraging", value: 1.4 },
  "Sharp Smell": { kind: "foraging", value: 1.2 },
  "Fast Legs": { kind: "foraging", value: 1.0 },
  "Tracking Instinct": { kind: "foraging", value: 0.8 },
  "Night Vision": { kind: "foraging", value: 0.6 },
  "Climbing Skill": { kind: "foraging", value: 0.4 },
  "Pack Hunting": { kind: "foraging", value: 0.2 },

  // fast-reproduction: % boost to chance of pairing off successfully
  "Charisma": { kind: "fast-reproduction", value: 12 },
  "High Libido": { kind: "fast-reproduction", value: 10 },
  "Strong Pheromones": { kind: "fast-reproduction", value: 8 },
  "Courtship Display": { kind: "fast-reproduction", value: 6 },
  "Bright Plumage": { kind: "fast-reproduction", value: 5 },
  "Social Bonding": { kind: "fast-reproduction", value: 3 },
  "Mating Call": { kind: "fast-reproduction", value: 2 },

  // fertility: extra babies contributed per copy (fractional, summed then floored)
  "Twin Gene": { kind: "fertility", value: 1.0 },
  "High Fertility": { kind: "fertility", value: 0.8 },
  "Large Litter": { kind: "fertility", value: 0.65 },
  "Egg Abundance": { kind: "fertility", value: 0.5 },
  "Womb Strength": { kind: "fertility", value: 0.4 },
  "Hormone Surge": { kind: "fertility", value: 0.25 },
  "Multiple Ovulation": { kind: "fertility", value: 0.15 },

  // longevity: % old-age risk removed per copy
  "Cellular Repair": { kind: "longevity", value: 4.5 },
  "Antioxidant Boost": { kind: "longevity", value: 4.0 },
  "Telomere Length": { kind: "longevity", value: 3.5 },
  "Slow Aging": { kind: "longevity", value: 3.0 },
  "Strong Heart": { kind: "longevity", value: 2.5 },
  "Resilient Organs": { kind: "longevity", value: 2.0 },
  "Youthful Genes": { kind: "longevity", value: 1.5 },
  "Long Lifespan": { kind: "longevity", value: 1.0 },
};

const ALL_EFFECTS = Object.keys(EFFECT_INFO);

const KIND_LABELS = {
  "disease-resistance": "reduces disease chance (varies 4-10%)",
  "immunity": "reduces disease chance (varies 4-16%)",
  "food-efficiency": "small boost to finding food (varies)",
  "foraging": "big boost to finding food (varies)",
  "fast-reproduction": "boost to pairing chance (varies)",
  "fertility": "extra babies (varies)",
  "longevity": "reduces old-age death (varies)",
};

const MAX_PEOPLE = 1000000;
const MAX_GENES = 10;

let numGenes = 2;
let enabledEffects = ["Thick Skin", "Nutrient Absorption", "Charisma"];
let population = [];
let generation = 0;
let running = false;
let timer = null;
let history = [];

function randomGene() {
  const pool = enabledEffects.length > 0 ? enabledEffects : ["none"];
  return pool[Math.floor(Math.random() * pool.length)];
}

function mutateRate() {
  return clampInt(document.getElementById("mutateRate").value, 0, 100);
}

function makePerson(parentA, parentB) {
  const genes = [];
  for (let i = 0; i < numGenes; i++) {
    let g;
    if (parentA && parentB) {
      g = Math.random() < 0.5 ? parentA.genes[i] : parentB.genes[i];
    } else if (parentA) {
      g = parentA.genes[i];
    } else {
      g = randomGene();
    }
    if (g === undefined) g = randomGene();
    if (Math.random() * 100 < mutateRate()) g = randomGene();
    genes.push(g);
  }
  return { genes };
}

// Sums the strength value of every gene a person has that matches `kind`.
function sumKind(person, kind) {
  let total = 0;
  for (let i = 0; i < numGenes; i++) {
    const info = EFFECT_INFO[person.genes[i]];
    if (info && info.kind === kind) total += info.value;
  }
  return total;
}

function setup() {
  const numPeople = clampInt(document.getElementById("numPeople").value, 1, MAX_PEOPLE);
  numGenes = clampInt(document.getElementById("numGenes").value, 1, MAX_GENES);
  renderGenePicker();
  population = [];
  for (let i = 0; i < numPeople; i++) population.push(makePerson(null, null));
  generation = 0;
  history = [population.length];
  logClear();
  log(`Simulation started with ${numPeople} people and ${numGenes} genes.`);
  updateLabels();
  drawGraph();
}

function clampInt(v, min, max) {
  v = parseInt(v, 10);
  if (isNaN(v)) v = min;
  return Math.max(min, Math.min(max, v));
}

function renderGenePicker() {
  const container = document.getElementById("geneEffects");
  if (!container) return;
  container.innerHTML = "";
  const title = document.createElement("p");
  title.textContent = "Genes available in the pool (unchecked genes never appear). Each gene has its own unique strength:";
  title.className = "gene-pool-title";
  container.appendChild(title);

  // Group by kind so the 50 genes are easier to scan.
  const byKind = {};
  ALL_EFFECTS.filter((e) => e !== "none").forEach((eff) => {
    const kind = EFFECT_INFO[eff].kind;
    if (!byKind[kind]) byKind[kind] = [];
    byKind[kind].push(eff);
  });

  Object.keys(byKind).forEach((kind) => {
    const group = document.createElement("div");
    group.className = "gene-group";
    const heading = document.createElement("strong");
    heading.textContent = `${kind} (${KIND_LABELS[kind]})`;
    group.appendChild(heading);
    byKind[kind].forEach((eff) => {
      const row = document.createElement("label");
      row.className = "gene-row";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = enabledEffects.includes(eff);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          if (!enabledEffects.includes(eff)) enabledEffects.push(eff);
        } else {
          enabledEffects = enabledEffects.filter((e) => e !== eff);
        }
      });
      const span = document.createElement("span");
      span.textContent = `${eff} (${EFFECT_INFO[eff].value})`;
      row.appendChild(checkbox);
      row.appendChild(span);
      group.appendChild(row);
    });
    container.appendChild(group);
  });
}

function runGeneration() {
  if (population.length === 0) {
    log("Everyone died out. Press Reset to start over.");
    stopPlaying();
    return;
  }

  generation++;
  const diseaseRate = clampInt(document.getElementById("diseaseRate").value, 0, 100);
  const reproRate = clampInt(document.getElementById("reproRate").value, 0, 100);
  const food = clampInt(document.getElementById("foodAmount").value, 0, MAX_PEOPLE * 2);
  const houses = clampInt(document.getElementById("numHouses").value, 0, MAX_PEOPLE);
  const offspringPerBirth = clampInt(document.getElementById("offspringCount").value, 1, 10);

  // Finding food: everyone gets a weight based on food-efficiency/foraging genes.
  // Only the top `food` people (by weight, with randomness) actually eat.
  // Anyone who doesn't find food dies.
  const weighted = population.map((p) => ({
    p,
    weight: 1 + sumKind(p, "food-efficiency") + sumKind(p, "foraging") + Math.random() * 0.5,
  }));
  weighted.sort((a, b) => b.weight - a.weight);
  const fed = weighted.slice(0, food).map((w) => w.p);
  const starved = population.length - fed.length;
  if (starved > 0) log(`Gen ${generation}: ${starved} could not find food and died.`);

  // Old age / background death, reduced by longevity gene.
  let oldAgeDeaths = 0;
  const afterAge = fed.filter((p) => {
    const risk = Math.max(0, 5 - sumKind(p, "longevity"));
    if (Math.random() * 100 < risk) {
      oldAgeDeaths++;
      return false;
    }
    return true;
  });
  if (oldAgeDeaths > 0) log(`Gen ${generation}: ${oldAgeDeaths} died of old age.`);

  // Disease
  const survivors = [];
  let diseaseDeaths = 0;
  for (const p of afterAge) {
    const resistance = sumKind(p, "disease-resistance") + sumKind(p, "immunity");
    const chance = Math.max(0, diseaseRate - resistance);
    if (Math.random() * 100 < chance) {
      diseaseDeaths++;
    } else {
      survivors.push(p);
    }
  }
  if (diseaseDeaths > 0) log(`Gen ${generation}: disease killed ${diseaseDeaths}.`);

  // Reproduction: fed, disease-free survivors pair up two by two. Each pair
  // needs a free house to reproduce.
  const offspring = [];
  let housesLeft = houses;
  for (let i = 0; i + 1 < survivors.length; i += 2) {
    if (housesLeft <= 0) break;
    if (survivors.length + offspring.length >= MAX_PEOPLE) break;
    const a = survivors[i];
    const b = survivors[i + 1];
    const boost = sumKind(a, "fast-reproduction") + sumKind(b, "fast-reproduction");
    const chance = Math.min(100, reproRate + boost);
    if (Math.random() * 100 < chance) {
      housesLeft--;
      const extra = Math.floor(sumKind(a, "fertility") + sumKind(b, "fertility"));
      const babies = Math.min(offspringPerBirth + extra, MAX_PEOPLE - survivors.length - offspring.length);
      for (let n = 0; n < babies; n++) offspring.push(makePerson(a, b));
    }
  }
  if (offspring.length > 0) log(`Gen ${generation}: ${offspring.length} born (houses used: ${houses - housesLeft}).`);

  population = survivors.concat(offspring);
  history.push(population.length);
  if (history.length > 100) history.shift();

  updateLabels();
  drawGraph();

  if (population.length === 0) {
    log(`Gen ${generation}: population extinct.`);
    stopPlaying();
  }
}

function updateLabels() {
  document.getElementById("genLabel").textContent = `Generation: ${generation}`;
  document.getElementById("popLabel").textContent = `Population: ${population.length}`;
}

function log(msg) {
  const logEl = document.getElementById("log");
  if (!logEl) return;
  const line = document.createElement("div");
  line.textContent = msg;
  logEl.prepend(line);
  // Keep the log from growing forever at huge population counts.
  while (logEl.childNodes.length > 200) logEl.removeChild(logEl.lastChild);
}

function logClear() {
  const logEl = document.getElementById("log");
  if (logEl) logEl.innerHTML = "";
}

function drawGraph() {
  const canvas = document.getElementById("graph");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (history.length < 2) return;
  const max = Math.max(...history, 1);
  ctx.strokeStyle = "#4f46e5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  history.forEach((val, i) => {
    const x = (i / (history.length - 1)) * canvas.width;
    const y = canvas.height - (val / max) * (canvas.height - 10) - 5;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function startPlaying() {
  if (running) return;
  running = true;
  document.getElementById("playBtn").textContent = "⏸ Pause";
  timer = setInterval(runGeneration, 500);
}

function stopPlaying() {
  running = false;
  document.getElementById("playBtn").textContent = "▶ Play";
  clearInterval(timer);
  timer = null;
}

function init() {
  document.getElementById("diseaseRate").addEventListener("input", (e) => {
    document.getElementById("diseaseVal").textContent = e.target.value;
  });
  document.getElementById("reproRate").addEventListener("input", (e) => {
    document.getElementById("reproVal").textContent = e.target.value;
  });
  document.getElementById("mutateRate").addEventListener("input", (e) => {
    document.getElementById("mutateVal").textContent = e.target.value;
  });
  document.getElementById("numGenes").addEventListener("change", () => {
    numGenes = clampInt(document.getElementById("numGenes").value, 1, MAX_GENES);
  });

  document.getElementById("playBtn").addEventListener("click", () => {
    if (population.length === 0) setup();
    if (running) stopPlaying();
    else startPlaying();
  });

  document.getElementById("stepBtn").addEventListener("click", () => {
    if (population.length === 0) setup();
    else runGeneration();
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    stopPlaying();
    setup();
  });

  renderGenePicker();
  updateLabels();
}

init();
