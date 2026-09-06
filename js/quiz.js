// Quiz page logic. Relies on js/store.js being loaded first.
async function initQuiz() {
  state = await loadState();
  populateSubjectSelect();
}
initQuiz();
let state = null;
let currentQuiz = null;
let currentQuestionIndex = 0;
let selectedAnswer = null;
let showingFeedback = false;

// ---------- improved rule-based question generation ----------
// Better templates, smarter distractors, more variety

const questionTypes = {
  easy: {
    definition: [
      "What is the definition of {topic}?",
      "Which best defines {topic}?",
      "{topic} refers to:",
      "In its most basic form, {topic} is:",
    ],
    identification: [
      "Which of these is an example of {topic}?",
      "Which statement correctly identifies {topic}?",
      "Which is a characteristic of {topic}?",
    ],
    basic: [
      "What is the primary purpose of {topic}?",
      "Which is a fundamental feature of {topic}?",
      "What does {topic} primarily involve?",
    ],
  },
  medium: {
    application: [
      "How would {topic} be applied in a practical scenario?",
      "In practice, {topic} is most commonly used for:",
      "Which approach best demonstrates {topic}?",
    ],
    comparison: [
      "How does {topic} differ from related concepts?",
      "What distinguishes {topic} from similar ideas?",
      "Compared to other approaches, {topic}:",
    ],
    analysis: [
      "Which factors influence {topic}?",
      "What is a key consideration when studying {topic}?",
      "Understanding {topic} requires knowing:",
    ],
    mechanism: [
      "How does {topic} work?",
      "What is the process behind {topic}?",
      "Which describes the mechanism of {topic}?",
    ],
  },
  hard: {
    critique: [
      "What is a common misconception about {topic}?",
      "Which assumption about {topic} is often incorrect?",
      "What is frequently misunderstood regarding {topic}?",
    ],
    edge_case: [
      "What is an exception or edge case in {topic}?",
      "Under what unusual circumstances might {topic} not apply?",
      "What are the limitations of {topic}?",
    ],
    synthesis: [
      "How does {topic} relate to broader principles?",
      "Integrating {topic} with other concepts, what emerges?",
      "What deeper insight does {topic} reveal?",
    ],
    evaluation: [
      "Which critique of {topic} is most valid?",
      "What is a weakness in the standard understanding of {topic}?",
      "Why might {topic} be contested or debated?",
    ],
  },
};

const answerPatterns = {
  easy_definition: [
    `A process or concept involving ${'{topic}'}`,
    `The practice of implementing ${'{topic}'}`,
    `A fundamental principle of ${'{topic}'}`,
  ],
  easy_identification: [
    `A direct example of ${'{topic}'}`,
    `A key characteristic of ${'{topic}'}`,
    `A primary instance of ${'{topic}'}`,
  ],
  medium_application: [
    `${'{topic}'} is typically used for solving practical problems`,
    `${'{topic}'} applies best when circumstances align with its principles`,
    `${'{topic}'} becomes most valuable in real-world implementation`,
  ],
  medium_comparison: [
    `${'{topic}'} focuses on aspects that related methods overlook`,
    `Unlike alternatives, ${'{topic}'} emphasizes specific elements`,
    `${'{topic}'} provides a distinct perspective compared to standard approaches`,
  ],
  hard_misconception: [
    `Many assume ${'{topic}'} works universally, but context matters`,
    `A common error is oversimplifying ${'{topic}'}`,
    `People often misunderstand the nuance in ${'{topic}'}`,
  ],
  hard_limitation: [
    `${'{topic}'} has inherent constraints in certain scenarios`,
    `The applicability of ${'{topic}'} depends on specific conditions`,
    `${'{topic}'} breaks down when assumptions don't hold`,
  ],
};

const distractorPatterns = {
  easy: [
    `A misunderstanding of ${'{topic}'}`,
    `An unrelated concept`,
    `An oversimplification of ${'{topic}'}`,
    `The opposite of ${'{topic}'}`,
  ],
  medium: [
    `Confuses ${'{topic}'} with a similar but distinct concept`,
    `Ignores a critical aspect of ${'{topic}'}`,
    `Applies ${'{topic}'} in an inappropriate context`,
    `Reverses the relationship in ${'{topic}'}`,
  ],
  hard: [
    `Misses the nuance and complexity of ${'{topic}'}`,
    `Oversimplifies what ${'{topic}'} truly entails`,
    `Conflates ${'{topic}'} with a superficially related idea`,
    `Assumes ${'{topic}'} is more universal than it actually is`,
  ],
};

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateQuestion(subject, chapter, difficulty, questionNumber) {
  const topic = chapter || subject;

  // Pick question type based on difficulty
  let questionType, questionText, answerKey;
  
  if (difficulty === "easy") {
    const types = Object.keys(questionTypes.easy);
    questionType = types[questionNumber % types.length];
    const templates = questionTypes.easy[questionType];
    questionText = getRandomItem(templates).replace("{topic}", topic);
    answerKey = `easy_${questionType}`;
  } else if (difficulty === "medium") {
    const types = Object.keys(questionTypes.medium);
    questionType = types[questionNumber % types.length];
    const templates = questionTypes.medium[questionType];
    questionText = getRandomItem(templates).replace("{topic}", topic);
    answerKey = `medium_${questionType}`;
  } else {
    const types = Object.keys(questionTypes.hard);
    questionType = types[questionNumber % types.length];
    const templates = questionTypes.hard[questionType];
    questionText = getRandomItem(templates).replace("{topic}", topic);
    answerKey = `hard_${questionType}`;
  }

  // Generate correct answer
  const correctAnswerTemplates = answerPatterns[answerKey] || answerPatterns["easy_definition"];
  const correctAnswer = getRandomItem(correctAnswerTemplates).replace(/\$\{'\{topic\}'\}/g, topic);

  // Generate plausible distractors
  const distractorSet = distractorPatterns[difficulty];
  const distractors = [];
  for (let i = 0; i < 3; i++) {
    const template = getRandomItem(distractorSet);
    const distractor = template.replace(/\$\{'\{topic\}'\}/g, topic);
    distractors.push(distractor);
  }

  // Shuffle and get correct index
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
