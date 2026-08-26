/* =========================================================
   EXAMHALL
   SUPABASE + STUDENT + TEACHER + EXAM + HISTORY + REVIEW
========================================================= */

const SUPABASE_URL =
  "https://imiuiizgusnydgongbqk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_wIN-aHetkbk4c8hpZ9e_pQ_mEJmVx_v";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let currentProfile = null;

let runningExam = null;
let runningQuestions = [];
let runningAnswers = {};
let currentQuestionIndex = 0;
let currentAttempt = null;
let examTimerInterval = null;
let examTimeRemaining = 0;

let lastCompletedAttempt = null;

let builderQuestions = [];


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
  return document.getElementById(id);
}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function formatDate(date) {

  if (!date) return "-";

  return new Date(date).toLocaleString();

}


function shuffle(array) {

  const copy = [...array];

  for (
    let i = copy.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [copy[i], copy[j]] =
      [copy[j], copy[i]];

  }

  return copy;

}


/* =========================================================
   AUTH TABS
========================================================= */

$("loginTab").addEventListener(
  "click",
  () => {

    $("loginTab").classList.add("active");
    $("signupTab").classList.remove("active");

    $("loginForm").classList.remove("hidden");
    $("signupForm").classList.add("hidden");

    $("loginError").textContent = "";
    $("signupError").textContent = "";
    $("signupSuccess").textContent = "";

  }
);


$("signupTab").addEventListener(
  "click",
  () => {

    $("signupTab").classList.add("active");
    $("loginTab").classList.remove("active");

    $("signupForm").classList.remove("hidden");
    $("loginForm").classList.add("hidden");

    $("loginError").textContent = "";
    $("signupError").textContent = "";
    $("signupSuccess").textContent = "";

  }
);


/* =========================================================
   LOGIN
========================================================= */

$("loginForm").addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    $("loginError").textContent = "";

    const email =
      $("loginEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
      $("loginPassword").value;

    $("loginBtn").disabled = true;
    $("loginBtn").textContent =
      "Logging in...";

    try {

      const {
        data,
        error
      } =
        await supabaseClient.auth
          .signInWithPassword({
            email,
            password
          });

      if (error) throw error;

      currentUser = data.user;

      await loadUserProfile();

    }
    catch (error) {

      console.error(error);

      $("loginError").textContent =
        error.message ||
        "Login failed.";

    }
    finally {

      $("loginBtn").disabled = false;
      $("loginBtn").textContent =
        "Login";

    }

  }
);


/* =========================================================
   STUDENT SIGNUP
========================================================= */

$("signupForm").addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    $("signupError").textContent = "";
    $("signupSuccess").textContent = "";

    const name =
      $("signupName")
        .value
        .trim();

    const email =
      $("signupEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
      $("signupPassword").value;

    const confirm =
      $("signupConfirmPassword").value;

    if (password.length < 6) {

      $("signupError").textContent =
        "Password must contain at least 6 characters.";

      return;

    }

    if (password !== confirm) {

      $("signupError").textContent =
        "Passwords do not match.";

      return;

    }

    $("signupBtn").disabled = true;

    try {

      const {
        data,
        error
      } =
        await supabaseClient.auth
          .signUp({

            email,
            password,

            options: {
              data: {
                full_name: name,
                role: "student"
              }
            }

          });

      if (error) throw error;

      if (data.session) {

        currentUser = data.user;

        await loadUserProfile();

      }
      else {

        $("signupSuccess").textContent =
          "Account created. Please verify your email and login.";

        $("signupForm").reset();

      }

    }
    catch (error) {

      $("signupError").textContent =
        error.message ||
        "Signup failed.";

    }
    finally {

      $("signupBtn").disabled = false;

    }

  }
);


/* =========================================================
   SESSION
========================================================= */

async function checkSession() {

  const {
    data
  } =
    await supabaseClient.auth
      .getSession();

  if (data.session) {

    currentUser =
      data.session.user;

    await loadUserProfile();

  }

}


supabaseClient.auth.onAuthStateChange(
  async (_event, session) => {

    if (!session) {

      currentUser = null;
      currentProfile = null;

      $("app").classList.add("hidden");
      $("loginPage").classList.remove("hidden");

    }

  }
);


/* =========================================================
   PROFILE
========================================================= */

async function loadUserProfile() {

  if (!currentUser) return;

  let {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

  if (error) {

    console.error(error);

    return;

  }

  /*
    If profile was not created because email confirmation
    or an old account is being used, create it.
  */

  if (!data) {

    const {
      data: newProfile,
      error: insertError
    } =
      await supabaseClient
        .from("profiles")
        .insert({

          id: currentUser.id,

          full_name:
            currentUser.user_metadata
              ?.full_name ||
            currentUser.email ||
            "User",

          role:
            currentUser.user_metadata
              ?.role ||
            "student"

        })
        .select()
        .single();

    if (insertError) {

      console.error(insertError);
      alert(insertError.message);
      return;

    }

    data = newProfile;

  }

  currentProfile = data;

  openDashboard();

}


/* =========================================================
   OPEN DASHBOARD
========================================================= */

function openDashboard() {

  $("loginPage").classList.add("hidden");
  $("app").classList.remove("hidden");

  updateUserUI();

  if (
    currentProfile.role === "teacher"
  ) {

    $("teacherMenu")
      .classList.remove("hidden");

    $("studentMenu")
      .classList.add("hidden");

    showPage("teacherDashboard");

  }
  else {

    $("studentMenu")
      .classList.remove("hidden");

    $("teacherMenu")
      .classList.add("hidden");

    showPage("studentDashboard");

  }

}


/* =========================================================
   USER UI
========================================================= */

function updateUserUI() {

  const name =
    currentProfile?.full_name ||
    currentUser?.email ||
    "User";

  $("userName").textContent =
    name;

  $("userRole").textContent =
    currentProfile?.role ||
    "student";

  $("userAvatar").textContent =
    name.charAt(0).toUpperCase();

  $("studentWelcome").textContent =
    name;

}


/* =========================================================
   NAVIGATION
========================================================= */

document
  .querySelectorAll(".menu-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showPage(
          button.dataset.page
        );

      }
    );

  });


function showPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.add("hidden");

    });

  const page =
    $(pageId);

  if (!page) return;

  page.classList.remove("hidden");

  document
    .querySelectorAll(".menu-btn")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === pageId
      );

    });


  if (
    pageId === "studentDashboard"
  )
    loadStudentDashboard();


  if (
    pageId === "studentResults"
  )
    loadStudentResults();


  if (
    pageId === "studentHistory"
  )
    loadStudentHistory();


  if (
    pageId === "studentProgress"
  )
    loadStudentProgress();


  if (
    pageId === "teacherDashboard"
  )
    loadTeacherDashboard();


  if (
    pageId === "createExam"
  )
    initializeExamBuilder();


  if (
    pageId === "questionBank"
  )
    loadQuestionBank();


  if (
    pageId === "teacherScores"
  )
    loadTeacherScores();

}


/* =========================================================
   STUDENT DASHBOARD
========================================================= */

async function loadStudentDashboard() {

  if (!currentUser) return;

  const {
    data: exams,
    error
  } =
    await supabaseClient
      .from("exams")
      .select(`
        id,
        title,
        description,
        duration_minutes,
        total_marks,
        max_attempts,
        start_at,
        end_at,
        subjects(name),
        chapters(name)
      `)
      .eq("is_published", true)
      .order(
        "created_at",
        { ascending: false }
      );

  if (error) {

    console.error(error);

    $("examList").innerHTML =
      `<p class="error-message">
        ${escapeHTML(error.message)}
      </p>`;

    return;

  }

  const now = new Date();

  const available =
    (exams || []).filter(exam => {

      if (
        exam.start_at &&
        new Date(exam.start_at) > now
      )
        return false;

      if (
        exam.end_at &&
        new Date(exam.end_at) < now
      )
        return false;

      return true;

    });


  $("availableExams").textContent =
    available.length;

  renderAvailableExams(
    available
  );

  await loadStudentStats();

}


/* =========================================================
   AVAILABLE EXAMS
========================================================= */

async function getAttemptCount(
  examId
) {

  const {
    count,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(
        "id",
        {
          count: "exact",
          head: true
        }
      )
      .eq(
        "exam_id",
        examId
      )
      .eq(
        "student_id",
        currentUser.id
      );

  if (error) {

    console.error(error);
    return 0;

  }

  return count || 0;

}


async function renderAvailableExams(
  exams
) {

  const list =
    $("examList");

  list.innerHTML = "";

  if (!exams.length) {

    list.innerHTML =
      `<div class="exam-item">
        <div>
          <h3>No new exams</h3>
          <p>Teacher has not published any new exam.</p>
        </div>
      </div>`;

    return;

  }


  for (const exam of exams) {

    const attempts =
      await getAttemptCount(
        exam.id
      );

    const maxAttempts =
      Number(
        exam.max_attempts || 1
      );

    const remaining =
      maxAttempts - attempts;

    const item =
      document.createElement("div");

    item.className =
      "exam-item";

    item.innerHTML = `

      <div class="exam-info">

        <h4>
          ${escapeHTML(exam.title)}
        </h4>

        <p>
          ${escapeHTML(
            exam.subjects?.name ||
            "General"
          )}
          •
          ${exam.duration_minutes} Minutes
          •
          ${exam.total_marks} Marks
        </p>

        <span class="badge">
          ${remaining > 0
            ? `${remaining} attempt(s) remaining`
            : "Attempts completed"}
        </span>

      </div>

      <button
        class="primary-btn"
        ${remaining <= 0 ? "disabled" : ""}
      >
        ${attempts === 0
          ? "Start Exam"
          : "Re-Exam"}
      </button>

    `;

    item
      .querySelector("button")
      .addEventListener(
        "click",
        () => startExam(exam)
      );

    list.appendChild(item);

  }

}


/* =========================================================
   STUDENT STATS
========================================================= */

async function loadStudentStats() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(
        "percentage,status,is_official_attempt"
      )
      .eq(
        "student_id",
        currentUser.id
      )
      .in(
        "status",
        [
          "submitted",
          "auto_submitted",
          "expired"
        ]
      );

  if (error) {

    console.error(error);
    return;

  }

  const attempts =
    data || [];

  $("attemptCount").textContent =
    attempts.length;

  if (!attempts.length) {

    $("averageScore").textContent =
      "0%";

    $("bestScore").textContent =
      "0%";

    return;

  }


  const percentages =
    attempts.map(
      x =>
        Number(
          x.percentage || 0
        )
    );

  const average =
    percentages.reduce(
      (a,b) => a + b,
      0
    ) / percentages.length;

  const best =
    Math.max(...percentages);


  $("averageScore").textContent =
    Math.round(average) + "%";

  $("bestScore").textContent =
    Math.round(best) + "%";

}


/* =========================================================
   START EXAM
========================================================= */

