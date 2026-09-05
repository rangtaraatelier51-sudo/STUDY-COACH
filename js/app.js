// ---------- storage helpers ----------
// v1 uses localStorage so the dashboard works with zero backend.
// When Supabase is wired in (Step 7), swap these three functions
// for calls to the Supabase client and the rest of the app stays the same.

const STORE_KEY = "studyCoach.v1";

function loadState() {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) return JSON.parse(raw);
  return {
    tasks: [],
    exams: [],
    streak: 0,
    lastActiveDate: null,
  };
}

function saveState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

let state = loadState();

// ---------- streak logic ----------
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const ms = new Date(b) - new Date(a);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function updateStreakOnVisit() {
  const today = todayISO();
  if (state.lastActiveDate === today) return; // already counted today
  if (state.lastActiveDate) {
    const gap = daysBetween(state.lastActiveDate, today);
    if (gap === 1) {
      state.streak += 1;
    } else if (gap > 1) {
      state.streak = 1; // streak broken, restart
    }
  } else {
    state.streak = 1; // first ever visit
  }
  state.lastActiveDate = today;
  saveState(state);
}

// ---------- rendering ----------
function renderDate() {
  const el = document.getElementById("today-date");
  el.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function renderStreak() {
  document.getElementById("streak-count").textContent = state.streak;
}

function renderStats() {
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById("progress-pct").textContent = `${pct}%`;
  document.getElementById("progress-fill").style.width = `${pct}%`;
  document.getElementById("task-count").textContent = `${done} / ${total}`;

  const upcoming = state.exams.filter((e) => daysBetween(todayISO(), e.date) >= 0 && daysBetween(todayISO(), e.date) <= 30);
  document.getElementById("exam-count").textContent = upcoming.length;
}

function renderTasks() {
  const list = document.getElementById("task-list");
  const empty = document.getElementById("task-empty");
  list.innerHTML = "";

  if (state.tasks.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  state.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.done ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveState(state);
      renderTasks();
      renderStats();
    });

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const tag = document.createElement("span");
    tag.className = "task-subject-tag";
    tag.textContent = task.subject || "General";

    li.appendChild(checkbox);
    li.appendChild(title);
    li.appendChild(tag);
    list.appendChild(li);
  });
}

function renderExams() {
  const list = document.getElementById("exam-list");
  const empty = document.getElementById("exam-empty");
  list.innerHTML = "";

  if (state.exams.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  const sorted = [...state.exams].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach((exam) => {
    const li = document.createElement("li");
    li.className = "exam-item";

    const left = document.createElement("span");
    left.textContent = exam.subject;

    const days = daysBetween(todayISO(), exam.date);
    const right = document.createElement("span");
    right.className = "exam-days" + (days <= 7 ? " soon-tag" : "");
    right.textContent = days < 0 ? "past" : days === 0 ? "today" : `${days}d left`;

    li.appendChild(left);
    li.appendChild(right);
    list.appendChild(li);
  });
}

function renderAll() {
  renderDate();
  renderStreak();
  renderStats();
  renderTasks();
  renderExams();
}

// ---------- modals ----------
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

document.getElementById("add-task-btn").addEventListener("click", () => openModal("task-modal"));
document.getElementById("task-cancel").addEventListener("click", () => closeModal("task-modal"));
document.getElementById("task-save").addEventListener("click", () => {
  const title = document.getElementById("task-input").value.trim();
  const subject = document.getElementById("task-subject").value.trim();
  if (!title) return;
  state.tasks.push({ id: Date.now(), title, subject, done: false });
  saveState(state);
  document.getElementById("task-input").value = "";
  document.getElementById("task-subject").value = "";
  closeModal("task-modal");
  renderAll();
});

document.getElementById("add-exam-btn").addEventListener("click", () => openModal("exam-modal"));
document.getElementById("exam-cancel").addEventListener("click", () => closeModal("exam-modal"));
document.getElementById("exam-save").addEventListener("click", () => {
  const subject = document.getElementById("exam-subject").value.trim();
  const date = document.getElementById("exam-date").value;
  if (!subject || !date) return;
  state.exams.push({ id: Date.now(), subject, date });
  saveState(state);
  document.getElementById("exam-subject").value = "";
  document.getElementById("exam-date").value = "";
  closeModal("exam-modal");
  renderAll();
});

// close modal on backdrop click
document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.classList.remove("open");
  });
});

// ---------- init ----------
updateStreakOnVisit();
renderAll();
