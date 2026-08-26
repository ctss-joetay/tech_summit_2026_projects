// Food Intake Tracker
// Data is saved with Summit.save/load so it survives a reload.

let goals = { cal: 2000, protein: 50, carbs: 275, fat: 70 };
let log = []; // { name, cal, protein, carbs, fat }
let weightLog = []; // { date, weight }

const goalInputs = {
  cal: document.getElementById("goal-cal"),
  protein: document.getElementById("goal-protein"),
  carbs: document.getElementById("goal-carbs"),
  fat: document.getElementById("goal-fat"),
};

const foodForm = document.getElementById("food-form");
const foodLogEl = document.getElementById("food-log");
const barsEl = document.getElementById("nutrient-bars");
const suggestionEl = document.getElementById("suggestion");
const suggestionListEl = document.getElementById("suggestion-list");
const jaydenBtn = document.getElementById("add-jayden-snack");
const foodNameInput = document.getElementById("food-name");
const foodCalInput = document.getElementById("food-cal");

const weightForm = document.getElementById("weight-form");
const weightValueInput = document.getElementById("weight-value");
const weightLogEl = document.getElementById("weight-log");
const weightChangeEl = document.getElementById("weight-change");

// Reference foods per nutrient, with approximate values per typical serving.
const foodSuggestions = {
  protein: [
    { name: "Grilled chicken breast (100g)", cal: 165, protein: 31, carbs: 0, fat: 4 },
    { name: "Greek yogurt (170g)", cal: 100, protein: 17, carbs: 6, fat: 0 },
    { name: "Eggs (2 large)", cal: 140, protein: 12, carbs: 1, fat: 10 },
    { name: "Tofu (100g)", cal: 76, protein: 8, carbs: 2, fat: 4 },
  ],
  carbs: [
    { name: "Cooked rice (1 cup)", cal: 205, protein: 4, carbs: 45, fat: 0 },
    { name: "Oats (1 cup cooked)", cal: 158, protein: 6, carbs: 27, fat: 3 },
    { name: "Banana", cal: 105, protein: 1, carbs: 27, fat: 0 },
    { name: "Whole-grain bread (2 slices)", cal: 160, protein: 8, carbs: 28, fat: 2 },
  ],
  fat: [
    { name: "Almonds (28g)", cal: 164, protein: 6, carbs: 6, fat: 14 },
    { name: "Avocado (half)", cal: 120, protein: 1, carbs: 6, fat: 11 },
    { name: "Salmon (100g)", cal: 208, protein: 20, carbs: 0, fat: 13 },
    { name: "Olive oil (1 tbsp)", cal: 119, protein: 0, carbs: 0, fat: 14 },
  ],
};

async function init() {
  const savedGoals = await Summit.load("goals");
  if (savedGoals) {
    goals = savedGoals;
    goalInputs.cal.value = goals.cal;
    goalInputs.protein.value = goals.protein;
    goalInputs.carbs.value = goals.carbs;
    goalInputs.fat.value = goals.fat;
  }
  const savedLog = await Summit.load("todayLog");
  if (Array.isArray(savedLog)) log = savedLog;

  const savedWeights = await Summit.load("weightLog");
  if (Array.isArray(savedWeights)) weightLog = savedWeights;

  render();
}

document.getElementById("save-goals").addEventListener("click", async () => {
  goals = {
    cal: Number(goalInputs.cal.value) || 0,
    protein: Number(goalInputs.protein.value) || 0,
    carbs: Number(goalInputs.carbs.value) || 0,
    fat: Number(goalInputs.fat.value) || 0,
  };
  await Summit.save("goals", goals);
  render();
});

// Easter egg: typing "Jayden" as the food name sets the calorie field to
// an absurdly huge number. Real 9^9^9^9 is far beyond what any number
// format can store (JavaScript would just call it Infinity), so we use
// Number.MAX_SAFE_INTEGER as the "biggest number that still behaves" stand-in.
if (foodNameInput && foodCalInput) {
  foodNameInput.addEventListener("input", () => {
    if (foodNameInput.value.trim().toLowerCase() === "jayden") {
      foodCalInput.value = Number.MAX_SAFE_INTEGER;
    }
  });
}

foodForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const item = {
    name: document.getElementById("food-name").value.trim(),
    cal: Number(document.getElementById("food-cal").value) || 0,
    protein: Number(document.getElementById("food-protein").value) || 0,
    carbs: Number(document.getElementById("food-carbs").value) || 0,
    fat: Number(document.getElementById("food-fat").value) || 0,
  };
  if (!item.name) return;
  log.push(item);
  await Summit.save("todayLog", log);
  foodForm.reset();
  render();
});

// A preset "junk food" entry: lots of calories and fat, very little
// protein or carbs — the opposite of a balanced meal.
if (jaydenBtn) {
  jaydenBtn.addEventListener("click", async () => {
    const item = {
      name: "Jayden's Fried Pork Rinds",
      cal: 620,
      protein: 4,
      carbs: 2,
      fat: 45,
    };
    log.push(item);
    await Summit.save("todayLog", log);
    render();
  });
}