async function startExam(exam) {

  const {
    data: attempts,
    error: attemptError
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(
        "id,attempt_number,status,is_official_attempt"
      )
      .eq(
        "exam_id",
        exam.id
      )
      .eq(
        "student_id",
        currentUser.id
      )
      .order(
        "attempt_number",
        { ascending: false }
      );

  if (attemptError) {

    alert(attemptError.message);
    return;

  }


  const completedAttempts =
    (attempts || []).filter(
      a =>
        [
          "submitted",
          "auto_submitted",
          "expired"
        ].includes(a.status)
    );

  const maxAttempts =
    Number(
      exam.max_attempts || 1
    );

  if (
    completedAttempts.length >=
    maxAttempts
  ) {

    alert(
      "Maximum attempts completed for this exam."
    );

    return;

  }


  const nextAttemptNumber =
    completedAttempts.length + 1;


  /*
    Load exam questions
  */

  const {
    data: examQuestions,
    error: questionError
  } =
    await supabaseClient
      .from("exam_questions")
      .select(`
        question_order,
        questions(
          id,
          question_text,
          question_type,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          explanation,
          marks,
          negative_marks,
          image_url
        )
      `)
      .eq(
        "exam_id",
        exam.id
      )
      .order(
        "question_order",
        { ascending: true }
      );


  if (questionError) {

    alert(questionError.message);
    return;

  }


  if (!examQuestions?.length) {

    alert(
      "This exam has no questions."
    );

    return;

  }


  let questions =
    examQuestions
      .map(x => x.questions)
      .filter(Boolean);


  if (exam.randomize_questions) {

    questions =
      shuffle(questions);

  }


  /*
    Create attempt
  */

  const {
    data: attempt,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .insert({

        exam_id: exam.id,

        student_id:
          currentUser.id,

        attempt_number:
          nextAttemptNumber,

        is_official_attempt:
          nextAttemptNumber === 1,

        status:
          "in_progress"

      })
      .select()
      .single();


  if (error) {

    alert(error.message);
    return;

  }


  currentAttempt =
    attempt;

  runningExam =
    exam;

  runningQuestions =
    questions;

  runningAnswers = {};

  currentQuestionIndex = 0;

  examTimeRemaining =
    Number(
      exam.duration_minutes || 30
    ) * 60;


  $("runningExamTitle").textContent =
    exam.title;

  $("examPage")
    .classList.remove("hidden");

  document
    .querySelectorAll(".page")
    .forEach(page => {

      if (
        page.id !== "examPage"
      )
        page.classList.add("hidden");

    });


  renderCurrentQuestion();
  renderQuestionNavigation();
  startTimer();

}


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

  clearInterval(
    examTimerInterval
  );

  updateTimer();

  examTimerInterval =
    setInterval(
      () => {

        examTimeRemaining--;

        updateTimer();

        if (
          examTimeRemaining <= 0
        ) {

          clearInterval(
            examTimerInterval
          );

          submitExam(
            true
          );

        }

      },
      1000
    );

}


function updateTimer() {

  const minutes =
    Math.floor(
      examTimeRemaining / 60
    );

  const seconds =
    examTimeRemaining % 60;

  $("examTimer").textContent =
    String(minutes).padStart(2,"0")
    + ":"
    +
    String(seconds).padStart(2,"0");

}


/* =========================================================
   QUESTION RENDER
========================================================= */

function renderCurrentQuestion() {

  const question =
    runningQuestions[
      currentQuestionIndex
    ];

  if (!question) return;


  $("questionNumber").textContent =
    `${currentQuestionIndex + 1} / ${runningQuestions.length}`;

  $("runningQuestionText").textContent =
    question.question_text;


  const options = [
    ["A", question.option_a],
    ["B", question.option_b],
    ["C", question.option_c],
    ["D", question.option_d]
  ].filter(
    x => x[1] !== null &&
         x[1] !== undefined &&
         String(x[1]).trim() !== ""
  );


  const selected =
    runningAnswers[
      question.id
    ] || "";


  $("runningOptions").innerHTML =
    options.map(
      ([key, text]) => `

        <label class="option ${
          selected === key
            ? "selected"
            : ""
        }">

          <input
            type="radio"
            name="currentOption"
            value="${key}"
            ${selected === key
              ? "checked"
              : ""}
          >

          <strong>${key}.</strong>
          ${escapeHTML(text)}

        </label>

      `
    ).join("");


  document
    .querySelectorAll(
      'input[name="currentOption"]'
    )
    .forEach(input => {

      input.addEventListener(
        "change",
        event => {

          runningAnswers[
            question.id
          ] =
            event.target.value;

          renderCurrentQuestion();
          renderQuestionNavigation();

        }
      );

    });


  $("previousBtn").disabled =
    currentQuestionIndex === 0;


  $("nextBtn")
    .classList.toggle(
      "hidden",
      currentQuestionIndex ===
      runningQuestions.length - 1
    );


  $("submitBtn")
    .classList.toggle(
      "hidden",
      currentQuestionIndex !==
      runningQuestions.length - 1
    );

}


/* =========================================================
   QUESTION NAVIGATION
========================================================= */

function renderQuestionNavigation() {

  $("questionNavigation").innerHTML =
    runningQuestions.map(
      (question, index) => `

        <button
          class="question-nav-btn
            ${
              runningAnswers[question.id]
                ? "answered"
                : ""
            }
            ${
              index === currentQuestionIndex
                ? "current"
                : ""
            }"
          data-index="${index}"
        >
          ${index + 1}
        </button>

      `
    ).join("");


  document
    .querySelectorAll(
      ".question-nav-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          currentQuestionIndex =
            Number(
              button.dataset.index
            );

          renderCurrentQuestion();
          renderQuestionNavigation();

        }
      );

    });

}


/* =========================================================
   PREVIOUS / NEXT
========================================================= */

$("previousBtn")
  .addEventListener(
    "click",
    () => {

      if (
        currentQuestionIndex > 0
      ) {

        currentQuestionIndex--;

        renderCurrentQuestion();
        renderQuestionNavigation();

      }

    }
  );


$("nextBtn")
  .addEventListener(
    "click",
    () => {

      if (
        currentQuestionIndex <
        runningQuestions.length - 1
      ) {

        currentQuestionIndex++;

        renderCurrentQuestion();
        renderQuestionNavigation();

      }

    }
  );


$("submitBtn")
  .addEventListener(
    "click",
    () => {

      submitExam(false);

    }
  );


/* =========================================================
   SUBMIT EXAM
========================================================= */

