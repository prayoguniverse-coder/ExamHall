/* =========================================================
   EXAMHALL
   Supabase + Vanilla JavaScript
   ========================================================= */

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;
let currentProfile = null;

let currentExam = null;
let currentExamQuestions = [];
let currentQuestionIndex = 0;

let examAnswers = {};
let examTimerInterval = null;
let remainingSeconds = 0;

let lastAttempt = null;
let lastAttemptReview = [];

let questionBuilder = [];


/* =========================================================
   DOM HELPER
   ========================================================= */

const $ = (id) => document.getElementById(id);

function show(id) {
  $(id)?.classList.remove("hidden");
}

function hide(id) {
  $(id)?.classList.add("hidden");
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  setupAuthEvents();
  setupNavigation();
  setupStudentEvents();
  setupTeacherEvents();
  setupExamEvents();

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session?.user) {
    await loadApplication(session.user);
  }
});


/* =========================================================
   AUTH
   ========================================================= */

function setupAuthEvents() {

  $("loginTab")?.addEventListener("click", () => {

    $("loginTab").classList.add("active");
    $("signupTab").classList.remove("active");

    show("loginForm");
    hide("signupForm");

  });


  $("signupTab")?.addEventListener("click", () => {

    $("signupTab").classList.add("active");
    $("loginTab").classList.remove("active");

    hide("loginForm");
    show("signupForm");

  });


  $("loginForm")?.addEventListener(
    "submit",
    handleLogin
  );


  $("signupForm")?.addEventListener(
    "submit",
    handleSignup
  );


  $("logoutBtn")?.addEventListener(
    "click",
    logout
  );
}


async function handleLogin(event) {

  event.preventDefault();

  $("loginError").textContent = "";

  const email =
    $("loginEmail").value.trim();

  const password =
    $("loginPassword").value;


  const {
    data,
    error
  } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });


  if (error) {

    $("loginError").textContent =
      error.message;

    return;
  }


  await loadApplication(data.user);
}


async function handleSignup(event) {

  event.preventDefault();

  $("signupError").textContent = "";
  $("signupSuccess").textContent = "";

  const name =
    $("signupName").value.trim();

  const email =
    $("signupEmail").value.trim();

  const password =
    $("signupPassword").value;

  const confirmPassword =
    $("signupConfirmPassword").value;


  if (password !== confirmPassword) {

    $("signupError").textContent =
      "Passwords do not match.";

    return;
  }


  const {
    data,
    error
  } = await supabaseClient.auth.signUp({

    email,
    password,

    options: {
      data: {
        full_name: name,
        role: "student"
      }
    }

  });


  if (error) {

    $("signupError").textContent =
      error.message;

    return;
  }


  if (!data.user) {

    $("signupError").textContent =
      "Account creation failed.";

    return;
  }


  const {
    error: profileError
  } = await supabaseClient
    .from("profiles")
    .insert({

      id: data.user.id,
      full_name: name,
      email,
      role: "student"

    });


  if (profileError) {

    console.error(profileError);

    $("signupError").textContent =
      "Account created, but profile setup failed.";

    return;
  }


  $("signupSuccess").textContent =
    "Student account created successfully. You can now login.";

  $("signupForm").reset();
}


/* =========================================================
   LOAD APPLICATION
   ========================================================= */

async function loadApplication(user) {

  currentUser = user;


  let {
    data: profile,
    error
  } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();


  if (error || !profile) {

    const name =
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User";


    const { data: createdProfile } =
      await supabaseClient
        .from("profiles")
        .insert({

          id: user.id,
          full_name: name,
          email: user.email,
          role: "student"

        })
        .select()
        .single();


    profile = createdProfile;
  }


  currentProfile = profile;


  updateUserUI();

  hide("loginPage");
  show("app");


  if (currentProfile.role === "teacher") {

    showTeacherInterface();
    await loadTeacherDashboard();

  } else {

    showStudentInterface();
    await loadStudentDashboard();

  }
}


function updateUserUI() {

  const name =
    currentProfile?.full_name ||
    currentUser?.email ||
    "User";

  $("userName").textContent = name;

  $("userRole").textContent =
    currentProfile?.role === "teacher"
      ? "Teacher"
      : "Student";

  $("userAvatar").textContent =
    name.charAt(0).toUpperCase();

  $("studentWelcome").textContent =
    name;
}


function showStudentInterface() {

  show("studentMenu");
  hide("teacherMenu");

  showPage("studentDashboard");
}


function showTeacherInterface() {

  hide("studentMenu");
  show("teacherMenu");

  showPage("teacherDashboard");
}


async function logout() {

  stopTimer();

  await supabaseClient.auth.signOut();

  currentUser = null;
  currentProfile = null;

  hide("app");
  show("loginPage");

  $("loginForm").reset();
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

  document.querySelectorAll(".menu-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const page =
            button.dataset.page;

          showPage(page);

          if (page === "studentDashboard")
            await loadStudentDashboard();

          if (page === "studentResults")
            await loadStudentResults();

          if (page === "studentHistory")
            await loadStudentHistory();

          if (page === "studentProgress")
            await loadStudentProgress();

          if (page === "teacherDashboard")
            await loadTeacherDashboard();

          if (page === "manageSubjects")
            await loadSubjects();

          if (page === "createExam")
            await prepareCreateExam();

          if (page === "questionBank")
            await loadQuestionBank();

          if (page === "teacherScores")
            await loadTeacherScores();

        }
      );

    });
}


