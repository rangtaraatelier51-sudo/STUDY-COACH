// Shared data store. Now uses Supabase instead of localStorage.
// All pages load this first, then their own script.

let state = {
  subjects: [],
  tasks: [],
  exams: [],
  sessions: [],
  streak: 0,
  lastActiveDate: null,
};

// Load state from Supabase
async function loadState() {
  try {
    await window.supabaseReady();
    
    if (!window.supabaseUser) {
      window.location.href = "auth.html";
      return state;
    }

    // Fetch all data from Supabase
    const [subjects, tasks, exams, sessions, stats] = await Promise.all([
      window.supabaseGetSubjects(),
      window.supabaseGetTasks(),
      window.supabaseGetExams(),
      window.supabaseGetSessions(),
      window.supabaseGetUserStats(),
    ]);

    state.subjects = subjects.map(s => ({
      id: s.id,
      name: s.name,
      chapters: (s.chapters || []).map(c => ({ id: c.id, name: c.name })),
    }));

    state.tasks = tasks.map(t => ({
      id: t.id,
      title: t.title,
      subjectId: t.subject_id,
      chapterId: t.chapter_id,
      done: t.done,
    }));

    state.exams = exams.map(e => ({
      id: e.id,
      subject: e.subject_id,
      date: e.exam_date,
    }));

    state.sessions = sessions.map(s => ({
      id: s.id,
      subjectId: s.subject_id,
      completedSessions: s.completed_sessions,
      totalSeconds: s.total_seconds,
      date: s.session_date,
    }));

    state.streak = stats.streak || 0;
    state.lastActiveDate = stats.last_active_date;

    return state;
  } catch (err) {
    console.error("Failed to load state:", err);
    return state;
  }
}

// Save state back to Supabase (called by individual update functions)
async function saveState(newState) {
  state = newState;
  // Individual saves happen in update functions below
}

// Subject functions
async function addSubject(name) {
  try {
    const subject = await window.supabaseInsertSubject(name);
    state.subjects.push({
      id: subject.id,
      name: subject.name,
      chapters: [],
    });
    return subject;
  } catch (err) {
    console.error("Failed to add subject:", err);
    throw err;
  }
}

async function updateSubject(id, updates) {
  try {
    await window.supabaseUpdateSubject(id, updates);
    const idx = state.subjects.findIndex(s => s.id === id);
    if (idx >= 0) {
      state.subjects[idx] = { ...state.subjects[idx], ...updates };
    }
  } catch (err) {
    console.error("Failed to update subject:", err);
    throw err;
  }
}

async function deleteSubject(id) {
  try {
    await window.supabaseDeleteSubject(id);
    state.subjects = state.subjects.filter(s => s.id !== id);
    state.tasks = state.tasks.filter(t => t.subjectId !== id);
  } catch (err) {
    console.error("Failed to delete subject:", err);
    throw err;
  }
}

// Chapter functions
async function addChapter(subjectId, name) {
  try {
    const chapter = await window.supabaseInsertChapter(subjectId, name);
    const subjectIdx = state.subjects.findIndex(s => s.id === subjectId);
    if (subjectIdx >= 0) {
      state.subjects[subjectIdx].chapters.push({
        id: chapter.id,
        name: chapter.name,
      });
    }
    return chapter;
  } catch (err) {
    console.error("Failed to add chapter:", err);
    throw err;
  }
}

async function deleteChapter(id) {
  try {
    await window.supabaseDeleteChapter(id);
    state.subjects.forEach(s => {
      s.chapters = s.chapters.filter(c => c.id !== id);
    });
  } catch (err) {
    console.error("Failed to delete chapter:", err);
    throw err;
  }
}

// Task functions
async function addTask(title, subjectId, chapterId) {
  try {
    const task = await window.supabaseInsertTask(title, subjectId, chapterId);
    state.tasks.push({
      id: task.id,
      title: task.title,
      subjectId: task.subject_id,
      chapterId: task.chapter_id,
      done: false,
    });
    return task;
  } catch (err) {
    console.error("Failed to add task:", err);
    throw err;
  }
}

async function updateTask(id, updates) {
  try {
    await window.supabaseUpdateTask(id, updates);
    const idx = state.tasks.findIndex(t => t.id === id);
    if (idx >= 0) {
      state.tasks[idx] = { ...state.tasks[idx], ...updates };
    }
  } catch (err) {
    console.error("Failed to update task:", err);
    throw err;
  }
}

async function deleteTask(id) {
  try {
    await window.supabaseDeleteTask(id);
    state.tasks = state.tasks.filter(t => t.id !== id);
  } catch (err) {
    console.error("Failed to delete task:", err);
    throw err;
  }
}

// Exam functions
async function addExam(subjectId, date) {
  try {
    const exam = await window.supabaseInsertExam(subjectId, date);
    state.exams.push({
      id: exam.id,
      subject: exam.subject_id,
      date: exam.exam_date,
    });
    return exam;
  } catch (err) {
    console.error("Failed to add exam:", err);
    throw err;
  }
}

async function deleteExam(id) {
  try {
    await window.supabaseDeleteExam(id);
    state.exams = state.exams.filter(e => e.id !== id);
  } catch (err) {
    console.error("Failed to delete exam:", err);
    throw err;
  }
}

// Session functions
async function addSession(subjectId, completedSessions, totalSeconds, date) {
  try {
    const session = await window.supabaseInsertSession(
      subjectId,
      completedSessions,
      totalSeconds,
      date
    );
    state.sessions.push({
      id: session.id,
      subjectId: session.subject_id,
      completedSessions: session.completed_sessions,
      totalSeconds: session.total_seconds,
      date: session.session_date,
    });
    return session;
  } catch (err) {
    console.error("Failed to add session:", err);
    throw err;
  }
}

// Streak functions
async function updateStreak() {
  try {
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

    await window.supabaseUpdateUserStats(newStreak, today);
    state.streak = newStreak;
    state.lastActiveDate = today;
  } catch (err) {
    console.error("Failed to update streak:", err);
  }
}

// Utility functions
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

// Logout function
async function logout() {
  try {
    await window.supabaseSignOut();
    window.location.href = "auth.html";
  } catch (err) {
    console.error("Logout failed:", err);
  }
}