async function submitExam(
  autoSubmit
) {

  if (!currentAttempt) return;


  if (!autoSubmit) {

    const ok =
      confirm(
        "Are you sure you want to submit the exam?"
      );

    if (!ok) return;

  }


  clearInterval(
    examTimerInterval
  );


  let score = 0;
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;


  /*
    Save answers
  */

  for (
    const question of
    runningQuestions
  ) {

    const selected =
      runningAnswers[
        question.id
      ] || null;

    const correctAnswer =
      String(
        question.correct_answer || ""
      )
      .trim()
      .toUpperCase();


    const isCorrect =
      selected &&
      String(selected)
        .toUpperCase() ===
      correctAnswer;


    if (!selected) {

      unanswered++;

    }
    else if (isCorrect) {

      correct++;

      score +=
        Number(
          question.marks || 0
        );

    }
    else {

      wrong++;

      score -=
        Number(
          question.negative_marks || 0
        );

    }


    await supabaseClient
      .from("student_answers")
      .upsert({

        attempt_id:
          currentAttempt.id,

        question_id:
          question.id,

        selected_answer:
          selected,

        is_correct:
          Boolean(isCorrect),

        marks_obtained:
          isCorrect
            ? Number(question.marks || 0)
            : (
              selected
                ? -Number(
                    question.negative_marks || 0
                  )
                : 0
            ),

        answered_at:
          selected
            ? new Date().toISOString()
            : null

      }, {

        onConflict:
          "attempt_id,question_id"

      });

  }


  score =
    Math.max(
      0,
      score
    );


  const totalMarks =
    Number(
      runningExam.total_marks || 0
    );


  const percentage =
    totalMarks > 0
      ? (
          score /
          totalMarks
        ) * 100
      : 0;


  const passed =
    percentage >=
    Number(
      runningExam.passing_percentage || 40
    );


  const status =
    autoSubmit
      ? "auto_submitted"
      : "submitted";


  const {
    data: updatedAttempt,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .update({

        status,

        submitted_at:
          new Date().toISOString(),

        score,

        correct_answers:
          correct,

        wrong_answers:
          wrong,

        unanswered,

        percentage:
          Number(
            percentage.toFixed(2)
          ),

        passed

      })
      .eq(
        "id",
        currentAttempt.id
      )
      .select()
      .single();


  if (error) {

    alert(error.message);
    return;

  }


  currentAttempt =
    updatedAttempt;

  lastCompletedAttempt =
    updatedAttempt;


  showResult(
    updatedAttempt
  );

}


/* =========================================================
   RESULT
========================================================= */

async function showResult(
  attempt
) {

  showPage("resultPage");


  $("resultExamName").textContent =
    runningExam.title;

  $("resultScore").textContent =
    Number(
      attempt.score || 0
    ).toFixed(2);

  $("resultPercentage").textContent =
    Number(
      attempt.percentage || 0
    ).toFixed(2)
    + "%";

  $("resultCorrect").textContent =
    attempt.correct_answers || 0;

  $("resultPassed").textContent =
    attempt.passed
      ? "PASSED"
      : "FAILED";


  $("resultDetails").innerHTML = `

    <p>
      <strong>Attempt:</strong>
      #${attempt.attempt_number}
    </p>

    <p>
      <strong>Official Score:</strong>
      ${
        attempt.is_official_attempt
          ? "YES - This is your permanent first-attempt score."
          : "No - This is a re-exam/practice attempt."
      }
    </p>

    <p>
      <strong>Wrong:</strong>
      ${attempt.wrong_answers || 0}
    </p>

    <p>
      <strong>Unanswered:</strong>
      ${attempt.unanswered || 0}
    </p>

  `;


  $("resultReviewBtn")
    .onclick =
      () =>
        openReview(
          attempt.id,
          runningExam.title
        );


  $("resultReexamBtn")
    .onclick =
      () =>
        startExam(
          runningExam
        );


  $("resultReexamBtn")
    .classList.remove(
      "hidden"
    );

}


/* =========================================================
   COMPLETE REVIEW
========================================================= */

async function openReview(
  attemptId,
  examTitle
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("student_answers")
      .select(`
        selected_answer,
        is_correct,
        marks_obtained,
        questions(
          id,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          explanation,
          marks
        )
      `)
      .eq(
        "attempt_id",
        attemptId
      );


  if (error) {

    alert(error.message);
    return;

  }


  $("reviewExamName").textContent =
    examTitle;


  $("reviewList").innerHTML =
    (data || []).map(
      (answer, index) => {

        const q =
          answer.questions;

        if (!q) return "";


        const options = [
          ["A", q.option_a],
          ["B", q.option_b],
          ["C", q.option_c],
          ["D", q.option_d]
        ].filter(
          x =>
            x[1] !== null &&
            x[1] !== undefined &&
            String(x[1]).trim() !== ""
        );


        const correct =
          String(
            q.correct_answer || ""
          ).toUpperCase();

        const selected =
          String(
            answer.selected_answer || ""
          ).toUpperCase();


        return `

          <div class="review-item ${
            answer.is_correct
              ? "correct"
              : "wrong"
          }">

            <h3>
              Q${index + 1}.
              ${escapeHTML(q.question_text)}
            </h3>

            <div class="review-options">

              ${
                options.map(
                  ([key, text]) => `

                    <div class="
                      review-option
                      ${
                        key === correct
                          ? "correct-answer"
                          : ""
                      }
                      ${
                        key === selected &&
                        key !== correct
                          ? "selected-wrong"
                          : ""
                      }
                    ">

                      <strong>${key}.</strong>
                      ${escapeHTML(text)}

                      ${
                        key === correct
                          ? " ✅ Correct Answer"
                          : ""
                      }

                      ${
                        key === selected &&
                        key !== correct
                          ? " ❌ Your Answer"
                          : ""
                      }

                    </div>

                  `
                ).join("")
              }

            </div>


            <div class="answer-box">

              <strong>Your Answer:</strong>

              ${
                selected
                  ? selected
                  : "Not Answered"
              }

              <br>

              <strong>Correct Answer:</strong>
              ${correct}

            </div>


            ${
              q.explanation
                ? `
                  <div class="explanation">

                    <strong>
                      Explanation
                    </strong>

                    <p>
                      ${escapeHTML(
                        q.explanation
                      )}
                    </p>

                  </div>
                `
                : ""
            }

          </div>

        `;

      }
    ).join("");


  showPage(
    "reviewPage"
  );

}


/* =========================================================
   STUDENT RESULTS
========================================================= */

async function loadStudentResults() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(`
        id,
        exam_id,
        attempt_number,
        score,
        percentage,
        correct_answers,
        wrong_answers,
        unanswered,
        passed,
        is_official_attempt,
        submitted_at,
        exams(title)
      `)
      .eq(
        "student_id",
        currentUser.id
      )
      .in(
        "status",
        [
          "submitted",
          "auto_submitted",
          "expired"
        ]
      )
      .order(
        "submitted_at",
        { ascending: false }
      );


  if (error) {

    $("myResults").innerHTML =
      `<p>${escapeHTML(error.message)}</p>`;

    return;

  }


  $("myResults").innerHTML =
    (data || []).map(
      result => `

        <div class="result-item">

          <div>

            <h3>
              ${escapeHTML(
                result.exams?.title ||
                "Exam"
              )}
            </h3>

            <p>
              Attempt #${result.attempt_number}
              •
              ${formatDate(
                result.submitted_at
              )}
            </p>

            <span class="badge ${
              result.is_official_attempt
                ? "official-badge"
                : "practice-badge"
            }">

              ${
                result.is_official_attempt
                  ? "Official First Attempt"
                  : "Re-Exam"
              }

            </span>

          </div>


          <div>

            <strong>
              ${Number(
                result.percentage || 0
              ).toFixed(2)}%
            </strong>

            <br>

            <button
              class="secondary-btn review-result-btn"
              data-id="${result.id}"
              data-title="${escapeHTML(
                result.exams?.title || "Exam"
              )}"
            >
              View Review
            </button>

          </div>

        </div>

      `
    ).join("");


  document
    .querySelectorAll(
      ".review-result-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          openReview(
            button.dataset.id,
            button.dataset.title
          )
      );

    });

}


