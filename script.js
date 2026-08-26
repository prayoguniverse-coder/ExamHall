/* Supabase Init */
const SUPABASE_URL = "https://imiuiizgusnydgongbqk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wIN-aHetkbk4c8hpZ9e_pQ_mEJmVx_v";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

/* Global State */
let currentUser = null;
let currentProfile = null;
let runningExam = null;
let runningQuestions = [];
let runningAnswers = {}; 
let markedForReview = {};
let currentQuestionIndex = 0;
let examTimerInterval = null;
let examTimeRemaining = 0;

/* System Start Setup */
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("signupForm").addEventListener("submit", handleSignup);
  document.getElementById("nextQBtn").addEventListener("click", () => navigateQuestion(1));
  document.getElementById("prevQBtn").addEventListener("click", () => navigateQuestion(-1));
  document.getElementById("clearAnswerBtn").addEventListener("click", clearAnswer);
  document.getElementById("markReviewBtn").addEventListener("click", toggleMarkForReview);
  document.getElementById("submitExamBtn").addEventListener("click", confirmSubmit);
}

/* Authentication Handlers */
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
  
  currentUser = data.user;
  loadStudentDashboard();
}

async function handleSignup(e) {
  e.preventDefault();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const name = document.getElementById("signupName").value.trim();

  const { data, error } = await supabaseClient.auth.signUp({
    email, password, options: { data: { full_name: name } }
  });
  if (error) return alert(error.message);
  alert("Account created successfully. Please login.");
}

/* Student Dashboard */
function loadStudentDashboard() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("studentWelcome").textContent = currentUser.email.split('@')[0];
  
  // Demo Data Render
  renderMockExams();
}

function renderMockExams() {
  const container = document.getElementById("examList");
  container.innerHTML = `
    <div class="exam-card">
      <h4>MPSC Talathi Bharti Mock Test 2026</h4>
      <p class="meta">10 Questions • 5 Mins • 10 Marks</p>
      <button onclick="startExamDemo()" class="primary-btn full-btn">Start Test</button>
    </div>
  `;
}

/* Exam Engine Logic */
function startExamDemo() {
  runningQuestions = [
    { id: 1, subject: "भूगोल", text: "खालीलपैकी कोणते राज्य संपूर्णतः कर्कवृत्ताच्या दक्षिणेस आहे?", options: ["केरळ", "राजस्थान", "मध्य प्रदेश", "गुजरात"], correct: 0, marks: 1 },
    { id: 2, subject: "इतिहास", text: "भारतीय राष्ट्रीय काँग्रेसचे पहिले अधिवेशन कोठे भरले होते?", options: ["पुणे", "मुंबई", "कोलकाता", "चेन्नई"], correct: 1, marks: 1 }
  ];

  document.getElementById("studentDashboard").classList.add("hidden");
  document.getElementById("examPage").classList.remove("hidden");

  currentQuestionIndex = 0;
  runningAnswers = {};
  markedForReview = {};
  examTimeRemaining = 5 * 60; // 5 minutes timer

  startTimer();
  renderSubjectTabs();
  renderQuestion();
  renderPalette();
}

/* Live Timer & Auto Submit Logic */
function startTimer() {
  clearInterval(examTimerInterval);
  examTimerInterval = setInterval(() => {
    examTimeRemaining--;
    
    let minutes = Math.floor(examTimeRemaining / 60);
    let seconds = examTimeRemaining % 60;
    document.getElementById("examTimer").textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (examTimeRemaining <= 0) {
      clearInterval(examTimerInterval);
      alert("⏰ वेळ संपली आहे! पेपर ऑटोमॅटिक सबमिट होत आहे.");
      autoSubmitExam();
    }
  }, 1000);
}

/* Navigation & Rendering */
function renderQuestion() {
  const q = runningQuestions[currentQuestionIndex];
  document.getElementById("questionNumberDisplay").textContent = `Question ${currentQuestionIndex + 1} of ${runningQuestions.length}`;
  document.getElementById("currentQSubject").textContent = q.subject;
  document.getElementById("currentQMarks").textContent = q.marks;
  document.getElementById("runningQuestionText").textContent = q.text;

  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";

  q.options.forEach((opt, idx) => {
    const isSelected = runningAnswers[q.id] === idx;
    optionsContainer.innerHTML += `
      <div class="option-item ${isSelected ? 'selected' : ''}" onclick="selectOption(${idx})">
        <input type="radio" name="opt" ${isSelected ? 'checked' : ''}>
        <span>${opt}</span>
      </div>
    `;
  });

  updatePaletteStatus();
}

function selectOption(index) {
  const qId = runningQuestions[currentQuestionIndex].id;
  runningAnswers[qId] = index;
  renderQuestion();
}

function clearAnswer() {
  const qId = runningQuestions[currentQuestionIndex].id;
  delete runningAnswers[qId];
  renderQuestion();
}

function toggleMarkForReview() {
  const qId = runningQuestions[currentQuestionIndex].id;
  markedForReview[qId] = !markedForReview[qId];
  renderQuestion();
}

function navigateQuestion(step) {
  const newIndex = currentQuestionIndex + step;
  if (newIndex >= 0 && newIndex < runningQuestions.length) {
    currentQuestionIndex = newIndex;
    renderQuestion();
  }
}

/* Palette Management */
function renderPalette() {
  const container = document.getElementById("questionPalette");
  container.innerHTML = "";
  
  runningQuestions.forEach((q, idx) => {
    container.innerHTML += `<button id="p-btn-${idx}" onclick="jumpToQuestion(${idx})" class="p-btn">${idx + 1}</button>`;
  });
}

function updatePaletteStatus() {
  runningQuestions.forEach((q, idx) => {
    const btn = document.getElementById(`p-btn-${idx}`);
    if (!btn) return;

    btn.className = "p-btn";
    if (idx === currentQuestionIndex) btn.classList.add("current");
    if (runningAnswers[q.id] !== undefined) btn.classList.add("answered");
    if (markedForReview[q.id]) btn.classList.add("review");
  });
}

function jumpToQuestion(index) {
  currentQuestionIndex = index;
  renderQuestion();
}

function renderSubjectTabs() {
  const container = document.getElementById("subjectTabs");
  const subjects = [...new Set(runningQuestions.map(q => q.subject))];
  container.innerHTML = subjects.map(s => `<button class="sub-tab">${s}</button>`).join("");
}

/* Submission System */
function confirmSubmit() {
  if (confirm("तुम्हाला खात्री आहे की पेपर सबमिट करायचा आहे?")) {
    autoSubmitExam();
  }
}

function autoSubmitExam() {
  clearInterval(examTimerInterval);
  let score = 0;

  runningQuestions.forEach(q => {
    if (runningAnswers[q.id] === q.correct) {
      score += q.marks;
    }
  });

  document.getElementById("examPage").classList.add("hidden");
  document.getElementById("resultPage").classList.remove("hidden");
  document.getElementById("resultScore").textContent = score;
  document.getElementById("resultPercentage").textContent = `${(score / runningQuestions.length) * 100}%`;
}
