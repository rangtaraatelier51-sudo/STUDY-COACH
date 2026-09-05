// Quiz page logic. Relies on js/store.js being loaded first.

let state = loadState();
let currentQuiz = null;
let currentQuestionIndex = 0;
let selectedAnswer = null;
let showingFeedback = false;

// ---------- rule-based question generation ----------
// Generates questions based on subject, chapter, and difficulty
// Each question gets a correct answer and 3 plausible distractors

const questionTemplates = {
  easy: [
    "What is the primary concept of {topic}?",
    "Which of the following best describes {topic}?",
    "In {topic}, what does this term mean?",
    "Which is an example of {topic}?",
    "How is {topic} typically applied?",
  ],
  medium: [
    "What is the relationship between {topic} and common applications?",
    "In what scenario would {topic} be most relevant?",
    "How do you solve problems involving {topic}?",
    "Which statement about {topic} is most accurate?",
    "What distinguishes {topic} from related concepts?",
  ],
  hard: [
    "Compare and contrast {topic} with advanced concepts.",
    "What are the edge cases or exceptions in {topic}?",
    "How would you apply {topic} to a complex scenario?",
    "What is a common misconception about {topic}?",
    "Analyze the limitations of {topic} in real-world situations.",
  ],
};

function generateQuestion(subject, chapter, difficulty, questionNumber) {
  const topic = chapter || subject;
  const templates = questionTemplates[difficulty] || questionTemplates.medium;
  const template = templates[questionNumber % templates.length];
  const questionText = template.replace("{topic}", topic);

  // Generate a correct answer and distractors based on difficulty
  const correctAnswer = generateCorrectAnswer(topic, difficulty);
  const distractors = generateDistractors(topic, difficulty, correctAnswer);

  const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
  const correctIndex = options.indexOf(correctAnswer);

  return {
    questionNumber,
    text: questionText,
    options,
    correctIndex,
    correctAnswer,
  };
}

function generateCorrectAnswer(topic, difficulty) {
  const answers = {
    easy: [
      `A fundamental principle of ${topic}`,
      `The core concept of ${topic}`,
      `A basic property of ${topic}`,
      `The definition of ${topic}`,
      `An essential aspect of ${topic}`,
    ],
    medium: [
      `${topic} depends on understanding underlying patterns`,
      `${topic} requires integration of multiple concepts`,
      `${topic} is applied through systematic methodology`,
      `${topic} involves practical problem-solving`,
      `${topic} balances theory and application`,
    ],
    hard: [
      `${topic} exhibits complexity in edge cases`,
      `${topic} requires nuanced understanding of limitations`,
      `${topic} challenges oversimplified interpretations`,
      `${topic} demands critical analysis of assumptions`,
      `${topic} reveals deeper principles through scrutiny`,
    ],
  };

  const answerList = answers[difficulty] || answers.medium;
  return answerList[Math.floor(Math.random() * answerList.length)];
}

function generateDistractors(topic, difficulty, correctAnswer) {
  const distractors = {
    easy: [
      `A misconception about ${topic}`,
      `An unrelated concept`,
      `An oversimplification of ${topic}`,
    ],
    medium: [
      `Confuses ${topic} with a related concept`,
      `Ignores a key aspect of ${topic}`,
      `Applies ${topic} in the wrong context`,
    ],
    hard: [
      `Misses the nuance in ${topic}`,
      `Oversimplifies the complexity of ${topic}`,
      `Conflates ${topic} with a superficially similar idea`,
    ],
  };

  const distractorList = distractors[difficulty] || distractors.medium;
  return distractorList;
}

// ---------- quiz management ----------
function generateQuiz(subjectId, chapterId, difficulty, questionCount) {
  const subject = state.subjects.find((s) => s.id === subjectId);
  if (!subject) return null;

  const chapter = chapterId
    ? subject.chapters.find((c) => c.id === chapterId)
    : null;

  const questions = [];
  for (let i = 0; i < questionCount; i++) {
    questions.push(generateQuestion(subject.name, chapter?.name, difficulty, i + 1));
  }

  return {
    subject: subject.name,
    chapter: chapter?.name || "General",
    difficulty,
    questions,
    answers: new Array(questionCount).fill(null),
    startedAt: new Date(),
  };
}

function getCurrentQuestion() {
  if (!currentQuiz || currentQuestionIndex >= currentQuiz.questions.length) {
    return null;
  }
  return currentQuiz.questions[currentQuestionIndex];
}

function calculateScore() {
  if (!currentQuiz) return 0;
  const correct = currentQuiz.answers.filter((answer, i) => {
    const question = currentQuiz.questions[i];
    return answer === question.correctIndex;
  }).length;
  return Math.round((correct / currentQuiz.questions.length) * 100);
}

// ---------- rendering ----------
function populateSubjectSelect() {
  const select = document.getElementById("quiz-subject");
  const noSubjectsNote = document.getElementById("quiz-no-subjects");
  const startBtn = document.getElementById("start-quiz-btn");

  select.innerHTML = "";

  if (state.subjects.length === 0) {
    noSubjectsNote.style.display = "block";
    startBtn.disabled = true;
    startBtn.style.opacity = "0.5";
    return;
  }

  noSubjectsNote.style.display = "none";
  startBtn.disabled = false;
  startBtn.style.opacity = "1";

  state.subjects.forEach((subject) => {
    const opt = document.createElement("option");
    opt.value = subject.id;
    opt.textContent = subject.name;
    select.appendChild(opt);
  });

  populateChapterSelect();
}