/* =========================================================
   STUDENT HISTORY
========================================================= */

async function loadStudentHistory() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(`
        id,
        exam_id,
        attempt_number,
        score,
        percentage,
        status,
        submitted_at,
        created_at,
        is_official_attempt,
        exams(
          title,
          max_attempts
        )
      `)
      .eq(
        "student_id",
        currentUser.id
      )
      .order(
        "created_at",
        { ascending: false }
      );


  if (error) {

    $("historyList").innerHTML =
      `<p>${escapeHTML(error.message)}</p>`;

    return;

  }


  $("historyList").innerHTML =
    (data || []).map(
      attempt => `

        <div class="result-item">

          <div>

            <h3>
              ${escapeHTML(
                attempt.exams?.title ||
                "Exam"
              )}
            </h3>

            <p>
              Attempt #${attempt.attempt_number}
              •
              ${formatDate(
                attempt.submitted_at ||
                attempt.created_at
              )}
            </p>

            <span class="badge ${
              attempt.is_official_attempt
                ? "official-badge"
                : "practice-badge"
            }">

              ${
                attempt.is_official_attempt
                  ? "Official Score"
                  : "Re-Exam"
              }

            </span>

          </div>


          <div>

            <strong>
              ${Number(
                attempt.percentage || 0
              ).toFixed(2)}%
            </strong>

            <br>

            ${
              attempt.status !==
              "in_progress"
                ? `
                  <button
                    class="secondary-btn history-review-btn"
                    data-id="${attempt.id}"
                    data-title="${escapeHTML(
                      attempt.exams?.title ||
                      "Exam"
                    )}"
                  >
                    View Complete Review
                  </button>
                `
                : ""
            }

          </div>

        </div>

      `
    ).join("");


  document
    .querySelectorAll(
      ".history-review-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          openReview(
            button.dataset.id,
            button.dataset.title
          )
      );

    });

}


/* =========================================================
   STUDENT PROGRESS
========================================================= */

async function loadStudentProgress() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(`
        id,
        exam_id,
        percentage,
        score,
        passed,
        is_official_attempt,
        exams(title,total_marks)
      `)
      .eq(
        "student_id",
        currentUser.id
      )
      .eq(
        "is_official_attempt",
        true
      )
      .in(
        "status",
        [
          "submitted",
          "auto_submitted",
          "expired"
        ]
      )
      .order(
        "created_at",
        { ascending: false }
      );


  if (error) {

    console.error(error);
    return;

  }


  const attempts =
    data || [];


  $("progressExams").textContent =
    attempts.length;

  $("progressOfficial").textContent =
    attempts.length;


  if (!attempts.length) {

    $("progressAverage").textContent =
      "0%";

    $("progressBest").textContent =
      "0%";

    $("progressDetails").innerHTML =
      `<p>No official exam attempts yet.</p>`;

    return;

  }


  const scores =
    attempts.map(
      x =>
        Number(
          x.percentage || 0
        )
    );


  const average =
    scores.reduce(
      (a,b) => a + b,
      0
    ) / scores.length;


  const best =
    Math.max(...scores);


  $("progressAverage").textContent =
    average.toFixed(2) + "%";

  $("progressBest").textContent =
    best.toFixed(2) + "%";


  $("progressDetails").innerHTML =
    attempts.map(
      attempt => `

        <div class="score-row">

          <div>

            <strong>
              ${escapeHTML(
                attempt.exams?.title ||
                "Exam"
              )}
            </strong>

            <small>
              Official First Attempt
            </small>

          </div>

          <strong>
            ${Number(
              attempt.percentage || 0
            ).toFixed(2)}%
          </strong>

        </div>

      `
    ).join("");

}


/* =========================================================
   TEACHER DASHBOARD
========================================================= */

