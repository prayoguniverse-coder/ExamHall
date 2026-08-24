/* =========================================================
   EXAMHALL
   STEP 2 - EXAM BUILDER + SUPABASE
========================================================= */


/* =========================================================
   SUPABASE CONFIG
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

let builderQuestions = [];
let currentExamId = null;

let currentExam = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentAttemptId = null;
let examTimerInterval = null;


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


/* =========================================================
   CLEAR MESSAGES
========================================================= */

function clearMessages() {

  if (loginError) {
    loginError.textContent = "";
  }

  if (signupError) {
    signupError.textContent = "";
  }

  if (signupSuccess) {
    signupSuccess.textContent = "";
  }

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
      document
        .getElementById("loginPassword")
        .value;

    if (!email || !password) {

      loginError.textContent =
        "Email and password are required.";

      return;

    }

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
      document
        .getElementById("signupPassword")
        .value;

    const confirmPassword =
      document
        .getElementById("signupConfirmPassword")
        .value;

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
        "Account created successfully. You can now login.";

      signupForm.reset();

    }

    catch (error) {

      console.error(error);

      signupError.textContent =
        getFriendlyAuthError(error.message);

    }

    finally {

      button.disabled = false;
      button.textContent =
        "Create Student Account";

    }

  }
);


/* =========================================================
   LOAD PROFILE
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
    currentProfile.role === "teacher"
  ) {

    document
      .getElementById("teacherMenu")
      .classList.remove("hidden");

    document
      .getElementById("studentMenu")
      .classList.add("hidden");

    showPage("teacherDashboard");

    loadTeacherDashboard();

  }

  else {

    document
      .getElementById("studentMenu")
      .classList.remove("hidden");

    document
      .getElementById("teacherMenu")
      .classList.add("hidden");

    showPage("studentDashboard");

    loadStudentDashboard();

  }

}


/* =========================================================
   USER UI
========================================================= */

function updateUserUI() {

  const name =
    currentProfile.full_name ||
    currentUser.email;

  document.getElementById(
    "userName"
  ).textContent = name;

  document.getElementById(
    "userRole"
  ).textContent =
    currentProfile.role;

  document.getElementById(
    "userAvatar"
  ).textContent =
    name
      .charAt(0)
      .toUpperCase();

  const welcome =
    document.getElementById(
      "studentWelcome"
    );

  if (welcome) {
    welcome.textContent = name;
  }

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

  if (pageId === "createExam") {
    initializeExamBuilder();
  }

  if (pageId === "teacherScores") {
    loadTeacherScores();
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
          max_attempts,
          start_at,
          end_at,
          subjects(name),
          chapters(name)
        `)
        .eq("is_published", true)
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {
      throw error;
    }

    document.getElementById(
      "availableExams"
    ).textContent =
      exams.length;

    showAvailableExams(exams);

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

function showAvailableExams(exams) {

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


  exams.forEach(exam => {

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
          ${exam.total_marks} Marks
        </p>

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
        () => startExam(exam.id)
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
    ).textContent = "0%";

    document.getElementById(
      "bestScore"
    ).textContent = "0%";

    return;
  }

  const percentages =
    attempts.map(
      item =>
        Number(item.percentage || 0)
    );

  const average =
    Math.round(
      percentages.reduce(
        (a, b) => a + b,
        0
      ) /
      percentages.length
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
      "<p>Unable to load results.</p>";

    return;

  }

  container.innerHTML = "";

  if (!data.length) {

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
          ${formatDate(
            result.submitted_at
          )}
        </p>

      </div>

      <div class="score">

        ${Number(
          result.score || 0
        ).toFixed(2)}

        <br>

        ${Number(
          result.percentage || 0
        )}%

      </div>

    `;

    container.appendChild(item);

  });

}


