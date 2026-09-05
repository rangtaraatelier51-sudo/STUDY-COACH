  // Dashboard page logic. Relies on js/store.js being loaded first.

let state = loadState();

// ---------- streak logic ----------
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
    const chapter = task.chapterId ? chapterName(state, task.subjectId, task.chapterId) : "";
    title.textContent = chapter ? `${task.title} · ${chapter}` : task.title;

    const tag = document.createElement("span");
    tag.className = "task-subject-tag";
    tag.textContent = subjectName(state, task.subjectId);
    tag.style.borderColor = colorForSubject(state, task.subjectId);

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

// ---------- task modal: subject + chapter dropdowns ----------
function populateTaskSubjectSelect() {
  const select = document.getElementById("task-subject");
  const chapterSelect = document.getElementById("task-chapter");
  const noSubjectsNote = document.getElementById("task-no-subjects");
  const saveBtn = document.getElementById("task-save");

  select.innerHTML = "";

  if (state.subjects.length === 0) {
    noSubjectsNote.style.display = "block";
    saveBtn.disabled = true;
    saveBtn.style.opacity = "0.5";
    chapterSelect.innerHTML = "";
    return;
  }

  noSubjectsNote.style.display = "none";
  saveBtn.disabled = false;
  saveBtn.style.opacity = "1";

  state.subjects.forEach((subject) => {
    const opt = document.createElement("option");
    opt.value = subject.id;
    opt.textContent = subject.name;
    select.appendChild(opt);
  });

  populateTaskChapterSelect();
}

function populateTaskChapterSelect() {
  const subjectId = document.getElementById("task-subject").value;
  const chapterSelect = document.getElementById("task-chapter");
  const subject = state.subjects.find((s) => String(s.id) === String(subjectId));

  chapterSelect.innerHTML = "";
  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = "No specific chapter";
  chapterSelect.appendChild(noneOpt);

  if (subject && subject.chapters) {
    subject.chapters.forEach((chapter) => {
      const opt = document.createElement("option");
      opt.value = chapter.id;
      opt.textContent = chapter.name;
      chapterSelect.appendChild(opt);
    });
  }
}

document.getElementById("task-subject").addEventListener("change", populateTaskChapterSelect);

// ---------- modals ----------
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

document.getElementById("add-task-btn").addEventListener("click", () => {
  populateTaskSubjectSelect();
  openModal("task-modal");
});
document.getElementById("task-cancel").addEventListener("click", () => closeModal("task-modal"));
document.getElementById("task-save").addEventListener("click", () => {
  const title = document.getElementById("task-input").value.trim();
  const subjectId = document.getElementById("task-subject").value;
  const chapterId = document.getElementById("task-chapter").value;
  if (!title || !subjectId) return;
  state.tasks.push({
    id: Date.now(),
    title,
    subjectId: Number(subjectId),
    chapterId: chapterId ? Number(chapterId) : null,
    done: false,
  });
  saveState(state);
  document.getElementById("task-input").value = "";
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