async function removeItem(index) {
  log.splice(index, 1);
  await Summit.save("todayLog", log);
  render();
}

// --- Weight tracking ---

if (weightForm) {
  weightForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const weight = Number(weightValueInput.value);
    if (!weight || weight <= 0) return;
    weightLog.push({ date: new Date().toLocaleDateString(), weight });
    await Summit.save("weightLog", weightLog);
    weightForm.reset();
    renderWeights();
  });
}

async function removeWeight(index) {
  weightLog.splice(index, 1);
  await Summit.save("weightLog", weightLog);
  renderWeights();
}

function renderWeights() {
  if (!weightLogEl) return;
  weightLogEl.innerHTML = "";

  if (weightLog.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No weight entries yet.";
    weightLogEl.appendChild(li);
    weightChangeEl.textContent = "";
    return;
  }

  weightLog.forEach((entry, i) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = `${entry.date} — ${entry.weight} kg`;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "remove-btn";
    removeBtn.addEventListener("click", () => removeWeight(i));
    li.appendChild(label);
    li.appendChild(removeBtn);
    weightLogEl.appendChild(li);
  });

  if (weightLog.length >= 2) {
    const last = weightLog[weightLog.length - 1].weight;
    const prev = weightLog[weightLog.length - 2].weight;
    const diff = (last - prev).toFixed(1);
    if (diff > 0) {
      weightChangeEl.textContent = `Up ${diff} kg since last entry.`;
    } else if (diff < 0) {
      weightChangeEl.textContent = `Down ${Math.abs(diff)} kg since last entry.`;
    } else {
      weightChangeEl.textContent = "No change since last entry.";
    }
  } else {
    weightChangeEl.textContent = "Log another entry to see your trend.";
  }
}

function totals() {
  return log.reduce(
    (acc, item) => {
      acc.cal += item.cal;
      acc.protein += item.protein;
      acc.carbs += item.carbs;
      acc.fat += item.fat;
      return acc;
    },
    { cal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function renderLog() {
  foodLogEl.innerHTML = "";
  if (log.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No foods logged yet today.";
    foodLogEl.appendChild(li);
    return;
  }
  log.forEach((item, i) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = `${item.name} — ${item.cal} kcal, P${item.protein} C${item.carbs} F${item.fat}`;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "remove-btn";
    removeBtn.addEventListener("click", () => removeItem(i));
    li.appendChild(label);
    li.appendChild(removeBtn);
    foodLogEl.appendChild(li);
  });
}

function renderBars(sum) {
  barsEl.innerHTML = "";
  const nutrients = [
    { key: "cal", label: "Calories", unit: "kcal" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "carbs", label: "Carbs", unit: "g" },
    { key: "fat", label: "Fat", unit: "g" },
  ];
  nutrients.forEach((n) => {
    const goal = goals[n.key] || 1;
    const value = sum[n.key];
    const pct = Math.min(100, (value / goal) * 100);
    const row = document.createElement("div");
    row.className = "bar-row";
    const labelRow = document.createElement("div");
    labelRow.className = "bar-label";
    labelRow.innerHTML = `<span>${n.label}</span><span>${value} / ${goal} ${n.unit}</span>`;
    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill" + (value > goal ? " over" : "");
    fill.style.width = pct + "%";
    track.appendChild(fill);
    row.appendChild(labelRow);
    row.appendChild(track);
    barsEl.appendChild(row);
  });
}

function renderSuggestion(sum) {
  suggestionListEl.innerHTML = "";

  const remaining = {
    cal: goals.cal - sum.cal,
    protein: goals.protein - sum.protein,
    carbs: goals.carbs - sum.carbs,
    fat: goals.fat - sum.fat,
  };

  if (remaining.cal <= 0) {
    suggestionEl.textContent =
      "You've hit or passed your calorie goal for today. Consider a light, low-calorie snack if you're still hungry — like vegetables or a piece of fruit.";
    return;
  }

  // Find which nutrient is furthest behind its goal, proportionally.
  const gaps = [
    { key: "protein", label: "protein", pct: sum.protein / (goals.protein || 1) },
    { key: "carbs", label: "carbs", pct: sum.carbs / (goals.carbs || 1) },
    { key: "fat", label: "fat", pct: sum.fat / (goals.fat || 1) },
  ];
  gaps.sort((a, b) => a.pct - b.pct);
  const lowest = gaps[0];

  suggestionEl.textContent =
    `You have about ${Math.max(0, remaining.cal)} kcal left today. ` +
    `You're lowest on ${lowest.label} relative to your goal. Try one of these:`;

  const options = foodSuggestions[lowest.key] || [];
  options.forEach((food) => {
    const li = document.createElement("li");
    li.textContent =
      `${food.name} — ${food.cal} kcal, P${food.protein}g C${food.carbs}g F${food.fat}g`;
    suggestionListEl.appendChild(li);
  });
}

function render() {
  const sum = totals();
  renderLog();
  renderBars(sum);
  renderSuggestion(sum);
  renderWeights();
}

init();
</content>