function populateChapterSelect() {
  const subjectId = document.getElementById("quiz-subject").value;
  const chapterSelect = document.getElementById("quiz-chapter");
  const subject = state.subjects.find((s) => String(s.id) === String(subjectId));

  chapterSelect.innerHTML = "";
  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = "All chapters";
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

function renderQuestion() {
  const question = getCurrentQuestion();
  if (!question) return;

  document.getElementById("question-number").textContent = `Q${question.questionNumber}`;
  document.getElementById("question-text").textContent = question.text;
  document.getElementById("quiz-progress").textContent = `${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;

  const progressPercent = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
  document.getElementById("quiz-progress-fill").style.width = `${progressPercent}%`;

  const optionsContainer = document.getElementById("question-options");
  optionsContainer.innerHTML = "";

  question.options.forEach((option, i) => {
    const button = document.createElement("button");
    button.className = "option-button";
    if (selectedAnswer === i) button.classList.add("selected");
    if (showingFeedback) {
      if (i === question.correctIndex) button.classList.add("correct");
      if (selectedAnswer === i && selectedAnswer !== question.correctIndex) {
        button.classList.add("incorrect");
      }
    }
    button.textContent = option;
    button.disabled = showingFeedback;
    button.addEventListener("click", () => {
      if (!showingFeedback) {
        selectedAnswer = i;
        currentQuiz.answers[currentQuestionIndex] = i;
        renderQuestion();
        showQuestionFeedback();
      }
    });
    optionsContainer.appendChild(button);
  });
}

function showQuestionFeedback() {
  const question = getCurrentQuestion();
  const feedbackEl = document.getElementById("question-feedback");

  if (selectedAnswer === null) return;

  showingFeedback = true;
  const isCorrect = selectedAnswer === question.correctIndex;

  feedbackEl.style.display = "block";
  feedbackEl.className = isCorrect ? "feedback-correct" : "feedback-incorrect";
  feedbackEl.textContent = isCorrect ? "✓ Correct!" : `✗ The correct answer is: ${question.correctAnswer}`;

  renderQuestion();
}

function renderResults() {
  const score = calculateScore();
  const correct = currentQuiz.answers.filter((a, i) => a === currentQuiz.questions[i].correctIndex).length;

  document.getElementById("results-score").textContent = `${score}%`;
  document.getElementById("results-detail").textContent = `You answered ${correct} out of ${currentQuiz.questions.length} questions correctly.`;

  const breakdown = document.getElementById("results-breakdown");
  breakdown.innerHTML = `
    <div class="result-meta">
      <span>Subject: ${currentQuiz.subject}</span>
      <span>Chapter: ${currentQuiz.chapter}</span>
      <span>Difficulty: ${currentQuiz.difficulty}</span>
    </div>
  `;
}

// ---------- events ----------
document.getElementById("quiz-subject").addEventListener("change", populateChapterSelect);

document.getElementById("start-quiz-btn").addEventListener("click", () => {
  const subjectId = document.getElementById("quiz-subject").value;
  const chapterId = document.getElementById("quiz-chapter").value;
  const difficulty = document.getElementById("quiz-difficulty").value;
  const questionCount = Number(document.getElementById("quiz-count").value);

  if (!subjectId || questionCount < 1) return;

  currentQuiz = generateQuiz(Number(subjectId), chapterId ? Number(chapterId) : null, difficulty, questionCount);
  currentQuestionIndex = 0;
  selectedAnswer = null;
  showingFeedback = false;

  document.getElementById("quiz-setup").style.display = "none";
  document.getElementById("quiz-view").style.display = "block";
  document.getElementById("quiz-results").style.display = "none";

  renderQuestion();
});

document.getElementById("quiz-next-btn").addEventListener("click", () => {
  if (!showingFeedback) return;

  currentQuestionIndex++;
  if (currentQuestionIndex >= currentQuiz.questions.length) {
    document.getElementById("quiz-view").style.display = "none";
    document.getElementById("quiz-results").style.display = "block";
    renderResults();
  } else {
    selectedAnswer = null;
    showingFeedback = false;
    document.getElementById("question-feedback").style.display = "none";
    renderQuestion();
  }
});

document.getElementById("quiz-back-btn").addEventListener("click", () => {
  document.getElementById("quiz-setup").style.display = "block";
  document.getElementById("quiz-view").style.display = "none";
  document.getElementById("quiz-results").style.display = "none";
  currentQuiz = null;
});

document.getElementById("retake-btn").addEventListener("click", () => {
  currentQuestionIndex = 0;
  selectedAnswer = null;
  showingFeedback = false;
  document.getElementById("quiz-view").style.display = "block";
  document.getElementById("quiz-results").style.display = "none";
  renderQuestion();
});

document.getElementById("back-home-btn").addEventListener("click", () => {
  document.getElementById("quiz-setup").style.display = "block";
  document.getElementById("quiz-results").style.display = "none";
  currentQuiz = null;
});

// ---------- init ----------
populateSubjectSelect();