function showPage(pageId) {

  document.querySelectorAll(".page")
    .forEach(page =>
      page.classList.add("hidden")
    );

  const page = $(pageId);

  if (page)
    page.classList.remove("hidden");


  document.querySelectorAll(".menu-btn")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === pageId
      );

    });
}


/* =========================================================
   STUDENT DASHBOARD
   ========================================================= */

async function loadStudentDashboard() {

  const {
    data: exams,
    error
  } = await supabaseClient
    .from("exams")
    .select(`
      *,
      subjects(name)
    `)
    .eq("published", true)
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    $("examList").innerHTML =
      `<p class="error-message">
        Unable to load exams.
      </p>`;

    return;
  }


  const {
    data: attempts
  } = await supabaseClient
    .from("attempts")
    .select("*")
    .eq("student_id", currentUser.id);


  const official =
    attempts || [];


  $("availableExams").textContent =
    exams?.length || 0;

  $("attemptCount").textContent =
    official.length;


  const scores =
    official.map(a => Number(a.percentage));


  const average =
    scores.length
      ? scores.reduce((a,b) => a+b, 0) / scores.length
      : 0;

  const best =
    scores.length
      ? Math.max(...scores)
      : 0;


  $("averageScore").textContent =
    `${average.toFixed(1)}%`;

  $("bestScore").textContent =
    `${best.toFixed(1)}%`;


  renderExamList(exams || []);
}


function renderExamList(exams) {

  if (!exams.length) {

    $("examList").innerHTML =
      `<p>No examinations are currently available.</p>`;

    return;
  }


  $("examList").innerHTML =
    exams.map(exam => `

      <div class="exam-item">

        <div>

          <h4>
            ${escapeHTML(exam.title)}
          </h4>

          <p class="exam-meta">

            ${escapeHTML(
              exam.subjects?.name || "Subject"
            )}

            · ${exam.duration} minutes
            · ${exam.total_marks} marks
            · Max ${exam.max_attempts} attempts

          </p>

          <p style="margin-top:7px;color:#64748b;font-size:13px">

            ${escapeHTML(
              exam.description || ""
            )}

          </p>

        </div>

        <div class="exam-actions">

          <button
            class="primary-btn"
            onclick="startExam('${exam.id}')"
          >
            Start Exam
          </button>

        </div>

      </div>

    `).join("");
}


/* =========================================================
   START EXAM
   ========================================================= */

async function startExam(examId) {

  const {
    data: exam,
    error
  } = await supabaseClient
    .from("exams")
    .select(`
      *,
      subjects(name)
    `)
    .eq("id", examId)
    .single();


  if (error || !exam) {

    alert("Unable to load exam.");
    return;
  }


  const {
    data: attempts
  } = await supabaseClient
    .from("attempts")
    .select("id,attempt_number")
    .eq("exam_id", examId)
    .eq("student_id", currentUser.id);


  if ((attempts?.length || 0) >= exam.max_attempts) {

    alert(
      `You have already used all ${exam.max_attempts} attempts.`
    );

    return;
  }


  const {
    data: links,
    error: linkError
  } = await supabaseClient
    .from("exam_questions")
    .select(`
      question_order,
      questions(*)
    `)
    .eq("exam_id", examId)
    .order("question_order");


  if (linkError) {

    console.error(linkError);
    alert("Unable to load questions.");
    return;
  }


  let questions =
    (links || [])
      .map(item => item.questions)
      .filter(Boolean);


  if (!questions.length) {

    alert("This exam has no questions.");
    return;
  }


  if (exam.randomize_questions) {

    questions =
      shuffleArray(questions);
  }


  currentExam = exam;
  currentExamQuestions = questions;
  currentQuestionIndex = 0;
  examAnswers = {};


  remainingSeconds =
    Number(exam.duration || 30) * 60;


  $("runningExamTitle").textContent =
    exam.title;


  showPage("examPage");

  renderCurrentQuestion();
  renderQuestionNavigation();
  startTimer();
}


/* =========================================================
   QUESTION RENDERING
   ========================================================= */