/* =========================================================
   STUDENT HISTORY
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

  if (!data.length) {

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
    exams.length;


  const {
    data: attempts,
    error: attemptsError
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(
        "student_id,percentage,status"
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
          Create your first exam from Create Exam.
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

          ${exam.duration_minutes}
          Minutes

        </p>

      </div>

      <strong>
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
        exams(title)
      `)
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

let examBuilderInitialized = false;


async function initializeExamBuilder() {

  if (examBuilderInitialized) {
    return;
  }

  examBuilderInitialized = true;

  builderQuestions = [];

  const addButton =
    document.getElementById(
      "addQuestionBtn"
    );

  if (addButton) {

    addButton.addEventListener(
      "click",
      addQuestion
    );

  }

  const saveButton =
    document.getElementById(
      "saveDraftBtn"
    );

  if (saveButton) {

    saveButton.addEventListener(
      "click",
      () => saveExam(false)
    );

  }

  const publishButton =
    document.getElementById(
      "publishExamBtn"
    );

  if (publishButton) {

    publishButton.addEventListener(
      "click",
      () => saveExam(true)
    );

  }

  await loadSubjects();

}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects() {

  const select =
    document.getElementById(
      "examSubjectSelect"
    );

  if (!select) {
    return;
  }

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

    console.error(
      "Subjects error:",
      error
    );

    return;

  }

  select.innerHTML =
    `<option value="">
      Select Subject
    </option>`;

  data.forEach(subject => {

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


  select.onchange =
    async function () {

      await loadChapters(
        select.value
      );

    };

}


/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadChapters(
  subjectId
) {

  const select =
    document.getElementById(
      "examChapterSelect"
    );

  if (!select) {
    return;
  }

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

    console.error(
      "Chapters error:",
      error
    );

    return;

  }

  data.forEach(chapter => {

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

function addQuestion() {

  const question = {

    id:
      Date.now(),

    question_text:
      "",

    image_url:
      "",

    option_a:
      "",

    option_b:
      "",

    option_c:
      "",

    option_d:
      "",

    correct_answer:
      "A",

    explanation:
      "",

    marks:
      1,

    negative_marks:
      0

  };

  builderQuestions.push(question);

  renderQuestionBuilder();

}


/* =========================================================
   REMOVE QUESTION
========================================================= */

function removeQuestion(
  questionId
) {

  builderQuestions =
    builderQuestions.filter(
      question =>
        question.id !== questionId
    );

  renderQuestionBuilder();

}


/* =========================================================
   UPDATE QUESTION
========================================================= */

function updateQuestion(
  questionId,
  field,
  value
) {

  const question =
    builderQuestions.find(
      item =>
        item.id === questionId
    );

  if (!question) {
    return;
  }

  question[field] = value;

}


/* =========================================================
   RENDER QUESTIONS
========================================================= */

