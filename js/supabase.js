// Supabase client initialization and wrapper functions
const SUPABASE_URL = "https://hnjkjlrwbsdveaqlyrnd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuamtqbHJ3YnNkdmVhcWx5cm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDgwMDksImV4cCI6MjEwNDI4NDAwOX0.IxKImDu-w6RhijSDfRWADXmI5Um4bajd5ljxRq0g0s4";

let supabase = null;
let currentUser = null;

// Initialize Supabase
async function initSupabase() {
  // Wait for the Supabase library to load from the script tag
  let attempts = 0;
  while (!window.supabase && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.supabase) {
    console.error("Supabase library failed to load");
    return;
  }

  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Check if user is already logged in
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
  }
  
  return supabase;
}

// Make ready promise for pages to wait on
let readyResolve = null;
const supabaseReadyPromise = new Promise(resolve => {
  readyResolve = resolve;
});

initSupabase().then(() => {
  readyResolve();
});

window.supabaseReady = () => supabaseReadyPromise;
window.supabaseUser = currentUser;

// Auth functions
async function supabaseSignUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

async function supabaseSignIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  currentUser = data.user;
  window.supabaseUser = currentUser;
  return data;
}

async function supabaseSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  currentUser = null;
  window.supabaseUser = null;
}

// Database functions
async function supabaseInsertSubject(name) {
  const { data, error } = await supabase
    .from("subjects")
    .insert([{ user_id: currentUser.id, name }])
    .select();
  if (error) throw error;
  return data[0];
}

async function supabaseGetSubjects() {
  const { data, error } = await supabase
    .from("subjects")
    .select("*, chapters(*)")
    .eq("user_id", currentUser.id);
  if (error) throw error;
  return data || [];
}

async function supabaseUpdateSubject(id, updates) {
  const { data, error } = await supabase
    .from("subjects")
    .update(updates)
    .eq("id", id)
    .eq("user_id", currentUser.id)
    .select();
  if (error) throw error;
  return data[0];
}

async function supabaseDeleteSubject(id) {
  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", id)
    .eq("user_id", currentUser.id);
  if (error) throw error;
}

async function supabaseInsertChapter(subjectId, name) {
  const { data, error } = await supabase
    .from("chapters")
    .insert([{ subject_id: subjectId, name }])
    .select();
  if (error) throw error;
  return data[0];
}

async function supabaseDeleteChapter(id) {
  const { error } = await supabase
    .from("chapters")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

async function supabaseInsertTask(title, subjectId, chapterId) {
  const { data, error } = await supabase
    .from("tasks")
    .insert([{
      user_id: currentUser.id,
      title,
      subject_id: subjectId || null,
      chapter_id: chapterId || null,
      done: false,
    }])
    .select();
  if (error) throw error;
  return data[0];
}

async function supabaseGetTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", currentUser.id);
  if (error) throw error;
  return data || [];
}

async function supabaseUpdateTask(id, updates) {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", currentUser.id)
    .select();
  if (error) throw error;
  return data[0];
}

async function supabaseDeleteTask(id) {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", currentUser.id);
  if (error) throw error;
}

async function supabaseInsertExam(subjectId, examDate) {
  const { data, error } = await supabase
    .from("exams")
    .insert([{
      user_id: currentUser.id,
      subject_id: subjectId,
      exam_date: examDate,
    }])
    .select();
  if (error) throw error;
  return data[0];
}

async function supabaseGetExams() {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .eq("user_id", currentUser.id);
  if (error) throw error;
  return data || [];
}

async function supabaseDeleteExam(id) {
  const { error } = await supabase
    .from("exams")
    .delete()
    .eq("id", id)
    .eq("user_id", currentUser.id);
  if (error) throw error;
}

async function supabaseInsertSession(subjectId, completedSessions, totalSeconds, sessionDate) {
  const { data, error } = await supabase
    .from("sessions")
    .insert([{
      user_id: currentUser.id,
      subject_id: subjectId || null,
      completed_sessions: completedSessions,
      total_seconds: totalSeconds,
      session_date: sessionDate,
    }])
    .select();
  if (error) throw error;
  return data[0];
}

async function supabaseGetSessions() {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", currentUser.id);
  if (error) throw error;
  return data || [];
}

async function supabaseGetUserStats() {
  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", currentUser.id)
    .single();
  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
  return data || { user_id: currentUser.id, streak: 0, last_active_date: null };
}

async function supabaseUpdateUserStats(streak, lastActiveDate) {
  const { data, error } = await supabase
    .from("user_stats")
    .upsert({
      user_id: currentUser.id,
      streak,
      last_active_date: lastActiveDate,
      updated_at: new Date(),
    })
    .select();
  if (error) throw error;
  return data[0];
}

// Export to global
window.supabaseSignUp = supabaseSignUp;
window.supabaseSignIn = supabaseSignIn;
window.supabaseSignOut = supabaseSignOut;
window.supabaseInsertSubject = supabaseInsertSubject;
window.supabaseGetSubjects = supabaseGetSubjects;
window.supabaseUpdateSubject = supabaseUpdateSubject;
window.supabaseDeleteSubject = supabaseDeleteSubject;
window.supabaseInsertChapter = supabaseInsertChapter;
window.supabaseDeleteChapter = supabaseDeleteChapter;
window.supabaseInsertTask = supabaseInsertTask;
window.supabaseGetTasks = supabaseGetTasks;
window.supabaseUpdateTask = supabaseUpdateTask;
window.supabaseDeleteTask = supabaseDeleteTask;
window.supabaseInsertExam = supabaseInsertExam;
window.supabaseGetExams = supabaseGetExams;
window.supabaseDeleteExam = supabaseDeleteExam;
window.supabaseInsertSession = supabaseInsertSession;
window.supabaseGetSessions = supabaseGetSessions;
window.supabaseGetUserStats = supabaseGetUserStats;
window.supabaseUpdateUserStats = supabaseUpdateUserStats;
