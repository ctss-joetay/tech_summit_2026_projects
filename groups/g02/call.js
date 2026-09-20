// ---------- Grandkid House: voice chat ----------
// Peer-to-peer audio (WebRTC). Since there's no server, two visitors find
// each other by leaving messages ("signals") for one another in a shared
// database table, which each browser polls.

const callBtn = document.getElementById("call-btn");
const leaveCallBtn = document.getElementById("leave-call-btn");
const callRing = document.getElementById("call-ring");
const callStatus = document.getElementById("call-status");

let inCall = false;
let localStream = null;
let audioCtx = null;
let peers = {};       // name -> { pc, audioEl, analyser, dataArray, seatEl, bodyEl }
let rosterTimer = null;
let signalTimer = null;
const seenSignalIds = {};

async function ensureCallTables() {
  await Summit.db.create("avatars", {
    name: "text", color: "text", status: "text", in_call: "bool"
  });
  await Summit.db.create("signals", {
    from: "text", to: "text", type: "text", data: "text"
  });
}
ensureCallTables().catch(function () {});

// ---------- Home-screen button: show when 2+ people are free to chat ----------
async function checkCallAvailability() {
  if (inCall || !myName) return;
  try {
    const everyone = await Summit.db.find("avatars", null);
    const free = everyone.filter(function (p) { return p.status === "free to chat"; });
    if (free.length >= 2) {
      callBtn.classList.remove("hidden");
      const already = everyone.some(function (p) { return p.in_call; });
      callBtn.textContent = already ? "📞 Join call" : "📞 Start call";
    } else {
      callBtn.classList.add("hidden");
    }
  } catch (e) {
    // Surface this instead of failing silently, so a real problem (not just
    // "nobody's free yet") is visible rather than looking like a missing button.
    homeStatusMessage("Could not check for a call: " + e.message);
  }
}
setInterval(checkCallAvailability, 2000);

// ---------- Starting / leaving ----------
async function startCall() {
  callBtn.disabled = true;
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    homeStatusMessage("Could not use the microphone: " + e.message);
    callBtn.disabled = false;
    return;
  }
  try {
    await Summit.db.update("avatars", { name: myName }, { in_call: true });
  } catch (e) {
    homeStatusMessage("Could not join the call: " + e.message);
    callBtn.disabled = false;
    return;
  }
  inCall = true;
  callBtn.disabled = false;
  document.getElementById("home-screen").classList.add("hidden");
  document.getElementById("call-screen").classList.remove("hidden");
  callStatus.textContent = "Connecting…";
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  rosterTimer = setInterval(pollRoster, 1500);
  signalTimer = setInterval(pollSignals, 1000);
  pollRoster();
}

async function leaveCall() {
  inCall = false;
  clearInterval(rosterTimer);
  clearInterval(signalTimer);
  Object.keys(peers).forEach(removePeer);
  if (localStream) {
    localStream.getTracks().forEach(function (t) { t.stop(); });
    localStream = null;
  }
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
  try {
    await Summit.db.update("avatars", { name: myName }, { in_call: false });
  } catch (e) {
    // still leave the screen even if the flag couldn't be cleared
  }
  document.getElementById("call-screen").classList.add("hidden");
  document.getElementById("home-screen").classList.remove("hidden");
}

function homeStatusMessage(msg) {
  const el = document.getElementById("home-status");
  if (el) el.textContent = msg;
}

callBtn.addEventListener("click", startCall);
leaveCallBtn.addEventListener("click", leaveCall);

// ---------- Roster: who else is in the call right now ----------
async function pollRoster() {
  if (!inCall) return;
  let everyone;
  try {
    everyone = await Summit.db.find("avatars", { in_call: true });
  } catch (e) {
    callStatus.textContent = "Could not reach the house: " + e.message;
    return;
  }
  const here = {};
  everyone.forEach(function (p) { here[p.name] = p; });

  // New arrivals: connect. Deterministic initiator so only one side offers.
  Object.keys(here).forEach(function (name) {
    if (name === myName || peers[name]) return;
    addSeat(name, here[name].color);
    const iInitiate = myName < name;
    createPeerConnection(name, iInitiate);
  });

  // Departures: tear down.
  Object.keys(peers).forEach(function (name) {
    if (!here[name]) removePeer(name);
  });

  const count = Object.keys(here).length;
  callStatus.textContent = count <= 1
    ? "Waiting for someone else to join…"
    : count + " people on the call.";

  layoutSeats();
}

