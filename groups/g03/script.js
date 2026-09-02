// ============================================================
// Solar Panel Dashboard
// This simulates a solar panel system (no real hardware is
// attached) so the dashboard can be demoed anywhere. Swap the
// functions marked "SIMULATED" for real sensor/API calls later.
// ============================================================

// ---- Grab all the elements we need once, at the top ----
const connectBtn   = document.getElementById("connectBtn");
const connDot       = document.getElementById("connDot");
const connLabel      = document.getElementById("connLabel");

const powerValueEl  = document.getElementById("powerValue");
const totalEnergyEl = document.getElementById("totalEnergy");
const lightValueEl  = document.getElementById("lightValue");
const sunAngleLabel = document.getElementById("sunAngleLabel");

const sunEl    = document.getElementById("sun");
const panelEl  = document.getElementById("panel");
const skyWidth = 500; // matches .sky's rendered width roughly, recalculated below

const autoBtn    = document.getElementById("autoBtn");
const manualBtn  = document.getElementById("manualBtn");
const manualControls = document.getElementById("manualControls");
const modeHint   = document.getElementById("modeHint");
const angleSlider = document.getElementById("angleSlider");
const angleSliderValue = document.getElementById("angleSliderValue");
const leftBtn  = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

const lightCanvas = document.getElementById("lightGraph");
const powerCanvas = document.getElementById("powerGraph");
const lightCtx = lightCanvas.getContext("2d");
const powerCtx = powerCanvas.getContext("2d");

// ---- State the page tracks ----
let connected = false;          // is the "solar panel" connected?
let mode = "auto";              // "auto" or "manual"
let sunAngle = 10;               // 0 = sunrise (left), 180 = sunset (right)
let panelAngle = 90;             // current physical angle of the panel
let totalEnergyKwh = 0;          // running total, in kWh

// History buffers for the two graphs (most recent ~60 readings)
const HISTORY_LEN = 60;
const lightHistory = [];
const powerHistory = [];

// ============================================================
// 1. CONNECT BUTTON
// ============================================================
connectBtn.addEventListener("click", () => {
  connected = !connected;
  if (connected) {
    connDot.classList.remove("offline");
    connDot.classList.add("online");
    connLabel.textContent = "Connected";
    connectBtn.textContent = "Disconnect";
  } else {
    connDot.classList.remove("online");
    connDot.classList.add("offline");
    connLabel.textContent = "Not connected";
    connectBtn.textContent = "Connect";
    powerValueEl.textContent = "--";
    lightValueEl.textContent = "--";
  }
});

// ============================================================
// 2. AUTO / MANUAL MODE
// ============================================================
autoBtn.addEventListener("click", () => setMode("auto"));
manualBtn.addEventListener("click", () => setMode("manual"));

function setMode(newMode) {
  mode = newMode;
  autoBtn.classList.toggle("active", mode === "auto");
  manualBtn.classList.toggle("active", mode === "manual");
  manualControls.classList.toggle("hidden", mode !== "manual");
  modeHint.textContent = mode === "auto"
    ? "Automatic mode: the motor uses the light sensor to keep the panel facing the sun."
    : "Manual mode: drag the slider or use the nudge buttons to aim the panel yourself.";
  if (mode === "manual") {
    // start manual angle from wherever the panel currently is
    angleSlider.value = Math.round(panelAngle);
    angleSliderValue.textContent = angleSlider.value;
  }
}

// Manual controls: slider directly sets the target angle
angleSlider.addEventListener("input", () => {
  angleSliderValue.textContent = angleSlider.value;
  if (mode === "manual") panelAngle = Number(angleSlider.value);
});

// Nudge buttons move the panel 5 degrees at a time, clamped 0-180
leftBtn.addEventListener("click", () => nudgePanel(-5));
rightBtn.addEventListener("click", () => nudgePanel(5));

function nudgePanel(delta) {
  if (mode !== "manual") return; // only works in manual mode
  panelAngle = Math.max(0, Math.min(180, panelAngle + delta));
  angleSlider.value = Math.round(panelAngle);
  angleSliderValue.textContent = angleSlider.value;
}

// ============================================================
// 3. SIMULATED SENSORS
// The sun sweeps from 0deg (sunrise) to 180deg (sunset) and
// back, over a couple of minutes, standing in for a full day.
// ============================================================
let simTime = 0; // seconds elapsed in the simulation