async function loadTeacherDashboard() {

  const {
    data: exams,
    error
  } =
    await supabaseClient
      .from("exams")
      .select(`
        id,
        title,
        is_published,
        duration_minutes,
        total_marks,
        created_at,
        subjects(name)
      `)
      .eq(
        "created_by",
        currentUser.id
      )
      .order(
        "created_at",
        { ascending: false }
      );


  if (error) {

    console.error(error);
    return;

  }


  $("teacherExamCount").textContent =
    exams.length;


  const examIds =
    exams.map(x => x.id);


  if (!examIds.length) {

    $("teacherAttemptCount").textContent =
      "0";

    $("teacherStudentCount").textContent =
      "0";

    $("teacherAverage").textContent =
      "0%";

    $("teacherExamList").innerHTML =
      `<p>No exams created yet.</p>`;

    return;

  }


  const {
    data: attempts
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(
        "student_id,percentage,status"
      )
      .in(
        "exam_id",
        examIds
      );


  const completed =
    (attempts || []).filter(
      a =>
        [
          "submitted",
          "auto_submitted",
          "expired"
        ].includes(a.status)
    );


  $("teacherAttemptCount").textContent =
    completed.length;


  $("teacherStudentCount").textContent =
    new Set(
      completed.map(
        x => x.student_id
      )
    ).size;


  const average =
    completed.length
      ? completed.reduce(
          (sum,x) =>
            sum +
            Number(
              x.percentage || 0
            ),
          0
        ) / completed.length
      : 0;


  $("teacherAverage").textContent =
    average.toFixed(2) + "%";


  $("teacherExamList").innerHTML =
    exams.map(
      exam => `

        <div class="exam-item">

          <div class="exam-info">

            <h4>
              ${escapeHTML(exam.title)}
            </h4>

            <p>
              ${escapeHTML(
                exam.subjects?.name ||
                "General"
              )}
              •
              ${exam.duration_minutes} min
              •
              ${exam.total_marks} marks
            </p>

            <span class="badge">
              ${
                exam.is_published
                  ? "Published"
                  : "Draft"
              }
            </span>

          </div>

        </div>

      `
    ).join("");

}


/* =========================================================
   TEACHER QUESTION BANK
========================================================= */

async function loadQuestionBank() {

  await loadSubjects(
    $("qSubject")
  );


  const {
    data,
    error
  } =
    await supabaseClient
      .from("questions")
      .select(`
        id,
        question_text,
        question_type,
        difficulty,
        marks,
        correct_answer,
        explanation,
        subjects(name),
        chapters(name)
      `)
      .eq(
        "created_by",
        currentUser.id
      )
      .order(
        "created_at",
        { ascending: false }
      );


  if (error) {

    console.error(error);
    return;

  }


  $("questionCount").textContent =
    `${data.length} questions`;


  $("questionBankList").innerHTML =
    data.map(
      q => `

        <div class="question-bank-item">

          <h3>
            ${escapeHTML(
              q.question_text
            )}
          </h3>

          <p>

            ${escapeHTML(
              q.subjects?.name ||
              "General"
            )}

            •

            ${escapeHTML(
              q.chapters?.name ||
              "All Chapters"
            )}

            •

            ${escapeHTML(
              q.difficulty
            )}

            •

            ${q.marks} marks

          </p>

          <span class="badge">
            Correct: ${escapeHTML(
              q.correct_answer
            )}
          </span>

        </div>

      `
    ).join("");

}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects(
  select
) {

  if (!select) return;

  const {
    data,
    error
  } =
    await supabaseClient
      .from("subjects")
      .select("id,name")
      .order(
        "name",
        { ascending: true }
      );


  if (error) {

    console.error(error);
    return;

  }


  select.innerHTML =
    `<option value="">
      Select Subject
    </option>`;


  data.forEach(
    subject => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        subject.id;

      option.textContent =
        subject.name;

      select.appendChild(
        option
      );

    }
  );

}


/* =========================================================
   CHAPTERS
========================================================= */

async function loadChapters(
  subjectId,
  select
) {

  select.innerHTML =
    `<option value="">
      All Chapters
    </option>`;


  if (!subjectId) return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("chapters")
      .select(
        "id,name"
      )
      .eq(
        "subject_id",
        subjectId
      )
      .order(
        "name"
      );


  if (error) {

    console.error(error);
    return;

  }


  data.forEach(
    chapter => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        chapter.id;

      option.textContent =
        chapter.name;

      select.appendChild(
        option
      );

    }
  );

}


$("examSubject")
  .addEventListener(
    "change",
    () => {

      loadChapters(
        $("examSubject").value,
        $("examChapter")
      );

    }
  );


$("qSubject")
  .addEventListener(
    "change",
    () => {

      loadChapters(
        $("qSubject").value,
        $("qChapter")
      );

    }
  );


/* =========================================================
   QUESTION BANK ADD
========================================================= */

$("questionForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      $("questionMessage")
        .textContent =
        "Saving question...";


      const {
        error
      } =
        await supabaseClient
          .from("questions")
          .insert({

            created_by:
              currentUser.id,

            subject_id:
              $("qSubject").value,

            chapter_id:
              $("qChapter").value ||
              null,

            question_type:
              $("qType").value,

            difficulty:
              $("qDifficulty").value,

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

            explanation:
              $("qExplanation").value.trim(),

            marks:
              Number(
                $("qMarks").value || 1
              ),

            negative_marks:
              0

          });


      if (error) {

        $("questionMessage")
          .textContent =
          error.message;

        return;

      }


      $("questionMessage")
        .textContent =
        "Question added successfully.";

      $("questionForm").reset();

      await loadQuestionBank();

    }
  );


/* =========================================================
   CREATE EXAM BUILDER
========================================================= */

async function initializeExamBuilder() {

  if (
    $("examSubject").options.length <= 1
  ) {

    await loadSubjects(
      $("examSubject")
    );

  }


  renderBuilderQuestions();

}


$("addQuestionBtn")
  .addEventListener(
    "click",
    () => {

      builderQuestions.push({

        question_text: "",

        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",

        correct_answer: "A",

        explanation: "",

        marks: 1,

        negative_marks: 0

      });

      renderBuilderQuestions();

    }
  );


