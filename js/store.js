// ---------- shared storage ----------
// Every page includes this file before its own page-specific script.
// v1 uses localStorage so the app works with zero backend.
// When Supabase is wired in (Step 7), swap loadState/saveState for
// calls to the Supabase client and the rest of the app stays the same.

const STORE_KEY = "studyCoach.v1";

const SUBJECT_COLORS = ["#f2a93b", "#7fb69e", "#e07a63", "#6fa3c9", "#b48ad1"];

function loadState() {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) return JSON.parse(raw);
  return {
    subjects: [],
    tasks: [],
    exams: [],
    streak: 0,
    lastActiveDate: null,
  };
}

function saveState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

// ---------- shared date helpers ----------
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const ms = new Date(b) - new Date(a);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// ---------- shared subject helpers ----------
function colorForSubject(state, subjectId) {
  const idx = state.subjects.findIndex((s) => s.id === subjectId);
  if (idx === -1) return "#8b90a6";
  return SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
}

function subjectName(state, subjectId) {
  const subject = state.subjects.find((s) => s.id === subjectId);
  return subject ? subject.name : "General";
}

function chapterName(state, subjectId, chapterId) {
  const subject = state.subjects.find((s) => s.id === subjectId);
  if (!subject) return "";
  const chapter = (subject.chapters || []).find((c) => c.id === chapterId);
  return chapter ? chapter.name : "";
}
