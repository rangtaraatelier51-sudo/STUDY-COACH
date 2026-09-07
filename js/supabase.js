const SUPABASE_URL = "https://hnjkjlrwbsdveaqlyrnd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuamtqbHJ3YnNkdmVhcWx5cm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MDgwMDksImV4cCI6MjEwNDI4NDAwOX0.IxKImDu-w6RhijSDfRWADXmI5Um4bajd5ljxRq0g0s4";

let sbClient = null;
let currentUser = null;

async function waitForSupabase() {
  let attempts = 0;
  while (!window.supabase && attempts < 100) {
    await new Promise(r => setTimeout(r, 50));
    attempts++;
  }
  if (!window.supabase) {
    throw new Error("Supabase library not loaded");
  }
  return window.supabase;
}

async function initSupabase() {
  try {
    const supabaseModule = await waitForSupabase();
    sbClient = supabaseModule.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: { session }, error } = await sbClient.auth.getSession();
    
    if (error) {
      console.error("Session error:", error);
      return;
    }

    if (session && session.user) {
      currentUser = session.user;
      window.supabaseUser = currentUser;
    } else {
      window.location.href = "auth.html";
    }
  } catch (err) {
    console.error("Supabase init failed:", err);
    window.location.href = "auth.html";
  }
}

let readyResolve = null;
const supabaseReadyPromise = new Promise(resolve => {
  readyResolve = resolve;
});

initSupabase().then(() => readyResolve()).catch(() => readyResolve());

window.supabaseReady = () => supabaseReadyPromise;

window.supabaseSignUp = async (email, password) => {
  const { data, error } = await sbClient.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

window.supabaseSignIn = async (email, password) => {
  const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  currentUser = data.user;
  window.supabaseUser = currentUser;
  return data;
};

window.supabaseSignOut = async () => {
  const { error } = await sbClient.auth.signOut();
  if (error) throw error;
  currentUser = null;
  window.supabaseUser = null;
};

window.supabaseInsertSubject = async (name) => {
  const { data, error } = await sbClient.from("subjects").insert([{ user_id: currentUser.id, name }]).select();
  if (error) throw error;
  return data[0];
};

window.supabaseGetSubjects = async () => {
  const { data, error } = await sbClient.from("subjects").select("*, chapters(*)").eq("user_id", currentUser.id);
  if (error) throw error;
  return data || [];
};

window.supabaseUpdateSubject = async (id, updates) => {
  const { data, error } = await sbClient.from("subjects").update(updates).eq("id", id).eq("user_id", currentUser.id).select();
  if (error) throw error;
  return data[0];
};

window.supabaseDeleteSubject = async (id) => {
  const { error } = await sbClient.from("subjects").delete().eq("id", id).eq("user_id", currentUser.id);
  if (error) throw error;
};

window.supabaseInsertChapter = async (subjectId, name) => {
  const { data, error } = await sbClient.from("chapters").insert([{ subject_id: subjectId, name }]).select();
  if (error) throw error;
  return data[0];
};

window.supabaseDeleteChapter = async (id) => {
  const { error } = await sbClient.from("chapters").delete().eq("id", id);
  if (error) throw error;
};

window.supabaseInsertTask = async (title, subjectId, chapterId) => {
  const { data, error } = await sbClient.from("tasks").insert([{
    user_id: currentUser.id,
    title,
    subject_id: subjectId || null,
    chapter_id: chapterId || null,
    done: false,
  }]).select();
  if (error) throw error;
  return data[0];
};

window.supabaseGetTasks = async () => {
  const { data, error } = await sbClient.from("tasks").select("*").eq("user_id", currentUser.id);
  if (error) throw error;
  return data || [];
};

window.supabaseUpdateTask = async (id, updates) => {
  const { data, error } = await sbClient.from("tasks").update(updates).eq("id", id).eq("user_id", currentUser.id).select();
  if (error) throw error;
  return data[0];
};

window.supabaseDeleteTask = async (id) => {
  const { error } = await sbClient.from("tasks").delete().eq("id", id).eq("user_id", currentUser.id);
  if (error) throw error;
};

window.supabaseInsertExam = async (subjectId, examDate) => {
  const { data, error } = await sbClient.from("exams").insert([{ user_id: currentUser.id, subject_id: subjectId, exam_date: examDate }]).select();
  if (error) throw error;
  return data[0];
};

window.supabaseGetExams = async () => {
  const { data, error } = await sbClient.from("exams").select("*").eq("user_id", currentUser.id);
  if (error) throw error;
  return data || [];
};

window.supabaseDeleteExam = async (id) => {
  const { error } = await sbClient.from("exams").delete().eq("id", id).eq("user_id", currentUser.id);
  if (error) throw error;
};

window.supabaseInsertSession = async (subjectId, completedSessions, totalSeconds, sessionDate) => {
  const { data, error } = await sbClient.from("sessions").insert([{
    user_id: currentUser.id,
    subject_id: subjectId || null,
    completed_sessions: completedSessions,
    total_seconds: totalSeconds,
    session_date: sessionDate,
  }]).select();
  if (error) throw error;
  return data[0];
};

window.supabaseGetSessions = async () => {
  const { data, error } = await sbClient.from("sessions").select("*").eq("user_id", currentUser.id);
  if (error) throw error;
  return data || [];
};

window.supabaseGetUserStats = async () => {
  const { data, error } = await sbClient.from("user_stats").select("*").eq("user_id", currentUser.id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data || { user_id: currentUser.id, streak: 0, last_active_date: null };
};

window.supabaseUpdateUserStats = async (streak, lastActiveDate) => {
  const { data, error } = await sbClient.from("user_stats").upsert({
    user_id: currentUser.id,
    streak,
    last_active_date: lastActiveDate,
    updated_at: new Date(),
  }).select();
  if (error) throw error;
  return data[0];
};