function renderBuilderQuestions() {

  const container =
    $("questionBuilder");


  if (!builderQuestions.length) {

    container.innerHTML =
      `<div class="exam-item">
        <div>
          <h3>No questions added</h3>
          <p>Click Add Question to create questions.</p>
        </div>
      </div>`;

    return;

  }


  container.innerHTML =
    builderQuestions.map(
      (q,index) => `

        <div
          class="builder-question"
          data-index="${index}"
        >

          <div
            class="builder-question-header"
          >

            <span
              class="builder-question-number"
            >
              Question ${index + 1}
            </span>

            <button
              class="remove-question"
              data-index="${index}"
            >
              Remove
            </button>

          </div>


          <label>Question</label>

          <textarea
            class="builder-text"
            rows="3"
            placeholder="Question text"
          >${escapeHTML(
            q.question_text
          )}</textarea>


          <div class="form-grid">

            <div>
              <label>Option A</label>
              <input
                class="builder-a"
                value="${escapeHTML(
                  q.option_a
                )}"
              >
            </div>

            <div>
              <label>Option B</label>
              <input
                class="builder-b"
                value="${escapeHTML(
                  q.option_b
                )}"
              >
            </div>

            <div>
              <label>Option C</label>
              <input
                class="builder-c"
                value="${escapeHTML(
                  q.option_c
                )}"
              >
            </div>

            <div>
              <label>Option D</label>
              <input
                class="builder-d"
                value="${escapeHTML(
                  q.option_d
                )}"
              >
            </div>

            <div>
              <label>Correct Answer</label>

              <select class="builder-correct">

                <option
                  value="A"
                  ${q.correct_answer === "A"
                    ? "selected"
                    : ""}
                >
                  A
                </option>

                <option
                  value="B"
                  ${q.correct_answer === "B"
                    ? "selected"
                    : ""}
                >
                  B
                </option>

                <option
                  value="C"
                  ${q.correct_answer === "C"
                    ? "selected"
                    : ""}
                >
                  C
                </option>

                <option
                  value="D"
                  ${q.correct_answer === "D"
                    ? "selected"
                    : ""}
                >
                  D
                </option>

              </select>

            </div>

            <div>
              <label>Marks</label>

              <input
                class="builder-marks"
                type="number"
                min="0"
                value="${q.marks}"
              >
            </div>

          </div>


          <label>Explanation</label>

          <textarea
            class="builder-explanation"
            rows="2"
            placeholder="Explanation"
          >${escapeHTML(
            q.explanation
          )}</textarea>

        </div>

      `
    ).join("");


  document
    .querySelectorAll(
      ".builder-question"
    )
    .forEach(card => {

      const index =
        Number(
          card.dataset.index
        );


      card
        .querySelector(".builder-text")
        .addEventListener(
          "input",
          e =>
            builderQuestions[
              index
            ].question_text =
            e.target.value
        );


      card
        .querySelector(".builder-a")
        .addEventListener(
          "input",
          e =>
            builderQuestions[
              index
            ].option_a =
            e.target.value
        );


      card
        .querySelector(".builder-b")
        .addEventListener(
          "input",
          e =>
            builderQuestions[
              index
            ].option_b =
            e.target.value
        );


      card
        .querySelector(".builder-c")
        .addEventListener(
          "input",
          e =>
            builderQuestions[
              index
            ].option_c =
            e.target.value
        );


      card
        .querySelector(".builder-d")
        .addEventListener(
          "input",
          e =>
            builderQuestions[
              index
            ].option_d =
            e.target.value
        );


      card
        .querySelector(".builder-correct")
        .addEventListener(
          "change",
          e =>
            builderQuestions[
              index
            ].correct_answer =
            e.target.value
        );


      card
        .querySelector(".builder-marks")
        .addEventListener(
          "input",
          e =>
            builderQuestions[
              index
            ].marks =
            Number(
              e.target.value || 1
            )
        );


      card
        .querySelector(".builder-explanation")
        .addEventListener(
          "input",
          e =>
            builderQuestions[
              index
            ].explanation =
            e.target.value
        );


      card
        .querySelector(".remove-question")
        .addEventListener(
          "click",
          () => {

            builderQuestions.splice(
              index,
              1
            );

            renderBuilderQuestions();

          }
        );

    });

}


/* =========================================================
   SAVE EXAM
========================================================= */

$("saveExamBtn")
  .addEventListener(
    "click",
    saveExam
  );


async function saveExam() {

  if (!currentProfile ||
      currentProfile.role !== "teacher") {

    alert(
      "Only teacher can create exams."
    );

    return;

  }


  if (!builderQuestions.length) {

    alert(
      "Please add at least one question."
    );

    return;

  }


  $("saveExamBtn").disabled =
    true;

  $("examFormMessage")
    .textContent =
    "Saving exam...";


  try {

    /*
      1. Create exam
    */

    const {
      data: exam,
      error: examError
    } =
      await supabaseClient
        .from("exams")
        .insert({

          created_by:
            currentUser.id,

          title:
            $("examTitleInput")
              .value
              .trim(),

          description:
            $("examDescription")
              .value
              .trim(),

          subject_id:
            $("examSubject").value,

          chapter_id:
            $("examChapter").value ||
            null,

          duration_minutes:
            Number(
              $("examDuration").value
            ),

          total_marks:
            Number(
              $("examTotalMarks").value
            ),

          passing_percentage:
            Number(
              $("examPassing").value
            ),

          max_attempts:
            Number(
              $("examMaxAttempts").value
            ),

          randomize_questions:
            $("randomizeQuestions")
              .checked,

          randomize_options:
            $("randomizeOptions")
              .checked,

          show_result_immediately:
            $("showResultImmediately")
              .checked,

          show_explanations:
            $("showExplanations")
              .checked,

          is_published:
            true

        })
        .select()
        .single();


    if (examError)
      throw examError;


    /*
      2. Create question-bank questions
    */

    for (
      let i = 0;
      i < builderQuestions.length;
      i++
    ) {

      const q =
        builderQuestions[i];


      const {
        data: question,
        error: questionError
      } =
        await supabaseClient
          .from("questions")
          .insert({

            created_by:
              currentUser.id,

            subject_id:
              $("examSubject").value,

            chapter_id:
              $("examChapter").value ||
              null,

            question_type:
              "mcq",

            difficulty:
              "medium",

            question_text:
              q.question_text,

            option_a:
              q.option_a,

            option_b:
              q.option_b,

            option_c:
              q.option_c,

            option_d:
              q.option_d,

            correct_answer:
              q.correct_answer,

            explanation:
              q.explanation,

            marks:
              Number(
                q.marks || 1
              ),

            negative_marks:
              Number(
                q.negative_marks || 0
              )

          })
          .select()
          .single();


      if (questionError)
        throw questionError;


      /*
        3. Attach question to exam
      */

      const {
        error: linkError
      } =
        await supabaseClient
          .from("exam_questions")
          .insert({

            exam_id:
              exam.id,

            question_id:
              question.id,

            question_order:
              i + 1

          });


      if (linkError)
        throw linkError;

    }


    $("examFormMessage")
      .textContent =
      "Exam created and published successfully.";

    $("examForm").reset();

    builderQuestions = [];

    renderBuilderQuestions();

    await loadTeacherDashboard();

  }
  catch (error) {

    console.error(error);

    $("examFormMessage")
      .textContent =
      error.message ||
      "Unable to create exam.";

  }
  finally {

    $("saveExamBtn").disabled =
      false;

  }

}


