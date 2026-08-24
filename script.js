/* =========================================================
   EXAMHALL - FINAL PHASE 1
   SUPABASE + AUTH + EXAM BUILDER + EXAM ENGINE
========================================================= */


/* =========================================================
   SUPABASE
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
   GLOBAL STATE
========================================================= */

let currentUser = null;
let currentProfile = null;

let currentExam = null;
let currentQuestions = [];
let currentAnswers = {};
let currentQuestionIndex = 0;

let currentAttempt = null;

let timerInterval = null;
let examEndTime = null;

let builderExamId = null;


/* =========================================================
   ELEMENTS
========================================================= */

const loginPage =
  document.getElementById("loginPage");

const app =
  document.getElementById("app");

const loginForm =
  document.getElementById("loginForm");

const signupForm =
  document.getElementById("signupForm");

const loginTab =
  document.getElementById("loginTab");

const signupTab =
  document.getElementById("signupTab");

const loginError =
  document.getElementById("loginError");

const signupError =
  document.getElementById("signupError");

const signupSuccess =
  document.getElementById("signupSuccess");


/* =========================================================
   AUTH TABS
========================================================= */

loginTab.addEventListener("click", () => {

  loginTab.classList.add("active");
  signupTab.classList.remove("active");

  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");

  clearMessages();

});


signupTab.addEventListener("click", () => {

  signupTab.classList.add("active");
  loginTab.classList.remove("active");

  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");

  clearMessages();

});


function clearMessages() {

  loginError.textContent = "";
  signupError.textContent = "";
  signupSuccess.textContent = "";

}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener("submit", async event => {

  event.preventDefault();

  clearMessages();

  const email =
    document
      .getElementById("loginEmail")
      .value
      .trim()
      .toLowerCase();

  const password =
    document.getElementById("loginPassword").value;

  const button =
    document.getElementById("loginBtn");

  button.disabled = true;
  button.textContent = "Logging in...";

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      throw error;
    }

    currentUser = data.user;

    await loadUserProfile();

  }

  catch (error) {

    console.error(error);

    loginError.textContent =
      getFriendlyAuthError(error.message);

  }

  finally {

    button.disabled = false;
    button.textContent = "Login";

  }

});


/* =========================================================
   SIGNUP
========================================================= */

signupForm.addEventListener("submit", async event => {

  event.preventDefault();

  clearMessages();

  const name =
    document
      .getElementById("signupName")
      .value
      .trim();

  const email =
    document
      .getElementById("signupEmail")
      .value
      .trim()
      .toLowerCase();

  const password =
    document.getElementById("signupPassword").value;

  const confirmPassword =
    document.getElementById("signupConfirmPassword").value;

  if (!name) {

    signupError.textContent =
      "Please enter your full name.";

    return;

  }

  if (password.length < 6) {

    signupError.textContent =
      "Password must contain at least 6 characters.";

    return;

  }

  if (password !== confirmPassword) {

    signupError.textContent =
      "Passwords do not match.";

    return;

  }

  const button =
    document.getElementById("signupBtn");

  button.disabled = true;
  button.textContent = "Creating account...";

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({

        email,

        password,

        options: {

          data: {
            full_name: name
          }

        }

      });

    if (error) {
      throw error;
    }

    if (data.session) {

      currentUser = data.user;

      await loadUserProfile();

      return;

    }

    signupSuccess.textContent =
      "Account created successfully. Please login.";

    signupForm.reset();

  }

  catch (error) {

    console.error(error);

    signupError.textContent =
      getFriendlyAuthError(error.message);

  }

  finally {

    button.disabled = false;
    button.textContent = "Create Student Account";

  }

});


/* =========================================================
   PROFILE
========================================================= */

async function loadUserProfile() {

  if (!currentUser) {
    return;
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

  if (error) {

    console.error("Profile error:", error);

    setTimeout(
      loadUserProfile,
      1000
    );

    return;

  }

  currentProfile = data;

  openDashboard();

}


/* =========================================================
   OPEN DASHBOARD
========================================================= */

function openDashboard() {

  loginPage.classList.add("hidden");
  app.classList.remove("hidden");

  updateUserUI();

  if (currentProfile.role === "teacher") {

    document
      .getElementById("teacherMenu")
      .classList.remove("hidden");

    document
      .getElementById("studentMenu")
      .classList.add("hidden");

    showPage("teacherDashboard");

  }

  else {

    document
      .getElementById("studentMenu")
      .classList.remove("hidden");

    document
      .getElementById("teacherMenu")
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

  document.getElementById("userName").textContent =
    name;

  document.getElementById("userRole").textContent =
    currentProfile?.role || "student";

  document.getElementById("userAvatar").textContent =
    name.charAt(0).toUpperCase();

  document.getElementById("studentWelcome").textContent =
    name;

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

document
  .querySelectorAll(".menu-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      showPage(button.dataset.page);

    });

  });


function showPage(pageId) {

  stopTimer();

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.add("hidden");

    });

  const page =
    document.getElementById(pageId);

  if (!page) {
    return;
  }

  page.classList.remove("hidden");

  document
    .querySelectorAll(".menu-btn")
    .forEach(button => {

      button.classList.remove("active");

      if (
        button.dataset.page === pageId
      ) {

        button.classList.add("active");

      }

    });


  if (pageId === "studentDashboard") {
    loadStudentDashboard();
  }

  if (pageId === "studentResults") {
    loadStudentResults();
  }

  if (pageId === "studentHistory") {
    loadStudentHistory();
  }

  if (pageId === "teacherDashboard") {
    loadTeacherDashboard();
  }

  if (pageId === "teacherScores") {
    loadTeacherScores();
  }

  if (pageId === "createExam") {
    loadSubjects();
  }

}


