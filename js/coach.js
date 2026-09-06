// AI Study Coach page logic. Relies on js/store.js being loaded first.
async function initQuiz() {
  state = await loadState();
  populateSubjectSelect();
}
initQuiz();
let state = null;
// ---------- plan generation (rule-based, no API) ----------
function generatePlan(subjectId, daysRemaining, currentCompletion, hoursPerDay) {
  const subject = state.subjects.find((s) => s.id === subjectId);
  if (!subject) return null;

  const remainingPercent = 100 - currentCompletion;
  const totalHours = daysRemaining * hoursPerDay;

  // Phases: ramp-up (20%), main study (50%), review (30%)
  const phases = [
    { name: "Ramp-up", daysPercent: 0.15, intensityMultiplier: 0.7 },
    { name: "Main study", daysPercent: 0.60, intensityMultiplier: 1.0 },
    { name: "Final review", daysPercent: 0.25, intensityMultiplier: 1.3 },
  ];

  const days = [];
  let dayIndex = 0;
  let cumulativePercent = currentCompletion;

  phases.forEach((phase) => {
    const phaseDays = Math.ceil(daysRemaining * phase.daysPercent);
    const phasePercent = (remainingPercent * phase.daysPercent) / phaseDays;

    for (let i = 0; i < phaseDays && dayIndex < daysRemaining; i++) {
      const dayPercent = Math.min(phasePercent * phase.intensityMultiplier, 100 - cumulativePercent);
      cumulativePercent += dayPercent;

      // Recommend chapters if available
      let recommendation = "";
      if (subject.chapters && subject.chapters.length > 0) {
        const chapterIndex = Math.floor((dayIndex / daysRemaining) * subject.chapters.length);
        const chapter = subject.chapters[Math.min(chapterIndex, subject.chapters.length - 1)];
        recommendation = chapter ? `Focus on ${chapter.name}` : "Review all chapters";
      } else {
        const topicIndex = dayIndex % 3;
        const topics = ["Concepts", "Practice problems", "Review & consolidate"];
        recommendation = topics[topicIndex];
      }

      days.push({
        dayNumber: dayIndex + 1,
        phase: phase.name,
        percentCovered: Math.round(dayPercent),
        cumulativePercent: Math.round(cumulativePercent),
        recommendation,
        hoursToStudy: Math.round(hoursPerDay * (0.8 + Math.random() * 0.4)), // variation 80-120%
      });

      dayIndex++;
    }
  });

  // Trim to exact days remaining
  const plan = days.slice(0, daysRemaining);

  // Generate coaching notes
  const totalStudyHours = plan.reduce((sum, d) => sum + d.hoursToStudy, 0);
  const avgPerDay = Math.round(totalStudyHours / daysRemaining);
  const notes = `You've completed ${currentCompletion}% of ${subject.name}. Over ${daysRemaining} days, you'll cover the remaining ${remainingPercent}% at ~${avgPerDay}h per day. Start lighter (${plan[0].hoursToStudy}h), ramp up in the middle, and finish with intensive review.`;

  return { subject: subject.name, plan, notes, totalHours: totalStudyHours };
}

// ---------- rendering ----------
function populateSubjectSelect() {
  const select = document.getElementById("coach-subject");
  const noSubjectsNote = document.getElementById("coach-no-subjects");
  const generateBtn = document.getElementById("generate-btn");

  select.innerHTML = "";

  if (state.subjects.length === 0) {
    noSubjectsNote.style.display = "block";
    generateBtn.disabled = true;
    generateBtn.style.opacity = "0.5";
    return;
  }

  noSubjectsNote.style.display = "none";
  generateBtn.disabled = false;
  generateBtn.style.opacity = "1";

  state.subjects.forEach((subject) => {
    const opt = document.createElement("option");
    opt.value = subject.id;
    opt.textContent = subject.name;
    select.appendChild(opt);
  });
}

function renderPlan(planData) {
  if (!planData) return;

  document.getElementById("coach-empty").style.display = "none";
  const view = document.getElementById("plan-view");
  view.style.display = "block";

  document.getElementById("plan-title").textContent = `${planData.subject} — ${planData.plan.length}-day plan`;
  document.getElementById("plan-subtitle").textContent = planData.notes;
  document.getElementById("plan-notes").textContent = "✓ Adjust the days on your dashboard as you study, and the plan will update.";

  const timeline = document.getElementById("plan-timeline");
  timeline.innerHTML = "";

  planData.plan.forEach((day, i) => {
    const card = document.createElement("div");
    card.className = "plan-day-card";
    if (i === 0) card.classList.add("plan-day-first");
    if (i === planData.plan.length - 1) card.classList.add("plan-day-last");

    const dayNum = document.createElement("div");
    dayNum.className = "plan-day-number";
    dayNum.textContent = `Day ${day.dayNumber}`;

    const phase = document.createElement("div");
    phase.className = "plan-day-phase";
    phase.textContent = day.phase;

    const rec = document.createElement("div");
    rec.className = "plan-day-rec";
    rec.textContent = day.recommendation;

    const stats = document.createElement("div");
    stats.className = "plan-day-stats";
    stats.innerHTML = `
      <span class="stat-hours">${day.hoursToStudy}h</span>
      <span class="stat-progress">${day.cumulativePercent}% done</span>
    `;

    card.appendChild(dayNum);
    card.appendChild(phase);
    card.appendChild(rec);
    card.appendChild(stats);
    timeline.appendChild(card);
  });
}

// ---------- events ----------
document.getElementById("coach-completion-range").addEventListener("input", (e) => {
  document.getElementById("coach-completion-display").textContent = e.target.value + "%";
});

document.getElementById("generate-btn").addEventListener("click", () => {
  const subjectId = document.getElementById("coach-subject").value;
  const daysRemaining = Number(document.getElementById("coach-days").value);
  const currentCompletion = Number(document.getElementById("coach-completion-range").value);
  const hoursPerDay = Number(document.getElementById("coach-hours").value);

  if (!subjectId || daysRemaining < 1 || hoursPerDay < 1) return;

  const planData = generatePlan(Number(subjectId), daysRemaining, currentCompletion, hoursPerDay);
  renderPlan(planData);
});

document.getElementById("regenerate-btn").addEventListener("click", () => {
  document.getElementById("plan-view").style.display = "none";
  document.getElementById("coach-empty").style.display = "block";
});

// ---------- init ----------
populateSubjectSelect();
