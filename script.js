const SUPABASE_URL = "https://imiuiizgusnydgongbqk.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_wIN-aHetkbk4c8hpZ9e_pQ_mEJmVx_v";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentProfile = null;
let activeExam = null;
let activeAttempt = null;
let examQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // { question_id: option_choice }
let markedForReview = new Set();
let timerInterval = null;

// Initialization
window.onload = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await fetchProfile();
  }
};

// Auth Tab Switch
function switchAuthTab(type) {
  const isSignup = type === 'signup';
  document.getElementById('name-group').style.display = isSignup ? 'block' : 'none';
  document.getElementById('role-group').style.display = isSignup ? 'block' : 'none';
  document.getElementById('auth-btn').innerText = isSignup ? 'Sign Up' : 'Login';
  document.querySelectorAll('.auth-tabs button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

// Authentication Logic
async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const isSignup = document.getElementById('auth-btn').innerText === 'Sign Up';

  if (isSignup) {
    const fullName = document.getElementById('auth-name').value;
    const role = document.getElementById('auth-role').value;

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);

    await supabase.from('profiles').insert([{ id: data.user.id, full_name: fullName, role }]);
    alert('Signup successful! Logging in...');
    location.reload();
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    currentUser = data.user;
    await fetchProfile();
  }
}

// Fetch Profile and Navigate Dashboard
async function fetchProfile() {
  const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
  currentProfile = data;

  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('user-display').innerText = `${data.full_name} (${data.role.toUpperCase()})`;

  if (data.role === 'student') {
    document.getElementById('student-dashboard').style.display = 'block';
    loadStudentDashboard();
  } else {
    document.getElementById('teacher-dashboard').style.display = 'block';
    loadTeacherDashboard();
  }
}

async function logout() {
  await supabase.auth.signOut();
  location.reload();
}

// ================= STUDENT EXAM ENGINE =================

async function loadStudentDashboard() {
  const { data: exams } = await supabase.from('exams').select('*').eq('is_published', true);
  const container = document.getElementById('exam-cards-list');
  container.innerHTML = exams.map(exam => `
    <div class="card">
      <h4>${exam.title}</h4>
      <p>Duration: ${exam.duration_minutes} Mins</p>
      <button class="btn primary-btn block-btn" style="margin-top:10px;" onclick="startExam('${exam.id}')">Start Exam</button>
    </div>
  `).join('');
}

async function startExam(examId) {
  // 1. Fetch Exam Meta
  const { data: exam } = await supabase.from('exams').select('*').eq('id', examId).single();
  activeExam = exam;

  // 2. Fetch Questions securely using RPC
  const { data: qData, error } = await supabase.rpc('get_exam_questions_safe', { p_exam_id: examId });
  if (error || qData.length === 0) return alert('Unable to load exam questions.');
  examQuestions = qData;

  // 3. Create Attempt Record
  const { data: attempt } = await supabase.from('exam_attempts').insert([
    { exam_id: examId, student_id: currentUser.id }
  ]).select().single();
  activeAttempt = attempt;

  // Render Engine Screen
  document.getElementById('app').style.display = 'none';
  document.getElementById('exam-engine').style.display = 'flex';
  document.getElementById('engine-exam-title').innerText = activeExam.title;

  setupTimer(activeExam.duration_minutes * 60);
  renderQuestion(0);
}

function renderQuestion(index) {
  currentQuestionIndex = index;
  const q = examQuestions[index];

  document.getElementById('q-number-badge').innerText = `Question ${index + 1} of ${examQuestions.length}`;
  document.getElementById('q-text').innerText = q.question_text;

  const optionsContainer = document.getElementById('options-list');
  const options = ['A', 'B', 'C', 'D'];
  const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d'];

  optionsContainer.innerHTML = options.map((opt, i) => `
    <label class="option-item">
      <input type="radio" name="opt" value="${opt}" ${userAnswers[q.id] === opt ? 'checked' : ''} onchange="selectAnswer('${q.id}', '${opt}')">
      <span style="margin-left:10px;">${opt}. ${q[optionKeys[i]]}</span>
    </label>
  `).join('');

  renderPalette();
}

