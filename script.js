/* =============================================================
   EXAMHALL — script.js
   Vanilla JS, localStorage-backed Online Exam Portal prototype.

   Sections in this file:
   1. Storage keys + generic helpers
   2. Demo data bootstrap
   3. Toast / small UI utilities
   4. Auth + session handling
   5. Router (view switching)
   6. Student dashboard
   7. Exam engine (taking an exam)
   8. Scoring + FIRST ATTEMPT LOCK logic
   9. Result / review rendering (shared by student + teacher)
   10. Attempt history
   11. Report-question modal
   12. Teacher dashboard + student details + report management
   13. Init / event wiring
============================================================= */

/* ============================================================
   1. STORAGE KEYS + GENERIC HELPERS
============================================================= */
const KEYS = {
  STUDENTS: 'exam_portal_students',
  TEACHERS: 'exam_portal_teachers',
  EXAMS: 'exam_portal_exams',
  ATTEMPTS: 'exam_portal_attempts',
  FIRST_ATTEMPTS: 'exam_portal_first_attempts',
  REPORTS: 'exam_portal_reports',
  SESSION: 'exam_portal_session',
  SEEDED: 'exam_portal_seeded'
};

// Generic get: returns parsed JSON array/object, or `fallback` if missing/corrupt.
function getData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Corrupt localStorage data for', key, err);
    return fallback;
  }
}

// Generic set: stringifies and writes. Wrapped so a full/blocked storage
// never throws an uncaught error up into the UI.
function setData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('Failed to write localStorage', key, err);
    showToast('Could not save data locally. Storage may be full.', 'error');
    return false;
  }
}

