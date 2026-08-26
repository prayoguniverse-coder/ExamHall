/* =========================================================
   EXAMHALL
   FINAL VERSION
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

let builderQuestions = [];

let runningExam = null;
let runningQuestions = [];
let runningAnswers = {};
let currentQuestionIndex = 0;
let currentAttempt = null;
let examTimerInterval = null;
let examTimeRemaining = 0;


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

loginTab.addEventListener(
  "click",
  () => {

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");

    clearMessages();

  }
);


signupTab.addEventListener(
  "click",
  () => {

    signupTab.classList.add("active");
    loginTab.classList.remove("active");

    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

    clearMessages();

  }
);


function clearMessages() {

  loginError.textContent = "";
  signupError.textContent = "";
  signupSuccess.textContent = "";

}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    clearMessages();

    const email =
      document
        .getElementById("loginEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
      document.getElementById(
        "loginPassword"
      ).value;

    const button =
      document.getElementById(
        "loginBtn"
      );

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
        getFriendlyAuthError(
          error.message
        );

    }

    finally {

      button.disabled = false;
      button.textContent = "Login";

    }

  }
);


/* =========================================================
   STUDENT SIGNUP
========================================================= */

signupForm.addEventListener(
  "submit",
  async event => {

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
      document.getElementById(
        "signupPassword"
      ).value;

    const confirmPassword =
      document.getElementById(
        "signupConfirmPassword"
      ).value;

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
      document.getElementById(
        "signupBtn"
      );

    button.disabled = true;
    button.textContent =
      "Creating account...";

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
        getFriendlyAuthError(
          error.message
        );

    }

    finally {

      button.disabled = false;

      button.textContent =
        "Create Student Account";

    }

  }
);


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
      .eq(
        "id",
        currentUser.id
      )
      .single();

  if (error) {

    console.error(
      "Profile error:",
      error
    );

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

  if (
    currentProfile.role ===
    "teacher"
  ) {

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

  document.getElementById(
    "userName"
  ).textContent =
    name;

  document.getElementById(
    "userRole"
  ).textContent =
    currentProfile?.role ||
    "student";

  document.getElementById(
    "userAvatar"
  ).textContent =
    name
      .charAt(0)
      .toUpperCase();

  document.getElementById(
    "studentWelcome"
  ).textContent =
    name;

}


/* =========================================================
   PAGE NAVIGATION
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
    document.getElementById(
      pageId
    );

  if (!page) {
    return;
  }

  page.classList.remove("hidden");


  document
    .querySelectorAll(".menu-btn")
    .forEach(button => {

      button.classList.remove("active");

      if (
        button.dataset.page ===
        pageId
      ) {

        button.classList.add("active");

      }

    });


  if (
    pageId ===
    "studentDashboard"
  ) {

    loadStudentDashboard();

  }


  if (
    pageId ===
    "studentResults"
  ) {

    loadStudentResults();

  }


  if (
    pageId ===
    "studentHistory"
  ) {

    loadStudentHistory();

  }


  if (
    pageId ===
    "teacherDashboard"
  ) {

    loadTeacherDashboard();

  }


  if (
    pageId ===
    "createExam"
  ) {

    initializeExamBuilder();

  }


  if (
    pageId ===
    "teacherScores"
  ) {

    loadTeacherScores();

  }


  if (
    pageId ===
    "questionBank"
  ) {

    initializeQuestionBank();

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
    document.getElementById(
      "examList"
    );

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
          max_attempts,
          start_at,
          end_at,
          subjects(name),
          chapters(name)
        `)
        .eq(
          "is_published",
          true
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );

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

    showAvailableExams(
      available
    );

    await loadStudentStats();

  }

  catch (error) {

    console.error(error);

    list.innerHTML =
      `<div class="empty-state">
        <h3>Unable to load exams</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>`;

  }

}


/* =========================================================
   AVAILABLE EXAMS
========================================================= */

function showAvailableExams(exams) {

  const list =
    document.getElementById(
      "examList"
    );

  list.innerHTML = "";

  if (!exams.length) {

    list.innerHTML =
      `<div class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>No exams available</h3>
        <p>
          Your teacher has not published any exams yet.
        </p>
      </div>`;

    return;

  }


  exams.forEach(exam => {

    const item =
      document.createElement(
        "div"
      );

    item.className =
      "exam-item";


    const subject =
      exam.subjects?.name ||
      "General";

    const chapter =
      exam.chapters?.name ||
      "All Chapters";


    item.innerHTML = `

      <div class="exam-info">

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
          ${exam.total_marks} Marks
        </p>

        ${
          exam.description
            ? `<small>
                ${escapeHTML(exam.description)}
               </small>`
            : ""
        }

      </div>

      <button
        class="primary-btn"
        type="button"
      >
        Start Exam
      </button>

    `;


    item
      .querySelector("button")
      .addEventListener(
        "click",
        () => startExam(exam)
      );


    list.appendChild(item);

  });

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
      item =>
        Number(
          item.percentage || 0
        )
    );


  const average =
    Math.round(
      percentages.reduce(
        (a, b) =>
          a + b,
        0
      ) /
      percentages.length
    );


  const best =
    Math.max(
      ...percentages
    );


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
    document.getElementById(
      "myResults"
    );

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
        passed,
        submitted_at,
        status,
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
      `<p>
        Unable to load results.
      </p>`;

    return;

  }


  container.innerHTML = "";


  if (!data.length) {

    container.innerHTML =
      `<div class="empty-state">
        <div class="empty-icon">📄</div>
        <h3>No results yet</h3>
        <p>
          Your completed exams will appear here.
        </p>
      </div>`;

    return;

  }


  data.forEach(result => {

    const item =
      document.createElement(
        "div"
      );

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
          ${formatDate(
            result.submitted_at
          )}
        </p>

      </div>

      <div class="result-mini">

        <strong>
          ${Number(
            result.score || 0
          ).toFixed(2)}
        </strong>

        <span>
          ${Number(
            result.percentage || 0
          )}%
        </span>

        <em class="${
          result.passed
            ? "pass"
            : "fail"
        }">
          ${
            result.passed
              ? "Passed"
              : "Failed"
          }
        </em>

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
    document.getElementById(
      "historyList"
    );

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
      `<p>
        Unable to load history.
      </p>`;

    return;

  }


  container.innerHTML = "";


  if (!data.length) {

    container.innerHTML =
      `<div class="empty-state">
        <div class="empty-icon">🕘</div>
        <h3>No attempts yet</h3>
        <p>
          Your exam attempts will appear here.
        </p>
      </div>`;

    return;

  }


  data.forEach(attempt => {

    const item =
      document.createElement(
        "div"
      );

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
          •
          ${formatDate(
            attempt.submitted_at ||
            attempt.created_at
          )}
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
        total_marks,
        created_at,
        subjects(name),
        chapters(name)
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
    exams.length;


  const {
    data: attempts,
    error: attemptsError
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(
        "student_id,percentage,status,exam_id"
      );


  if (!attemptsError) {

    const completed =
      attempts.filter(
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
          item =>
            item.student_id
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

    else {

      document.getElementById(
        "teacherAverage"
      ).textContent =
        "0%";

    }

  }


  const list =
    document.getElementById(
      "teacherExamList"
    );

  list.innerHTML = "";


  if (!exams.length) {

    list.innerHTML =
      `<div class="empty-state">

        <div class="empty-icon">
          📝
        </div>

        <h3>
          No exams created
        </h3>

        <p>
          Create your first exam from the Create Exam section.
        </p>

      </div>`;

    return;

  }


  exams.forEach(exam => {

    const item =
      document.createElement(
        "div"
      );

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

          ${escapeHTML(
            exam.chapters?.name ||
            "All Chapters"
          )}

          •

          ${exam.duration_minutes}
          Minutes

          •

          ${exam.total_marks}
          Marks

        </p>

      </div>

      <div class="status-badge ${
        exam.is_published
          ? "published"
          : "draft"
      }">

        ${
          exam.is_published
            ? "Published"
            : "Draft"
        }

      </div>

    `;


    list.appendChild(item);

  });

}


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
      <td colspan="5">
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
        <td colspan="5">
          Unable to load scores.
        </td>
      </tr>`;

    return;

  }


  table.innerHTML = "";


  if (!data.length) {

    table.innerHTML =
      `<tr>
        <td colspan="5">
          No student attempts yet.
        </td>
      </tr>`;

    return;

  }


  data.forEach(result => {

    const row =
      document.createElement(
        "tr"
      );

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
        ${formatDate(
          result.submitted_at
        )}
      </td>

    `;

    table.appendChild(row);

  });

}


/* =========================================================
   EXAM BUILDER
========================================================= */

let builderInitialized = false;


async function initializeExamBuilder() {

  if (
    builderInitialized
  ) {
    return;
  }

  builderInitialized = true;

  builderQuestions = [];

  await loadSubjects();

  renderQuestionBuilder();

}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects() {

  const select =
    document.getElementById(
      "examSubject"
    );

  select.innerHTML =
    `<option value="">
      Select Subject
    </option>`;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("subjects")
      .select(
        "id,name"
      )
      .order(
        "name",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(error);

    return;

  }


  (data || []).forEach(subject => {

    const option =
      document.createElement(
        "option"
      );

    option.value =
      subject.id;

    option.textContent =
      subject.name;

    select.appendChild(option);

  });

}


/* =========================================================
   SUBJECT -> CHAPTER
========================================================= */

document
  .getElementById("examSubject")
  .addEventListener(
    "change",
    async event => {

      await loadChapters(
        event.target.value
      );

    }
  );


async function loadChapters(subjectId) {

  const select =
    document.getElementById(
      "examChapter"
    );

  select.innerHTML =
    `<option value="">
      All Chapters
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
      .select(
        "id,name"
      )
      .eq(
        "subject_id",
        subjectId
      )
      .order(
        "name",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(error);

    return;

  }


  (data || []).forEach(chapter => {

    const option =
      document.createElement(
        "option"
      );

    option.value =
      chapter.id;

    option.textContent =
      chapter.name;

    select.appendChild(option);

  });

}


/* =========================================================
   ADD QUESTION
========================================================= */

document
  .getElementById("addQuestionBtn")
  .addEventListener(
    "click",
    () => {

      builderQuestions.push({

        localId:
          Date.now() +
          Math.random(),

        question_text: "",

        image_url: "",

        option_a: "",

        option_b: "",

        option_c: "",

        option_d: "",

        correct_answer: "A",

        explanation: "",

        marks: 1,

        negative_marks: 0,

        question_order:
          builderQuestions.length + 1

      });

      renderQuestionBuilder();

    }
  );


/* =========================================================
   RENDER QUESTION BUILDER
========================================================= */

function renderQuestionBuilder() {

  const container =
    document.getElementById(
      "questionBuilder"
    );

  if (!builderQuestions.length) {

    container.innerHTML =
      `<div class="empty-state small-empty">

        <div class="empty-icon">
          ❓
        </div>

        <h3>
          No questions added
        </h3>

        <p>
          Click "Add Question" to create your first question.
        </p>

      </div>`;

    return;

  }


  container.innerHTML = "";


  builderQuestions.forEach(
    (question, index) => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "question-builder-card";


      card.innerHTML = `

        <div class="question-builder-top">

          <h3>
            Question ${index + 1}
          </h3>

          <button
            type="button"
            class="remove-question-btn"
          >
            🗑 Remove
          </button>

        </div>


        <div class="form-group">

          <label>
            Question Text *
          </label>

          <textarea
            rows="3"
            class="builder-question-text"
            placeholder="Enter question"
          >${escapeHTML(
            question.question_text
          )}</textarea>

        </div>


        <div class="form-group">

          <label>
            Question Image URL
          </label>

          <input
            type="url"
            class="builder-image-url"
            placeholder="https://..."
            value="${escapeAttribute(
              question.image_url
            )}"
          >

        </div>


        <div class="options-builder">

          <div class="form-group">

            <label>
              Option A *
            </label>

            <input
              type="text"
              class="builder-option-a"
              value="${escapeAttribute(
                question.option_a
              )}"
              placeholder="Option A"
            >

          </div>


          <div class="form-group">

            <label>
              Option B *
            </label>

            <input
              type="text"
              class="builder-option-b"
              value="${escapeAttribute(
                question.option_b
              )}"
              placeholder="Option B"
            >

          </div>


          <div class="form-group">

            <label>
              Option C
            </label>

            <input
              type="text"
              class="builder-option-c"
              value="${escapeAttribute(
                question.option_c
              )}"
              placeholder="Option C"
            >

          </div>


          <div class="form-group">

            <label>
              Option D
            </label>

            <input
              type="text"
              class="builder-option-d"
              value="${escapeAttribute(
                question.option_d
              )}"
              placeholder="Option D"
            >

          </div>

        </div>


        <div class="form-grid">

          <div class="form-group">

            <label>
              Correct Answer *
            </label>

            <select class="builder-correct-answer">

              <option value="A"
                ${question.correct_answer === "A" ? "selected" : ""}>
                A
              </option>

              <option value="B"
                ${question.correct_answer === "B" ? "selected" : ""}>
                B
              </option>

              <option value="C"
                ${question.correct_answer === "C" ? "selected" : ""}>
                C
              </option>

              <option value="D"
                ${question.correct_answer === "D" ? "selected" : ""}>
                D
              </option>

            </select>

          </div>


          <div class="form-group">

            <label>
              Marks
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              class="builder-marks"
              value="${question.marks}"
            >

          </div>


          <div class="form-group">

            <label>
              Negative Marks
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              class="builder-negative"
              value="${question.negative_marks}"
            >

          </div>

        </div>


        <div class="form-group">

          <label>
            Explanation
          </label>

          <textarea
            rows="2"
            class="builder-explanation"
            placeholder="Explain the correct answer"
          >${escapeHTML(
            question.explanation
          )}</textarea>

        </div>

      `;


      const get =
        selector =>
          card.querySelector(
            selector
          );


      get(".builder-question-text")
        .addEventListener(
          "input",
          event => {

            question.question_text =
              event.target.value;

          }
        );


      get(".builder-image-url")
        .addEventListener(
          "input",
          event => {

            question.image_url =
              event.target.value;

          }
        );


      get(".builder-option-a")
        .addEventListener(
          "input",
          event => {

            question.option_a =
              event.target.value;

          }
        );


      get(".builder-option-b")
        .addEventListener(
          "input",
          event => {

            question.option_b =
              event.target.value;

          }
        );


      get(".builder-option-c")
        .addEventListener(
          "input",
          event => {

            question.option_c =
              event.target.value;

          }
        );


      get(".builder-option-d")
        .addEventListener(
          "input",
          event => {

            question.option_d =
              event.target.value;

          }
        );


      get(".builder-correct-answer")
        .addEventListener(
          "change",
          event => {

            question.correct_answer =
              event.target.value;

          }
        );


      get(".builder-marks")
        .addEventListener(
          "input",
          event => {

            question.marks =
              Number(
                event.target.value
              ) || 0;

          }
        );


      get(".builder-negative")
        .addEventListener(
          "input",
          event => {

            question.negative_marks =
              Number(
                event.target.value
              ) || 0;

          }
        );


      get(".builder-explanation")
        .addEventListener(
          "input",
          event => {

            question.explanation =
              event.target.value;

          }
        );


      get(".remove-question-btn")
        .addEventListener(
          "click",
          () => {

            builderQuestions =
              builderQuestions.filter(
                item =>
                  item.localId !==
                  question.localId
              );

            renumberQuestions();

            renderQuestionBuilder();

          }
        );


      container.appendChild(card);

    }
  );

}


/* =========================================================
   RENUMBER
========================================================= */

function renumberQuestions() {

  builderQuestions.forEach(
    (question, index) => {

      question.question_order =
        index + 1;

    }
  );

}


/* =========================================================
   VALIDATE EXAM
========================================================= */

function validateExam() {

  const title =
    document
      .getElementById(
        "examTitleInput"
      )
      .value
      .trim();

  const subjectId =
    document.getElementById(
      "examSubject"
    ).value;

  const duration =
    Number(
      document.getElementById(
        "examDuration"
      ).value
    );

  const totalMarks =
    Number(
      document.getElementById(
        "examTotalMarks"
      ).value
    );

  const passing =
    Number(
      document.getElementById(
        "examPassing"
      ).value
    );


  if (!title) {

    return "Exam title is required.";

  }


  if (!subjectId) {

    return "Please select a subject.";

  }


  if (
    !duration ||
    duration < 1
  ) {

    return "Duration must be at least 1 minute.";

  }


  if (
    !totalMarks ||
    totalMarks <= 0
  ) {

    return "Total marks must be greater than 0.";

  }


  if (
    passing < 0 ||
    passing > 100
  ) {

    return "Passing percentage must be between 0 and 100.";

  }


  if (!builderQuestions.length) {

    return "Please add at least one question.";

  }


  for (
    let i = 0;
    i < builderQuestions.length;
    i++
  ) {

    const q =
      builderQuestions[i];

    if (
      !q.question_text.trim()
    ) {

      return `Question ${i + 1} text is required.`;

    }


    if (
      !q.option_a.trim() ||
      !q.option_b.trim()
    ) {

      return `Question ${i + 1}: Option A and Option B are required.`;

    }


    if (
      q.correct_answer === "C" &&
      !q.option_c.trim()
    ) {

      return `Question ${i + 1}: Option C is empty.`;

    }


    if (
      q.correct_answer === "D" &&
      !q.option_d.trim()
    ) {

      return `Question ${i + 1}: Option D is empty.`;

    }


    if (
      Number(q.marks) <= 0
    ) {

      return `Question ${i + 1}: Marks must be greater than 0.`;

    }

  }


  return null;

}


/* =========================================================
   GET EXAM FORM DATA
========================================================= */

function getExamFormData(
  published
) {

  return {

    title:
      document
        .getElementById(
          "examTitleInput"
        )
        .value
        .trim(),

    description:
      document
        .getElementById(
          "examDescription"
        )
        .value
        .trim(),

    subject_id:
      Number(
        document.getElementById(
          "examSubject"
        ).value
      ),

    chapter_id:
      document.getElementById(
        "examChapter"
      ).value
        ? Number(
            document.getElementById(
              "examChapter"
            ).value
          )
        : null,

    duration_minutes:
      Number(
        document.getElementById(
          "examDuration"
        ).value
      ),

    total_marks:
      Number(
        document.getElementById(
          "examTotalMarks"
        ).value
      ),

    passing_percentage:
      Number(
        document.getElementById(
          "examPassing"
        ).value
      ) || 0,

    negative_marking:
      Number(
        document.getElementById(
          "examNegative"
        ).value
      ) || 0,

    max_attempts:
      Number(
        document.getElementById(
          "examMaxAttempts"
        ).value
      ) || 1,

    randomize_questions:
      document.getElementById(
        "randomizeQuestions"
      ).checked,

    randomize_options:
      document.getElementById(
        "randomizeOptions"
      ).checked,

    show_result_immediately:
      document.getElementById(
        "showResultImmediately"
      ).checked,

    show_explanations:
      document.getElementById(
        "showExplanations"
      ).checked,

    is_published:
      published

  };

}


/* =========================================================
   SAVE DRAFT
========================================================= */

document
  .getElementById("saveDraftBtn")
  .addEventListener(
    "click",
    () => saveExam(false)
  );


/* =========================================================
   PUBLISH
========================================================= */

document
  .getElementById("publishExamBtn")
  .addEventListener(
    "click",
    () => saveExam(true)
  );


/* =========================================================
   SAVE EXAM
========================================================= */

async function saveExam(
  published
) {

  const message =
    document.getElementById(
      "examFormMessage"
    );

  const validation =
    validateExam();

  if (validation) {

    message.className =
      "form-message error";

    message.textContent =
      validation;

    return;

  }


  const saveButton =
    published
      ? document.getElementById(
          "publishExamBtn"
        )
      : document.getElementById(
          "saveDraftBtn"
        );


  saveButton.disabled = true;

  saveButton.textContent =
    published
      ? "Publishing..."
      : "Saving...";


  try {

    const examData =
      getExamFormData(
        published
      );


    /*
      First create exam.
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
            examData.title,

          description:
            examData.description,

          subject_id:
            examData.subject_id,

          chapter_id:
            examData.chapter_id,

          duration_minutes:
            examData.duration_minutes,

          total_marks:
            examData.total_marks,

          passing_percentage:
            examData.passing_percentage,

          negative_marking:
            examData.negative_marking,

          max_attempts:
            examData.max_attempts,

          randomize_questions:
            examData.randomize_questions,

          randomize_options:
            examData.randomize_options,

          show_result_immediately:
            examData.show_result_immediately,

          show_explanations:
            examData.show_explanations,

          is_published:
            examData.is_published

        })
        .select()
        .single();


    if (examError) {
      throw examError;
    }


    /*
      Insert questions.
    */

    const questions =
      builderQuestions.map(
        (question, index) => ({

          exam_id:
            exam.id,

          question_text:
            question.question_text.trim(),

          image_url:
            question.image_url.trim() ||
            null,

          option_a:
            question.option_a.trim(),

          option_b:
            question.option_b.trim(),

          option_c:
            question.option_c.trim() ||
            null,

          option_d:
            question.option_d.trim() ||
            null,

          correct_answer:
            question.correct_answer,

          explanation:
            question.explanation.trim() ||
            null,

          marks:
            Number(
              question.marks
            ),

          negative_marks:
            Number(
              question.negative_marks
            ) || 0,

          question_order:
            index + 1

        })
      );


    const {
      error: questionError
    } =
      await supabaseClient
        .from("questions")
        .insert(
          questions
        );


    if (questionError) {

      /*
        If question insert fails,
        remove the newly created exam.
      */

      await supabaseClient
        .from("exams")
        .delete()
        .eq(
          "id",
          exam.id
        );

      throw questionError;

    }


    message.className =
      "form-message success";

    message.textContent =
      published
        ? "Exam published successfully."
        : "Exam saved as draft successfully.";


    alert(
      published
        ? "Exam Published Successfully!"
        : "Exam Saved as Draft!"
    );


    resetExamBuilder();

    showPage(
      "teacherDashboard"
    );

  }

  catch (error) {

    console.error(
      "Save exam error:",
      error
    );

    message.className =
      "form-message error";

    message.textContent =
      error.message ||
      "Unable to save exam.";

  }

  finally {

    saveButton.disabled = false;

    saveButton.textContent =
      published
        ? "🚀 Publish Exam"
        : "💾 Save Draft";

  }

}


/* =========================================================
   RESET BUILDER
========================================================= */

function resetExamBuilder() {

  builderQuestions = [];

  builderInitialized = false;

  document
    .getElementById(
      "examForm"
    )
    .reset();

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
    "examDuration"
  ).value = 30;

  document.getElementById(
    "examTotalMarks"
  ).value = 10;

  document.getElementById(
    "showResultImmediately"
  ).checked = true;

  document.getElementById(
    "showExplanations"
  ).checked = true;

  renderQuestionBuilder();

}


/* =========================================================
   QUESTION BANK — STATE
========================================================= */

let qbInitialized = false;
let qbQuestions = [];
let qbEditingId = null;


/* =========================================================
   QUESTION BANK — INIT
========================================================= */

async function initializeQuestionBank() {

  if (!qbInitialized) {

    qbInitialized = true;

    await populateSubjectSelect(
      document.getElementById("qbFilterSubject"),
      "All Subjects"
    );

    await populateSubjectSelect(
      document.getElementById("qSubject"),
      "Select Subject"
    );

    await populateSubjectSelect(
      document.getElementById("bulkSubject"),
      "Select Subject"
    );

    wireQuestionBankEvents();

  }

  await loadQuestionBank();

}


/* =========================================================
   QUESTION BANK — SUBJECT / CHAPTER / TOPIC HELPERS
========================================================= */

async function populateSubjectSelect(select, placeholder) {

  if (!select) {
    return;
  }

  const currentValue = select.value;

  select.innerHTML =
    `<option value="">${placeholder}</option>`;

  const { data, error } =
    await supabaseClient
      .from("subjects")
      .select("id,name")
      .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  (data || []).forEach(subject => {

    const option = document.createElement("option");

    option.value = subject.id;
    option.textContent = subject.name;

    select.appendChild(option);

  });

  if (currentValue) {
    select.value = currentValue;
  }

}


async function populateChapterSelect(select, subjectId, placeholder) {

  if (!select) {
    return;
  }

  select.innerHTML =
    `<option value="">${placeholder}</option>`;

  if (!subjectId) {
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("chapters")
      .select("id,name")
      .eq("subject_id", subjectId)
      .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  (data || []).forEach(chapter => {

    const option = document.createElement("option");

    option.value = chapter.id;
    option.textContent = chapter.name;

    select.appendChild(option);

  });

}


async function populateTopicSelect(select, chapterId, placeholder) {

  if (!select) {
    return;
  }

  select.innerHTML =
    `<option value="">${placeholder}</option>`;

  if (!chapterId) {
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("topics")
      .select("id,name")
      .eq("chapter_id", chapterId)
      .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  (data || []).forEach(topic => {

    const option = document.createElement("option");

    option.value = topic.id;
    option.textContent = topic.name;

    select.appendChild(option);

  });

}


async function quickAddSubject(select) {

  const name = prompt("New subject name:");

  if (!name || !name.trim()) {
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("subjects")
      .insert({ name: name.trim() })
      .select()
      .single();

  if (error) {
    alert(error.message || "Unable to add subject.");
    return;
  }

  await populateSubjectSelect(select, select.options[0].textContent);

  select.value = data.id;

  select.dispatchEvent(new Event("change"));

}


async function quickAddChapter(select, subjectId) {

  if (!subjectId) {
    alert("Please select a subject first.");
    return;
  }

  const name = prompt("New chapter name:");

  if (!name || !name.trim()) {
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("chapters")
      .insert({ name: name.trim(), subject_id: subjectId })
      .select()
      .single();

  if (error) {
    alert(error.message || "Unable to add chapter.");
    return;
  }

  await populateChapterSelect(select, subjectId, select.options[0].textContent);

  select.value = data.id;

  select.dispatchEvent(new Event("change"));

}


async function quickAddTopic(select, chapterId) {

  if (!chapterId) {
    alert("Please select a chapter first.");
    return;
  }

  const name = prompt("New topic name:");

  if (!name || !name.trim()) {
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("topics")
      .insert({ name: name.trim(), chapter_id: chapterId })
      .select()
      .single();

  if (error) {
    alert(error.message || "Unable to add topic.");
    return;
  }

  await populateTopicSelect(select, chapterId, select.options[0].textContent);

  select.value = data.id;

}


/* =========================================================
   QUESTION BANK — EVENTS (wired once)
========================================================= */

function wireQuestionBankEvents() {

  document.getElementById("qbFilterSubject")
    .addEventListener("change", async event => {

      await populateChapterSelect(
        document.getElementById("qbFilterChapter"),
        event.target.value,
        "All Chapters"
      );

      loadQuestionBank();

    });

  ["qbFilterChapter", "qbFilterDifficulty", "qbFilterType"]
    .forEach(id => {

      document.getElementById(id)
        .addEventListener("change", loadQuestionBank);

    });

  let searchTimeout = null;

  document.getElementById("qbSearchInput")
    .addEventListener("input", () => {

      clearTimeout(searchTimeout);

      searchTimeout = setTimeout(loadQuestionBank, 350);

    });


  document.getElementById("addQuestionBankBtn")
    .addEventListener("click", () => openQuestionForm(null));

  document.getElementById("cancelQuestionBtn")
    .addEventListener("click", closeQuestionForm);

  document.getElementById("questionForm")
    .addEventListener("submit", saveQuestionToBank);

  document.getElementById("qType")
    .addEventListener("change", updateQuestionFormForType);


  document.getElementById("qSubject")
    .addEventListener("change", async event => {

      await populateChapterSelect(
        document.getElementById("qChapter"),
        event.target.value,
        "Select Chapter"
      );

      await populateTopicSelect(
        document.getElementById("qTopic"),
        null,
        "Select Topic"
      );

    });

  document.getElementById("qChapter")
    .addEventListener("change", async event => {

      await populateTopicSelect(
        document.getElementById("qTopic"),
        event.target.value,
        "Select Topic"
      );

    });

  document.getElementById("qAddSubjectBtn")
    .addEventListener("click", () =>
      quickAddSubject(document.getElementById("qSubject"))
    );

  document.getElementById("qAddChapterBtn")
    .addEventListener("click", () =>
      quickAddChapter(
        document.getElementById("qChapter"),
        document.getElementById("qSubject").value
      )
    );

  document.getElementById("qAddTopicBtn")
    .addEventListener("click", () =>
      quickAddTopic(
        document.getElementById("qTopic"),
        document.getElementById("qChapter").value
      )
    );


  // correct-answer checkboxes: enforce single-select unless multiple_answer
  document.querySelectorAll(".q-correct-check")
    .forEach(box => {

      box.addEventListener("change", () => {

        const type = document.getElementById("qType").value;

        if (type !== "multiple_answer" && box.checked) {

          document.querySelectorAll(".q-correct-check")
            .forEach(other => {

              if (other !== box) {
                other.checked = false;
              }

            });

        }

      });

    });


  document.getElementById("bulkImportOpenBtn")
    .addEventListener("click", () => {

      document.getElementById("bulkImportPanel").classList.remove("hidden");
      document.getElementById("questionFormPanel").classList.add("hidden");

    });

  document.getElementById("bulkImportCancelBtn")
    .addEventListener("click", () => {

      document.getElementById("bulkImportPanel").classList.add("hidden");

    });

  document.getElementById("bulkSubject")
    .addEventListener("change", event => {

      populateChapterSelect(
        document.getElementById("bulkChapter"),
        event.target.value,
        "Select Chapter"
      );

    });

  document.getElementById("bulkImportSubmitBtn")
    .addEventListener("click", submitBulkImport);

}


/* =========================================================
   QUESTION BANK — LOAD & RENDER LIST
========================================================= */

async function loadQuestionBank() {

  const list = document.getElementById("questionBankList");

  list.innerHTML =
    `<div class="loading">Loading questions...</div>`;

  let query =
    supabaseClient
      .from("questions")
      .select(`
        id, question_text, question_type, difficulty, marks, negative_marks,
        class, subject_id, chapter_id, topic_id,
        subjects(name), chapters(name), topics(name)
      `)
      .eq("created_by", currentUser.id)
      .order("created_at", { ascending: false });

  const subjectFilter = document.getElementById("qbFilterSubject").value;
  const chapterFilter = document.getElementById("qbFilterChapter").value;
  const difficultyFilter = document.getElementById("qbFilterDifficulty").value;
  const typeFilter = document.getElementById("qbFilterType").value;
  const search = document.getElementById("qbSearchInput").value.trim();

  if (subjectFilter) {
    query = query.eq("subject_id", subjectFilter);
  }

  if (chapterFilter) {
    query = query.eq("chapter_id", chapterFilter);
  }

  if (difficultyFilter) {
    query = query.eq("difficulty", difficultyFilter);
  }

  if (typeFilter) {
    query = query.eq("question_type", typeFilter);
  }

  if (search) {
    query = query.ilike("question_text", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {

    console.error(error);

    list.innerHTML =
      `<div class="empty-state">
        <h3>Unable to load questions</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>`;

    return;

  }

  qbQuestions = data || [];

  document.getElementById("qbCount").textContent = qbQuestions.length;

  renderQuestionBankList();

}


function renderQuestionBankList() {

  const list = document.getElementById("questionBankList");

  list.innerHTML = "";

  if (!qbQuestions.length) {

    list.innerHTML =
      `<div class="empty-state small-empty">
        <div class="empty-icon">❓</div>
        <h3>No questions found</h3>
        <p>Add your first question or adjust your filters.</p>
      </div>`;

    return;

  }

  const typeLabels = {
    mcq: "MCQ",
    multiple_answer: "Multiple Answer",
    true_false: "True / False"
  };

  qbQuestions.forEach(question => {

    const item = document.createElement("div");

    item.className = "qb-item";

    item.innerHTML = `

      <div class="qb-item-main">

        <h4>${escapeHTML(question.question_text)}</h4>

        <p>
          ${escapeHTML(question.subjects?.name || "General")}
          ${question.chapters?.name ? " • " + escapeHTML(question.chapters.name) : ""}
          ${question.topics?.name ? " • " + escapeHTML(question.topics.name) : ""}
          ${question.class ? " • Class " + escapeHTML(question.class) : ""}
          • ${question.marks} Marks
        </p>

        <div class="qb-badges">

          <span class="badge badge-${escapeHTML(question.difficulty)}">
            ${escapeHTML(question.difficulty)}
          </span>

          <span class="badge">
            ${typeLabels[question.question_type] || question.question_type}
          </span>

        </div>

      </div>

      <div class="qb-item-actions">

        <button type="button" class="edit-question-btn">✏️ Edit</button>
        <button type="button" class="delete-question-btn">🗑 Delete</button>

      </div>

    `;

    item.querySelector(".edit-question-btn")
      .addEventListener("click", () => editQuestion(question.id));

    item.querySelector(".delete-question-btn")
      .addEventListener("click", () => deleteQuestion(question.id));

    list.appendChild(item);

  });

}


/* =========================================================
   QUESTION BANK — ADD / EDIT FORM
========================================================= */

async function openQuestionForm(questionId) {

  qbEditingId = questionId;

  document.getElementById("bulkImportPanel").classList.add("hidden");

  const panel = document.getElementById("questionFormPanel");

  panel.classList.remove("hidden");

  document.getElementById("questionFormMessage").textContent = "";
  document.getElementById("questionFormMessage").className = "form-message";

  document.getElementById("questionFormTitle").textContent =
    questionId ? "Edit Question" : "Add Question";

  document.getElementById("questionForm").reset();

  document.querySelectorAll(".q-correct-check")
    .forEach(box => box.checked = false);

  if (!questionId) {

    await populateChapterSelect(document.getElementById("qChapter"), null, "Select Chapter");
    await populateTopicSelect(document.getElementById("qTopic"), null, "Select Topic");

    updateQuestionFormForType();

    panel.scrollIntoView({ behavior: "smooth", block: "start" });

    return;

  }

  const { data, error } =
    await supabaseClient
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .single();

  if (error) {

    alert(error.message || "Unable to load question.");

    closeQuestionForm();

    return;

  }

  document.getElementById("qClass").value = data.class || "";
  document.getElementById("qType").value = data.question_type;
  document.getElementById("qDifficulty").value = data.difficulty;
  document.getElementById("qQuestionText").value = data.question_text;
  document.getElementById("qImageUrl").value = data.image_url || "";
  document.getElementById("qOptionA").value = data.option_a || "";
  document.getElementById("qOptionB").value = data.option_b || "";
  document.getElementById("qOptionC").value = data.option_c || "";
  document.getElementById("qOptionD").value = data.option_d || "";
  document.getElementById("qMarks").value = data.marks;
  document.getElementById("qNegative").value = data.negative_marks;
  document.getElementById("qExplanation").value = data.explanation || "";

  const correctKeys = String(data.correct_answer || "").split(",").map(k => k.trim());

  document.getElementById("qCorrectA").checked = correctKeys.includes("A");
  document.getElementById("qCorrectB").checked = correctKeys.includes("B");
  document.getElementById("qCorrectC").checked = correctKeys.includes("C");
  document.getElementById("qCorrectD").checked = correctKeys.includes("D");

  document.getElementById("qSubject").value = data.subject_id || "";

  await populateChapterSelect(document.getElementById("qChapter"), data.subject_id, "Select Chapter");

  document.getElementById("qChapter").value = data.chapter_id || "";

  await populateTopicSelect(document.getElementById("qTopic"), data.chapter_id, "Select Topic");

  document.getElementById("qTopic").value = data.topic_id || "";

  updateQuestionFormForType();

  panel.scrollIntoView({ behavior: "smooth", block: "start" });

}


function editQuestion(id) {

  openQuestionForm(id);

}


function closeQuestionForm() {

  qbEditingId = null;

  document.getElementById("questionFormPanel").classList.add("hidden");

}


function updateQuestionFormForType() {

  const type = document.getElementById("qType").value;

  const cWrap = document.getElementById("qOptionCWrap");
  const dWrap = document.getElementById("qOptionDWrap");

  if (type === "true_false") {

    cWrap.classList.add("hidden");
    dWrap.classList.add("hidden");

    document.getElementById("qOptionA").value = "True";
    document.getElementById("qOptionB").value = "False";

  } else {

    cWrap.classList.remove("hidden");
    dWrap.classList.remove("hidden");

  }

  if (type !== "multiple_answer") {

    const checked = document.querySelector(".q-correct-check:checked");

    document.querySelectorAll(".q-correct-check")
      .forEach(box => {

        if (box !== checked) {
          box.checked = false;
        }

      });

  }

}


async function saveQuestionToBank(event) {

  event.preventDefault();

  const message = document.getElementById("questionFormMessage");

  const subjectId = document.getElementById("qSubject").value;
  const questionText = document.getElementById("qQuestionText").value.trim();
  const type = document.getElementById("qType").value;
  const optionA = document.getElementById("qOptionA").value.trim();
  const optionB = document.getElementById("qOptionB").value.trim();
  const optionC = document.getElementById("qOptionC").value.trim();
  const optionD = document.getElementById("qOptionD").value.trim();
  const marks = Number(document.getElementById("qMarks").value);

  const correctKeys = [];

  if (document.getElementById("qCorrectA").checked) correctKeys.push("A");
  if (document.getElementById("qCorrectB").checked) correctKeys.push("B");
  if (document.getElementById("qCorrectC").checked) correctKeys.push("C");
  if (document.getElementById("qCorrectD").checked) correctKeys.push("D");

  if (!subjectId) {
    message.className = "form-message error";
    message.textContent = "Please select a subject.";
    return;
  }

  if (!questionText) {
    message.className = "form-message error";
    message.textContent = "Question text is required.";
    return;
  }

  if (!optionA || !optionB) {
    message.className = "form-message error";
    message.textContent = "Option A and Option B are required.";
    return;
  }

  if (!correctKeys.length) {
    message.className = "form-message error";
    message.textContent = "Please mark at least one correct answer.";
    return;
  }

  if (type !== "multiple_answer" && correctKeys.length > 1) {
    message.className = "form-message error";
    message.textContent = "Only one correct answer allowed for this question type.";
    return;
  }

  if (!marks || marks <= 0) {
    message.className = "form-message error";
    message.textContent = "Marks must be greater than 0.";
    return;
  }

  const payload = {

    created_by: currentUser.id,
    subject_id: Number(subjectId),
    chapter_id: document.getElementById("qChapter").value
      ? Number(document.getElementById("qChapter").value)
      : null,
    topic_id: document.getElementById("qTopic").value
      ? Number(document.getElementById("qTopic").value)
      : null,
    class: document.getElementById("qClass").value.trim() || null,

    question_type: type,
    question_text: questionText,
    image_url: document.getElementById("qImageUrl").value.trim() || null,

    option_a: optionA,
    option_b: optionB,
    option_c: optionC || null,
    option_d: optionD || null,

    correct_answer: correctKeys.join(","),

    explanation: document.getElementById("qExplanation").value.trim() || null,
    marks: marks,
    negative_marks: Number(document.getElementById("qNegative").value) || 0,
    difficulty: document.getElementById("qDifficulty").value

  };

  const saveButton = document.getElementById("saveQuestionBtn");

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {

    let error;

    if (qbEditingId) {

      ({ error } =
        await supabaseClient
          .from("questions")
          .update(payload)
          .eq("id", qbEditingId));

    } else {

      ({ error } =
        await supabaseClient
          .from("questions")
          .insert(payload));

    }

    if (error) {
      throw error;
    }

    closeQuestionForm();

    await loadQuestionBank();

  }

  catch (error) {

    console.error(error);

    message.className = "form-message error";
    message.textContent = error.message || "Unable to save question.";

  }

  finally {

    saveButton.disabled = false;
    saveButton.textContent = "💾 Save Question";

  }

}


async function deleteQuestion(id) {

  if (!confirm("Delete this question? This cannot be undone.")) {
    return;
  }

  const { error } =
    await supabaseClient
      .from("questions")
      .delete()
      .eq("id", id);

  if (error) {

    alert(error.message || "Unable to delete question. It may be used in an exam.");

    return;

  }

  await loadQuestionBank();

}


/* =========================================================
   QUESTION BANK — BULK IMPORT
========================================================= */

async function submitBulkImport() {

  const message = document.getElementById("bulkImportMessage");
  const subjectId = document.getElementById("bulkSubject").value;
  const chapterId = document.getElementById("bulkChapter").value;
  const rawText = document.getElementById("bulkImportText").value.trim();

  message.className = "form-message";
  message.textContent = "";

  if (!subjectId) {
    message.className = "form-message error";
    message.textContent = "Please select a subject.";
    return;
  }

  if (!rawText) {
    message.className = "form-message error";
    message.textContent = "Please paste questions JSON.";
    return;
  }

  let parsed;

  try {

    parsed = JSON.parse(rawText);

  } catch (error) {

    message.className = "form-message error";
    message.textContent = "Invalid JSON: " + error.message;
    return;

  }

  if (!Array.isArray(parsed) || !parsed.length) {

    message.className = "form-message error";
    message.textContent = "JSON must be a non-empty array of questions.";
    return;

  }

  const rows = [];

  for (let i = 0; i < parsed.length; i++) {

    const q = parsed[i];

    if (!q.question_text || !q.option_a || !q.option_b || !q.correct_answer) {

      message.className = "form-message error";
      message.textContent =
        `Question ${i + 1}: question_text, option_a, option_b and correct_answer are required.`;
      return;

    }

    rows.push({

      created_by: currentUser.id,
      subject_id: Number(subjectId),
      chapter_id: chapterId ? Number(chapterId) : null,
      topic_id: null,
      class: q.class || null,

      question_type: q.question_type || "mcq",
      question_text: q.question_text,
      image_url: q.image_url || null,

      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c || null,
      option_d: q.option_d || null,

      correct_answer: String(q.correct_answer).toUpperCase(),

      explanation: q.explanation || null,
      marks: Number(q.marks) || 1,
      negative_marks: Number(q.negative_marks) || 0,
      difficulty: q.difficulty || "medium"

    });

  }

  const button = document.getElementById("bulkImportSubmitBtn");

  button.disabled = true;
  button.textContent = "Importing...";

  try {

    const { error } =
      await supabaseClient
        .from("questions")
        .insert(rows);

    if (error) {
      throw error;
    }

    message.className = "form-message success";
    message.textContent = `${rows.length} question(s) imported successfully.`;

    document.getElementById("bulkImportText").value = "";

    await loadQuestionBank();

  }

  catch (error) {

    console.error(error);

    message.className = "form-message error";
    message.textContent = error.message || "Unable to import questions.";

  }

  finally {

    button.disabled = false;
    button.textContent = "📥 Import Questions";

  }

}


/* =========================================================
   START EXAM
========================================================= */

async function startExam(
  exam
) {

  try {

    /*
      Check attempt count.
    */

    const {
      data: attempts,
      error: attemptError
    } =
      await supabaseClient
        .from("exam_attempts")
        .select(
          "id,attempt_number,status"
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
        "You have already used all allowed attempts for this exam."
      );

      return;

    }


    /*
      Get questions.
    */

    const {
      data: questions,
      error: questionError
    } =
      await supabaseClient
        .from("questions")
        .select(`
          id,
          exam_id,
          question_text,
          image_url,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          explanation,
          marks,
          negative_marks,
          question_order
        `)
        .eq(
          "exam_id",
          exam.id
        )
        .order(
          "question_order",
          {
            ascending: true
          }
        );


    if (questionError) {
      throw questionError;
    }


    if (!questions?.length) {

      alert(
        "This exam has no questions yet."
      );

      return;

    }


    /*
      Create attempt.
    */

    const nextAttemptNumber =
      completedAttempts.length + 1;


    const {
      data: attempt,
      error: createAttemptError
    } =
      await supabaseClient
        .from("exam_attempts")
        .insert({

          exam_id:
            exam.id,

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
            questions.length,

          percentage:
            0,

          passed:
            false

        })
        .select()
        .single();


    if (createAttemptError) {
      throw createAttemptError;
    }


    runningExam =
      exam;

    currentAttempt =
      attempt;

    runningAnswers = {};

    currentQuestionIndex = 0;


    runningQuestions =
      questions.map(
        question => {

          const options =
            buildQuestionOptions(
              question,
              exam.randomize_options
            );

          return {

            ...question,

            displayOptions:
              options

          };

        }
      );


    if (
      exam.randomize_questions
    ) {

      runningQuestions =
        shuffle(
          runningQuestions
        );

    }


    examTimeRemaining =
      Number(
        exam.duration_minutes
      ) *
      60;


    showPage(
      "examPage"
    );


    renderRunningQuestion();

    startExamTimer();

  }

  catch (error) {

    console.error(
      "Start exam error:",
      error
    );

    alert(
      error.message ||
      "Unable to start exam."
    );

  }

}


/* =========================================================
   QUESTION OPTIONS
========================================================= */

function buildQuestionOptions(
  question,
  randomize
) {

  const options = [];

  if (
    question.option_a
  ) {

    options.push({
      key: "A",
      text: question.option_a
    });

  }

  if (
    question.option_b
  ) {

    options.push({
      key: "B",
      text: question.option_b
    });

  }

  if (
    question.option_c
  ) {

    options.push({
      key: "C",
      text: question.option_c
    });

  }

  if (
    question.option_d
  ) {

    options.push({
      key: "D",
      text: question.option_d
    });

  }


  return randomize
    ? shuffle(options)
    : options;

}


/* =========================================================
   RENDER RUNNING QUESTION
========================================================= */

function renderRunningQuestion() {

  if (
    !runningQuestions.length
  ) {
    return;
  }


  const question =
    runningQuestions[
      currentQuestionIndex
    ];


  document.getElementById(
    "runningExamTitle"
  ).textContent =
    runningExam.title;


  document.getElementById(
    "questionNumber"
  ).textContent =
    `Question ${
      currentQuestionIndex + 1
    } of ${
      runningQuestions.length
    }`;


  document.getElementById(
    "runningQuestionText"
  ).textContent =
    question.question_text;


  const image =
    document.getElementById(
      "runningQuestionImage"
    );


  if (
    question.image_url
  ) {

    image.src =
      question.image_url;

    image.classList.remove(
      "hidden"
    );

  }

  else {

    image.src = "";

    image.classList.add(
      "hidden"
    );

  }


  const optionsContainer =
    document.getElementById(
      "options"
    );

  optionsContainer.innerHTML = "";


  const selected =
    runningAnswers[
      question.id
    ];


  question.displayOptions
    .forEach(option => {

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "option";

      if (
        selected ===
        option.key
      ) {

        button.classList.add(
          "selected"
        );

      }


      button.innerHTML = `

        <span class="option-letter">
          ${escapeHTML(
            option.key
          )}
        </span>

        <span>
          ${escapeHTML(
            option.text
          )}
        </span>

      `;


      button.addEventListener(
        "click",
        () => {

          runningAnswers[
            question.id
          ] =
            option.key;

          renderRunningQuestion();

        }
      );


      optionsContainer.appendChild(
        button
      );

    });


  document.getElementById(
    "previousBtn"
  ).disabled =
    currentQuestionIndex === 0;


  const isLast =
    currentQuestionIndex ===
    runningQuestions.length - 1;


  document.getElementById(
    "nextBtn"
  ).classList.toggle(
    "hidden",
    isLast
  );


  document.getElementById(
    "submitBtn"
  ).classList.toggle(
    "hidden",
    !isLast
  );


  const progress =
    (
      (
        currentQuestionIndex + 1
      ) /
      runningQuestions.length
    ) *
    100;


  document.getElementById(
    "progressBar"
  ).style.width =
    progress + "%";


  renderQuestionNavigation();

}


/* =========================================================
   QUESTION NAVIGATION
========================================================= */

function renderQuestionNavigation() {

  const container =
    document.getElementById(
      "questionNavigation"
    );

  container.innerHTML = "";


  runningQuestions.forEach(
    (question, index) => {

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

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
        runningAnswers[
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

          renderRunningQuestion();

        }
      );


      container.appendChild(
        button
      );

    }
  );

}


/* =========================================================
   PREVIOUS
========================================================= */

document
  .getElementById(
    "previousBtn"
  )
  .addEventListener(
    "click",
    () => {

      if (
        currentQuestionIndex > 0
      ) {

        currentQuestionIndex--;

        renderRunningQuestion();

      }

    }
  );


/* =========================================================
   NEXT
========================================================= */

document
  .getElementById(
    "nextBtn"
  )
  .addEventListener(
    "click",
    () => {

      if (
        currentQuestionIndex <
        runningQuestions.length - 1
      ) {

        currentQuestionIndex++;

        renderRunningQuestion();

      }

    }
  );


/* =========================================================
   SUBMIT BUTTON
========================================================= */

document
  .getElementById(
    "submitBtn"
  )
  .addEventListener(
    "click",
    () => {

      submitRunningExam(
        "submitted"
      );

    }
  );


/* =========================================================
   TIMER
========================================================= */

function startExamTimer() {

  stopExamTimer();

  updateTimerUI();


  examTimerInterval =
    setInterval(
      () => {

        examTimeRemaining--;

        updateTimerUI();


        if (
          examTimeRemaining <= 0
        ) {

          stopExamTimer();

          submitRunningExam(
            "auto_submitted"
          );

        }

      },
      1000
    );

}


function stopExamTimer() {

  if (
    examTimerInterval
  ) {

    clearInterval(
      examTimerInterval
    );

    examTimerInterval =
      null;

  }

}


function updateTimerUI() {

  const minutes =
    Math.floor(
      examTimeRemaining / 60
    );

  const seconds =
    examTimeRemaining % 60;


  document.getElementById(
    "examTimer"
  ).textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


  if (
    examTimeRemaining <= 60
  ) {

    document
      .getElementById(
        "examTimer"
      )
      .classList.add(
        "timer-danger"
      );

  }

  else {

    document
      .getElementById(
        "examTimer"
      )
      .classList.remove(
        "timer-danger"
      );

  }

}


/* =========================================================
   SUBMIT EXAM
========================================================= */

async function submitRunningExam(
  status = "submitted"
) {

  if (
    !currentAttempt ||
    !runningExam
  ) {

    return;

  }


  const button =
    document.getElementById(
      "submitBtn"
    );

  button.disabled = true;

  stopExamTimer();


  try {

    /*
      Calculate result.
    */

    let score = 0;
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;


    const answersToInsert = [];


    runningQuestions.forEach(
      question => {

        const selected =
          runningAnswers[
            question.id
          ] ||
          null;


        let isCorrect =
          false;

        let marksObtained =
          0;


        if (!selected) {

          unanswered++;

        }

        else if (
          selected ===
          question.correct_answer
        ) {

          isCorrect = true;

          correct++;

          marksObtained =
            Number(
              question.marks || 0
            );

          score +=
            marksObtained;

        }

        else {

          wrong++;

          marksObtained =
            -Number(
              question.negative_marks ||
              runningExam.negative_marking ||
              0
            );

          score +=
            marksObtained;

        }


        answersToInsert.push({

          attempt_id:
            currentAttempt.id,

          question_id:
            question.id,

          selected_answer:
            selected,

          is_correct:
            isCorrect,

          marks_obtained:
            marksObtained,

          answered_at:
            new Date().toISOString()

        });

      }
    );


    const totalMarks =
      Number(
        runningExam.total_marks || 0
      );


    let percentage =
      totalMarks > 0
        ? (
            score /
            totalMarks
          ) *
          100
        : 0;


    /*
      Keep percentage in 0-100 range.
    */

    percentage =
      Math.max(
        0,
        Math.min(
          100,
          percentage
        )
      );


    const passed =
      percentage >=
      Number(
        runningExam.passing_percentage || 0
      );


    /*
      Insert student answers.
    */

    const {
      error: answerError
    } =
      await supabaseClient
        .from("student_answers")
        .insert(
          answersToInsert
        );


    if (answerError) {

      throw answerError;

    }


    /*
      Update attempt.
    */

    const {
      data: updatedAttempt,
      error: updateError
    } =
      await supabaseClient
        .from("exam_attempts")
        .update({

          submitted_at:
            new Date().toISOString(),

          status:
            status,

          score:
            score,

          correct_answers:
            correct,

          wrong_answers:
            wrong,

          unanswered:
            unanswered,

          percentage:
            percentage,

          passed:
            passed

        })
        .eq(
          "id",
          currentAttempt.id
        )
        .select()
        .single();


    if (updateError) {

      throw updateError;

    }


    currentAttempt =
      updatedAttempt;


    showResult(
      score,
      percentage,
      correct,
      wrong,
      unanswered,
      passed
    );

  }

  catch (error) {

    console.error(
      "Submit error:",
      error
    );

    alert(
      error.message ||
      "Unable to submit exam."
    );

    button.disabled = false;

  }

}


/* =========================================================
   SHOW RESULT
========================================================= */

async function showResult(
  score,
  percentage,
  correct,
  wrong,
  unanswered,
  passed
) {

  stopExamTimer();

  showPage(
    "resultPage"
  );


  document.getElementById(
    "resultExamName"
  ).textContent =
    runningExam.title;


  document.getElementById(
    "resultScore"
  ).textContent =
    Number(
      score
    ).toFixed(2);


  document.getElementById(
    "resultPercentage"
  ).textContent =
    Number(
      percentage
    ).toFixed(2) + "%";


  document.getElementById(
    "resultCorrect"
  ).textContent =
    correct;


  const passedElement =
    document.getElementById(
      "resultPassed"
    );

  passedElement.textContent =
    passed
      ? "PASSED"
      : "FAILED";


  passedElement.className =
    passed
      ? "pass-text"
      : "fail-text";


  const details =
    document.getElementById(
      "resultDetails"
    );


  details.innerHTML = `

    <div class="result-detail-grid">

      <div>
        <span>Correct Answers</span>
        <strong>${correct}</strong>
      </div>

      <div>
        <span>Wrong Answers</span>
        <strong>${wrong}</strong>
      </div>

      <div>
        <span>Unanswered</span>
        <strong>${unanswered}</strong>
      </div>

      <div>
        <span>Passing Percentage</span>
        <strong>
          ${Number(
            runningExam.passing_percentage || 0
          )}%
        </strong>
      </div>

    </div>

  `;


  /*
    Load answer review if explanations enabled.
  */

  if (
    runningExam.show_explanations
  ) {

    await loadResultReview(
      details
    );

  }


  /*
    Reset exam state after result.
  */

  runningExam = null;
  runningQuestions = [];
  runningAnswers = {};
  currentAttempt = null;
  currentQuestionIndex = 0;

}


/* =========================================================
   RESULT REVIEW
========================================================= */

async function loadResultReview(
  container
) {

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
        id,
        selected_answer,
        is_correct,
        marks_obtained,
        question_id,
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
        currentAttempt.id
      )
      .order(
        "id",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(error);

    return;

  }


  if (!data?.length) {
    return;
  }


  const review =
    document.createElement(
      "div"
    );

  review.className =
    "review-section";


  review.innerHTML =
    `<h3>
      Answer Review
    </h3>`;


  data.forEach(
    (answer, index) => {

      const q =
        answer.questions;

      if (!q) {
        return;
      }


      const item =
        document.createElement(
          "div"
        );

      item.className =
        "review-item";


      item.innerHTML = `

        <div class="review-question">

          <strong>
            Q${index + 1}.
            ${escapeHTML(
              q.question_text
            )}
          </strong>

        </div>


        <p>
          Your Answer:
          <strong>
            ${
              answer.selected_answer
                ? escapeHTML(
                    getOptionText(
                      q,
                      answer.selected_answer
                    )
                  )
                : "Not Answered"
            }
          </strong>
        </p>


        <p>
          Correct Answer:
          <strong>
            ${escapeHTML(
              getOptionText(
                q,
                q.correct_answer
              )
            )}
          </strong>
        </p>


        ${
          q.explanation
            ? `<div class="explanation">
                <strong>Explanation:</strong>
                ${escapeHTML(
                  q.explanation
                )}
               </div>`
            : ""
        }

      `;


      review.appendChild(
        item
      );

    }
  );


  container.appendChild(
    review
  );

}


/* =========================================================
   GET OPTION TEXT
========================================================= */

function getOptionText(
  question,
  key
) {

  if (
    key === "A"
  ) {
    return question.option_a || "";
  }

  if (
    key === "B"
  ) {
    return question.option_b || "";
  }

  if (
    key === "C"
  ) {
    return question.option_c || "";
  }

  if (
    key === "D"
  ) {
    return question.option_d || "";
  }

  return "";

}


/* =========================================================
   BACK TO DASHBOARD
========================================================= */

document
  .getElementById(
    "backToDashboardBtn"
  )
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
   LOGOUT
========================================================= */

document
  .getElementById(
    "logoutBtn"
  )
  .addEventListener(
    "click",
    async () => {

      stopExamTimer();

      await supabaseClient.auth.signOut();

      currentUser = null;
      currentProfile = null;

      runningExam = null;
      runningQuestions = [];
      runningAnswers = {};
      currentAttempt = null;

      app.classList.add(
        "hidden"
      );

      loginPage.classList.remove(
        "hidden"
      );

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

    console.log(
      "Auth event:",
      event
    );


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

      app.classList.add(
        "hidden"
      );

      loginPage.classList.remove(
        "hidden"
      );

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
   FRIENDLY AUTH ERRORS
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


  return (
    message ||
    "Something went wrong. Please try again."
  );

}


/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHTML(
  value
) {

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


function escapeAttribute(
  value
) {

  return escapeHTML(
    value
  );

}


/* =========================================================
   SHUFFLE
========================================================= */

function shuffle(
  array
) {

  const copy =
    [...array];

  for (
    let i =
      copy.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      copy[i],
      copy[j]
    ] =
    [
      copy[j],
      copy[i]
    ];

  }

  return copy;

}


/* =========================================================
   DATE
========================================================= */

function formatDate(
  value
) {

  if (!value) {
    return "-";
  }

  return new Date(
    value
  ).toLocaleString(
    "en-IN"
  );

}