function stepSimulation(dtSeconds) {
  simTime += dtSeconds;

  // Sun angle: a slow back-and-forth sweep (one full day ~ 120s)
  const dayLength = 120;
  const t = (simTime % dayLength) / dayLength; // 0..1
  sunAngle = 180 * (0.5 - 0.5 * Math.cos(t * Math.PI * 2)); // eases 0->180->0

  // Light level (lux): brightest when sun is near the top of its arc.
  // We model "near the top" as sunAngle close to 90.
  const sunHeight = Math.sin((sunAngle / 180) * Math.PI); // 0 at edges, 1 at 90deg
  const lightLux = Math.round(sunHeight * 950 + 20); // 20..~970 lux

  // In automatic mode, the motor turns the panel to track the sun.
  if (mode === "auto") {
    panelAngle = sunAngle;
  }

  // Electricity output depends on how well the panel is aimed at
  // the sun (a bigger angle gap = a weaker angle = less power) AND
  // how bright it is.
  const angleGap = Math.abs(sunAngle - panelAngle); // 0 = perfectly aimed
  const aimFactor = Math.cos((angleGap / 180) * Math.PI / 2); // 1 aimed, 0 at 90deg off
  const powerKw = Math.max(0, (lightLux / 1000) * aimFactor * 5); // up to ~5kW

  return { lightLux, powerKw, sunHeight };
}

// ============================================================
// 4. MAIN LOOP - runs on a timer, updates numbers, panel and graphs
// ============================================================
const TICK_MS = 1000; // one reading per second

setInterval(() => {
  if (!connected) return; // nothing to show while disconnected

  const { lightLux, powerKw } = stepSimulation(TICK_MS / 1000);

  // Add energy generated in this tick (kW * hours elapsed)
  totalEnergyKwh += powerKw * (TICK_MS / 1000 / 3600);

  // Update the live numbers
  powerValueEl.textContent = powerKw.toFixed(2);
  totalEnergyEl.textContent = totalEnergyKwh.toFixed(3);
  lightValueEl.textContent = lightLux;
  sunAngleLabel.textContent = Math.round(sunAngle);

  // Move the sun and panel in the little illustration
  updateVisual(lightLux, powerKw);

  // Push into history and redraw graphs
  pushHistory(lightHistory, lightLux);
  pushHistory(powerHistory, powerKw);
  drawGraph(lightCtx, lightCanvas, lightHistory, "#00e5ff", 1000);
  drawGraph(powerCtx, powerCanvas, powerHistory, "#7cff6b", 5);
}, TICK_MS);

function pushHistory(arr, value) {
  arr.push(value);
  if (arr.length > HISTORY_LEN) arr.shift();
}

// ============================================================
// 5. VISUAL: move the sun across the sky, rotate the panel.
// Uses anime.js for a smooth transition each tick instead of a
// snap-to-position jump.
// ============================================================
function updateVisual(lightLux) {
  const skyBox = sunEl.parentElement.getBoundingClientRect();
  const usableWidth = skyBox.width - 34; // sun's own width
  const sunX = (sunAngle / 180) * usableWidth;

  anime({
    targets: sunEl,
    left: `${sunX}px`,
    opacity: 0.4 + (lightLux / 1000) * 0.6, // dimmer at sunrise/sunset
    duration: 900,
    easing: "linear"
  });

  // Panel rotation: 0deg = flat, we rotate around its centre.
  // Map panelAngle (0-180) to a visual tilt (-60deg to 60deg) so it
  // reads as "leaning towards the sun" rather than flipping over.
  const tilt = ((panelAngle - 90) / 90) * 60;
  anime({
    targets: panelEl,
    rotate: `${tilt}deg`,
    duration: 900,
    easing: "easeOutQuad"
  });
}

// ============================================================
// 6. GRAPHS: simple line chart drawn straight onto a <canvas>.
// No charting library needed for something this small.
// ============================================================
function drawGraph(ctx, canvas, data, color, maxValue) {
  // Canvas has a CSS size and an internal pixel size; keep them
  // matched so the line isn't blurry or squashed.
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.clientHeight || canvas.height;
  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (data.length < 2) return;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  data.forEach((value, i) => {
    const x = (i / (HISTORY_LEN - 1)) * width;
    const y = height - (Math.min(value, maxValue) / maxValue) * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// Set initial mode UI state and make the sun element absolutely
// positioned (CSS gives it left:50% by default; JS takes over once running).
sunEl.style.position = "absolute";
setMode("auto");
console.log("Solar panel dashboard loaded. Press Connect to start the simulated feed.");