function uid(prefix) {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/* ============================================================
   2. DEMO DATA BOOTSTRAP
   Runs once (guarded by KEYS.SEEDED) so refreshing never
   duplicates or resets demo accounts / exam progress.
============================================================= */
function seedDemoDataIfNeeded() {
  if (getData(KEYS.SEEDED, false)) return;

  const students = [
    { studentId: 'student01', name: 'Rahul Sharma', password: '123456' }
  ];

  const teachers = [
    { teacherId: 'teacher01', name: 'Admin Teacher', password: '123456' }
  ];

  const exams = [
    {
      examId: 'exam_html_css_basics',
      title: 'HTML & CSS Basics',
      description: '10 questions covering core HTML and CSS fundamentals.',
      questions: [
        { id: 1, question: 'What does HTML stand for?', options: ['Hyper Trainer Marking Language', 'Hyper Text Markup Language', 'Hyper Text Marketing Language', 'Home Tool Markup Language'], correctAnswer: 1 },
        { id: 2, question: 'Which tag is used to define an unordered list?', options: ['<ol>', '<list>', '<ul>', '<li>'], correctAnswer: 2 },
        { id: 3, question: 'What is the correct HTML element for the largest heading?', options: ['<heading>', '<h6>', '<h1>', '<head>'], correctAnswer: 2 },
        { id: 4, question: 'Which CSS property controls the text size?', options: ['text-style', 'font-size', 'text-size', 'font-style'], correctAnswer: 1 },
        { id: 5, question: 'Which HTML attribute specifies an alternate text for an image?', options: ['title', 'src', 'alt', 'longdesc'], correctAnswer: 2 },
        { id: 6, question: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Creative Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets'], correctAnswer: 0 },
        { id: 7, question: 'Which property is used to change the background color?', options: ['color', 'bgcolor', 'background-color', 'background'], correctAnswer: 2 },
        { id: 8, question: 'Inside which HTML element do we put JavaScript?', options: ['<js>', '<scripting>', '<javascript>', '<script>'], correctAnswer: 3 },
        { id: 9, question: 'Which is the correct syntax to link an external CSS file?', options: ['<style src="style.css">', '<link rel="stylesheet" href="style.css">', '<css> style.css </css>', '<stylesheet>style.css</stylesheet>'], correctAnswer: 1 },
        { id: 10, question: 'Which CSS property is used to change the space between elements?', options: ['spacing', 'margin', 'padding-space', 'gap-size'], correctAnswer: 1 }
      ]
    }
  ];

  setData(KEYS.STUDENTS, students);
  setData(KEYS.TEACHERS, teachers);
  setData(KEYS.EXAMS, exams);
  setData(KEYS.ATTEMPTS, []);
  setData(KEYS.FIRST_ATTEMPTS, []);
  setData(KEYS.REPORTS, []);
  setData(KEYS.SEEDED, true);
}

/* ============================================================
   3. TOAST / SMALL UI UTILITIES
============================================================= */
let toastTimer = null;
function showToast(message, type) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = 'toast show' + (type ? ' toast-' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3200);
}

/* ============================================================
   4. AUTH + SESSION HANDLING
============================================================= */
function getSession() {
  return getData(KEYS.SESSION, null);
}

function setSession(session) {
  setData(KEYS.SESSION, session);
}

function clearSession() {
  localStorage.removeItem(KEYS.SESSION);
}

function findStudent(studentId) {
  return getData(KEYS.STUDENTS, []).find(s => s.studentId === studentId) || null;
}

function findTeacher(teacherId) {
  return getData(KEYS.TEACHERS, []).find(t => t.teacherId === teacherId) || null;
}

function findExam(examId) {
  return getData(KEYS.EXAMS, []).find(e => e.examId === examId) || null;
}

function handleLogin(e) {
  e.preventDefault();
  const role = document.querySelector('.role-tab.active').dataset.role;
  const id = document.getElementById('login-id').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.hidden = true;

  if (!id || !password) {
    errorEl.textContent = 'Please enter both ID and password.';
    errorEl.hidden = false;
    return;
  }

  if (role === 'student') {
    const student = findStudent(id);
    if (!student || student.password !== password) {
      errorEl.textContent = 'Invalid Student ID or password.';
      errorEl.hidden = false;
      return;
    }
    setSession({ role: 'student', userId: student.studentId });
  } else {
    const teacher = findTeacher(id);
    if (!teacher || teacher.password !== password) {
      errorEl.textContent = 'Invalid Teacher ID or password.';
      errorEl.hidden = false;
      return;
    }
    setSession({ role: 'teacher', userId: teacher.teacherId });
  }

  document.getElementById('login-form').reset();
  enterApp();
}

function handleLogout() {
  clearSession();
  document.getElementById('app-shell').hidden = true;
  document.getElementById('page-login').classList.add('active');
  document.getElementById('student-nav').hidden = true;
  document.getElementById('teacher-nav').hidden = true;
}

/* Restores session on page load/refresh so the user isn't
   unnecessarily logged out. */
function restoreSessionOnLoad() {
  const session = getSession();
  if (!session) return;

  if (session.role === 'student' && findStudent(session.userId)) {
    enterApp();
  } else if (session.role === 'teacher' && findTeacher(session.userId)) {
    enterApp();
  } else {
    // Session points at a user that no longer exists — clear it.
    clearSession();
  }
}

function enterApp() {
  const session = getSession();
  if (!session) return;

  document.getElementById('page-login').classList.remove('active');
  document.getElementById('app-shell').hidden = false;

  const isStudent = session.role === 'student';
  document.getElementById('student-nav').hidden = !isStudent;
  document.getElementById('teacher-nav').hidden = isStudent;

  if (isStudent) {
    const student = findStudent(session.userId);
    document.getElementById('sidebar-user-name').textContent = student.name;
    document.getElementById('sidebar-user-role').textContent = 'Student';
    document.getElementById('sidebar-avatar').textContent = student.name.charAt(0).toUpperCase();
    showView('student-dashboard');
  } else {
    const teacher = findTeacher(session.userId);
    document.getElementById('sidebar-user-name').textContent = teacher.name;
    document.getElementById('sidebar-user-role').textContent = 'Teacher';
    document.getElementById('sidebar-avatar').textContent = teacher.name.charAt(0).toUpperCase();
    showView('teacher-dashboard');
  }
}

/* ============================================================
   5. ROUTER — plain show/hide, no page reloads
============================================================= */
function showView(viewId, params) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(viewId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === viewId);
  });

  // Close mobile sidebar after navigating.
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');

  // Route-specific render calls.
  const session = getSession();
  if (!session) return;

  if (viewId === 'student-dashboard') renderStudentDashboard();
  if (viewId === 'student-result') renderStudentResultPage();
  if (viewId === 'student-history') renderStudentHistoryPage();
  if (viewId === 'teacher-dashboard') renderTeacherDashboard();
  if (viewId === 'teacher-reports') renderTeacherReports();
  if (viewId === 'teacher-student-details' && params) renderTeacherStudentDetails(params.studentId, params.examId);
}