/* =========================================================
   STUDENT DASHBOARD
========================================================= */

async function loadStudentDashboard() {

  if (!currentUser) {
    return;
  }

  const list =
    document.getElementById("examList");

  list.innerHTML =
    `<div class="loading">
      Loading exams...
    </div>`;

  try {

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
          passing_percentage,
          negative_marking,
          max_attempts,
          start_at,
          end_at,
          subjects(name),
          chapters(name)
        `)
        .eq("is_published", true)
        .order("created_at", {
          ascending: false
        });

    if (error) {
      throw error;
    }

    const now =
      new Date();

    const available =
      (exams || []).filter(exam => {

        if (
          exam.start_at &&
          new Date(exam.start_at) > now
        ) {
          return false;
        }

        if (
          exam.end_at &&
          new Date(exam.end_at) < now
        ) {
          return false;
        }

        return true;

      });

    document.getElementById(
      "availableExams"
    ).textContent =
      available.length;

    showAvailableExams(available);

    await loadStudentStats();

  }

  catch (error) {

    console.error(error);

    list.innerHTML =
      `<p>
        Unable to load exams.
      </p>`;

  }

}


/* =========================================================
   AVAILABLE EXAMS
========================================================= */

async function showAvailableExams(exams) {

  const list =
    document.getElementById("examList");

  list.innerHTML = "";

  if (!exams.length) {

    list.innerHTML =
      `<div class="empty-state">

        <div class="empty-icon">
          📚
        </div>

        <h3>
          No exams available
        </h3>

        <p>
          Your teacher has not published any exams yet.
        </p>

      </div>`;

    return;

  }


  for (const exam of exams) {

    const item =
      document.createElement("div");

    item.className =
      "exam-item";

    const subject =
      exam.subjects?.name ||
      "General";

    const chapter =
      exam.chapters?.name ||
      "All Chapters";


    const attempts =
      await getStudentAttemptCount(
        exam.id
      );

    const maxAttempts =
      Number(exam.max_attempts || 1);

    const exhausted =
      attempts >= maxAttempts;


    item.innerHTML = `

      <div>

        <h4>
          ${escapeHTML(exam.title)}
        </h4>

        <p>
          ${escapeHTML(subject)}
          •
          ${escapeHTML(chapter)}
          •
          ${exam.duration_minutes} Minutes
          •
          ${attempts}/${maxAttempts} Attempts
        </p>

      </div>

      <button
        class="primary-btn"
        type="button"
        ${exhausted ? "disabled" : ""}
      >
        ${exhausted ? "Attempts Used" : "Start Exam"}
      </button>

    `;


    if (!exhausted) {

      item
        .querySelector("button")
        .addEventListener(
          "click",
          () => startExam(exam.id)
        );

    }

    list.appendChild(item);

  }

}


/* =========================================================
   ATTEMPT COUNT
========================================================= */

async function getStudentAttemptCount(examId) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .select("id", {
        count: "exact"
      })
      .eq("exam_id", examId)
      .eq("student_id", currentUser.id);

  if (error) {

    console.error(error);

    return 0;

  }

  return data?.length || 0;

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
        "percentage,status"
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

  document.getElementById(
    "attemptCount"
  ).textContent =
    attempts.length;

  if (!attempts.length) {

    document.getElementById(
      "averageScore"
    ).textContent =
      "0%";

    document.getElementById(
      "bestScore"
    ).textContent =
      "0%";

    return;

  }

  const percentages =
    attempts.map(
      item => Number(item.percentage || 0)
    );

  const average =
    Math.round(
      percentages.reduce(
        (a, b) => a + b,
        0
      ) / percentages.length
    );

  const best =
    Math.max(...percentages);

  document.getElementById(
    "averageScore"
  ).textContent =
    average + "%";

  document.getElementById(
    "bestScore"
  ).textContent =
    best + "%";

}


/* =========================================================
   STUDENT RESULTS
========================================================= */

async function loadStudentResults() {

  const container =
    document.getElementById("myResults");

  container.innerHTML =
    `<div class="loading">
      Loading results...
    </div>`;

  const {
    data,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(`
        id,
        score,
        percentage,
        correct_answers,
        wrong_answers,
        unanswered,
        submitted_at,
        status,
        passed,
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
        {
          ascending: false
        }
      );

  if (error) {

    console.error(error);

    container.innerHTML =
      "<p>Unable to load results.</p>";

    return;

  }

  container.innerHTML = "";

  if (!data?.length) {

    container.innerHTML =
      `<div class="empty-state">

        <div class="empty-icon">
          📄
        </div>

        <h3>
          No results yet
        </h3>

        <p>
          Your completed exams will appear here.
        </p>

      </div>`;

    return;

  }


  data.forEach(result => {

    const item =
      document.createElement("div");

    item.className =
      "result-item";

    item.innerHTML = `

      <div>

        <strong>
          ${escapeHTML(
            result.exams?.title ||
            "Exam"
          )}
        </strong>

        <p>
          ${formatDate(result.submitted_at)}
          •
          ${
            result.passed
              ? "Passed"
              : "Failed"
          }
        </p>

      </div>

      <div class="score">

        ${Number(result.score || 0).toFixed(2)}

        <br>

        ${Number(result.percentage || 0)}%

      </div>

    `;

    container.appendChild(item);

  });

}


