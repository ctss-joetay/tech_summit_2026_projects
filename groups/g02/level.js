// ---------- Pitch Quest: level gameplay ----------
// Exposes window.PitchQuest.enterLevel(n) and .stop() for script.js to call.

(function () {
  const staffArea = document.getElementById("staff-area");
  const notesLayer = document.getElementById("notes-layer");
  const confettiLayer = document.getElementById("confetti-layer");
  const playerSquare = document.getElementById("player-square");
  const stageMessage = document.getElementById("stage-message");
  const heartsEl = document.getElementById("hearts");
  const micFill = document.getElementById("mic-meter-fill");
  const micLabel = document.getElementById("mic-label");
  const resultOverlay = document.getElementById("result-overlay");
  const resultTitle = document.getElementById("result-title");
  const retryBtn = document.getElementById("retry-btn");
  const resultBackBtn = document.getElementById("result-back-btn");
  const selectScreen = document.getElementById("select-screen");
  const levelScreen = document.getElementById("level-screen");

  const SONG_DURATION = 15000; // ms
  const TRAVEL_TIME = 2200;    // ms a note takes to travel from spawn to hit line
  const HIT_X = 60 + 18;       // player square left edge + half width
  const HIT_TOLERANCE_Y = 30;  // px, how close counts as a "match"
  const HIT_WINDOW_MS = 220;   // how close in time counts as judged

  const TOP_BOUND = 40;
  const BOTTOM_BOUND = 220; // staff area is 400 tall; keep square inside

  let level = null;
  let hp = 20;
  let notes = [];
  let running = false;
  let rafId = null;
  let startTime = 0;
  let audioCtx = null;
  let analyser = null;
  let micStream = null;
  let dataArray = null;
  let currentY = 130;

  function renderHearts() {
    heartsEl.textContent = "❤️".repeat(Math.max(0, hp));
  }

  function freqToY(freq) {
    // Map a singing range (roughly 100Hz - 800Hz) log-scale onto the staff.
    const minF = 100, maxF = 800;
    const clamped = Math.min(maxF, Math.max(minF, freq));
    const t = (Math.log(clamped) - Math.log(minF)) / (Math.log(maxF) - Math.log(minF));
    // higher pitch = higher on screen = smaller top value
    return BOTTOM_BOUND - t * (BOTTOM_BOUND - TOP_BOUND);
  }

  function makeSong(levelNum) {
    // Simple procedural song: number of notes and jumpiness scale with level.
    const count = 8 + Math.min(6, levelNum);
    const arr = [];
    const gap = SONG_DURATION / (count + 1);
    let lastY = 130;
    for (let i = 1; i <= count; i++) {
      const hitTime = gap * i;
      // pick a y not too far from the last one for lower levels, wilder for higher
      const maxJump = 40 + levelNum * 12;
      let y = lastY + (Math.random() * 2 - 1) * maxJump;
      y = Math.min(BOTTOM_BOUND, Math.max(TOP_BOUND, y));
      lastY = y;
      arr.push({ hitTime, y, judged: false, el: null });
    }
    return arr;
  }

  function clearLayer(layer) {
    while (layer.firstChild) layer.removeChild(layer.firstChild);
  }

  function buildNoteElements() {
    clearLayer(notesLayer);
    notes.forEach((n) => {
      const el = document.createElement("div");
      el.className = "note-marker";
      el.style.top = n.y + "px";
      notesLayer.appendChild(el);
      n.el = el;
    });
  }

  function burstConfetti(x, y) {
    const colors = ["#FF6251", "#3B82F6", "#FECB3E", "#1a1a1a"];
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("div");
      p.className = "confetti-piece";
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.background = colors[i % colors.length];
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 60;
      p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      p.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      confettiLayer.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }

  function flashMiss() {
    staffArea.classList.add("miss-flash");
    setTimeout(() => staffArea.classList.remove("miss-flash"), 200);
  }

  async function setupMic() {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      micLabel.textContent = "🚫";
      stageMessage.textContent = "no microphone input";
      return false;
    }
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      const source = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      dataArray = new Float32Array(analyser.fftSize);
      micLabel.textContent = "🎙️";
      return true;
    } catch (err) {
      stageMessage.textContent = "no microphone input";
      return false;
    }
  }

  function stopMic() {
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    analyser = null;
  }

  // Autocorrelation pitch detection on time-domain samples.
  function detectPitch() {
    analyser.getFloatTimeDomainData(dataArray);
    const sampleRate = audioCtx.sampleRate;
    const SIZE = dataArray.length;

    // volume (RMS) for the meter, works even without a clean pitch
    let sumSquares = 0;
    for (let i = 0; i < SIZE; i++) sumSquares += dataArray[i] * dataArray[i];
    const rms = Math.sqrt(sumSquares / SIZE);
    micFill.style.width = Math.min(100, rms * 400) + "%";

    if (rms < 0.01) return null; // too quiet to trust a pitch

    let bestOffset = -1;
    let bestCorrelation = 0;
    const minOffset = Math.floor(sampleRate / 800); // ~800Hz max
    const maxOffset = Math.floor(sampleRate / 80);  // ~80Hz min

    for (let offset = minOffset; offset <= maxOffset; offset++) {
      let correlation = 0;
      for (let i = 0; i < SIZE - offset; i++) {
        correlation += dataArray[i] * dataArray[i + offset];
      }
      correlation = correlation / (SIZE - offset);
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    if (bestOffset <= 0 || bestCorrelation < 0.001) return null;
    return sampleRate / bestOffset;
  }

  function endLevel(won) {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    stopMic();
    resultOverlay.classList.remove("hidden");
    resultTitle.textContent = won ? `🎉 Level ${level} Clear!` : "💥 Out of hearts!";
  }

  function loop(ts) {
    if (!running) return;
    try {
      const elapsed = ts - startTime;

      if (analyser) {
        const freq = detectPitch();
        if (freq) currentY = freqToY(freq);
      }
      playerSquare.style.top = currentY + "px";

      notes.forEach((n) => {
        if (!n.el) return;
        const x = staffArea.clientWidth - ((elapsed - (n.hitTime - TRAVEL_TIME)) / TRAVEL_TIME) * staffArea.clientWidth;
        n.el.style.left = x + "px";

        if (!n.judged && elapsed >= n.hitTime) {
          n.judged = true;
          const dist = Math.abs(currentY - n.y);
          if (dist <= HIT_TOLERANCE_Y) {
            n.el.classList.add("hit");
            burstConfetti(HIT_X, n.y + 18);
          } else {
            n.el.classList.add("missed");
            hp -= 1;
            renderHearts();
            flashMiss();
            if (hp <= 0) {
              endLevel(false);
              return;
            }
          }
        }
      });

      if (elapsed >= SONG_DURATION + HIT_WINDOW_MS) {
        endLevel(true);
        return;
      }

      rafId = requestAnimationFrame(loop);
    } catch (err) {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      stopMic();
      stageMessage.textContent = "level crashed: " + err.message;
    }
  }

  async function beginPlaying() {
    try {
      hp = 20;
      renderHearts();
      currentY = 130;
      playerSquare.style.top = currentY + "px";
      notes = makeSong(level);
      buildNoteElements();
      resultOverlay.classList.add("hidden");
      stageMessage.textContent = `Level ${level} — sing to move the square!`;

      const micOk = await setupMic();
      if (!micOk) return; // message already shown by setupMic

      running = true;
      startTime = performance.now();
      rafId = requestAnimationFrame(loop);
    } catch (err) {
      stageMessage.textContent = "issue with starting the level: " + err.message;
    }
  }

  function enterLevel(levelNum) {
    level = levelNum;
    hp = 20;
    renderHearts();
    resultOverlay.classList.add("hidden");
    clearLayer(notesLayer);
    clearLayer(confettiLayer);
    playerSquare.style.top = "130px";
    stageMessage.textContent = `Level ${levelNum} — press Space or click the stage to begin`;

    function startOnce() {
      if (running) return;
      beginPlaying();
    }

    staffArea.onclick = startOnce;
    window.onkeydown = (e) => {
      if (e.code === "Space" && !levelScreen.classList.contains("hidden")) {
        e.preventDefault();
        startOnce();
      }
    };
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    stopMic();
    resultOverlay.classList.add("hidden");
  }

  retryBtn.addEventListener("click", () => enterLevel(level));
  resultBackBtn.addEventListener("click", () => {
    stop();
    levelScreen.classList.add("hidden");
    selectScreen.classList.remove("hidden");
  });

  window.PitchQuest = { enterLevel, stop };
})();