function renderQuestionBuilder() {

  const container =
    document.getElementById(
      "questionBuilderList"
    );

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!builderQuestions.length) {

    container.innerHTML =
      `<div
        id="noQuestionsMessage"
        class="empty-state"
      >

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


  builderQuestions.forEach(
    (question, index) => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "question-builder-card";


      card.innerHTML = `

        <div class="question-builder-title">

          <div>

            <strong>
              Question ${index + 1}
            </strong>

            <span>
              Configure question
            </span>

          </div>

          <button
            type="button"
            class="remove-question-btn"
          >
            🗑️ Remove
          </button>

        </div>


        <div class="form-grid">


          <div class="form-group full-width">

            <label>
              Question *
            </label>

            <textarea
              class="builder-question-text"
              rows="3"
              placeholder="Enter question..."
            >${escapeHTML(
              question.question_text
            )}</textarea>

          </div>


          <div class="form-group full-width">

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


          <div class="form-group">

            <label>
              Correct Answer *
            </label>

            <select
              class="builder-correct-answer"
            >

              <option
                value="A"
                ${
                  question.correct_answer === "A"
                    ? "selected"
                    : ""
                }
              >
                Option A
              </option>

              <option
                value="B"
                ${
                  question.correct_answer === "B"
                    ? "selected"
                    : ""
                }
              >
                Option B
              </option>

              <option
                value="C"
                ${
                  question.correct_answer === "C"
                    ? "selected"
                    : ""
                }
              >
                Option C
              </option>

              <option
                value="D"
                ${
                  question.correct_answer === "D"
                    ? "selected"
                    : ""
                }
              >
                Option D
              </option>

            </select>

          </div>


          <div class="form-group">

            <label>
              Marks *
            </label>

            <input
              type="number"
              class="builder-marks"
              min="0"
              step="0.01"
              value="${question.marks}"
            >

          </div>


          <div class="form-group">

            <label>
              Negative Marks
            </label>

            <input
              type="number"
              class="builder-negative-marks"
              min="0"
              step="0.01"
              value="${question.negative_marks}"
            >

          </div>


          <div class="form-group full-width">

            <label>
              Explanation
            </label>

            <textarea
              class="builder-explanation"
              rows="3"
              placeholder="Explain the correct answer..."
            >${escapeHTML(
              question.explanation
            )}</textarea>

          </div>

        </div>

      `;


      const removeButton =
        card.querySelector(
          ".remove-question-btn"
        );

      removeButton.addEventListener(
        "click",
        () =>
          removeQuestion(
            question.id
          )
      );


      const text =
        card.querySelector(
          ".builder-question-text"
        );

      text.addEventListener(
        "input",
        event =>
          updateQuestion(
            question.id,
            "question_text",
            event.target.value
          )
      );


      const image =
        card.querySelector(
          ".builder-image-url"
        );

      image.addEventListener(
        "input",
        event =>
          updateQuestion(
            question.id,
            "image_url",
            event.target.value
          )
      );


      const optionA =
        card.querySelector(
          ".builder-option-a"
        );

      optionA.addEventListener(
        "input",
        event =>
          updateQuestion(
            question.id,
            "option_a",
            event.target.value
          )
      );


      const optionB =
        card.querySelector(
          ".builder-option-b"
        );

      optionB.addEventListener(
        "input",
        event =>
          updateQuestion(
            question.id,
            "option_b",
            event.target.value
          )
      );


      const optionC =
        card.querySelector(
          ".builder-option-c"
        );

      optionC.addEventListener(
        "input",
        event =>
          updateQuestion(
            question.id,
            "option_c",
            event.target.value
          )
      );


      const optionD =
        card.querySelector(
          ".builder-option-d"
        );

      optionD.addEventListener(
        "input",
        event =>
          updateQuestion(
            question.id,
            "option_d",
            event.target.value
          )
      );


      const correct =
        card.querySelector(
          ".builder-correct-answer"
        );

      correct.addEventListener(
        "change",
        event =>
          updateQuestion(
            question.id,
            "correct_answer",
            event.target.value
          )
      );


      const marks =
        card.querySelector(
          ".builder-marks"
        );

      marks.addEventListener(
        "input",
        event =>
          updateQuestion(
            question.id,
            "marks",
            Number(
              event.target.value
            )
          )
      );


      const negative =
        card.querySelector(
          ".builder-negative-marks"
        );

      negative.addEventListener(
        "input",
        event =>
          updateQuestion(
            question.id,
            "negative_marks",
            Number(
              event.target.value
            )
          )
      );


      const explanation =
        card.querySelector(
          ".builder-explanation"
        );

      explanation.addEventListener(
        "input",
        event =>
          updateQuestion(
            question.id,
            "explanation",
            event.target.value
          )
      );


      container.appendChild(card);

    }
  );

}


/* =========================================================
   SAVE / PUBLISH EXAM
========================================================= */

async function saveExam(
  publish
) {

  if (!currentUser) {

    showBuilderMessage(
      "Please login first.",
      true
    );

    return;

  }


  const title =
    document
      .getElementById(
        "examTitleInput"
      )
      .value
      .trim();

  const description =
    document
      .getElementById(
        "examDescriptionInput"
      )
      .value
      .trim();

  const subjectValue =
    document
      .getElementById(
        "examSubjectSelect"
      )
      .value;

  const chapterValue =
    document
      .getElementById(
        "examChapterSelect"
      )
      .value;

  const duration =
    Number(
      document
        .getElementById(
          "examDurationInput"
        )
        .value
    );

  const passing =
    Number(
      document
        .getElementById(
          "examPassingInput"
        )
        .value
    );

  const negative =
    Number(
      document
        .getElementById(
          "examNegativeInput"
        )
        .value
    );

  const maxAttempts =
    Number(
      document
        .getElementById(
          "examAttemptsInput"
        )
        .value
    );

  const startValue =
    document
      .getElementById(
        "examStartInput"
      )
      .value;

  const endValue =
    document
      .getElementById(
        "examEndInput"
      )
      .value;

  const randomizeQuestions =
    document
      .getElementById(
        "randomizeQuestionsInput"
      )
      .checked;

  const randomizeOptions =
    document
      .getElementById(
        "randomizeOptionsInput"
      )
      .checked;

  const showResult =
    document
      .getElementById(
        "showResultInput"
      )
      .checked;

  const showExplanations =
    document
      .getElementById(
        "showExplanationInput"
      )
      .checked;


  /* VALIDATION */

  if (!title) {

    showBuilderMessage(
      "Please enter exam title.",
      true
    );

    return;

  }


  if (!duration || duration < 1) {

    showBuilderMessage(
      "Exam duration must be at least 1 minute.",
      true
    );

    return;

  }


  if (
    passing < 0 ||
    passing > 100
  ) {

    showBuilderMessage(
      "Passing percentage must be between 0 and 100.",
      true
    );

    return;

  }


  if (
    maxAttempts < 1
  ) {

    showBuilderMessage(
      "Maximum attempts must be at least 1.",
      true
    );

    return;

  }


  if (publish && !builderQuestions.length) {

    showBuilderMessage(
      "Add at least one question before publishing.",
      true
    );

    return;

  }


  if (publish) {

    const validation =
      validateQuestions();

    if (!validation.valid) {

      showBuilderMessage(
        validation.message,
        true
      );

      return;

    }

  }


  const totalMarks =
    builderQuestions.reduce(
      (
        total,
        question
      ) =>
        total +
        Number(
          question.marks || 0
        ),
      0
    );


  const payload = {

    title,

    description:
      description || null,

    subject_id:
      subjectValue
        ? Number(subjectValue)
        : null,

    chapter_id:
      chapterValue
        ? Number(chapterValue)
        : null,

    created_by:
      currentUser.id,

    duration_minutes:
      duration,

    total_marks:
      totalMarks,

    passing_percentage:
      passing,

    negative_marking:
      negative,

    max_attempts:
      maxAttempts,

    randomize_questions:
      randomizeQuestions,

    randomize_options:
      randomizeOptions,

    show_result_immediately:
      showResult,

    show_explanations:
      showExplanations,

    is_published:
      publish,

    start_at:
      startValue
        ? new Date(
            startValue
          ).toISOString()
        : null,

    end_at:
      endValue
        ? new Date(
            endValue
          ).toISOString()
        : null

  };


  const button =
    publish
      ? document.getElementById(
          "publishExamBtn"
        )
      : document.getElementById(
          "saveDraftBtn"
        );


  if (button) {
    button.disabled = true;
  }


  showBuilderMessage(
    publish
      ? "Publishing exam..."
      : "Saving draft...",
    false
  );


  try {

    const {
      data: exam,
      error: examError
    } =
      await supabaseClient
        .from("exams")
        .insert(payload)
        .select()
        .single();


    if (examError) {
      throw examError;
    }


    currentExamId =
      exam.id;


    /* SAVE QUESTIONS */

    if (builderQuestions.length) {

      const questionRows =
        builderQuestions.map(
          (
            question,
            index
          ) => ({

            exam_id:
              exam.id,

            question_text:
              question.question_text
                .trim(),

            image_url:
              question.image_url
                .trim() ||
              null,

            option_a:
              question.option_a
                .trim(),

            option_b:
              question.option_b
                .trim(),

            option_c:
              question.option_c
                .trim() ||
              null,

            option_d:
              question.option_d
                .trim() ||
              null,

            correct_answer:
              question.correct_answer,

            explanation:
              question.explanation
                .trim() ||
              null,

            marks:
              Number(
                question.marks || 0
              ),

            negative_marks:
              Number(
                question.negative_marks || 0
              ),

            question_order:
              index + 1

          })
        );


      const {
        error: questionsError
      } =
        await supabaseClient
          .from("questions")
          .insert(
            questionRows
          );


      if (questionsError) {

        /*
          Exam was created but questions failed.
        */

        console.error(
          questionsError
        );

        throw new Error(
          "Exam created, but questions could not be saved. Check database policies."
        );

      }

    }


    showBuilderMessage(
      publish
        ? "🎉 Exam published successfully!"
        : "💾 Exam draft saved successfully!",
      false
    );


    alert(
      publish
        ? "Exam published successfully!"
        : "Exam draft saved successfully!"
    );


    resetExamBuilder();


    await loadTeacherDashboard();

  }

  catch (error) {

    console.error(
      "Save exam error:",
      error
    );

    showBuilderMessage(
      error.message ||
      "Unable to save exam.",
      true
    );

  }

  finally {

    if (button) {
      button.disabled = false;
    }

  }

}


/* =========================================================
   VALIDATE QUESTIONS
========================================================= */

function validateQuestions() {

  for (
    let i = 0;
    i < builderQuestions.length;
    i++
  ) {

    const question =
      builderQuestions[i];

    if (
      !question.question_text ||
      !question.question_text.trim()
    ) {

      return {
        valid: false,
        message:
          `Question ${i + 1}: Question text is required.`
      };

    }


    if (
      !question.option_a ||
      !question.option_a.trim()
    ) {

      return {
        valid: false,
        message:
          `Question ${i + 1}: Option A is required.`
      };

    }


    if (
      !question.option_b ||
      !question.option_b.trim()
    ) {

      return {
        valid: false,
        message:
          `Question ${i + 1}: Option B is required.`
      };

    }


    if (
      question.correct_answer === "C" &&
      (
        !question.option_c ||
        !question.option_c.trim()
      )
    ) {

      return {
        valid: false,
        message:
          `Question ${i + 1}: Option C is empty.`
      };

    }


    if (
      question.correct_answer === "D" &&
      (
        !question.option_d ||
        !question.option_d.trim()
      )
    ) {

      return {
        valid: false,
        message:
          `Question ${i + 1}: Option D is empty.`
      };

    }


    if (
      Number(question.marks) <= 0
    ) {

      return {
        valid: false,
        message:
          `Question ${i + 1}: Marks must be greater than 0.`
      };

    }

  }


  return {
    valid: true
  };

}


/* =========================================================
   BUILDER MESSAGE
========================================================= */

function showBuilderMessage(
  message,
  isError
) {

  const element =
    document.getElementById(
      "examBuilderMessage"
    );

  if (!element) {
    return;
  }

  element.textContent =
    message;

  element.className =
    isError
      ? "form-message error-message"
      : "form-message success-message";

}


/* =========================================================
   RESET EXAM BUILDER
========================================================= */

function resetExamBuilder() {

  builderQuestions = [];
  currentExamId = null;

  const fields = [

    "examTitleInput",
    "examDescriptionInput",
    "examDurationInput",
    "examPassingInput",
    "examNegativeInput",
    "examAttemptsInput",
    "examStartInput",
    "examEndInput"

  ];


  fields.forEach(id => {

    const element =
      document.getElementById(id);

    if (!element) {
      return;
    }

    if (
      id === "examDurationInput"
    ) {

      element.value = 30;

    }

    else if (
      id === "examPassingInput"
    ) {

      element.value = 40;

    }

    else if (
      id === "examNegativeInput"
    ) {

      element.value = 0;

    }

    else if (
      id === "examAttemptsInput"
    ) {

      element.value = 1;

    }

    else {

      element.value = "";

    }

  });


  document.getElementById(
    "examSubjectSelect"
  ).value = "";

  document.getElementById(
    "examChapterSelect"
  ).innerHTML =
    `<option value="">
      Select Chapter
    </option>`;


  document.getElementById(
    "randomizeQuestionsInput"
  ).checked = false;

  document.getElementById(
    "randomizeOptionsInput"
  ).checked = false;

  document.getElementById(
    "showResultInput"
  ).checked = true;

  document.getElementById(
    "showExplanationInput"
  ).checked = false;


  renderQuestionBuilder();

}


/* =========================================================
   START EXAM
========================================================= */

async function startExam(
  examId
) {

  if (!currentUser) {
    return;
  }


  try {

    const {
      data: exam,
      error: examError
    } =
      await supabaseClient
        .from("exams")
        .select("*")
        .eq(
          "id",
          examId
        )
        .eq(
          "is_published",
          true
        )
        .single();


    if (examError) {
      throw examError;
    }


    /* DATE CHECK */

    const now =
      new Date();


    if (
      exam.start_at &&
      now <
      new Date(
        exam.start_at
      )
    ) {

      alert(
        "This exam has not started yet."
      );

      return;

    }


    if (
      exam.end_at &&
      now >
      new Date(
        exam.end_at
      )
    ) {

      alert(
        "This exam is no longer available."
      );

      return;

    }


    /* CHECK ATTEMPTS */

    const {
      data: attempts,
      error: attemptsError
    } =
      await supabaseClient
        .from("exam_attempts")
        .select(
          "id,attempt_number,status"
        )
        .eq(
          "exam_id",
          examId
        )
        .eq(
          "student_id",
          currentUser.id
        );


    if (attemptsError) {
      throw attemptsError;
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
      exam.max_attempts
    ) {

      alert(
        `Maximum ${exam.max_attempts} attempt(s) allowed for this exam.`
      );

      return;

    }


    /* LOAD QUESTIONS */

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
          "question_order",
          {
            ascending: true
          }
        );


    if (questionError) {
      throw questionError;
    }


    if (!questions.length) {

      alert(
        "This exam has no questions yet."
      );

      return;

    }


    currentExam = exam;

    currentQuestions =
      [...questions];


    if (
      exam.randomize_questions
    ) {

      shuffleArray(
        currentQuestions
      );

    }


    currentQuestionIndex = 0;


    /* CREATE ATTEMPT */

    const attemptNumber =
      completedAttempts.length + 1;


    const {
      data: attempt,
      error: attemptError
    } =
      await supabaseClient
        .from("exam_attempts")
        .insert({

          exam_id:
            exam.id,

          student_id:
            currentUser.id,

          attempt_number:
            attemptNumber,

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
            currentQuestions.length,

          percentage:
            0,

          passed:
            false

        })
        .select()
        .single();


    if (attemptError) {
      throw attemptError;
    }


    currentAttemptId =
      attempt.id;


    showPage("examPage");

    renderCurrentQuestion();

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
   RENDER CURRENT QUESTION
========================================================= */

function renderCurrentQuestion() {

  if (!currentQuestions.length) {
    return;
  }


  const question =
    currentQuestions[
      currentQuestionIndex
    ];


  document.getElementById(
    "examTitle"
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
      "questionImageContainer"
    );


  imageContainer.innerHTML = "";


  if (question.image_url) {

    const image =
      document.createElement("img");

    image.src =
      question.image_url;

    image.alt =
      "Question image";

    image.style.maxWidth =
      "100%";

    image.style.borderRadius =
      "10px";

    image.style.marginBottom =
      "20px";

    imageContainer.appendChild(
      image
    );

  }


  const options =
    document.getElementById(
      "options"
    );

  options.innerHTML = "";


  const optionList = [

    {
      key: "A",
      text: question.option_a
    },

    {
      key: "B",
      text: question.option_b
    },

    {
      key: "C",
      text: question.option_c
    },

    {
      key: "D",
      text: question.option_d
    }

  ].filter(
    option =>
      option.text
  );


  optionList.forEach(
    option => {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "option";

      div.dataset.answer =
        option.key;

      div.innerHTML = `

        <strong>
          ${option.key}.
        </strong>

        ${escapeHTML(
          option.text
        )}

      `;


      div.addEventListener(
        "click",
        () =>
          selectAnswer(
            question.id,
            option.key
          )
      );


      options.appendChild(div);

    }
  );


  loadSavedAnswer(
    question.id
  );


  updateExamButtons();

  renderQuestionNavigation();

}


/* =========================================================
   SELECT ANSWER
========================================================= */

async function selectAnswer(
  questionId,
  answer
) {

  if (!currentAttemptId) {
    return;
  }


  const question =
    currentQuestions.find(
      item =>
        item.id === questionId
    );


  if (!question) {
    return;
  }


  const isCorrect =
    answer ===
    question.correct_answer;


  let marks =
    isCorrect
      ? Number(question.marks || 0)
      : -Number(
          question.negative_marks || 0
        );


  const {
    data: existing,
    error: existingError
  } =
    await supabaseClient
      .from("student_answers")
      .select("id")
      .eq(
        "attempt_id",
        currentAttemptId
      )
      .eq(
        "question_id",
        questionId
      )
      .maybeSingle();


  if (existingError) {

    console.error(
      existingError
    );

    return;

  }


  try {

    if (existing) {

      const {
        error
      } =
        await supabaseClient
          .from("student_answers")
          .update({

            selected_answer:
              answer,

            is_correct:
              isCorrect,

            marks_obtained:
              marks,

            answered_at:
              new Date().toISOString()

          })
          .eq(
            "id",
            existing.id
          );


      if (error) {
        throw error;
      }

    }

    else {

      const {
        error
      } =
        await supabaseClient
          .from("student_answers")
          .insert({

            attempt_id:
              currentAttemptId,

            question_id:
              questionId,

            selected_answer:
              answer,

            is_correct:
              isCorrect,

            marks_obtained:
              marks,

            answered_at:
              new Date().toISOString()

          });


      if (error) {
        throw error;
      }

    }


    loadSavedAnswer(
      questionId
    );

    renderQuestionNavigation();

  }

  catch (error) {

    console.error(
      "Answer error:",
      error
    );

    alert(
      "Unable to save answer."
    );

  }

}


/* =========================================================
   LOAD SAVED ANSWER
========================================================= */

async function loadSavedAnswer(
  questionId
) {

  if (!currentAttemptId) {
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("student_answers")
      .select(
        "selected_answer"
      )
      .eq(
        "attempt_id",
        currentAttemptId
      )
      .eq(
        "question_id",
        questionId
      )
      .maybeSingle();


  if (error) {
    return;
  }


  document
    .querySelectorAll(
      "#options .option"
    )
    .forEach(
      element => {

        element.classList.remove(
          "selected"
        );


        if (
          data &&
          element.dataset.answer ===
          data.selected_answer
        ) {

          element.classList.add(
            "selected"
          );

        }

      }
    );

}


/* =========================================================
   QUESTION NAVIGATION
========================================================= */

function renderQuestionNavigation() {

  const container =
    document.getElementById(
      "questionNavigation"
    );

  if (!container) {
    return;
  }

  container.innerHTML = "";


  currentQuestions.forEach(
    (
      question,
      index
    ) => {

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
   EXAM BUTTONS
========================================================= */

document
  .getElementById(
    "previousBtn"
  )
  .addEventListener(
    "click",
    () => {

      if (
        currentQuestionIndex >
        0
      ) {

        currentQuestionIndex--;

        renderCurrentQuestion();

      }

    }
  );


document
  .getElementById(
    "nextBtn"
  )
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
  .getElementById(
    "submitBtn"
  )
  .addEventListener(
    "click",
    () => submitExam(false)
  );


function updateExamButtons() {

  const previous =
    document.getElementById(
      "previousBtn"
    );

  const next =
    document.getElementById(
      "nextBtn"
    );

  const submit =
    document.getElementById(
      "submitBtn"
    );


  previous.disabled =
    currentQuestionIndex === 0;


  const isLast =
    currentQuestionIndex ===
    currentQuestions.length - 1;


  next.classList.toggle(
    "hidden",
    isLast
  );


  submit.classList.toggle(
    "hidden",
    !isLast
  );

}


/* =========================================================
   SUBMIT EXAM
========================================================= */

async function submitExam(
  autoSubmitted
) {

  if (!currentAttemptId) {
    return;
  }


  const confirmed =
    autoSubmitted
      ? true
      : confirm(
          "Are you sure you want to submit the exam?"
        );


  if (!confirmed) {
    return;
  }


  try {

    const {
      data: answers,
      error
    } =
      await supabaseClient
        .from("student_answers")
        .select(`
          is_correct,
          marks_obtained,
          selected_answer
        `)
        .eq(
          "attempt_id",
          currentAttemptId
        );


    if (error) {
      throw error;
    }


    const totalQuestions =
      currentQuestions.length;


    const answered =
      answers.filter(
        answer =>
          answer.selected_answer
      );


    const correct =
      answers.filter(
        answer =>
          answer.is_correct
      ).length;


    const unanswered =
      totalQuestions -
      answered.length;


    const score =
      answers.reduce(
        (
          total,
          answer
        ) =>
          total +
          Number(
            answer.marks_obtained || 0
          ),
        0
      );


    const totalMarks =
      Number(
        currentExam.total_marks || 0
      );


    const percentage =
      totalMarks > 0
        ? (
            score /
            totalMarks
          ) *
          100
        : 0;


    const passed =
      percentage >=
      Number(
        currentExam.passing_percentage || 0
      );


    const status =
      autoSubmitted
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
            answered.length -
            correct,

          unanswered,

          percentage,

          passed

        })
        .eq(
          "id",
          currentAttemptId
        );


    if (updateError) {
      throw updateError;
    }


    if (examTimerInterval) {

      clearInterval(
        examTimerInterval
      );

      examTimerInterval =
        null;

    }


    alert(
      `Exam submitted successfully.\n\nScore: ${score.toFixed(2)} / ${totalMarks}\nPercentage: ${percentage.toFixed(2)}%\nResult: ${
        passed
          ? "PASSED"
          : "NOT PASSED"
      }`
    );


    currentAttemptId = null;
    currentExam = null;
    currentQuestions = [];
    currentQuestionIndex = 0;


    showPage(
      "studentDashboard"
    );

  }

  catch (error) {

    console.error(
      "Submit exam error:",
      error
    );

    alert(
      error.message ||
      "Unable to submit exam."
    );

  }

}


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

      if (examTimerInterval) {

        clearInterval(
          examTimerInterval
        );

        examTimerInterval =
          null;

      }

      await supabaseClient.auth.signOut();

      currentUser = null;
      currentProfile = null;

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
    String(message || "")
      .toLowerCase();


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

  return escapeHTML(value);

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


/* =========================================================
   SHUFFLE
========================================================= */

function shuffleArray(
  array
) {

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
