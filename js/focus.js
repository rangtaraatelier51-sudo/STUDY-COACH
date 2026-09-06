// Focus Mode page logic. Relies on js/store.js and js/supabase.js being loaded first.

state = null;
let timerState = null;
let timerInterval = null;
let workMinutes = 25;
let breakMinutes = 5;
let isWorkPhase = true;
let timeRemaining = workMinutes * 60;
let sessionStartTime = null;
let sessionNumber = 1;
let selectedSubject = null;

async function initFocus() {
  state = await loadState();
  populateSubjectSelect();
  renderSessionHistory();
  document.getElementById("logout-btn").addEventListener("click", logout);
}

// ---------- audio notification ----------
function playNotification() {
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

document
