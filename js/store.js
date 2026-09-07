// Shared data store. Uses localStorage (no backend).

let state = {
  subjects: [],
  tasks: [],
  exams: [],
  sessions: [],
  streak: 0,
  lastActiveDate: null,
};

function loadState() {
  try {
    const saved = localStorage.getItem("studyCoachState");
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    }
  } catch (err) {
    console.error("Failed to load state:", err);
  }
  return state;
}

function saveState(newState) {
  state = newState;
  try {
    localStorage.setItem("studyCoachState", JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save state:", err);
  }
}

async function addSubject(name) {
  const id = Date.now();
  const subject = { id, name, chapters: [] };
  state.subjects.push(subject);
  saveState(state);
  return subject;
}

async function updateSubject(id, updates) {
  const idx = state.subjects.findIndex(s => s.id === id);
  if (idx >= 0) {
    state.subjects[idx] = { ...state.subjects[idx], ...updates };
    saveState(state);
  }
}

async function deleteSubject(id) {
  state.subjects = state.subjects.filter(s => s.id !== id);
  state.tasks = state.tasks.filter(t => t.subjectId !== id);
  saveState(state);
}

async function addChapter(subjectId, name) {
  const id = Date.now();
  const chapter = { id, name };
  const subjectIdx = state.subjects.findIndex(s => s.id === subjectId);
  if (subjectIdx >= 0) {
    state.subjects[subjectIdx].chapters.push(chapter);
    saveState(state);
  }
  return chapter;
}

async function deleteChapter(id) {
  state.subjects.forEach(s => {
    s.chapters = s.chapters.filter(c => c.id !== id);
  });
  saveState(state);
}

async function addTask(title, subjectId, chapterId) {
  const id = Date.now();
  const task = { id, title, subjectId, chapterId, done: false };
  state.tasks.push(task);
  saveState(state);
  return task;
}

async function updateTask(id, updates) {
  const idx = state.tasks.findIndex(t => t.id === id);
  if (idx >= 0) {
    state.tasks[idx] = { ...state.tasks[idx], ...updates };
    saveState(state);
  }
}

async function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState(state);
}

async function addExam(subjectId, date) {
  const id = Date.now();
  const exam = { id, subject: subjectId, date };
  state.exams.push(exam);
  saveState(state);
  return exam;
}

async function deleteExam(id) {
  state.exams = state.exams.filter(e => e.id !== id);
  saveState(state);
}

async function addSession(subjectId, completedSessions, totalSeconds, date) {
  const id = Date.now();
  const session = { id, subjectId, completedSessions, totalSeconds, date };
  state.sessions.push(session);
  saveState(state);
  return session;
}

async function updateStreak() {
  const today = todayISO();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split("T")[0];

  let newStreak = state.streak;
  if (state.lastActiveDate === yesterdayISO) {
    newStreak = state.streak + 1;
  } else if (state.lastActiveDate !== today) {
    newStreak = 1;
  }

  state.streak = newStreak;
  state.lastActiveDate = today;
  saveState(state);
}

function todayISO() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function subjectName(state, subjectId) {
  const subject = state.subjects.find(s => s.id === subjectId);
  return subject ? subject.name : "Unknown";
}

function chapterName(state, chapterId) {
  for (let subject of state.subjects) {
    const chapter = subject.chapters.find(c => c.id === chapterId);
    if (chapter) return chapter.name;
  }
  return "Unknown";
}

function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2 - d1;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function logout() {
  localStorage.removeItem("studyCoachState");
  window.location.href = "index.html";
}

// Add dummy Supabase functions so existing code doesn't break
window.supabaseReady = () => Promise.resolve();
window.supabaseUser = true;
