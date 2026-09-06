// Focus Mode page logic. Relies on js/store.js being loaded first.

let state = loadState();

// Timer state
let timerState = null;
let timerInterval = null;
let workMinutes = 25;
let breakMinutes = 5;
let isWorkPhase = true;
let timeRemaining = workMinutes * 60; // in seconds
let sessionStartTime = null;
let sessionNumber = 1;
let selectedSubject = null;

// Initialize sessions array if it doesn't exist
if (!state.sessions) {
  state.sessions = [];
}

// ---------- audio notification ----------
function playNotification() {
  // Simple beep using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

// ---------- subject setup ----------
function populateSubjectSelect() {
  const select = document.getElementById("focus-subject");
  select.innerHTML = '<option value="">No subject selected</option>';

  state.subjects.forEach((subject) => {
    const opt = document.createElement("option");
    opt.value = subject.id;
    opt.textContent = subject.name;
    select.appendChild(opt);
  });
}

// ---------- preset buttons ----------
document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const work = btn.dataset.work;
    const breakTime = btn.dataset.break;

    if (work === "custom") {
      document.getElementById("custom-times").style.display = "block";
      workMinutes = Number(document.getElementById("work-minutes").value);
      breakMinutes = Number(document.getElementById("break-minutes").value);
    } else {
      document.getElementById("custom-times").style.display = "none";
      workMinutes = Number(work);
      breakMinutes = Number(breakTime);
    }
  });
});

document.getElementById("work-minutes").addEventListener("change", (e) => {
  workMinutes = Number(e.target.value);
});

document.getElementById("break-minutes").addEventListener("change", (e) => {
  breakMinutes = Number(e.target.value);
});

// ---------- timer display ----------
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function updateTimerDisplay() {
  document.getElementById("timer-display").textContent = formatTime(timeRemaining);
}

function updateElapsedTime() {
  if (!sessionStartTime) return;
  const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  document.getElementById("elapsed-time").textContent = `${mins}:${secs.toString().padStart(2, "0")} elapsed`;
}

// ---------- timer tick ----------
function timerTick() {
  timeRemaining--;
  updateTimerDisplay();
  updateElapsedTime();

  if (timeRemaining <= 0) {
    completePhase();
  }
}

function completePhase() {
  clearInterval(timerInterval);
  playNotification();

  if (isWorkPhase) {
    // Work phase done, start break
    isWorkPhase = false;
    timeRemaining = breakMinutes * 60;
    document.getElementById("timer-label").textContent = "Break";
    document.getElementById("timer-label").className = "timer-label timer-label-break";
  } else {
    // Break done, start new work session
    isWorkPhase = true;
    sessionNumber++;
    timeRemaining = workMinutes * 60;
    document.getElementById("timer-label").textContent = "Work";
    document.getElementById("timer-label").className = "timer-label timer-label-work";
    document.getElementById("session-count").textContent = `Session ${sessionNumber}`;
  }

  updateTimerDisplay();
  startTimer();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(timerTick, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
}

// ---------- session management ----------
function startSession() {
  const workVal = document.getElementById("work-minutes").value;
  const breakVal = document.getElementById("break-minutes").value;

  if (!workVal || !breakVal) return;

  workMinutes = Number(workVal);
  breakMinutes = Number(breakVal);
  selectedSubject = document.getElementById("focus-subject").value || null;

  // Initialize timer
  isWorkPhase = true;
  sessionNumber = 1;
  timeRemaining = workMinutes * 60;
  sessionStartTime = Date.now();

  document.getElementById("focus-setup").style.display = "none";
  document.getElementById("focus-timer-view").style.display = "block";
  document.getElementById("timer-label").textContent = "Work";
  document.getElementById("timer-label").className = "timer-label timer-label-work";
  document.getElementById("session-count").textContent = "Session 1";

  if (selectedSubject) {
    const subject = state.subjects.find((s) => String(s.id) === String(selectedSubject));
    document.getElementById("timer-subject").textContent = subject ? subject.name : "";
  } else {
    document.getElementById("timer-subject").textContent = "";
  }

  updateTimerDisplay();
  startTimer();
}

function endSession() {
  clearInterval(timerInterval);

  // Record session
  const totalTime = Math.floor((Date.now() - sessionStartTime) / 1000);
  state.sessions.push({
    id: Date.now(),
    subjectId: selectedSubject ? Number(selectedSubject) : null,
    completedSessions: sessionNumber,
    totalSeconds: totalTime,
    date: todayISO(),
  });
  saveState(state);

  // Return to setup
  document.getElementById("focus-setup").style.display = "block";
  document.getElementById("focus-timer-view").style.display = "none";

  renderSessionHistory();
}

// ---------- session history ----------
function renderSessionHistory() {
  const list = document.getElementById("session-list");
  const empty = document.getElementById("history-empty");

  const todaysSessions = state.sessions.filter((s) => s.date === todayISO());

  list.innerHTML = "";

  if (todaysSessions.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  todaysSessions.forEach((session) => {
    const li = document.createElement("li");
    li.className = "session-item";

    const subject = session.subjectId ? subjectName(state, session.subjectId) : "General";
    const mins = Math.floor(session.totalSeconds / 60);

    li.innerHTML = `
      <span>${subject}</span>
      <span class="session-meta">${session.completedSessions} pomos · ${mins}m</span>
    `;

    list.appendChild(li);
  });
}

// ---------- events ----------
document.getElementById("start-focus-btn").addEventListener("click", startSession);
document.getElementById("timer-pause-btn").addEventListener("click", () => {
  const btn = document.getElementById("timer-pause-btn");
  if (btn.textContent === "Pause") {
    pauseTimer();
    btn.textContent = "Resume";
  } else {
    startTimer();
    btn.textContent = "Pause";
  }
});

document.getElementById("timer-end-btn").addEventListener("click", endSession);

// ---------- init ----------
populateSubjectSelect();
renderSessionHistory();
