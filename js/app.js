 // Dashboard page logic. Relies on js/store.js and js/supabase.js being loaded first.
state = null;

// Initialize dashboard
async function initDashboard() {
  state = await loadState();
  await updateStreak();
  
  populateTaskSubjectSelect();
  populateTaskChapterSelect();
  populateExamSubjectSelect();
  renderTasks();
  renderExams();
  updateStats();

  document.getElementById("logout-btn").addEventListener("click", logout);
}

// ---------- task management ----------
async function populateTaskSubjectSelect() {
  const select = document.getElementById("task-subject");
  select.innerHTML = '<option value="">No subject</option>';

  state.subjects.forEach((subject) => {
    const opt = document.createElement("option");
    opt.value = subject.id;
    opt.textContent = subject.name;
    select.appendChild(opt);
  });
}

function populateTaskChapterSelect() {
  const subjectId = Number(document.getElementById("task-subject").value);
  const chapterSelect = document.getElementById("task-chapter");

  chapterSelect.innerHTML = '<option value="">All chapters</option>';

  if (subjectId) {
    const subject = state.subjects.find((s) => s.id === subjectId);
    if (subject && subject.chapters) {
      subject.chapters.forEach((chapter) => {
        const opt = document.createElement("option");
        opt.value = chapter.id;
        opt.textContent = chapter.name;
        chapterSelect.appendChild(opt);
      });
    }
  }
}

async function renderTasks() {
  const list = document.getElementById("task-list");
  const empty = document.getElementById("tasks-empty");

  list.innerHTML = "";

  if (state.tasks.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  state.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.done ? "done" : ""}`;

    const subjectName = task.subjectId ? subjectName(state, task.subjectId) : null;
    const chapterName = task.chapterId ? chapterName(state, task.chapterId) : null;
    const context = chapterName || subjectName || "";

    li.innerHTML = `
      <input type="checkbox" ${task.done ? "checked" : ""} data-id="${task.id}" class="task-checkbox" />
      <span class="task-title">${task.title}</span>
      ${context ? `<span class="task-subject-tag">${context}</span>` : ""}
    `;

    li.querySelector(".task-checkbox").addEventListener("change", async (e) => {
      await updateTask(task.id, { done: e.target.checked });
      renderTasks();
      updateStats();
    });

    list.appendChild(li);
  });
}

async function addTaskHandler() {
  const title = document.getElementById("task-title").value.trim();
  const subjectId = document.getElementById("task-subject").value;
  const chapterId = document.getElementById("task-chapter").value;

  if (!title) return;

  try {
    await addTask(title, subjectId ? Number(subjectId) : null, chapterId ? Number(chapterId) : null);
    document.getElementById("task-modal").classList.remove("open");
    document.getElementById("task-title").value = "";
    document.getElementById("task-subject").value = "";
    document.getElementById("task-chapter").value = "";
    state = await loadState();
    renderTasks();
    updateStats();
  } catch (err) {
    console.error("Failed to add task:", err);
  }
}

// ---------- exam management ----------
async function populateExamSubjectSelect() {
  const select = document.getElementById("exam-subject");
  select.innerHTML = '<option value="">Select a subject</option>';

  if (state.subjects.length === 0) {
    document.getElementById("exam-empty-note").style.display = "block";
    return;
  }

  document.getElementById("exam-empty-note").style.display = "none";

  state.subjects.forEach((subject) => {
    const opt = document.createElement("option");
    opt.value = subject.id;
    opt.textContent = subject.name;
    select.appendChild(opt);
  });
}

async function renderExams() {
  const list = document.getElementById("exam-list");
  const empty = document.getElementById("exams-empty");

  list.innerHTML = "";

  if (state.exams.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  state.exams.forEach((exam) => {
    const li = document.createElement("li");
    li.className = "exam-item";

    const subject = state.subjects.find((s) => s.id === exam.subject);
    const subjectName = subject ? subject.name : "Unknown";
    const days = daysBetween(new Date().toISOString().split("T")[0], exam.date);
    const isSoon = days <= 7 && days >= 0;

    li.innerHTML = `
      <span>${subjectName}</span>
      <span class="exam-days ${isSoon ? "soon-tag" : ""}">${days} days</span>
    `;

    li.addEventListener("contextmenu", async (e) => {
      e.preventDefault();
      if (confirm("Delete this exam?")) {
        try {
          await deleteExam(exam.id);
          state = await loadState();
          renderExams();
          updateStats();
        } catch (err) {
          console.error("Failed to delete exam:", err);
        }
      }
    });

    list.appendChild(li);
  });
}

async function addExamHandler() {
  const subjectId = document.getElementById("exam-subject").value;
  const examDate = document.getElementById("exam-date").value;

  if (!subjectId || !examDate) return;

  try {
    await addExam(Number(subjectId), examDate);
    document.getElementById("exam-modal").classList.remove("open");
    document.getElementById("exam-subject").value = "";
    document.getElementById("exam-date").value = "";
    state = await loadState();
    renderExams();
    updateStats();
  } catch (err) {
    console.error("Failed to add exam:", err);
  }
}

// ---------- stats ----------
function updateStats() {
  // Progress
  const done = state.tasks.filter((t) => t.done).length;
  const total = state.tasks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById("progress-pct").textContent = `${pct}%`;
  document.getElementById("progress-text").textContent = `${done} of ${total} done`;
  document.getElementById("progress-fill").style.width = `${pct}%`;

  // Streak
  document.getElementById("streak-count").textContent = state.streak;

  // Sessions today
  const today = todayISO();
  const todaysSessions = state.sessions.filter((s) => s.date === today);
  const totalPomos = todaysSessions.reduce((sum, s) => sum + s.completedSessions, 0);
  document.getElementById("session-stat").textContent = totalPomos || "—";

  // Next exam
  const today_str = new Date().toISOString().split("T")[0];
  const upcomingExams = state.exams
    .filter((e) => e.date >= today_str)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (upcomingExams.length > 0) {
    const nextExam = upcomingExams[0];
    const subject = state.subjects.find((s) => s.id === nextExam.subject);
    const days = daysBetween(today_str, nextExam.date);
    document.getElementById("next-exam-name").textContent = subject ? subject.name : "Unknown";
    document.getElementById("next-exam-days").textContent = `${days} days`;
  } else {
    document.getElementById("next-exam-name").textContent = "—";
    document.getElementById("next-exam-days").textContent = "No exams";
  }
}

// ---------- modals ----------
document.getElementById("add-task-btn").addEventListener("click", () => {
  document.getElementById("task-modal").classList.add("open");
});

document.getElementById("close-task-modal").addEventListener("click", () => {
  document.getElementById("task-modal").classList.remove("open");
});

document.getElementById("task-modal").addEventListener("click", (e) => {
  if (e.target.id === "task-modal") {
    document.getElementById("task-modal").classList.remove("open");
  }
});

document.getElementById("save-task-btn").addEventListener("click", addTaskHandler);

document.getElementById("task-subject").addEventListener("change", populateTaskChapterSelect);

document.getElementById("add-exam-btn").addEventListener("click", () => {
  document.getElementById("exam-modal").classList.add("open");
});

document.getElementById("close-exam-modal").addEventListener("click", () => {
  document.getElementById("exam-modal").classList.remove("open");
});

document.getElementById("exam-modal").addEventListener("click", (e) => {
  if (e.target.id === "exam-modal") {
    document.getElementById("exam-modal").classList.remove("open");
  }
});

document.getElementById("save-exam-btn").addEventListener("click", addExamHandler);

// ---------- init ----------
initDashboard();