function renderCurrentQuestion() {

  const question =
    currentExamQuestions[
      currentQuestionIndex
    ];


  if (!question)
    return;


  $("questionNumber").textContent =
    `${currentQuestionIndex + 1} / ${currentExamQuestions.length}`;


  $("runningQuestionText").textContent =
    question.question_text;


  const options = [

    ["A", question.option_a],
    ["B", question.option_b],
    ["C", question.option_c],
    ["D", question.option_d]

  ].filter(item => item[1]);


  let displayOptions =
    [...options];


  if (currentExam.randomize_options)
    displayOptions =
      shuffleArray(displayOptions);


  const selected =
    examAnswers[question.id];


  $("runningOptions").innerHTML =
    displayOptions.map(([key, text]) => `

      <label class="
        exam-option
        ${selected === key ? "selected" : ""}
      ">

        <input
          type="radio"
          name="currentAnswer"
          value="${key}"
          ${selected === key ? "checked" : ""}
        >

        <strong>${key}.</strong>

        <span>
          ${escapeHTML(text)}
        </span>

      </label>

    `).join("");


  document
    .querySelectorAll(
      'input[name="currentAnswer"]'
    )
    .forEach(input => {

      input.addEventListener(
        "change",
        () => {

          examAnswers[question.id] =
            input.value;

          renderCurrentQuestion();
          renderQuestionNavigation();

        }
      );

    });


  $("previousBtn").disabled =
    currentQuestionIndex === 0;


  if (
    currentQuestionIndex ===
    currentExamQuestions.length - 1
  ) {

    hide("nextBtn");
    show("submitBtn");

  } else {

    show("nextBtn");
    hide("submitBtn");

  }
}


function renderQuestionNavigation() {

  $("questionNavigation").innerHTML =
    currentExamQuestions.map(
      (question, index) => {

        const answered =
          examAnswers[question.id];

        return `

          <button
            class="
              question-nav-btn
              ${index === currentQuestionIndex ? "current" : ""}
              ${answered ? "answered" : ""}
            "
            onclick="jumpToQuestion(${index})"
          >
            ${index + 1}
          </button>

        `;

      }
    ).join("");
}


function jumpToQuestion(index) {

  currentQuestionIndex = index;

  renderCurrentQuestion();
  renderQuestionNavigation();
}


/* =========================================================
   EXAM CONTROLS
   ========================================================= */

function setupExamEvents() {

  $("previousBtn")?.addEventListener(
    "click",
    () => {

      if (currentQuestionIndex > 0) {

        currentQuestionIndex--;

        renderCurrentQuestion();
        renderQuestionNavigation();

      }

    }
  );


  $("nextBtn")?.addEventListener(
    "click",
    () => {

      if (
        currentQuestionIndex <
        currentExamQuestions.length - 1
      ) {

        currentQuestionIndex++;

        renderCurrentQuestion();
        renderQuestionNavigation();

      }

    }
  );


  $("submitBtn")?.addEventListener(
    "click",
    () => submitExam(false)
  );


  $("resultReviewBtn")?.addEventListener(
    "click",
    showReview
  );


  $("resultReexamBtn")?.addEventListener(
    "click",
    () => {

      if (currentExam)
        startExam(currentExam.id);

    }
  );


  $("backToDashboardBtn")?.addEventListener(
    "click",
    () => {

      showPage("studentDashboard");
      loadStudentDashboard();

    }
  );


  $("reviewBackBtn")?.addEventListener(
    "click",
    () => {

      if (lastAttempt)
        showPage("resultPage");
      else
        showPage("studentDashboard");

    }
  );
}


/* =========================================================
   TIMER
   ========================================================= */

function startTimer() {

  stopTimer();

  updateTimerDisplay();


  examTimerInterval =
    setInterval(() => {

      remainingSeconds--;

      updateTimerDisplay();


      if (remainingSeconds <= 0) {

        stopTimer();

        submitExam(true);

      }

    }, 1000);
}


function stopTimer() {

  if (examTimerInterval) {

    clearInterval(
      examTimerInterval
    );

    examTimerInterval = null;
  }
}