/* =========================================================
   HISTORY
========================================================= */

async function loadStudentHistory() {

  const container =
    document.getElementById("historyList");

  container.innerHTML =
    `<div class="loading">
      Loading history...
    </div>`;

  const {
    data,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(`
        id,
        attempt_number,
        score,
        percentage,
        status,
        submitted_at,
        created_at,
        exams(title)
      `)
      .eq(
        "student_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {

    console.error(error);

    container.innerHTML =
      "<p>Unable to load history.</p>";

    return;

  }

  container.innerHTML = "";

  if (!data?.length) {

    container.innerHTML =
      `<div class="empty-state">

        <div class="empty-icon">
          🕘
        </div>

        <h3>
          No attempts yet
        </h3>

        <p>
          Your exam attempts will appear here.
        </p>

      </div>`;

    return;

  }


  data.forEach(attempt => {

    const item =
      document.createElement("div");

    item.className =
      "result-item";

    item.innerHTML = `

      <div>

        <strong>
          ${escapeHTML(
            attempt.exams?.title ||
            "Exam"
          )}
        </strong>

        <p>
          Attempt #${attempt.attempt_number}
          •
          ${escapeHTML(attempt.status)}
        </p>

      </div>

      <div class="score">

        ${Number(
          attempt.percentage || 0
        )}%

      </div>

    `;

    container.appendChild(item);

  });

}


/* =========================================================
   TEACHER DASHBOARD
========================================================= */

async function loadTeacherDashboard() {

  if (!currentUser) {
    return;
  }

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
        created_at,
        subjects(name)
      `)
      .eq(
        "created_by",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {

    console.error(error);

    return;

  }

  document.getElementById(
    "teacherExamCount"
  ).textContent =
    exams?.length || 0;


  const {
    data: attempts,
    error: attemptsError
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(`
        student_id,
        percentage,
        status,
        exams!inner(created_by)
      `)
      .eq(
        "exams.created_by",
        currentUser.id
      );


  if (!attemptsError) {

    const completed =
      (attempts || []).filter(
        attempt =>
          [
            "submitted",
            "auto_submitted",
            "expired"
          ].includes(
            attempt.status
          )
      );


    document.getElementById(
      "teacherAttemptCount"
    ).textContent =
      completed.length;


    const students =
      new Set(
        completed.map(
          item => item.student_id
        )
      );


    document.getElementById(
      "teacherStudentCount"
    ).textContent =
      students.size;


    if (completed.length) {

      const average =
        Math.round(
          completed.reduce(
            (total, item) =>
              total +
              Number(
                item.percentage || 0
              ),
            0
          ) /
          completed.length
        );

      document.getElementById(
        "teacherAverage"
      ).textContent =
        average + "%";

    }

  }


  const list =
    document.getElementById(
      "teacherExamList"
    );

  list.innerHTML = "";


  if (!exams?.length) {

    list.innerHTML =
      `<div class="empty-state">

        <div class="empty-icon">
          📝
        </div>

        <h3>
          No exams created
        </h3>

        <p>
          Create your first exam.
        </p>

      </div>`;

    return;

  }


  exams.forEach(exam => {

    const item =
      document.createElement("div");

    item.className =
      "exam-item";

    item.innerHTML = `

      <div>

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
        </p>

      </div>

      <strong class="${
        exam.is_published
          ? "published"
          : "draft"
      }">

        ${
          exam.is_published
            ? "Published"
            : "Draft"
        }

      </strong>

    `;

    list.appendChild(item);

  });

}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects() {

  const select =
    document.getElementById("examSubject");

  if (!select) {
    return;
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from("subjects")
      .select("id,name")
      .order("name");

  if (error) {

    console.error(error);

    return;

  }

  select.innerHTML =
    `<option value="">
      Select Subject
    </option>`;

  (data || []).forEach(subject => {

    const option =
      document.createElement("option");

    option.value =
      subject.id;

    option.textContent =
      subject.name;

    select.appendChild(option);

  });

}


/* =========================================================
   SUBJECT CHANGE
========================================================= */

document
  .getElementById("examSubject")
  .addEventListener(
    "change",
    loadChapters
  );


async function loadChapters() {

  const subjectId =
    document.getElementById(
      "examSubject"
    ).value;

  const select =
    document.getElementById(
      "examChapter"
    );

  select.innerHTML =
    `<option value="">
      Select Chapter
    </option>`;

  if (!subjectId) {
    return;
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from("chapters")
      .select("id,name")
      .eq(
        "subject_id",
        subjectId
      )
      .order("name");

  if (error) {

    console.error(error);

    return;

  }

  (data || []).forEach(chapter => {

    const option =
      document.createElement("option");

    option.value =
      chapter.id;

    option.textContent =
      chapter.name;

    select.appendChild(option);

  });

}


/* =========================================================
   CREATE EXAM
========================================================= */

document
  .getElementById("examForm")
  .addEventListener(
    "submit",
    createExam
  );


async function createExam(event) {

  event.preventDefault();

  const message =
    document.getElementById(
      "examFormMessage"
    );

  const button =
    document.getElementById(
      "saveExamBtn"
    );

  message.textContent = "";

  button.disabled = true;
  button.textContent = "Creating...";


  try {

    const payload = {

      title:
        document
          .getElementById("examTitleInput")
          .value
          .trim(),

      description:
        document
          .getElementById("examDescription")
          .value
          .trim() || null,

      subject_id:
        toNullableNumber(
          document
            .getElementById("examSubject")
            .value
        ),

      chapter_id:
        toNullableNumber(
          document
            .getElementById("examChapter")
            .value
        ),

      created_by:
        currentUser.id,

      duration_minutes:
        Number(
          document
            .getElementById("examDuration")
            .value
        ),

      total_marks:
        Number(
          document
            .getElementById("examTotalMarks")
            .value || 0
        ),

      passing_percentage:
        Number(
          document
            .getElementById("examPassing")
            .value || 0
        ),

      negative_marking:
        Number(
          document
            .getElementById("examNegative")
            .value || 0
        ),

      max_attempts:
        Number(
          document
            .getElementById("examMaxAttempts")
            .value || 1
        ),

      randomize_questions:
        document
          .getElementById("randomQuestions")
          .checked,

      randomize_options:
        document
          .getElementById("randomOptions")
          .checked,

      show_result_immediately:
        document
          .getElementById("showResult")
          .checked,

      show_explanations:
        document
          .getElementById("showExplanation")
          .checked,

      is_published:
        false,

      start_at:
        localInputToISO(
          document
            .getElementById("examStart")
            .value
        ),

      end_at:
        localInputToISO(
          document
            .getElementById("examEnd")
            .value
        )

    };


    const {
      data,
      error
    } =
      await supabaseClient
        .from("exams")
        .insert(payload)
        .select()
        .single();


    if (error) {
      throw error;
    }


    builderExamId =
      data.id;


    document.getElementById(
      "questionBuilder"
    ).classList.remove("hidden");


    document.getElementById(
      "currentExamInfo"
    ).textContent =
      `${data.title} • Exam ID: ${data.id}`;


    message.className =
      "form-message success-message";

    message.textContent =
      "Exam created successfully. Now add questions.";


    await loadBuilderQuestions();

  }

  catch (error) {

    console.error(error);

    message.className =
      "form-message error-message";

    message.textContent =
      error.message ||
      "Unable to create exam.";

  }

  finally {

    button.disabled = false;
    button.textContent = "Create Exam";

  }

}


/* =========================================================
   ADD QUESTION
========================================================= */

document
  .getElementById("questionForm")
  .addEventListener(
    "submit",
    addQuestion
  );


async function addQuestion(event) {

  event.preventDefault();

  if (!builderExamId) {

    alert(
      "Please create the exam first."
    );

    return;

  }

  const message =
    document.getElementById(
      "questionMessage"
    );

  const button =
    document.getElementById(
      "addQuestionBtn"
    );

  button.disabled = true;
  button.textContent = "Adding...";


  try {

    const {
      data: existing,
      error: countError
    } =
      await supabaseClient
        .from("questions")
        .select("question_order")
        .eq(
          "exam_id",
          builderExamId
        )
        .order(
          "question_order",
          {
            ascending: false
          }
        )
        .limit(1);


    if (countError) {
      throw countError;
    }


    const nextOrder =
      existing?.length
        ? Number(
            existing[0].question_order
          ) + 1
        : 1;


    const payload = {

      exam_id:
        builderExamId,

      question_text:
        document
          .getElementById(
            "questionTextInput"
          )
          .value
          .trim(),

      image_url:
        document
          .getElementById(
            "questionImage"
          )
          .value
          .trim() || null,

      option_a:
        document
          .getElementById(
            "optionA"
          )
          .value
          .trim(),

      option_b:
        document
          .getElementById(
            "optionB"
          )
          .value
          .trim(),

      option_c:
        document
          .getElementById(
            "optionC"
          )
          .value
          .trim() || null,

      option_d:
        document
          .getElementById(
            "optionD"
          )
          .value
          .trim() || null,

      correct_answer:
        document
          .getElementById(
            "correctAnswer"
          )
          .value,

      explanation:
        document
          .getElementById(
            "questionExplanation"
          )
          .value
          .trim() || null,

      marks:
        Number(
          document
            .getElementById(
              "questionMarks"
            )
            .value || 1
        ),

      negative_marks:
        Number(
          document
            .getElementById(
              "questionNegative"
            )
            .value || 0
        ),

      question_order:
        nextOrder

    };


    const {
      error
    } =
      await supabaseClient
        .from("questions")
        .insert(payload);


    if (error) {
      throw error;
    }


    message.className =
      "form-message success-message";

    message.textContent =
      "Question added successfully.";

    document
      .getElementById("questionForm")
      .reset();

    document.getElementById(
      "questionMarks"
    ).value = 1;

    document.getElementById(
      "questionNegative"
    ).value = 0;


    await loadBuilderQuestions();

  }

  catch (error) {

    console.error(error);

    message.className =
      "form-message error-message";

    message.textContent =
      error.message ||
      "Unable to add question.";

  }

  finally {

    button.disabled = false;
    button.textContent = "Add Question";

  }

}


/* =========================================================
   BUILDER QUESTIONS
========================================================= */

async function loadBuilderQuestions() {

  if (!builderExamId) {
    return;
  }

  const list =
    document.getElementById(
      "builderQuestionList"
    );

  list.innerHTML =
    `<div class="loading">
      Loading questions...
    </div>`;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("questions")
      .select("*")
      .eq(
        "exam_id",
        builderExamId
      )
      .order(
        "question_order"
      );


  if (error) {

    console.error(error);

    list.innerHTML =
      "<p>Unable to load questions.</p>";

    return;

  }


  list.innerHTML = "";


  if (!data?.length) {

    list.innerHTML =
      `<div class="empty-state small-empty">

        <div class="empty-icon">
          ❓
        </div>

        <p>
          No questions added yet.
        </p>

      </div>`;

    return;

  }


  data.forEach((question, index) => {

    const item =
      document.createElement("div");

    item.className =
      "builder-question";


    item.innerHTML = `

      <div class="builder-question-number">
        ${index + 1}
      </div>

      <div class="builder-question-content">

        <strong>
          ${escapeHTML(
            question.question_text
          )}
        </strong>

        <p>
          A: ${escapeHTML(question.option_a)}
          •
          B: ${escapeHTML(question.option_b)}
          ${
            question.option_c
              ? `• C: ${escapeHTML(question.option_c)}`
              : ""
          }
          ${
            question.option_d
              ? `• D: ${escapeHTML(question.option_d)}`
              : ""
          }
        </p>

        <small>
          Correct:
          ${escapeHTML(question.correct_answer)}
          •
          Marks:
          ${Number(question.marks || 0)}
        </small>

      </div>

      <button
        class="delete-question-btn"
        type="button"
      >
        Delete
      </button>

    `;


    item
      .querySelector(
        ".delete-question-btn"
      )
      .addEventListener(
        "click",
        () => deleteQuestion(question.id)
      );


    list.appendChild(item);

  });

}


/* =========================================================
   DELETE QUESTION
========================================================= */

async function deleteQuestion(id) {

  if (
    !confirm(
      "Delete this question?"
    )
  ) {
    return;
  }

  const {
    error
  } =
    await supabaseClient
      .from("questions")
      .delete()
      .eq(
        "id",
        id
      );

  if (error) {

    alert(error.message);

    return;

  }

  await loadBuilderQuestions();

}


/* =========================================================
   PUBLISH EXAM
========================================================= */

document
  .getElementById("publishExamBtn")
  .addEventListener(
    "click",
    publishExam
  );


async function publishExam() {

  if (!builderExamId) {

    alert(
      "Please create an exam first."
    );

    return;

  }


  const {
    data: questions,
    error: questionError
  } =
    await supabaseClient
      .from("questions")
      .select("id")
      .eq(
        "exam_id",
        builderExamId
      );


  if (questionError) {

    alert(questionError.message);

    return;

  }


  if (!questions?.length) {

    alert(
      "Please add at least one question before publishing."
    );

    return;

  }


  if (
    !confirm(
      "Publish this exam now?"
    )
  ) {
    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("exams")
      .update({
        is_published: true
      })
      .eq(
        "id",
        builderExamId
      )
      .eq(
        "created_by",
        currentUser.id
      );


  if (error) {

    alert(error.message);

    return;

  }


  alert(
    "Exam published successfully."
  );


  document
    .getElementById("examForm")
    .reset();

  document
    .getElementById("questionForm")
    .reset();

  document
    .getElementById("questionBuilder")
    .classList.add("hidden");

  builderExamId = null;

  showPage("teacherDashboard");

}


/* =========================================================
   RESET EXAM
========================================================= */

document
  .getElementById("resetExamBtn")
  .addEventListener(
    "click",
    () => {

      document
        .getElementById("examForm")
        .reset();

      document
        .getElementById("questionBuilder")
        .classList.add("hidden");

      builderExamId = null;

      document.getElementById(
        "examDuration"
      ).value = 30;

      document.getElementById(
        "examPassing"
      ).value = 40;

      document.getElementById(
        "examNegative"
      ).value = 0;

      document.getElementById(
        "examMaxAttempts"
      ).value = 1;

      document.getElementById(
        "showResult"
      ).checked = true;

      document.getElementById(
        "showExplanation"
      ).checked = true;

    }
  );


/* =========================================================
   START EXAM
========================================================= */

async function startExam(examId) {

  try {

    const {
      data: exam,
      error
    } =
      await supabaseClient
        .from("exams")
        .select(`
          *,
          subjects(name),
          chapters(name)
        `)
        .eq(
          "id",
          examId
        )
        .single();

    if (error) {
      throw error;
    }


    const now =
      new Date();


    if (
      exam.start_at &&
      new Date(exam.start_at) > now
    ) {

      alert(
        "This exam has not started yet."
      );

      return;

    }


    if (
      exam.end_at &&
      new Date(exam.end_at) < now
    ) {

      alert(
        "This exam has already ended."
      );

      return;

    }


    const {
      data: attempts,
      error: attemptError
    } =
      await supabaseClient
        .from("exam_attempts")
        .select("*")
        .eq(
          "exam_id",
          examId
        )
        .eq(
          "student_id",
          currentUser.id
        )
        .order(
          "attempt_number",
          {
            ascending: false
          }
        );


    if (attemptError) {
      throw attemptError;
    }


    const completedAttempts =
      (attempts || []).filter(
        attempt =>
          [
            "submitted",
            "auto_submitted",
            "expired"
          ].includes(
            attempt.status
          )
      );


    if (
      completedAttempts.length >=
      Number(exam.max_attempts || 1)
    ) {

      alert(
        "You have used all allowed attempts."
      );

      return;

    }


    const activeAttempt =
      (attempts || []).find(
        attempt =>
          attempt.status === "in_progress"
      );


    let attempt;


    if (activeAttempt) {

      attempt =
        activeAttempt;

    }

    else {

      const nextAttemptNumber =
        completedAttempts.length + 1;


      const {
        data: createdAttempt,
        error: createError
      } =
        await supabaseClient
          .from("exam_attempts")
          .insert({

            exam_id: examId,

            student_id:
              currentUser.id,

            attempt_number:
              nextAttemptNumber,

            started_at:
              new Date().toISOString(),

            status:
              "in_progress",

            score:
              0,

            correct_answers:
              0,

            wrong_answers:
              0,

            unanswered:
              0,

            percentage:
              0,

            passed:
              false

          })
          .select()
          .single();


      if (createError) {
        throw createError;
      }

      attempt =
        createdAttempt;

    }


    const {
      data: questions,
      error: questionError
    } =
      await supabaseClient
        .from("questions")
        .select("*")
        .eq(
          "exam_id",
          examId
        )
        .order(
          "question_order"
        );


    if (questionError) {
      throw questionError;
    }


    if (!questions?.length) {

      alert(
        "This exam has no questions."
      );

      return;

    }


    currentExam =
      exam;

    currentAttempt =
      attempt;

    currentQuestions =
      [...questions];

    currentAnswers = {};

    currentQuestionIndex = 0;


    if (exam.randomize_questions) {

      shuffleArray(
        currentQuestions
      );

    }


    await loadExistingAnswers();

    showPage("examPage");

    renderCurrentQuestion();

    startExamTimer();

  }

  catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Unable to start exam."
    );

  }

}


/* =========================================================
   LOAD EXISTING ANSWERS
========================================================= */

async function loadExistingAnswers() {

  if (!currentAttempt) {
    return;
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from("student_answers")
      .select(`
        question_id,
        selected_answer
      `)
      .eq(
        "attempt_id",
        currentAttempt.id
      );


  if (error) {

    console.error(error);

    return;

  }


  (data || []).forEach(answer => {

    currentAnswers[
      answer.question_id
    ] =
      answer.selected_answer;

  });

}


/* =========================================================
   RENDER QUESTION
========================================================= */

function renderCurrentQuestion() {

  const question =
    currentQuestions[
      currentQuestionIndex
    ];

  if (!question) {
    return;
  }


  document.getElementById(
    "examTitleDisplay"
  ).textContent =
    currentExam.title;


  document.getElementById(
    "questionNumber"
  ).textContent =
    `Question ${
      currentQuestionIndex + 1
    } of ${
      currentQuestions.length
    }`;


  document.getElementById(
    "questionText"
  ).textContent =
    question.question_text;


  const imageContainer =
    document.getElementById(
      "questionImageDisplay"
    );


  if (question.image_url) {

    imageContainer.innerHTML =
      `<img
        src="${escapeAttribute(
          question.image_url
        )}"
        alt="Question image"
      >`;

  }

  else {

    imageContainer.innerHTML = "";

  }


  const optionsContainer =
    document.getElementById(
      "options"
    );

  optionsContainer.innerHTML = "";


  let options = [

    {
      key: "A",
      text: question.option_a
    },

    {
      key: "B",
      text: question.option_b
    }

  ];


  if (question.option_c) {

    options.push({
      key: "C",
      text: question.option_c
    });

  }


  if (question.option_d) {

    options.push({
      key: "D",
      text: question.option_d
    });

  }


  if (currentExam.randomize_options) {

    shuffleArray(options);

  }


  options.forEach(option => {

    const div =
      document.createElement("div");

    div.className =
      "option";


    if (
      currentAnswers[
        question.id
      ] === option.key
    ) {

      div.classList.add(
        "selected"
      );

    }


    div.innerHTML = `

      <span class="option-key">
        ${option.key}
      </span>

      <span>
        ${escapeHTML(option.text)}
      </span>

    `;


    div.addEventListener(
      "click",
      () => selectAnswer(
        question,
        option.key
      )
    );


    optionsContainer.appendChild(div);

  });


  document.getElementById(
    "previousBtn"
  ).disabled =
    currentQuestionIndex === 0;


  const isLast =
    currentQuestionIndex ===
    currentQuestions.length - 1;


  document
    .getElementById("nextBtn")
    .classList.toggle(
      "hidden",
      isLast
    );


  document
    .getElementById("submitBtn")
    .classList.toggle(
      "hidden",
      !isLast
    );


  renderQuestionNavigation();

}


/* =========================================================
   SELECT ANSWER
========================================================= */

async function selectAnswer(
  question,
  selected
) {

  currentAnswers[
    question.id
  ] =
    selected;


  renderCurrentQuestion();


  const {
    data: existing,
    error: existingError
  } =
    await supabaseClient
      .from("student_answers")
      .select("id")
      .eq(
        "attempt_id",
        currentAttempt.id
      )
      .eq(
        "question_id",
        question.id
      )
      .maybeSingle();


  if (existingError) {

    console.error(existingError);

    return;

  }


  const isCorrect =
    selected ===
    question.correct_answer;


  const marks =
    isCorrect
      ? Number(
          question.marks || 0
        )
      : -Number(
          question.negative_marks || 0
        );


  const payload = {

    attempt_id:
      currentAttempt.id,

    question_id:
      question.id,

    selected_answer:
      selected,

    is_correct:
      isCorrect,

    marks_obtained:
      marks,

    answered_at:
      new Date().toISOString()

  };


  let error;


  if (existing) {

    const result =
      await supabaseClient
        .from("student_answers")
        .update(payload)
        .eq(
          "id",
          existing.id
        );

    error =
      result.error;

  }

  else {

    const result =
      await supabaseClient
        .from("student_answers")
        .insert(payload);

    error =
      result.error;

  }


  if (error) {

    console.error(
      "Answer save error:",
      error
    );

  }

}


/* =========================================================
   NEXT / PREVIOUS
========================================================= */

document
  .getElementById("nextBtn")
  .addEventListener(
    "click",
    () => {

      if (
        currentQuestionIndex <
        currentQuestions.length - 1
      ) {

        currentQuestionIndex++;

        renderCurrentQuestion();

      }

    }
  );


document
  .getElementById("previousBtn")
  .addEventListener(
    "click",
    () => {

      if (
        currentQuestionIndex > 0
      ) {

        currentQuestionIndex--;

        renderCurrentQuestion();

      }

    }
  );


/* =========================================================
   QUESTION NAVIGATION
========================================================= */

function renderQuestionNavigation() {

  const container =
    document.getElementById(
      "questionNavigation"
    );

  container.innerHTML = "";


  currentQuestions.forEach(
    (question, index) => {

      const button =
        document.createElement("button");

      button.type = "button";

      button.textContent =
        index + 1;


      if (
        index ===
        currentQuestionIndex
      ) {

        button.classList.add(
          "active"
        );

      }


      if (
        currentAnswers[
          question.id
        ]
      ) {

        button.classList.add(
          "answered"
        );

      }


      button.addEventListener(
        "click",
        () => {

          currentQuestionIndex =
            index;

          renderCurrentQuestion();

        }
      );


      container.appendChild(
        button
      );

    }
  );

}


/* =========================================================
   TIMER
========================================================= */

function startExamTimer() {

  stopTimer();


  const startedAt =
    new Date(
      currentAttempt.started_at
    ).getTime();


  const duration =
    Number(
      currentExam.duration_minutes || 1
    ) *
    60 *
    1000;


  examEndTime =
    startedAt +
    duration;


  updateTimer();


  timerInterval =
    setInterval(
      updateTimer,
      1000
    );

}


function updateTimer() {

  if (!examEndTime) {
    return;
  }


  const remaining =
    examEndTime -
    Date.now();


  if (remaining <= 0) {

    document.getElementById(
      "examTimer"
    ).textContent =
      "00:00";

    stopTimer();

    submitExam(
      true
    );

    return;

  }


  const totalSeconds =
    Math.floor(
      remaining / 1000
    );


  const minutes =
    Math.floor(
      totalSeconds / 60
    );


  const seconds =
    totalSeconds % 60;


  document.getElementById(
    "examTimer"
  ).textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


function stopTimer() {

  if (timerInterval) {

    clearInterval(
      timerInterval
    );

    timerInterval = null;

  }

}


/* =========================================================
   SUBMIT BUTTON
========================================================= */

document
  .getElementById("submitBtn")
  .addEventListener(
    "click",
    () => submitExam(false)
  );


/* =========================================================
   SUBMIT EXAM
========================================================= */

async function submitExam(
  autoSubmit = false
) {

  if (!currentAttempt) {
    return;
  }


  if (
    !autoSubmit &&
    !confirm(
      "Are you sure you want to submit the exam?"
    )
  ) {

    return;

  }


  stopTimer();


  try {

    const {
      data: answers,
      error
    } =
      await supabaseClient
        .from("student_answers")
        .select(`
          question_id,
          selected_answer,
          is_correct,
          marks_obtained
        `)
        .eq(
          "attempt_id",
          currentAttempt.id
        );


    if (error) {
      throw error;
    }


    let score = 0;
    let correct = 0;
    let wrong = 0;


    const answerMap =
      new Map(
        (answers || []).map(
          answer => [
            answer.question_id,
            answer
          ]
        )
      );


    currentQuestions.forEach(question => {

      const answer =
        answerMap.get(
          question.id
        );


      if (!answer) {
        return;
      }


      if (answer.is_correct) {

        correct++;

        score +=
          Number(
            answer.marks_obtained || 0
          );

      }

      else {

        wrong++;

        score +=
          Number(
            answer.marks_obtained || 0
          );

      }

    });


    const unanswered =
      currentQuestions.length -
      (answers?.length || 0);


    const totalMarks =
      currentQuestions.reduce(
        (total, question) =>
          total +
          Number(
            question.marks || 0
          ),
        0
      );


    const percentage =
      totalMarks > 0
        ? Math.max(
            0,
            Math.min(
              100,
              (score / totalMarks) *
              100
            )
          )
        : 0;


    const passed =
      percentage >=
      Number(
        currentExam.passing_percentage || 0
      );


    const status =
      autoSubmit
        ? "auto_submitted"
        : "submitted";


    const {
      error: updateError
    } =
      await supabaseClient
        .from("exam_attempts")
        .update({

          submitted_at:
            new Date().toISOString(),

          status,

          score,

          correct_answers:
            correct,

          wrong_answers:
            wrong,

          unanswered,

          percentage,

          passed

        })
        .eq(
          "id",
          currentAttempt.id
        );


    if (updateError) {
      throw updateError;
    }


    showExamResult({

      score,

      correct,

      wrong,

      unanswered,

      percentage,

      passed,

      status

    });

  }

  catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Unable to submit exam."
    );

  }

}


/* =========================================================
   RESULT
========================================================= */

function showExamResult(result) {

  document.getElementById(
    "resultExamTitle"
  ).textContent =
    currentExam.title;


  document.getElementById(
    "resultPercentage"
  ).textContent =
    `${Number(
      result.percentage
    ).toFixed(1)}%`;


  document.getElementById(
    "resultStatus"
  ).textContent =
    result.passed
      ? "🎉 Passed"
      : "❌ Failed";


  document.getElementById(
    "resultScore"
  ).textContent =
    Number(
      result.score
    ).toFixed(2);


  document.getElementById(
    "resultCorrect"
  ).textContent =
    result.correct;


  document.getElementById(
    "resultWrong"
  ).textContent =
    result.wrong;


  document.getElementById(
    "resultUnanswered"
  ).textContent =
    result.unanswered;


  const detail =
    document.getElementById(
      "resultDetails"
    );


  detail.innerHTML = `

    <div class="result-summary">

      <div>
        <span>Total Questions</span>
        <strong>
          ${currentQuestions.length}
        </strong>
      </div>

      <div>
        <span>Passing Percentage</span>
        <strong>
          ${Number(
            currentExam.passing_percentage || 0
          )}%
        </strong>
      </div>

      <div>
        <span>Attempt</span>
        <strong>
          #${currentAttempt.attempt_number}
        </strong>
      </div>

    </div>

  `;


  currentAttempt = null;
  currentExam = null;
  currentQuestions = [];
  currentAnswers = {};
  currentQuestionIndex = 0;

  showPage("examResultPage");

}


/* =========================================================
   RESULT BACK
========================================================= */

document
  .getElementById("resultBackBtn")
  .addEventListener(
    "click",
    () => {

      if (
        currentProfile?.role ===
        "teacher"
      ) {

        showPage(
          "teacherDashboard"
        );

      }

      else {

        showPage(
          "studentDashboard"
        );

      }

    }
  );


/* =========================================================
   TEACHER SCORES
========================================================= */

async function loadTeacherScores() {

  const table =
    document.getElementById(
      "scoreTable"
    );

  table.innerHTML =
    `<tr>
      <td colspan="6">
        Loading...
      </td>
    </tr>`;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(`
        score,
        percentage,
        status,
        submitted_at,
        profiles!exam_attempts_student_id_fkey(full_name),
        exams!inner(title,created_by)
      `)
      .eq(
        "exams.created_by",
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
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    table.innerHTML =
      `<tr>
        <td colspan="6">
          Unable to load scores.
        </td>
      </tr>`;

    return;

  }


  table.innerHTML = "";


  if (!data?.length) {

    table.innerHTML =
      `<tr>
        <td colspan="6">
          No student attempts yet.
        </td>
      </tr>`;

    return;

  }


  data.forEach(result => {

    const row =
      document.createElement("tr");


    row.innerHTML = `

      <td>
        ${escapeHTML(
          result.profiles?.full_name ||
          "Student"
        )}
      </td>

      <td>
        ${escapeHTML(
          result.exams?.title ||
          "Exam"
        )}
      </td>

      <td>
        ${Number(
          result.score || 0
        ).toFixed(2)}
      </td>

      <td>
        ${Number(
          result.percentage || 0
        )}%
      </td>

      <td>
        ${escapeHTML(
          result.status
        )}
      </td>

      <td>
        ${formatDate(
          result.submitted_at
        )}
      </td>

    `;


    table.appendChild(row);

  });

}


/* =========================================================
   LOGOUT
========================================================= */

document
  .getElementById("logoutBtn")
  .addEventListener(
    "click",
    async () => {

      stopTimer();

      await supabaseClient.auth.signOut();

      currentUser = null;
      currentProfile = null;

      currentExam = null;
      currentAttempt = null;
      currentQuestions = [];
      currentAnswers = {};

      app.classList.add("hidden");
      loginPage.classList.remove("hidden");

      loginForm.reset();
      signupForm.reset();

      clearMessages();

      loginTab.click();

    }
  );


/* =========================================================
   AUTH STATE
========================================================= */

supabaseClient.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    if (
      session &&
      session.user
    ) {

      currentUser =
        session.user;

      if (!currentProfile) {

        await loadUserProfile();

      }

    }

    else {

      currentUser = null;
      currentProfile = null;

      app.classList.add("hidden");
      loginPage.classList.remove("hidden");

    }

  }
);


/* =========================================================
   INITIAL SESSION
========================================================= */

async function checkExistingSession() {

  const {
    data,
    error
  } =
    await supabaseClient.auth.getSession();


  if (error) {

    console.error(error);

    return;

  }


  if (
    data.session &&
    data.session.user
  ) {

    currentUser =
      data.session.user;

    await loadUserProfile();

  }

}


checkExistingSession();


/* =========================================================
   FRIENDLY AUTH ERROR
========================================================= */

function getFriendlyAuthError(
  message
) {

  const text =
    String(
      message || ""
    ).toLowerCase();


  if (
    text.includes(
      "invalid login credentials"
    )
  ) {

    return "Invalid email or password.";

  }


  if (
    text.includes(
      "user already registered"
    )
  ) {

    return "This email is already registered.";

  }


  if (
    text.includes(
      "password should be at least"
    )
  ) {

    return "Password must be at least 6 characters.";

  }


  if (
    text.includes(
      "email not confirmed"
    )
  ) {

    return "Please confirm your email before logging in.";

  }


  return message ||
    "Something went wrong. Please try again.";

}


/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeAttribute(value) {

  return escapeHTML(value);

}


function formatDate(value) {

  if (!value) {
    return "-";
  }

  return new Date(
    value
  ).toLocaleString(
    "en-IN"
  );

}


function toNullableNumber(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return null;

  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;

}


function localInputToISO(value) {

  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date.toISOString();

}


function shuffleArray(array) {

  for (
    let i = array.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      array[i],
      array[j]
    ] =
    [
      array[j],
      array[i]
    ];

  }

  return array;

}
