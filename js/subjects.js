// Subjects page logic. Relies on js/store.js and js/supabase.js being loaded first.

let state = null;
let editingSubjectId = null;

async function initSubjects() {
  state = await loadState();
  renderSubjects();
  document.getElementById("logout-btn").addEventListener("click", logout);
}

async function renderSubjects() {
  const grid = document.getElementById("subject-grid");
  const empty = document.getElementById("subjects-empty");

  grid.innerHTML = "";

  if (state.subjects.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  state.subjects.forEach((subject) => {
    const card = document.createElement("div");
    card.className = "subject-card";

    const chaptersHtml =
      subject.chapters.length > 0
        ? subject.chapters.map((c) => `<span class="chapter-chip">${c.name}</span>`).join("")
        : '<span class="chapter-chip chapter-chip-empty">No chapters yet</span>';

    card.innerHTML = `
      <div class="subject-card-head">
        <h3>${subject.name}</h3>
        <div class="subject-card-actions">
          <button class="icon-btn" data-id="${subject.id}" data-action="edit">✎</button>
          <button class="icon-btn" data-id="${subject.id}" data-action="delete">✕</button>
        </div>
      </div>
      <div class="chapter-chip-row">${chaptersHtml}</div>
      <div class="subject-progress-line">
        ${subject.chapters.length} chapter${subject.chapters.length !== 1 ? "s" : ""}
      </div>
    `;

    card.querySelector('[data-action="edit"]').addEventListener("click", () => {
      editSubject(subject.id);
    });

    card.querySelector('[data-action="delete"]').addEventListener("click", async () => {
      if (confirm(`Delete "${subject.name}"? All tasks will be removed.`)) {
        try {
          await deleteSubject(subject.id);
          state = await loadState();
          renderSubjects();
        } catch (err) {
          console.error("Failed to delete subject:", err);
        }
      }
    });

    grid.appendChild(card);
  });
}

function editSubject(subjectId) {
  editingSubjectId = subjectId;
  const subject = state.subjects.find((s) => s.id === subjectId);

  document.getElementById("subject-modal-title").textContent = "Edit subject";
  document.getElementById("subject-name").value = subject.name;

  const chapterRows = document.getElementById("chapter-rows");
  chapterRows.innerHTML = "";

  subject.chapters.forEach((chapter) => {
    appendChapterRow(chapter.id, chapter.name);
  });

  document.getElementById("subject-modal").classList.add("open");
}

function appendChapterRow(id = null, name = "") {
  const chapterRows = document.getElementById("chapter-rows");
  const row = document.createElement("div");
  row.className = "chapter-row";
  row.dataset.id = id || "";

  row.innerHTML = `
    <input type="text" placeholder="e.g., Mechanics, Renaissance" value="${name}" class="chapter-input" />
    <button class="chapter-row-remove" type="button">−</button>
  `;

  row.querySelector(".chapter-row-remove").addEventListener("click", () => {
    row.remove();
  });

  chapterRows.appendChild(row);
}

async function saveSubject() {
  const name = document.getElementById("subject-name").value.trim();

  if (!name) {
    alert("Subject name required");
    return;
  }

  try {
    if (editingSubjectId) {
      // Update existing
      await updateSubject(editingSubjectId, { name });

      // Handle chapters: delete removed, add new
      const subject = state.subjects.find((s) => s.id === editingSubjectId);
      const existingIds = new Set(subject.chapters.map((c) => c.id));
      const currentIds = new Set();

      const chapterRows = document.querySelectorAll(".chapter-row");
      for (const row of chapterRows) {
        const input = row.querySelector(".chapter-input").value.trim();
        const id = row.dataset.id ? Number(row.dataset.id) : null;

        if (input) {
          if (id) {
            currentIds.add(id);
          } else {
            // New chapter
            await addChapter(editingSubjectId, input);
          }
        }
      }

      // Delete chapters not in current
      for (const id of existingIds) {
        if (!currentIds.has(id)) {
          await deleteChapter(id);
        }
      }
    } else {
      // Add new subject
      const newSubject = await addSubject(name);

      // Add chapters
      const chapterRows = document.querySelectorAll(".chapter-row");
      for (const row of chapterRows) {
        const input = row.querySelector(".chapter-input").value.trim();
        if (input) {
          await addChapter(newSubject.id, input);
        }
      }
    }

    document.getElementById("subject-modal").classList.remove("open");
    document.getElementById("subject-name").value = "";
    document.getElementById("chapter-rows").innerHTML = "";
    editingSubjectId = null;
    state = await loadState();
    renderSubjects();
  } catch (err) {
    console.error("Failed to save subject:", err);
    alert("Failed to save subject");
  }
}

document.getElementById("add-subject-btn").addEventListener("click", () => {
  editingSubjectId = null;
  document.getElementById("subject-modal-title").textContent = "Add subject";
  document.getElementById("subject-name").value = "";
  document.getElementById("chapter-rows").innerHTML = "";
  appendChapterRow();
  document.getElementById("subject-modal").classList.add("open");
});

document.getElementById("close-subject-modal").addEventListener("click", () => {
  document.getElementById("subject-modal").classList.remove("open");
});

document.getElementById("subject-modal").addEventListener("click", (e) => {
  if (e.target.id === "subject-modal") {
    document.getElementById("subject-modal").classList.remove("open");
  }
});

document.getElementById("add-chapter-btn").addEventListener("click", () => {
  appendChapterRow();
});

document.getElementById("save-subject-btn").addEventListener("click", saveSubject);

initSubjects();