/* ============================================================
   6. STUDENT DASHBOARD
============================================================= */
function renderStudentDashboard() {
  const session = getSession();
  const student = findStudent(session.userId);
  const exams = getData(KEYS.EXAMS, []);
  const firstAttempts = getData(KEYS.FIRST_ATTEMPTS, []);
  const attempts = getData(KEYS.ATTEMPTS, []);

  document.getElementById('dash-student-name').textContent = student.name;
  document.getElementById('dash-student-id').textContent = student.studentId;

  // For the prototype's single demo exam we show that exam's stats up top;
  // this generalises fine since getFirstAttempt() is always scoped by examId.
  const primaryExam = exams[0];
  const firstAttempt = primaryExam
    ? firstAttempts.find(f => f.studentId === student.studentId && f.examId === primaryExam.examId)
    : null;
  const myAttempts = primaryExam
    ? attempts.filter(a => a.studentId === student.studentId && a.examId === primaryExam.examId)
    : [];

  document.getElementById('dash-official-score').textContent = firstAttempt
    ? `${firstAttempt.correctAnswers}/${firstAttempt.totalQuestions}` : '—';
  document.getElementById('dash-official-percent').textContent = firstAttempt
    ? `${firstAttempt.percentage}%` : '—';
  document.getElementById('dash-attempt-count').textContent = myAttempts.length;
  document.getElementById('dash-first-date').textContent = firstAttempt
    ? formatDateTime(firstAttempt.timestamp) : '—';

  // Exam list
  const listEl = document.getElementById('exam-list');
  listEl.innerHTML = '';
  exams.forEach(exam => {
    const attemptsForExam = attempts.filter(a => a.studentId === student.studentId && a.examId === exam.examId);
    const item = document.createElement('div');
    item.className = 'exam-item';
    item.innerHTML = `
      <div>
        <h4>${escapeHtml(exam.title)}</h4>
        <p>${exam.questions.length} questions · ${attemptsForExam.length} attempt${attemptsForExam.length === 1 ? '' : 's'} so far</p>
      </div>
      <button class="btn btn-primary start-exam-btn">${attemptsForExam.length ? 'Re-attempt' : 'Start Exam'}</button>
    `;
    item.querySelector('.start-exam-btn').addEventListener('click', () => startExam(exam.examId));
    listEl.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ============================================================
   7. EXAM ENGINE
   examSession holds in-progress state only — nothing is written
   to localStorage until the student presses Submit.
============================================================= */
let examSession = null; // { examId, questions, answers: {qId: optionIndex}, currentIndex }

function startExam(examId) {
  const exam = findExam(examId);
  if (!exam) { showToast('Exam not found.', 'error'); return; }

  examSession = {
    examId,
    questions: exam.questions,
    answers: {},
    currentIndex: 0
  };

  showView('exam-page');
  document.getElementById('exam-title').textContent = exam.title;
  renderExamNavGrid();
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  const { questions, currentIndex, answers } = examSession;
  const q = questions[currentIndex];

  document.getElementById('exam-progress-badge').textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  document.getElementById('question-text').textContent = q.question;

  const optionsList = document.getElementById('options-list');
  optionsList.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  q.options.forEach((opt, idx) => {
    const row = document.createElement('div');
    row.className = 'option-row' + (answers[q.id] === idx ? ' selected' : '');
    row.innerHTML = `<span class="option-letter">${letters[idx]}</span><span>${escapeHtml(opt)}</span>`;
    row.addEventListener('click', () => selectAnswer(q.id, idx));
    optionsList.appendChild(row);
  });

  document.getElementById('prev-btn').disabled = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;
  document.getElementById('next-btn').hidden = isLast;
  document.getElementById('submit-exam-btn').hidden = !isLast;

  renderExamNavGrid();
}

function selectAnswer(questionId, optionIndex) {
  examSession.answers[questionId] = optionIndex;
  renderCurrentQuestion();
}

function renderExamNavGrid() {
  const { questions, currentIndex, answers } = examSession;
  const grid = document.getElementById('nav-grid');
  grid.innerHTML = '';
  questions.forEach((q, idx) => {
    const cell = document.createElement('button');
    const attempted = answers[q.id] !== undefined;
    cell.className = 'nav-cell' + (attempted ? ' attempted' : '') + (idx === currentIndex ? ' current' : '');
    cell.textContent = idx + 1;
    cell.title = attempted ? 'Attempted' : 'Unattempted';
    cell.addEventListener('click', () => {
      examSession.currentIndex = idx;
      renderCurrentQuestion();
    });
    grid.appendChild(cell);
  });
}

function goPrevQuestion() {
  if (examSession.currentIndex > 0) {
    examSession.currentIndex--;
    renderCurrentQuestion();
  }
}

function goNextQuestion() {
  if (examSession.currentIndex < examSession.questions.length - 1) {
    examSession.currentIndex++;
    renderCurrentQuestion();
  }
}

function submitExam() {
  const unanswered = examSession.questions.length - Object.keys(examSession.answers).length;
  if (unanswered > 0) {
    const proceed = confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`);
    if (!proceed) return;
  }

  const { examId, questions, answers } = examSession;
  const session = getSession();
  const studentId = session.userId;

  let correctAnswers = 0;
  const answerLog = questions.map(q => {
    const studentAnswer = answers[q.id] !== undefined ? answers[q.id] : null;
    const isCorrect = studentAnswer === q.correctAnswer;
    if (isCorrect) correctAnswers++;
    return { questionId: q.id, studentAnswer, correctAnswer: q.correctAnswer, isCorrect };
  });

  const totalQuestions = questions.length;
  const wrongAnswers = totalQuestions - correctAnswers;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);

  const attempt = {
    attemptId: uid('attempt'),
    studentId,
    examId,
    score: correctAnswers,
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    percentage,
    answers: answerLog,
    timestamp: new Date().toISOString()
  };

  saveAttemptAndEnforceFirstAttemptLock(attempt);
  examSession = null;

  showToast(`Exam submitted — scored ${correctAnswers}/${totalQuestions}.`, 'success');
  showView('student-result');
}

/* ============================================================
   8. SCORING + FIRST ATTEMPT LOCK
   This is the core rule of the whole app: the first attempt a
   student makes on a given exam becomes their permanent official
   result. Every later attempt is stored in full (so history and
   "best of" views remain possible) but NEVER touches the
   firstAttemptResults record.
============================================================= */
function getFirstAttempt(studentId, examId) {
  return getData(KEYS.FIRST_ATTEMPTS, []).find(f => f.studentId === studentId && f.examId === examId) || null;
}

function saveAttemptAndEnforceFirstAttemptLock(attempt) {
  // 1. Always append the raw attempt to the full attempts log.
  const attempts = getData(KEYS.ATTEMPTS, []);
  attempts.push(attempt);
  setData(KEYS.ATTEMPTS, attempts);

  // 2. Only create a firstAttemptResults record if one does not
  //    already exist for this student+exam pair. If it exists,
  //    it is left completely untouched — this is the lock.
  const existing = getFirstAttempt(attempt.studentId, attempt.examId);
  if (!existing) {
    const firstAttempts = getData(KEYS.FIRST_ATTEMPTS, []);
    firstAttempts.push({
      studentId: attempt.studentId,
      examId: attempt.examId,
      attemptId: attempt.attemptId,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      wrongAnswers: attempt.wrongAnswers,
      percentage: attempt.percentage,
      answers: attempt.answers,
      timestamp: attempt.timestamp
    });
    setData(KEYS.FIRST_ATTEMPTS, firstAttempts);
  }
  // else: intentionally do nothing — official result stays locked.
}

/* ============================================================
   9. RESULT / REVIEW RENDERING
   Shared between the student's own result page and the teacher's
   "view student details" page — both read from firstAttemptResults.
============================================================= */
function buildResultHtml(firstAttempt, exam, options) {
  options = options || {};
  if (!firstAttempt) {
    return `<div class="empty-state"><h3>No attempts yet</h3><p>Take the exam to see your first-attempt result here.</p></div>`;
  }

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  let html = `
    <div class="result-summary">
      <div class="stat-card"><div class="stat-label">Total Questions</div><div class="stat-value">${firstAttempt.totalQuestions}</div></div>
      <div class="stat-card"><div class="stat-label">Correct</div><div class="stat-value">${firstAttempt.correctAnswers}</div></div>
      <div class="stat-card"><div class="stat-label">Wrong</div><div class="stat-value">${firstAttempt.wrongAnswers}</div></div>
      <div class="stat-card"><div class="stat-label">Score</div><div class="stat-value">${firstAttempt.score}/${firstAttempt.totalQuestions}</div></div>
      <div class="stat-card"><div class="stat-label">Percentage</div><div class="stat-value">${firstAttempt.percentage}%</div></div>
    </div>
    <p class="muted" style="margin-bottom:20px;">First attempt taken on ${formatDateTime(firstAttempt.timestamp)}</p>
  `;

  firstAttempt.answers.forEach((log, idx) => {
    const q = exam.questions.find(qq => qq.id === log.questionId);
    if (!q) return;
    const isCorrect = log.isCorrect;
    html += `<div class="review-item ${isCorrect ? 'correct' : 'wrong'}">
      <div class="review-q-head">
        <p>Q${idx + 1}. ${escapeHtml(q.question)}</p>
        <span class="badge ${isCorrect ? 'badge-green' : 'badge-red'}">${isCorrect ? '✅ Correct' : '❌ Wrong'}</span>
      </div>
      <div class="review-options">`;
    q.options.forEach((opt, oIdx) => {
      let cls = 'review-option';
      if (oIdx === q.correctAnswer) cls += ' is-correct';
      else if (oIdx === log.studentAnswer) cls += ' is-wrong-pick';
      html += `<div class="${cls}">${letters[oIdx]}. ${escapeHtml(opt)}</div>`;
    });
    html += `</div>
      <div class="review-footer">
        <span>Your answer: <strong>${log.studentAnswer !== null ? letters[log.studentAnswer] : '— (unanswered)'}</strong></span>
        <span>Correct answer: <strong>${letters[q.correctAnswer]}</strong></span>
        ${options.allowReport ? `<button class="report-link" data-qid="${q.id}">🚩 Report this question</button>` : ''}
      </div>
    </div>`;
  });

  return html;
}

function renderStudentResultPage() {
  const session = getSession();
  const exam = getData(KEYS.EXAMS, [])[0];
  if (!exam) return;
  const firstAttempt = getFirstAttempt(session.userId, exam.examId);

  document.getElementById('student-result-body').innerHTML = buildResultHtml(firstAttempt, exam, { allowReport: true });

  document.querySelectorAll('#student-result-body .report-link').forEach(btn => {
    btn.addEventListener('click', () => openReportModal(exam, Number(btn.dataset.qid)));
  });
}

/* ============================================================
   10. ATTEMPT HISTORY (student view)
============================================================= */
function renderStudentHistoryPage() {
  const session = getSession();
  const exam = getData(KEYS.EXAMS, [])[0];
  const container = document.getElementById('student-history-body');
  if (!exam) { container.innerHTML = ''; return; }

  const attempts = getData(KEYS.ATTEMPTS, [])
    .filter(a => a.studentId === session.userId && a.examId === exam.examId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (!attempts.length) {
    container.innerHTML = `<div class="empty-state"><h3>No attempts yet</h3><p>Your attempt history will appear here.</p></div>`;
    return;
  }

  container.innerHTML = attempts.map((a, idx) => `
    <div class="history-row">
      <div class="h-left">
        <span class="attempt-number">Attempt ${idx + 1}</span>
        <span>${a.score}/${a.totalQuestions} (${a.percentage}%)</span>
        <span class="muted">${formatDateTime(a.timestamp)}</span>
      </div>
      ${idx === 0 ? '<span class="badge badge-amber">Official</span>' : '<span class="badge">Not official</span>'}
    </div>
  `).join('');
}

/* ============================================================
   11. REPORT-QUESTION MODAL
============================================================= */
let reportContext = null; // { exam, question }

function openReportModal(exam, questionId) {
  const session = getSession();
  const student = findStudent(session.userId);
  const question = exam.questions.find(q => q.id === questionId);
  if (!question) return;

  reportContext = { exam, question };

  document.getElementById('report-question-preview').textContent = question.question;
  document.getElementById('report-student-name').value = student.name;
  document.getElementById('report-student-id').value = student.studentId;
  document.getElementById('report-reason').value = 'Wrong Question';
  document.getElementById('report-description').value = '';
  document.getElementById('report-modal').hidden = false;
}

function closeReportModal() {
  document.getElementById('report-modal').hidden = true;
  reportContext = null;
}

function submitReport(e) {
  e.preventDefault();
  if (!reportContext) return;

  const session = getSession();
  const student = findStudent(session.userId);
  const { exam, question } = reportContext;

  const report = {
    reportId: uid('report'),
    studentId: student.studentId,
    studentName: student.name,
    examId: exam.examId,
    examTitle: exam.title,
    questionId: question.id,
    question: question.question,
    reason: document.getElementById('report-reason').value,
    description: document.getElementById('report-description').value.trim(),
    correctAnswer: question.options[question.correctAnswer],
    date: new Date().toISOString(),
    status: 'Pending'
  };

  const reports = getData(KEYS.REPORTS, []);
  reports.push(report);
  setData(KEYS.REPORTS, reports);

  closeReportModal();
  showToast('Report submitted. A teacher will review it.', 'success');
}

/* Report button while actually taking the exam (before first submit) */
function openReportModalFromExam() {
  if (!examSession) return;
  const exam = findExam(examSession.examId);
  const q = examSession.questions[examSession.currentIndex];
  openReportModal(exam, q.id);
}

/* ============================================================
   12. TEACHER DASHBOARD + STUDENT DETAILS + REPORT MANAGEMENT
============================================================= */
function renderTeacherDashboard() {
  const students = getData(KEYS.STUDENTS, []);
  const exams = getData(KEYS.EXAMS, []);
  const attempts = getData(KEYS.ATTEMPTS, []);
  const firstAttempts = getData(KEYS.FIRST_ATTEMPTS, []);
  const reports = getData(KEYS.REPORTS, []);

  document.getElementById('t-stat-students').textContent = students.length;
  document.getElementById('t-stat-exams').textContent = exams.length;
  document.getElementById('t-stat-attempts').textContent = attempts.length;
  document.getElementById('t-stat-pending').textContent = reports.filter(r => r.status === 'Pending').length;

  const tbody = document.getElementById('teacher-student-table');
  tbody.innerHTML = '';

  // One row per student × exam combination that has at least one attempt,
  // plus a "Not Attempted" row for exams a student hasn't touched.
  students.forEach(student => {
    exams.forEach(exam => {
      const studentAttempts = attempts.filter(a => a.studentId === student.studentId && a.examId === exam.examId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const first = firstAttempts.find(f => f.studentId === student.studentId && f.examId === exam.examId);

      let status = 'Not Attempted';
      if (studentAttempts.length === 1) status = 'Attempted';
      if (studentAttempts.length > 1) status = 'Completed';

      const lastAttempt = studentAttempts[studentAttempts.length - 1];

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(student.studentId)}</td>
        <td>${escapeHtml(exam.title)}</td>
        <td>${first ? `${first.score}/${first.totalQuestions}` : '—'}</td>
        <td>${first ? first.percentage + '%' : '—'}</td>
        <td>${studentAttempts.length}</td>
        <td>${first ? formatDateTime(first.timestamp) : '—'}</td>
        <td>${lastAttempt ? formatDateTime(lastAttempt.timestamp) : '—'}</td>
        <td><span class="badge ${status === 'Not Attempted' ? '' : status === 'Completed' ? 'badge-green' : 'badge-amber'}">${status}</span></td>
        <td>${first ? '<button class="btn btn-secondary view-result-btn">View Result</button>' : '—'}</td>
      `;
      const viewBtn = tr.querySelector('.view-result-btn');
      if (viewBtn) {
        viewBtn.addEventListener('click', () => showView('teacher-student-details', { studentId: student.studentId, examId: exam.examId }));
      }
      tbody.appendChild(tr);
    });
  });
}