function updateTimerDisplay() {

  const minutes =
    Math.floor(
      remainingSeconds / 60
    );

  const seconds =
    remainingSeconds % 60;


  $("examTimer").textContent =
    `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
}


/* =========================================================
   SUBMIT EXAM
   ========================================================= */

async function submitExam(autoSubmitted = false) {

  if (!currentExam)
    return;


  if (!autoSubmitted) {

    const unanswered =
      currentExamQuestions.filter(
        q => !examAnswers[q.id]
      ).length;


    if (unanswered > 0) {

      const confirmed =
        confirm(
          `You have ${unanswered} unanswered question(s). Submit anyway?`
        );

      if (!confirmed)
        return;
    }


    const confirmed =
      confirm("Submit this examination?");

    if (!confirmed)
      return;
  }


  stopTimer();


  let score = 0;
  let correct = 0;
  let totalMarks = 0;


  const review = [];


  currentExamQuestions.forEach(
    question => {

      const marks =
        Number(question.marks || 1);

      totalMarks += marks;


      const userAnswer =
        examAnswers[question.id] || null;


      const correctAnswer =
        question.correct_answer;


      const isCorrect =
        userAnswer === correctAnswer;


      if (isCorrect) {

        score += marks;
        correct++;

      }


      review.push({

        question,
        userAnswer,
        correctAnswer,
        isCorrect

      });

    }
  );


  const percentage =
    totalMarks > 0
      ? (score / totalMarks) * 100
      : 0;


  const passed =
    percentage >=
    Number(
      currentExam.passing_percentage || 40
    );


  const {
    data: previousAttempts
  } = await supabaseClient
    .from("attempts")
    .select("attempt_number")
    .eq("exam_id", currentExam.id)
    .eq("student_id", currentUser.id)
    .order("attempt_number", {
      ascending: false
    })
    .limit(1);


  const attemptNumber =
    previousAttempts?.length
      ? Number(
          previousAttempts[0].attempt_number
        ) + 1
      : 1;


  const {
    data: attempt,
    error
  } = await supabaseClient
    .from("attempts")
    .insert({

      exam_id: currentExam.id,
      student_id: currentUser.id,

      attempt_number: attemptNumber,

      score,
      percentage,

      correct_answers: correct,
      total_questions:
        currentExamQuestions.length,

      passed,

      submitted_at:
        new Date().toISOString(),

      answers: examAnswers

    })
    .select()
    .single();


  if (error) {

    console.error(error);

    alert(
      "Unable to save your result."
    );

    return;
  }


  lastAttempt = attempt;
  lastAttemptReview = review;


  showResultPage(
    attempt,
    score,
    percentage,
    correct,
    passed,
    autoSubmitted
  );
}


/* =========================================================
   RESULT
   ========================================================= */

function showResultPage(
  attempt,
  score,
  percentage,
  correct,
  passed,
  autoSubmitted
) {

  $("resultExamName").textContent =
    currentExam.title;

  $("resultScore").textContent =
    `${score} / ${currentExam.total_marks}`;

  $("resultPercentage").textContent =
    `${percentage.toFixed(1)}%`;

  $("resultCorrect").textContent =
    `${correct} / ${currentExamQuestions.length}`;

  $("resultPassed").textContent =
    passed ? "PASSED" : "FAILED";


  $("resultPassed").style.color =
    passed
      ? "var(--success)"
      : "var(--danger)";


  $("resultDetails").innerHTML = `

    <div class="result-item">

      <strong>
        ${passed
          ? "🎉 Congratulations!"
          : "Keep practicing!"}
      </strong>

      <p style="margin-top:8px;color:#64748b">

        ${autoSubmitted
          ? "The examination was automatically submitted because the timer expired."
          : "Your examination has been submitted successfully."}

      </p>

    </div>

  `;


  if (
    currentExam.show_result_immediately
  ) {

    show("resultReviewBtn");

  } else {

    hide("resultReviewBtn");

  }


  showPage("resultPage");
}


/* =========================================================
   REVIEW
   ========================================================= */

function showReview() {

  $("reviewExamName").textContent =
    currentExam.title;


  $("reviewList").innerHTML =
    lastAttemptReview.map(
      (item, index) => {

        const q =
          item.question;


        const options = [

          ["A", q.option_a],
          ["B", q.option_b],
          ["C", q.option_c],
          ["D", q.option_d]

        ].filter(x => x[1]);


        return `

          <div class="review-item">

            <div class="review-question">

              ${index + 1}.
              ${escapeHTML(
                q.question_text
              )}

            </div>


            ${options.map(
              ([key,text]) => `

                <div class="
                  review-answer
                  ${
                    key === item.correctAnswer
                      ? "answer-correct"
                      : key === item.userAnswer
                        ? "answer-wrong"
                        : "answer-neutral"
                  }
                ">

                  <strong>${key}.</strong>
                  ${escapeHTML(text)}

                  ${
                    key === item.correctAnswer
                      ? " ✓ Correct Answer"
                      : ""
                  }

                  ${
                    key === item.userAnswer &&
                    key !== item.correctAnswer
                      ? " ✗ Your Answer"
                      : ""
                  }

                </div>

              `
            ).join("")}


            ${
              currentExam.show_explanations &&
              q.explanation
                ? `
                  <div class="explanation">

                    <strong>Explanation:</strong>

                    ${escapeHTML(
                      q.explanation
                    )}

                  </div>
                `
                : ""
            }

          </div>

        `;

      }
    ).join("");


  showPage("reviewPage");
}


/* =========================================================
   STUDENT RESULTS
   ========================================================= */

async function loadStudentResults() {

  const {
    data: attempts,
    error
  } = await supabaseClient
    .from("attempts")
    .select(`
      *,
      exams(title)
    `)
    .eq("student_id", currentUser.id)
    .order("submitted_at", {
      ascending: false
    });


  if (error) {

    console.error(error);
    return;
  }


  if (!attempts?.length) {

    $("myResults").innerHTML =
      "<p>No results yet.</p>";

    return;
  }


  $("myResults").innerHTML =
    attempts.map(a => `

      <div class="result-item">

        <h4>
          ${escapeHTML(
            a.exams?.title || "Exam"
          )}
        </h4>

        <p style="color:#64748b;margin-top:6px">

          Attempt ${a.attempt_number}
          · Score ${a.score}
          · ${Number(a.percentage).toFixed(1)}%
          · ${a.passed ? "Passed" : "Failed"}

        </p>

        <small style="color:#94a3b8">

          ${a.submitted_at
            ? new Date(
                a.submitted_at
              ).toLocaleString()
            : ""}

        </small>

      </div>

    `).join("");
}


/* =========================================================
   STUDENT HISTORY
   ========================================================= */

async function loadStudentHistory() {

  const {
    data: attempts
  } = await supabaseClient
    .from("attempts")
    .select(`
      *,
      exams(title,description)
    `)
    .eq("student_id", currentUser.id)
    .order("submitted_at", {
      ascending: false
    });


  if (!attempts?.length) {

    $("historyList").innerHTML =
      "<p>No examination history.</p>";

    return;
  }


  $("historyList").innerHTML =
    attempts.map(a => `

      <div class="history-item">

        <h4>
          ${escapeHTML(
            a.exams?.title || "Exam"
          )}
        </h4>

        <p style="color:#64748b;margin:6px 0">

          Attempt ${a.attempt_number}
          · ${Number(a.percentage).toFixed(1)}%
          · ${a.passed ? "Passed" : "Failed"}

        </p>

        <button
          class="secondary-btn"
          onclick="openHistoricalAttempt('${a.id}')"
        >
          View Attempt
        </button>

      </div>

    `).join("");
}


async function openHistoricalAttempt(attemptId) {

  const {
    data: attempt
  } = await supabaseClient
    .from("attempts")
    .select(`
      *,
      exams(*)
    `)
    .eq("id", attemptId)
    .single();


  if (!attempt)
    return;


  const {
    data: links
  } = await supabaseClient
    .from("exam_questions")
    .select(`
      question_order,
      questions(*)
    `)
    .eq("exam_id", attempt.exam_id)
    .order("question_order");


  currentExam =
    attempt.exams;

  currentExamQuestions =
    (links || [])
      .map(x => x.questions)
      .filter(Boolean);

  lastAttempt = attempt;

  examAnswers =
    attempt.answers || {};


  lastAttemptReview =
    currentExamQuestions.map(q => {

      const userAnswer =
        examAnswers[q.id] || null;

      return {

        question: q,
        userAnswer,
        correctAnswer:
          q.correct_answer,

        isCorrect:
          userAnswer ===
          q.correct_answer

      };

    });


  showReview();
}


/* =========================================================
   STUDENT PROGRESS
   ========================================================= */

async function loadStudentProgress() {

  const {
    data: attempts
  } = await supabaseClient
    .from("attempts")
    .select(`
      *,
      exams(title)
    `)
    .eq("student_id", currentUser.id);


  const data =
    attempts || [];


  const scores =
    data.map(
      a => Number(a.percentage)
    );


  const average =
    scores.length
      ? scores.reduce((a,b) => a+b,0) /
        scores.length
      : 0;


  const best =
    scores.length
      ? Math.max(...scores)
      : 0;


  $("progressExams").textContent =
    data.length;

  $("progressOfficial").textContent =
    data.length;

  $("progressAverage").textContent =
    `${average.toFixed(1)}%`;

  $("progressBest").textContent =
    `${best.toFixed(1)}%`;


  if (!data.length) {

    $("progressDetails").innerHTML =
      "<p>No performance data available.</p>";

    return;
  }


  $("progressDetails").innerHTML =
    data.map(a => `

      <div class="result-item">

        <strong>
          ${escapeHTML(
            a.exams?.title || "Exam"
          )}
        </strong>

        <p style="margin-top:6px;color:#64748b">

          ${Number(a.percentage).toFixed(1)}%
          · ${a.passed ? "Passed" : "Failed"}

        </p>

      </div>

    `).join("");
}


/* =========================================================
   TEACHER DASHBOARD
   ========================================================= */

async function loadTeacherDashboard() {

  if (currentProfile?.role !== "teacher")
    return;


  const {
    data: exams
  } = await supabaseClient
    .from("exams")
    .select("*")
    .eq("teacher_id", currentUser.id);


  const {
    data: attempts
  } = await supabaseClient
    .from("attempts")
    .select("*");


  const teacherExams =
    exams || [];


  const examIds =
    teacherExams.map(e => e.id);


  const teacherAttempts =
    (attempts || []).filter(
      a => examIds.includes(a.exam_id)
    );


  const students =
    new Set(
      teacherAttempts.map(
        a => a.student_id
      )
    );


  const scores =
    teacherAttempts.map(
      a => Number(a.percentage)
    );


  const average =
    scores.length
      ? scores.reduce((a,b)=>a+b,0) /
        scores.length
      : 0;


  $("teacherExamCount").textContent =
    teacherExams.length;

  $("teacherAttemptCount").textContent =
    teacherAttempts.length;

  $("teacherStudentCount").textContent =
    students.size;

  $("teacherAverage").textContent =
    `${average.toFixed(1)}%`;


  $("teacherExamList").innerHTML =
    teacherExams.length

      ? teacherExams.map(e => `

          <div class="exam-item">

            <div>

              <h4>
                ${escapeHTML(e.title)}
              </h4>

              <p class="exam-meta">

                ${e.duration} minutes
                · ${e.total_marks} marks
                · ${e.published
                  ? "Published"
                  : "Draft"}

              </p>

            </div>

          </div>

        `).join("")

      : "<p>No exams created yet.</p>";
}


/* =========================================================
   SUBJECT MANAGEMENT
   ========================================================= */

async function loadSubjects() {

  const {
    data: subjects,
    error
  } = await supabaseClient
    .from("subjects")
    .select("*")
    .order("name");


  if (error) {

    console.error(error);
    return;
  }


  $("subjectCount").textContent =
    `${subjects.length} Subject${subjects.length === 1 ? "" : "s"}`;


  if (!subjects.length) {

    $("subjectList").innerHTML =
      "<p>No subjects available.</p>";

    return;
  }


  $("subjectList").innerHTML =
    subjects.map(s => `

      <div class="subject-item">

        <div>

          <strong>
            ${escapeHTML(s.name)}
          </strong>

          <small>
            Added ${new Date(
              s.created_at
            ).toLocaleDateString()}
          </small>

        </div>

        ${
          s.teacher_id === currentUser.id
            ? `
              <button
                class="danger-btn"
                onclick="deleteSubject('${s.id}')"
              >
                Delete
              </button>
            `
            : ""
        }

      </div>

    `).join("");


  populateSubjectSelects(
    subjects
  );
}


function setupTeacherEvents() {

  $("subjectForm")?.addEventListener(
    "submit",
    addSubject
  );


  $("questionForm")?.addEventListener(
    "submit",
    addQuestion
  );


  $("examForm")?.addEventListener(
    "change",
    () => {}
  );
}


async function addSubject(event) {

  event.preventDefault();

  const name =
    $("subjectNameInput")
      .value.trim();


  if (!name)
    return;


  const {
    error
  } = await supabaseClient
    .from("subjects")
    .insert({

      name,
      teacher_id:
        currentUser.id

    });


  if (error) {

    $("subjectMessage").textContent =
      error.message;

    return;
  }


  $("subjectMessage").textContent =
    "Subject added successfully.";

  $("subjectNameInput").value = "";

  await loadSubjects();
}


async function deleteSubject(id) {

  if (!confirm(
    "Delete this subject?"
  ))
    return;


  const {
    error
  } = await supabaseClient
    .from("subjects")
    .delete()
    .eq("id", id)
    .eq(
      "teacher_id",
      currentUser.id
    );


  if (error) {

    alert(error.message);
    return;
  }


  await loadSubjects();
}


function populateSubjectSelects(
  subjects
) {

  const selects = [
    $("examSubject"),
    $("qSubject")
  ];


  selects.forEach(select => {

    if (!select)
      return;


    const current =
      select.value;


    select.innerHTML =
      `<option value="">
        Select Subject
      </option>`;


    subjects.forEach(s => {

      select.innerHTML += `

        <option value="${s.id}">
          ${escapeHTML(s.name)}
        </option>

      `;

    });


    select.value = current;

  });
}


/* =========================================================
   CREATE EXAM
   ========================================================= */

async function prepareCreateExam() {

  questionBuilder = [];

  $("questionBuilder").innerHTML = "";

  await loadSubjects();

  await loadTeacherQuestions();

  $("examForm").reset();

  $("examDuration").value = 30;
  $("examTotalMarks").value = 10;
  $("examPassing").value = 40;
  $("examMaxAttempts").value = 3;
  $("showResultImmediately").checked = true;
  $("showExplanations").checked = true;
}


function addQuestionBuilder() {

  const index =
    questionBuilder.length;

  questionBuilder.push({

    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    marks: 1,
    explanation: ""

  });


  renderQuestionBuilder();
}


function renderQuestionBuilder() {

  $("questionBuilder").innerHTML =
    questionBuilder.map(
      (q,index) => `

        <div class="question-builder-card">

          <div class="question-builder-top">

            <strong>
              Question ${index + 1}
            </strong>

            <button
              type="button"
              class="remove-question"
              onclick="removeQuestionBuilder(${index})"
            >
              Remove
            </button>

          </div>


          <div class="form-grid">

            <div class="form-group full">

              <label>
                Question
              </label>

              <textarea
                rows="3"
                data-q="${index}"
                data-field="question_text"
                class="builder-field"
                placeholder="Enter question"
              >${escapeHTML(q.question_text)}</textarea>

            </div>


            <div class="form-group">

              <label>Option A</label>

              <input
                value="${escapeHTML(q.option_a)}"
                data-q="${index}"
                data-field="option_a"
                class="builder-field"
              >

            </div>


            <div class="form-group">

              <label>Option B</label>

              <input
                value="${escapeHTML(q.option_b)}"
                data-q="${index}"
                data-field="option_b"
                class="builder-field"
              >

            </div>


            <div class="form-group">

              <label>Option C</label>

              <input
                value="${escapeHTML(q.option_c)}"
                data-q="${index}"
                data-field="option_c"
                class="builder-field"
              >

            </div>


            <div class="form-group">

              <label>Option D</label>

              <input
                value="${escapeHTML(q.option_d)}"
                data-q="${index}"
                data-field="option_d"
                class="builder-field"
              >

            </div>


            <div class="form-group">

              <label>
                Correct Answer
              </label>

              <select
                data-q="${index}"
                data-field="correct_answer"
                class="builder-field"
              >

                ${["A","B","C","D"].map(
                  letter => `

                    <option
                      value="${letter}"
                      ${q.correct_answer === letter ? "selected" : ""}
                    >
                      ${letter}
                    </option>

                  `
                ).join("")}

              </select>

            </div>


            <div class="form-group">

              <label>
                Marks
              </label>

              <input
                type="number"
                min="1"
                value="${q.marks}"
                data-q="${index}"
                data-field="marks"
                class="builder-field"
              >

            </div>


            <div class="form-group full">

              <label>
                Explanation
              </label>

              <textarea
                rows="2"
                data-q="${index}"
                data-field="explanation"
                class="builder-field"
              >${escapeHTML(q.explanation)}</textarea>

            </div>

          </div>

        </div>

      `
    ).join("");


  document.querySelectorAll(
    ".builder-field"
  ).forEach(field => {

    field.addEventListener(
      "input",
      updateQuestionBuilder
    );

    field.addEventListener(
      "change",
      updateQuestionBuilder
    );

  });
}


function updateQuestionBuilder(event) {

  const field =
    event.target;

  const index =
    Number(field.dataset.q);

  const property =
    field.dataset.field;


  questionBuilder[index][property] =
    field.value;
}


function removeQuestionBuilder(index) {

  questionBuilder.splice(
    index,
    1
  );

  renderQuestionBuilder();
}


async function saveExam() {

  $("examFormMessage").textContent = "";


  if (!questionBuilder.length) {

    $("examFormMessage").textContent =
      "Add at least one question.";

    return;
  }


  for (const q of questionBuilder) {

    if (
      !q.question_text.trim() ||
      !q.option_a.trim() ||
      !q.option_b.trim()
    ) {

      $("examFormMessage").textContent =
        "Every question needs text and at least options A and B.";

      return;
    }
  }


  const examData = {

    teacher_id:
      currentUser.id,

    subject_id:
      $("examSubject").value,

    chapter_id:
      $("examChapter").value || null,

    title:
      $("examTitleInput").value.trim(),

    description:
      $("examDescription").value.trim(),

    duration:
      Number($("examDuration").value),

    total_marks:
      Number($("examTotalMarks").value),

    passing_percentage:
      Number($("examPassing").value),

    max_attempts:
      Number($("examMaxAttempts").value),

    randomize_questions:
      $("randomizeQuestions").checked,

    randomize_options:
      $("randomizeOptions").checked,

    show_result_immediately:
      $("showResultImmediately").checked,

    show_explanations:
      $("showExplanations").checked,

    published: true

  };


  const {
    data: exam,
    error
  } = await supabaseClient
    .from("exams")
    .insert(examData)
    .select()
    .single();


  if (error) {

    console.error(error);

    $("examFormMessage").textContent =
      error.message;

    return;
  }


  for (
    let index = 0;
    index < questionBuilder.length;
    index++
  ) {

    const q =
      questionBuilder[index];


    const {
      data: question,
      error: questionError
    } = await supabaseClient
      .from("questions")
      .insert({

        teacher_id:
          currentUser.id,

        subject_id:
          exam.subject_id,

        chapter_id:
          exam.chapter_id,

        difficulty:
          "medium",

        question_type:
          "mcq",

        question_text:
          q.question_text.trim(),

        option_a:
          q.option_a.trim(),

        option_b:
          q.option_b.trim(),

        option_c:
          q.option_c.trim(),

        option_d:
          q.option_d.trim(),

        correct_answer:
          q.correct_answer,

        marks:
          Number(q.marks || 1),

        explanation:
          q.explanation.trim()

      })
      .select()
      .single();


    if (questionError) {

      console.error(questionError);

      $("examFormMessage").textContent =
        "Exam created, but a question failed to save.";

      return;
    }


    const {
      error: linkError
    } = await supabaseClient
      .from("exam_questions")
      .insert({

        exam_id:
          exam.id,

        question_id:
          question.id,

        question_order:
          index

      });


    if (linkError) {

      console.error(linkError);

      $("examFormMessage").textContent =
        "Exam created, but question linking failed.";

      return;
    }
  }


  $("examFormMessage").textContent =
    "Exam published successfully!";


  questionBuilder = [];

  $("questionBuilder").innerHTML = "";

  $("examForm").reset();

  await loadTeacherDashboard();
}


/* =========================================================
   QUESTION BANK
   ========================================================= */

async function loadTeacherQuestions() {

  const {
    data: questions
  } = await supabaseClient
    .from("questions")
    .select(`
      *,
      subjects(name)
    `)
    .eq("teacher_id", currentUser.id)
    .order("created_at", {
      ascending: false
    });


  window.teacherQuestions =
    questions || [];
}


async function loadQuestionBank() {

  await loadSubjects();
  await loadTeacherQuestions();


  const questions =
    window.teacherQuestions || [];


  $("questionCount").textContent =
    `${questions.length} question${questions.length === 1 ? "" : "s"}`;


  if (!questions.length) {

    $("questionBankList").innerHTML =
      "<p>No questions created yet.</p>";

    return;
  }


  $("questionBankList").innerHTML =
    questions.map(q => `

      <div class="question-bank-item">

        <h4>
          ${escapeHTML(
            q.question_text
          )}
        </h4>

        <small style="color:#64748b">

          ${escapeHTML(
            q.subjects?.name || "Subject"
          )}

          · ${q.difficulty}
          · ${q.marks} mark(s)

        </small>


        <div class="question-options">

          ${[
            ["A",q.option_a],
            ["B",q.option_b],
            ["C",q.option_c],
            ["D",q.option_d]
          ].filter(x => x[1]).map(
            ([letter,text]) => `

              <div class="
                question-option
                ${
                  letter === q.correct_answer
                    ? "correct-option"
                    : ""
                }
              ">

                <strong>
                  ${letter}.
                </strong>

                ${escapeHTML(text)}

              </div>

            `
          ).join("")}

        </div>


        ${
          q.explanation
            ? `
              <p style="
                color:#64748b;
                font-size:13px;
                margin-top:10px
              ">

                <strong>
                  Explanation:
                </strong>

                ${escapeHTML(
                  q.explanation
                )}

              </p>
            `
            : ""
        }


        <div style="margin-top:12px">

          <button
            class="danger-btn"
            onclick="deleteQuestion('${q.id}')"
          >
            Delete
          </button>

        </div>

      </div>

    `).join("");
}


async function addQuestion(event) {

  event.preventDefault();

  const data = {

    teacher_id:
      currentUser.id,

    subject_id:
      $("qSubject").value,

    chapter_id:
      $("qChapter").value || null,

    difficulty:
      $("qDifficulty").value,

    question_type:
      $("qType").value,

    question_text:
      $("qText").value.trim(),

    option_a:
      $("qA").value.trim(),

    option_b:
      $("qB").value.trim(),

    option_c:
      $("qC").value.trim(),

    option_d:
      $("qD").value.trim(),

    correct_answer:
      $("qCorrect").value,

    marks:
      Number($("qMarks").value || 1),

    explanation:
      $("qExplanation").value.trim()

  };


  const {
    error
  } = await supabaseClient
    .from("questions")
    .insert(data);


  if (error) {

    $("questionMessage").textContent =
      error.message;

    return;
  }


  $("questionMessage").textContent =
    "Question added successfully.";

  $("questionForm").reset();

  $("qDifficulty").value = "medium";
  $("qType").value = "mcq";
  $("qMarks").value = 1;

  await loadQuestionBank();
}


async function deleteQuestion(id) {

  if (!confirm(
    "Delete this question?"
  ))
    return;


  const {
    error
  } = await supabaseClient
    .from("questions")
    .delete()
    .eq("id", id)
    .eq(
      "teacher_id",
      currentUser.id
    );


  if (error) {

    alert(error.message);
    return;
  }


  await loadQuestionBank();
}


/* =========================================================
   TEACHER SCORES
   ========================================================= */

async function loadTeacherScores() {

  const {
    data: exams
  } = await supabaseClient
    .from("exams")
    .select("id,title")
    .eq("teacher_id", currentUser.id);


  const examIds =
    (exams || []).map(e => e.id);


  if (!examIds.length) {

    $("scoreTable").innerHTML =
      "<p>No exam attempts yet.</p>";

    return;
  }


  const {
    data: attempts
  } = await supabaseClient
    .from("attempts")
    .select(`
      *,
      profiles(full_name,email),
      exams(title)
    `)
    .in(
      "exam_id",
      examIds
    )
    .order("submitted_at", {
      ascending: false
    });


  if (!attempts?.length) {

    $("scoreTable").innerHTML =
      "<p>No student attempts yet.</p>";

    return;
  }


  $("scoreTable").innerHTML = `

    <div class="
      score-item
      score-header
    ">

      <span>Student</span>
      <span>Exam</span>
      <span>Attempt</span>
      <span>Score</span>
      <span>Status</span>

    </div>


    ${attempts.map(a => `

      <div class="score-item">

        <div>

          <strong>
            ${escapeHTML(
              a.profiles?.full_name ||
              "Student"
            )}
          </strong>

          <small style="
            display:block;
            color:#64748b
          ">

            ${escapeHTML(
              a.profiles?.email || ""
            )}

          </small>

        </div>


        <span>
          ${escapeHTML(
            a.exams?.title || "Exam"
          )}
        </span>


        <span>
          ${a.attempt_number}
        </span>


        <strong>
          ${Number(
            a.percentage
          ).toFixed(1)}%
        </strong>


        <span style="
          color:${
            a.passed
              ? "var(--success)"
              : "var(--danger)"
          };
          font-weight:700
        ">

          ${a.passed
            ? "Passed"
            : "Failed"}

        </span>

      </div>

    `).join("")}

  `;
}


/* =========================================================
   CREATE EXAM BUTTON
   ========================================================= */

$("addQuestionBtn")?.addEventListener(
  "click",
  addQuestionBuilder
);


$("saveExamBtn")?.addEventListener(
  "click",
  saveExam
);


/* =========================================================
   UTILITIES
   ========================================================= */

function shuffleArray(array) {

  const result =
    [...array];


  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );


    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];

  }


  return result;
}


/* =========================================================
   MAKE FUNCTIONS AVAILABLE TO HTML
   ========================================================= */

window.startExam =
  startExam;

window.jumpToQuestion =
  jumpToQuestion;

window.openHistoricalAttempt =
  openHistoricalAttempt;

window.deleteSubject =
  deleteSubject;

window.deleteQuestion =
  deleteQuestion;

window.removeQuestionBuilder =
  removeQuestionBuilder;