// ---------- Seats around the table ----------
function addSeat(name, color) {
  const seat = document.createElement("div");
  seat.className = "call-seat";
  const body = document.createElement("div");
  body.className = "call-avatar-body";
  body.style.background = color || "#BAE6FD";
  const label = document.createElement("div");
  label.className = "call-name";
  label.textContent = name;
  seat.appendChild(body);
  seat.appendChild(label);
  callRing.appendChild(seat);
  peers[name] = { pc: null, audioEl: null, analyser: null, dataArray: null, seatEl: seat, bodyEl: body };
}

function layoutSeats() {
  const names = Object.keys(peers);
  const n = names.length;
  names.forEach(function (name, i) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = 50 + Math.cos(angle) * 42;
    const y = 50 + Math.sin(angle) * 42;
    const seat = peers[name].seatEl;
    seat.style.left = x + "%";
    seat.style.top = y + "%";
  });
}

function removePeer(name) {
  const p = peers[name];
  if (!p) return;
  if (p.pc) p.pc.close();
  if (p.audioEl) p.audioEl.remove();
  if (p.seatEl) p.seatEl.remove();
  delete peers[name];
  layoutSeats();
}

// ---------- WebRTC ----------
function createPeerConnection(name, isInitiator) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });
  peers[name].pc = pc;

  localStream.getTracks().forEach(function (track) {
    pc.addTrack(track, localStream);
  });

  pc.onicecandidate = function (e) {
    if (e.candidate) {
      sendSignal(name, "candidate", e.candidate);
    }
  };

  pc.ontrack = function (e) {
    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    audioEl.srcObject = e.streams[0];
    document.body.appendChild(audioEl);
    peers[name].audioEl = audioEl;
    setupVoiceMeter(name, e.streams[0]);
  };

  if (isInitiator) {
    pc.createOffer()
      .then(function (offer) { return pc.setLocalDescription(offer); })
      .then(function () { sendSignal(name, "offer", pc.localDescription); })
      .catch(function () {});
  }
}

async function sendSignal(to, type, payload) {
  try {
    await Summit.db.insert("signals", {
      from: myName, to: to, type: type, data: JSON.stringify(payload)
    });
  } catch (e) {
    // a dropped signal just means that one ICE step retries on the next poll
  }
}

async function pollSignals() {
  if (!inCall) return;
  let mine;
  try {
    mine = await Summit.db.find("signals", { to: myName });
  } catch (e) {
    return;
  }
  for (const sig of mine) {
    if (seenSignalIds[sig.id]) continue;
    seenSignalIds[sig.id] = true;
    await handleSignal(sig);
  }
}

async function handleSignal(sig) {
  const from = sig.from;
  const payload = JSON.parse(sig.data);

  if (sig.type === "offer") {
    if (!peers[from]) addSeat(from, null);
    if (!peers[from].pc) createPeerConnection(from, false);
    const pc = peers[from].pc;
    await pc.setRemoteDescription(new RTCSessionDescription(payload));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendSignal(from, "answer", pc.localDescription);
    layoutSeats();
  } else if (sig.type === "answer") {
    if (peers[from] && peers[from].pc) {
      await peers[from].pc.setRemoteDescription(new RTCSessionDescription(payload));
    }
  } else if (sig.type === "candidate") {
    if (peers[from] && peers[from].pc) {
      try { await peers[from].pc.addIceCandidate(new RTCIceCandidate(payload)); }
      catch (e) {}
    }
  }
}

// ---------- Voice-reactive shapes ----------
function setupVoiceMeter(name, stream) {
  if (!audioCtx) return;
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  peers[name].analyser = analyser;
  peers[name].dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function meterLoop() {
  Object.keys(peers).forEach(function (name) {
    const p = peers[name];
    if (!p.analyser) return;
    p.analyser.getByteFrequencyData(p.dataArray);
    let sum = 0;
    for (let i = 0; i < p.dataArray.length; i++) sum += p.dataArray[i];
    const level = sum / p.dataArray.length;
    if (level > 18) {
      p.bodyEl.classList.add("talking");
    } else {
      p.bodyEl.classList.remove("talking");
    }
  });
  requestAnimationFrame(meterLoop);
}
requestAnimationFrame(meterLoop);