/* =========================================================
   TEACHER SCORES
========================================================= */

async function loadTeacherScores() {

  const {
    data: exams,
    error: examError
  } =
    await supabaseClient
      .from("exams")
      .select("id,title")
      .eq(
        "created_by",
        currentUser.id
      );


  if (examError) {

    console.error(examError);
    return;

  }


  const ids =
    exams.map(x => x.id);


  if (!ids.length) {

    $("scoreTable").innerHTML =
      "<p>No student attempts yet.</p>";

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(`
        id,
        exam_id,
        student_id,
        attempt_number,
        score,
        percentage,
        correct_answers,
        wrong_answers,
        unanswered,
        passed,
        is_official_attempt,
        submitted_at,
        profiles(full_name),
        exams(title)
      `)
      .in(
        "exam_id",
        ids
      )
      .in(
        "status",
        [
          "submitted",
          "auto_submitted",
          "expired"
        ]
      )
      .order(
        "submitted_at",
        { ascending: false }
      );


  if (error) {

    $("scoreTable").innerHTML =
      `<p>${escapeHTML(error.message)}</p>`;

    return;

  }


  $("scoreTable").innerHTML =
    (data || []).map(
      row => `

        <div class="score-row">

          <div>

            <strong>
              ${escapeHTML(
                row.profiles?.full_name ||
                "Student"
              )}
            </strong>

            <small>
              ${escapeHTML(
                row.exams?.title ||
                "Exam"
              )}

              •

              Attempt #${row.attempt_number}

              •

              ${
                row.is_official_attempt
                  ? "Official"
                  : "Re-Exam"
              }
            </small>

          </div>


          <div>

            <strong>
              ${Number(
                row.percentage || 0
              ).toFixed(2)}%
            </strong>

            <small>
              ${row.correct_answers || 0}
              correct /
              ${row.wrong_answers || 0}
              wrong
            </small>

          </div>


          <button
            class="secondary-btn teacher-review-btn"
            data-id="${row.id}"
            data-title="${escapeHTML(
              row.exams?.title ||
              "Exam"
            )}"
          >
            View Answers
          </button>

        </div>

      `
    ).join("");


  document
    .querySelectorAll(
      ".teacher-review-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          openTeacherReview(
            button.dataset.id,
            button.dataset.title
          )
      );

    });

}


/* =========================================================
   TEACHER REVIEW
========================================================= */

async function openTeacherReview(
  attemptId,
  examTitle
) {

  /*
    Teacher is allowed to read answers
    through RLS if the exam belongs
    to that teacher.
  */

  const {
    data,
    error
  } =
    await supabaseClient
      .from("student_answers")
      .select(`
        selected_answer,
        is_correct,
        marks_obtained,
        questions(
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          explanation
        )
      `)
      .eq(
        "attempt_id",
        attemptId
      );


  if (error) {

    alert(error.message);
    return;

  }


  $("reviewExamName").textContent =
    "Teacher Review - " +
    examTitle;


  $("reviewList").innerHTML =
    (data || []).map(
      (answer,index) => {

        const q =
          answer.questions;

        if (!q) return "";


        const options = [
          ["A",q.option_a],
          ["B",q.option_b],
          ["C",q.option_c],
          ["D",q.option_d]
        ];


        const correct =
          String(
            q.correct_answer || ""
          ).toUpperCase();

        const selected =
          String(
            answer.selected_answer || ""
          ).toUpperCase();


        return `

          <div class="review-item ${
            answer.is_correct
              ? "correct"
              : "wrong"
          }">

            <h3>
              Q${index + 1}.
              ${escapeHTML(
                q.question_text
              )}
            </h3>

            <div class="review-options">

              ${
                options.map(
                  ([key,text]) => `

                    <div class="
                      review-option
                      ${
                        key === correct
                          ? "correct-answer"
                          : ""
                      }
                      ${
                        key === selected &&
                        key !== correct
                          ? "selected-wrong"
                          : ""
                      }
                    ">

                      <strong>
                        ${key}.
                      </strong>

                      ${escapeHTML(
                        text || ""
                      )}

                    </div>

                  `
                ).join("")
              }

            </div>


            <div class="answer-box">

              <strong>
                Student Answer:
              </strong>

              ${
                selected ||
                "Not Answered"
              }

              <br>

              <strong>
                Correct Answer:
              </strong>

              ${correct}

            </div>


            ${
              q.explanation
                ? `
                  <div class="explanation">

                    <strong>
                      Explanation
                    </strong>

                    <p>
                      ${escapeHTML(
                        q.explanation
                      )}
                    </p>

                  </div>
                `
                : ""
            }

          </div>

        `;

      }
    ).join("");


  showPage(
    "reviewPage"
  );

}


/* =========================================================
   BACK BUTTONS
========================================================= */

$("backToDashboardBtn")
  .addEventListener(
    "click",
    () => {

      if (
        currentProfile?.role ===
        "teacher"
      )
        showPage(
          "teacherDashboard"
        );
      else
        showPage(
          "studentDashboard"
        );

    }
  );


$("reviewBackBtn")
  .addEventListener(
    "click",
    () => {

      if (
        currentProfile?.role ===
        "teacher"
      )
        showPage(
          "teacherScores"
        );
      else
        showPage(
          "studentHistory"
        );

    }
  );


/* =========================================================
   LOGOUT
========================================================= */

$("logoutBtn")
  .addEventListener(
    "click",
    async () => {

      clearInterval(
        examTimerInterval
      );

      await supabaseClient.auth
        .signOut();

      currentUser = null;
      currentProfile = null;

      $("app")
        .classList.add("hidden");

      $("loginPage")
        .classList.remove("hidden");

    }
  );


/* =========================================================
   INITIALIZE
========================================================= */

checkSession();
