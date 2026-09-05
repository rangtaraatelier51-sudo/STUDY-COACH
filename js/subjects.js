// Subjects page logic. Relies on js/store.js being loaded first.

let state = loadState();

// Make sure the subjects array always exists
if (!Array.isArray(state.subjects)) {
  state.subjects = [];
}

let editingSubjectId = null;
// ---------- rendering ----------
function taskStatsFor(subjectId) {
  const tasks = state.tasks.filter((t) => t.subjectId === subjectId);
  const done = tasks.filter((t) => t.done).length;
  return { total: tasks.length, done };
}

function renderSubjects() {
  const grid = document.getElementById("subject-grid");
  const empty = document.getElementById("subject-empty");
  grid.innerHTML = "";

  if (state.subjects.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  state.subjects.forEach((subject) => {
    const color = colorForSubject(state, subject.id);
    const stats = taskStatsFor(subject.id);

    const card = document.createElement("div");
    card.className = "subject-card";
    card.style.borderTopColor = color;

    const head = document.createElement("div");
    head.className = "subject-card-head";

    const nameEl = document.createElement("h3");
    nameEl.textContent = subject.name;

    const actions = document.createElement("div");
    actions.className = "subject-card-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openSubjectModal(subject));

    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deleteSubject(subject.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    head.appendChild(nameEl);
    head.appendChild(actions);

    const chapterWrap = document.createElement("div");
    chapterWrap.className = "chapter-chip-row";
    if (subject.chapters && subject.chapters.length > 0) {
      subject.chapters.forEach((ch) => {
        const chip = document.createElement("span");
        chip.className = "chapter-chip";
        chip.textContent = ch.name;
        chapterWrap.appendChild(chip);
      });
    } else {
      const chip = document.createElement("span");
      chip.className = "chapter-chip chapter-chip-empty";
      chip.textContent = "No chapters added";
      chapterWrap.appendChild(chip);
    }

    const progressLine = document.createElement("div");
    progressLine.className = "subject-progress-line";
    progressLine.textContent = stats.total === 0
      ? "No tasks yet"
      : `${stats.done} / ${stats.total} tasks done`;

    card.appendChild(head);
    card.appendChild(chapterWrap);
    card.appendChild(progressLine);
    grid.appendChild(card);
  });
}

// ---------- modal ----------
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

function addChapterRow(value) {
  const rows = document.getElementById("chapter-rows");
  const row = document.createElement("div");
  row.className = "chapter-row";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "e.g. Electrostatics";
  input.value = value || "";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "chapter-row-remove";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => row.remove());

  row.appendChild(input);
  row.appendChild(removeBtn);
  rows.appendChild(row);
}

function openSubjectModal(subject) {
  editingSubjectId = subject ? subject.id : null;
  document.getElementById("subject-modal-title").textContent = subject ? "Edit subject" : "New subject";
  document.getElementById("subject-name").value = subject ? subject.name : "";
  document.getElementById("chapter-rows").innerHTML = "";

  if (subject && subject.chapters && subject.chapters.length > 0) {
    subject.chapters.forEach((ch) => addChapterRow(ch.name));
  } else {
    addChapterRow("");
  }
  openModal("subject-modal");
}

document.getElementById("add-subject-btn").addEventListener("click", () => openSubjectModal(null));
document.getElementById("add-chapter-row").addEventListener("click", () => addChapterRow(""));
document.getElementById("subject-cancel").addEventListener("click", () => closeModal("subject-modal"));

document.getElementById("subject-save").addEventListener("click", () => {
  const name = document.getElementById("subject-name").value.trim();
  if (!name) return;

  const chapterInputs = document.querySelectorAll("#chapter-rows input");
  const chapters = [];
  let chapterIdBase = Date.now();
  chapterInputs.forEach((input, i) => {
    const val = input.value.trim();
    if (val) chapters.push({ id: chapterIdBase + i, name: val });
  });

  if (editingSubjectId) {
    const subject = state.subjects.find((s) => s.id === editingSubjectId);
    subject.name = name;
    subject.chapters = chapters;
  } else {
    state.subjects.push({ id: Date.now(), name, chapters });
  }

  saveState(state);
  closeModal("subject-modal");
  renderSubjects();
});

function deleteSubject(id) {
  state.subjects = state.subjects.filter((s) => s.id !== id);
  saveState(state);
  renderSubjects();
}

document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.classList.remove("open");
  });
});

// ---------- init ----------
renderSubjects();