function renderTeacherStudentDetails(studentId, examId) {
  const student = findStudent(studentId);
  const exam = findExam(examId);
  if (!student || !exam) return;

  const firstAttempt = getFirstAttempt(studentId, examId);
  const attempts = getData(KEYS.ATTEMPTS, [])
    .filter(a => a.studentId === studentId && a.examId === examId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const reports = getData(KEYS.REPORTS, []).filter(r => r.studentId === studentId && r.examId === examId);

  document.getElementById('details-heading').textContent = `${student.name} — ${exam.title}`;

  let html = `
    <div class="detail-block">
      <div class="kv-grid">
        <div class="kv-item"><div class="kv-label">Official First Attempt</div><div class="kv-value">${firstAttempt ? firstAttempt.score + '/' + firstAttempt.totalQuestions : '—'}</div></div>
        <div class="kv-item"><div class="kv-label">Percentage</div><div class="kv-value">${firstAttempt ? firstAttempt.percentage + '%' : '—'}</div></div>
        <div class="kv-item"><div class="kv-label">Total Attempts</div><div class="kv-value">${attempts.length}</div></div>
      </div>
    </div>

    <div class="detail-block">
      <h3>First Attempt — Question Review</h3>
      ${buildResultHtml(firstAttempt, exam, { allowReport: false })}
    </div>

    <div class="detail-block">
      <h3>Attempt History</h3>
      ${attempts.map((a, idx) => `
        <div class="history-row">
          <div class="h-left">
            <span class="attempt-number">Attempt ${idx + 1}</span>
            <span>${a.score}/${a.totalQuestions} (${a.percentage}%)</span>
            <span class="muted">${formatDateTime(a.timestamp)}</span>
          </div>
          ${idx === 0 ? '<span class="badge badge-amber">Official</span>' : '<span class="badge">Not official</span>'}
        </div>
      `).join('') || '<p class="muted">No attempts yet.</p>'}
    </div>

    <div class="detail-block">
      <h3>Reported Questions</h3>
      ${reports.length ? reports.map(r => `
        <div class="history-row">
          <div class="h-left">
            <span>${escapeHtml(r.question)}</span>
            <span class="muted">${escapeHtml(r.reason)}</span>
          </div>
          <span class="badge ${r.status === 'Resolved' ? 'badge-green' : r.status === 'Reviewed' ? 'badge-amber' : ''}">${r.status}</span>
        </div>
      `).join('') : '<p class="muted">No reports for this exam.</p>'}
    </div>
  `;

  document.getElementById('teacher-details-body').innerHTML = html;
}

function renderTeacherReports() {
  const reports = getData(KEYS.REPORTS, []).sort((a, b) => new Date(b.date) - new Date(a.date));
  const tbody = document.getElementById('teacher-reports-table');
  tbody.innerHTML = '';

  if (!reports.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="muted" style="text-align:center;padding:24px;">No questions have been reported yet.</td></tr>`;
    return;
  }

  reports.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(r.studentName)} (${escapeHtml(r.studentId)})</td>
      <td>${escapeHtml(r.examTitle || '')}</td>
      <td>${escapeHtml(r.question)}</td>
      <td>${escapeHtml(r.reason)}</td>
      <td>${escapeHtml(r.description)}</td>
      <td>${escapeHtml(r.correctAnswer)}</td>
      <td>${formatDateTime(r.date)}</td>
      <td></td>
    `;
    const statusTd = tr.lastElementChild;
    const select = document.createElement('select');
    ['Pending', 'Reviewed', 'Resolved'].forEach(status => {
      const opt = document.createElement('option');
      opt.value = status;
      opt.textContent = status;
      if (status === r.status) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => updateReportStatus(r.reportId, select.value));
    statusTd.appendChild(select);
    tbody.appendChild(tr);
  });
}

function updateReportStatus(reportId, newStatus) {
  const reports = getData(KEYS.REPORTS, []);
  const report = reports.find(r => r.reportId === reportId);
  if (!report) return;
  report.status = newStatus;
  setData(KEYS.REPORTS, reports);
  showToast('Report status updated.', 'success');
  renderTeacherDashboard(); // pending count may have changed
}

/* ============================================================
   13. INIT / EVENT WIRING
============================================================= */
document.addEventListener('DOMContentLoaded', () => {
  seedDemoDataIfNeeded();

  // --- Login role tabs ---
  document.querySelectorAll('.role-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.role-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const role = tab.dataset.role;
      document.getElementById('id-label').textContent = role === 'student' ? 'Student ID' : 'Teacher ID';
      document.getElementById('login-id').placeholder = role === 'student' ? 'e.g. student01' : 'e.g. teacher01';
      document.getElementById('demo-hint-text').textContent = role === 'student' ? 'student01 / 123456' : 'teacher01 / 123456';
      document.getElementById('login-error').hidden = true;
    });
  });

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // --- Sidebar nav links (event delegation on both nav lists) ---
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.target));
  });
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.target));
  });

  // --- Mobile sidebar toggle ---
  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('show');
  });
  document.getElementById('sidebar-overlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
  });

  // --- Exam controls ---
  document.getElementById('prev-btn').addEventListener('click', goPrevQuestion);
  document.getElementById('next-btn').addEventListener('click', goNextQuestion);
  document.getElementById('submit-exam-btn').addEventListener('click', submitExam);
  document.getElementById('report-open-btn').addEventListener('click', openReportModalFromExam);

  // --- Report modal ---
  document.getElementById('report-form').addEventListener('submit', submitReport);
  document.getElementById('report-close-btn').addEventListener('click', closeReportModal);
  document.getElementById('report-cancel-btn').addEventListener('click', closeReportModal);
  document.getElementById('report-modal').addEventListener('click', (e) => {
    if (e.target.id === 'report-modal') closeReportModal();
  });

  restoreSessionOnLoad();
});