function selectAnswer(qId, val) {
  userAnswers[qId] = val;
  renderPalette();
}

function toggleMarkForReview() {
  const qId = examQuestions[currentQuestionIndex].id;
  if (markedForReview.has(qId)) markedForReview.delete(qId);
  else markedForReview.add(qId);
  renderPalette();
}

function renderPalette() {
  const palette = document.getElementById('palette-grid');
  palette.innerHTML = examQuestions.map((q, i) => {
    let statusClass = '';
    if (userAnswers[q.id]) statusClass = 'answered';
    if (markedForReview.has(q.id)) statusClass = 'marked';
    if (i === currentQuestionIndex) statusClass += ' current';

    return `<button class="palette-btn ${statusClass}" onclick="renderQuestion(${i})">${i + 1}</button>`;
  }).join('');
}

function nextQuestion() {
  if (currentQuestionIndex < examQuestions.length - 1) renderQuestion(currentQuestionIndex + 1);
}

function prevQuestion() {
  if (currentQuestionIndex > 0) renderQuestion(currentQuestionIndex - 1);
}

function setupTimer(secondsRemaining) {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    secondsRemaining--;
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    document.getElementById('timer-display').innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (secondsRemaining <= 0) {
      clearInterval(timerInterval);
      alert('Time Up! Auto submitting...');
      submitExam();
    }
  }, 1000);
}

async function submitExam() {
  clearInterval(timerInterval);

  // Format Payload
  const answersPayload = Object.keys(userAnswers).map(qId => ({
    question_id: qId,
    selected_option: userAnswers[qId]
  }));

  // Execute Secure Server-side Evaluation RPC
  const { data: result, error } = await supabase.rpc('submit_exam_attempt', {
    p_attempt_id: activeAttempt.id,
    p_answers: answersPayload
  });

  if (error) return alert("Submission error: " + error.message);

  alert(`Exam Submitted!\nYour Score: ${result.score}\nCorrect: ${result.correct}\nWrong: ${result.wrong}`);
  location.reload();
}

// ================= TEACHER DASHBOARD =================

async function loadTeacherDashboard() {
  const { data: exams } = await supabase.from('exams').select('*').eq('created_by', currentUser.id);
  
  document.getElementById('stat-total-exams').innerText = exams.length;
  document.getElementById('stat-published-exams').innerText = exams.filter(e => e.is_published).length;

  const container = document.getElementById('teacher-exams-list');
  container.innerHTML = exams.map(e => `
    <div class="card">
      <h4>${e.title}</h4>
      <p>Status: <strong>${e.is_published ? 'Published' : 'Draft'}</strong></p>
      <button onclick="togglePublish('${e.id}', ${e.is_published})" class="btn ${e.is_published ? 'warning-btn' : 'success-btn'}" style="margin-top:10px;">
        ${e.is_published ? 'Unpublish' : 'Publish'}
      </button>
    </div>
  `).join('');
}

function showCreateExamModal() {
  document.getElementById('create-exam-modal').style.display = 'flex';
}
function closeModal() {
  document.getElementById('create-exam-modal').style.display = 'none';
}

async function handleCreateExam(e) {
  e.preventDefault();
  const title = document.getElementById('exam-title').value;
  const duration = document.getElementById('exam-duration').value;
  const passing = document.getElementById('exam-passing').value;

  await supabase.from('exams').insert([{
    title, duration_minutes: duration, passing_percentage: passing, created_by: currentUser.id
  }]);

  closeModal();
  loadTeacherDashboard();
}

async function togglePublish(examId, currentStatus) {
  await supabase.from('exams').update({ is_published: !currentStatus }).eq('id', examId);
  loadTeacherDashboard();
}
