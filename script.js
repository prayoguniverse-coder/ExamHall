/* =========================================================
   EXAMHALL
   COMPLETE FRONTEND
   SUPABASE AUTH + DASHBOARDS + EXAM BUILDER
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
   GLOBAL STATE
========================================================= */

let currentUser = null;
let currentProfile = null;

let currentExam = null;

let questionBuilderItems = [];


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
  function () {

    loginTab.classList.add("active");

    signupTab.classList.remove("active");

    loginForm.classList.remove("hidden");

    signupForm.classList.add("hidden");

    clearMessages();

  }
);


signupTab.addEventListener(
  "click",
  function () {

    signupTab.classList.add("active");

    loginTab.classList.remove("active");

    signupForm.classList.remove("hidden");

    loginForm.classList.add("hidden");

    clearMessages();

  }
);


/* =========================================================
   CLEAR AUTH MESSAGES
========================================================= */

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
  async function (event) {

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

    if (!email || !password) {

      loginError.textContent =
        "Email and password are required.";

      return;
    }

    const button =
      document.getElementById(
        "loginBtn"
      );

    button.disabled = true;

    button.textContent =
      "Logging in...";

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

      currentUser =
        data.user;

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

      button.textContent =
        "Login";

    }

  }
);


/* =========================================================
   STUDENT SIGNUP
========================================================= */

signupForm.addEventListener(
  "submit",
  async function (event) {

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

        currentUser =
          data.user;

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

  currentProfile =
    data;

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

    showPage(
      "teacherDashboard"
    );

  }
  else {

    document
      .getElementById("studentMenu")
      .classList.remove("hidden");

    document
      .getElementById("teacherMenu")
      .classList.add("hidden");

    showPage(
      "studentDashboard"
    );

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
  ).textContent =
    name;

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
  .forEach(
    button => {

      button.addEventListener(
        "click",
        function () {

          showPage(
            button.dataset.page
          );

        }
      );

    }
  );


function showPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach(
      page => {

        page.classList.add(
          "hidden"
        );

      }
    );

  const page =
    document.getElementById(
      pageId
    );

  if (!page) {
    return;
  }

  page.classList.remove(
    "hidden"
  );

  document
    .querySelectorAll(".menu-btn")
    .forEach(
      button => {

        button.classList.remove(
          "active"
        );

        if (
          button.dataset.page ===
          pageId
        ) {

          button.classList.add(
            "active"
          );

        }

      }
    );


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

    loadCreateExamPage();

  }


  if (
    pageId ===
    "teacherScores"
  ) {

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

  document.getElementById(
    "examList"
  ).innerHTML =
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
          negative_marking,
          passing_percentage,
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

    document.getElementById(
      "availableExams"
    ).textContent =
      exams.length;

    showAvailableExams(
      exams
    );

    await loadStudentStats();

  }
  catch (error) {

    console.error(error);

    document.getElementById(
      "examList"
    ).innerHTML =
      `<div class="error-box">
        Unable to load exams.
      </div>`;

  }

}


/* =========================================================
   SHOW AVAILABLE EXAMS
========================================================= */

function showAvailableExams(
  exams
) {

  const list =
    document.getElementById(
      "examList"
    );

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


  exams.forEach(
    exam => {

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

        <div class="exam-item-info">

          <h4>
            ${escapeHTML(
              exam.title
            )}
          </h4>

          <p>
            ${escapeHTML(subject)}
            •
            ${escapeHTML(chapter)}
          </p>

          <div class="exam-meta">

            <span>
              ⏱ ${exam.duration_minutes} min
            </span>

            <span>
              🎯 ${exam.total_marks} marks
            </span>

            <span>
              🔄 ${exam.max_attempts} attempt(s)
            </span>

          </div>

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
          function () {

            startExam(
              exam.id
            );

          }
        );


      list.appendChild(
        item
      );

    }
  );

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
        "percentage, status"
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
        (
          total,
          value
        ) =>
          total + value,
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
      `<div class="error-box">
        Unable to load results.
      </div>`;

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


  data.forEach(
    result => {

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

      container.appendChild(
        item
      );

    }
  );

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
      `<div class="error-box">
        Unable to load history.
      </div>`;

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


  data.forEach(
    attempt => {

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
            ${escapeHTML(
              attempt.status
            )}
          </p>

        </div>

        <div class="score">

          ${Number(
            attempt.percentage || 0
          )}%

        </div>

      `;

      container.appendChild(
        item
      );

    }
  );

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
        "student_id, percentage, status"
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
            (
              total,
              item
            ) =>
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


  exams.forEach(
    exam => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "exam-item";

      item.innerHTML = `

        <div class="exam-item-info">

          <h4>
            ${escapeHTML(
              exam.title
            )}
          </h4>

          <p>
            ${escapeHTML(
              exam.subjects?.name ||
              "General"
            )}
            •
            ${exam.duration_minutes}
            Minutes
            •
            ${exam.total_marks}
            Marks
          </p>

        </div>

        <span class="
          exam-status
          ${
            exam.is_published
              ? "published"
              : "draft"
          }
        ">

          ${
            exam.is_published
              ? "Published"
              : "Draft"
          }

        </span>

      `;

      list.appendChild(
        item
      );

    }
  );

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


  data.forEach(
    result => {

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

      table.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   CREATE EXAM PAGE
========================================================= */

async function loadCreateExamPage() {

  await loadSubjects();

  setupQuestionBuilderIfNeeded();

}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects() {

  const select =
    document.getElementById(
      "examSubject"
    );

  if (!select) {
    return;
  }

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
        "id, name"
      )
      .order(
        "name",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Subject error:",
      error
    );

    return;
  }


  (data || []).forEach(
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
   LOAD CHAPTERS
========================================================= */

document
  .getElementById("examSubject")
  .addEventListener(
    "change",
    async function () {

      await loadChapters(
        this.value
      );

    }
  );


async function loadChapters(
  subjectId
) {

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
      .select(
        "id, name"
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
      "Chapter error:",
      error
    );

    return;
  }


  (data || []).forEach(
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


/* =========================================================
   QUESTION BUILDER
========================================================= */

function setupQuestionBuilderIfNeeded() {

  const button =
    document.getElementById(
      "addQuestionBtn"
    );

  if (
    button.dataset.ready ===
    "true"
  ) {
    return;
  }

  button.dataset.ready =
    "true";


  button.addEventListener(
    "click",
    function () {

      addQuestionBuilder();

    }
  );

}


function addQuestionBuilder() {

  const id =
    Date.now() +
    Math.random()
      .toString(36)
      .substring(2, 8);


  const question =
    {
      id,
      question_text: "",
      image_url: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "A",
      explanation: "",
      marks: 1,
      negative_marks: 0
    };


  questionBuilderItems.push(
    question
  );


  renderQuestionBuilder();

}


function renderQuestionBuilder() {

  const container =
    document.getElementById(
      "questionBuilder"
    );

  const empty =
    document.getElementById(
      "noQuestionsMessage"
    );


  container.innerHTML = "";


  if (
    questionBuilderItems.length ===
    0
  ) {

    empty.classList.remove(
      "hidden"
    );

    return;
  }


  empty.classList.add(
    "hidden"
  );


  questionBuilderItems.forEach(
    (
      question,
      index
    ) => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "question-builder-card";


      card.dataset.id =
        question.id;


      card.innerHTML = `

        <div class="question-card-header">

          <div>

            <span class="question-number-badge">
              Question ${index + 1}
            </span>

          </div>

          <button
            type="button"
            class="remove-question-btn"
            data-remove-question="${question.id}"
          >
            🗑 Remove
          </button>

        </div>


        <div class="form-group full-width">

          <label>
            Question *
          </label>

          <textarea
            class="question-input"
            data-field="question_text"
            rows="3"
            placeholder="Enter question"
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
            class="question-input"
            data-field="image_url"
            placeholder="https://example.com/question.jpg"
            value="${escapeAttribute(
              question.image_url
            )}"
          >

          <small class="field-help">
            Optional. Image hosting/storage will be connected later.
          </small>

        </div>


        <div class="options-grid">

          ${createOptionInput(
            "A",
            question.option_a
          )}

          ${createOptionInput(
            "B",
            question.option_b
          )}

          ${createOptionInput(
            "C",
            question.option_c
          )}

          ${createOptionInput(
            "D",
            question.option_d
          )}

        </div>


        <div class="question-settings">

          <div class="form-group">

            <label>
              Correct Answer *
            </label>

            <select
              class="question-input"
              data-field="correct_answer"
            >

              <option
                value="A"
                ${
                  question.correct_answer === "A"
                    ? "selected"
                    : ""
                }
              >
                A
              </option>

              <option
                value="B"
                ${
                  question.correct_answer === "B"
                    ? "selected"
                    : ""
                }
              >
                B
              </option>

              <option
                value="C"
                ${
                  question.correct_answer === "C"
                    ? "selected"
                    : ""
                }
              >
                C
              </option>

              <option
                value="D"
                ${
                  question.correct_answer === "D"
                    ? "selected"
                    : ""
                }
              >
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
              class="question-input"
              data-field="marks"
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
              class="question-input"
              data-field="negative_marks"
              min="0"
              step="0.01"
              value="${question.negative_marks}"
            >

          </div>

        </div>


        <div class="form-group full-width">

          <label>
            Explanation
          </label>

          <textarea
            class="question-input"
            data-field="explanation"
            rows="3"
            placeholder="Optional explanation"
          >${escapeHTML(
            question.explanation
          )}</textarea>

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );


  bindQuestionInputs();

}


function createOptionInput(
  letter,
  value
) {

  return `

    <div class="form-group">

      <label>
        Option ${letter} *
      </label>

      <input
        type="text"
        class="question-input"
        data-field="option_${letter.toLowerCase()}"
        placeholder="Enter option ${letter}"
        value="${escapeAttribute(
          value
        )}"
      >

    </div>

  `;

}


/* =========================================================
   QUESTION INPUT EVENTS
========================================================= */

function bindQuestionInputs() {

  document
    .querySelectorAll(
      ".question-builder-card"
    )
    .forEach(
      card => {

        const id =
          card.dataset.id;


        card
          .querySelectorAll(
            ".question-input"
          )
          .forEach(
            input => {

              input.addEventListener(
                "input",
                function () {

                  updateQuestionData(
                    id,
                    this
                  );

                }
              );

              input.addEventListener(
                "change",
                function () {

                  updateQuestionData(
                    id,
                    this
                  );

                }
              );

            }
          );


        const removeButton =
          card.querySelector(
            "[data-remove-question]"
          );


        removeButton.addEventListener(
          "click",
          function () {

            removeQuestion(
              id
            );

          }
        );

      }
    );

}


function updateQuestionData(
  id,
  input
) {

  const question =
    questionBuilderItems.find(
      item =>
        item.id === id
    );

  if (!question) {
    return;
  }


  const field =
    input.dataset.field;


  if (
    input.type ===
    "number"
  ) {

    question[field] =
      Number(
        input.value || 0
      );

  }
  else {

    question[field] =
      input.value;

  }

}


function removeQuestion(
  id
) {

  questionBuilderItems =
    questionBuilderItems.filter(
      question =>
        question.id !== id
    );


  renderQuestionBuilder();

}


/* =========================================================
   VALIDATE EXAM
========================================================= */

function validateExamForm() {

  const title =
    document
      .getElementById(
        "examTitleInput"
      )
      .value
      .trim();


  const duration =
    Number(
      document.getElementById(
        "examDuration"
      ).value
    );


  if (!title) {

    return {
      valid: false,
      message:
        "Please enter exam title."
    };

  }


  if (
    !duration ||
    duration < 1
  ) {

    return {
      valid: false,
      message:
        "Exam duration must be at least 1 minute."
    };

  }


  if (
    questionBuilderItems.length ===
    0
  ) {

    return {
      valid: false,
      message:
        "Please add at least one question."
    };

  }


  for (
    let i = 0;
    i < questionBuilderItems.length;
    i++
  ) {

    const question =
      questionBuilderItems[i];


    if (
      !question.question_text.trim()
    ) {

      return {
        valid: false,
        message:
          `Question ${i + 1}: question text is required.`
      };

    }


    if (
      !question.option_a.trim() ||
      !question.option_b.trim()
    ) {

      return {
        valid: false,
        message:
          `Question ${i + 1}: Option A and B are required.`
      };

    }


    if (
      question.correct_answer ===
      "C" &&
      !question.option_c.trim()
    ) {

      return {
        valid: false,
        message:
          `Question ${i + 1}: Option C is empty.`
      };

    }


    if (
      question.correct_answer ===
      "D" &&
      !question.option_d.trim()
    ) {

      return {
        valid: false,
        message:
          `Question ${i + 1}: Option D is empty.`
      };

    }


    if (
      Number(question.marks) <=
      0
    ) {

      return {
        valid: false,
        message:
          `Question ${i + 1}: marks must be greater than 0.`
      };

    }

  }


  return {
    valid: true,
    message: ""
  };

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
          "examDescriptionInput"
        )
        .value
        .trim() ||
      null,

    subject_id:
      getNullableNumber(
        document.getElementById(
          "examSubject"
        ).value
      ),

    chapter_id:
      getNullableNumber(
        document.getElementById(
          "examChapter"
        ).value
      ),

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
      ) ||
      calculateTotalMarks(),

    passing_percentage:
      Number(
        document.getElementById(
          "examPassingPercentage"
        ).value
      ) || 0,

    negative_marking:
      Number(
        document.getElementById(
          "examNegativeMarking"
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
   SAVE EXAM
========================================================= */

async function saveExam(
  publish
) {

  clearBuilderMessage();


  if (
    !currentUser ||
    !currentProfile ||
    currentProfile.role !==
    "teacher"
  ) {

    showBuilderMessage(
      "Only a teacher can create an exam.",
      "error"
    );

    return;

  }


  const validation =
    validateExamForm();


  if (!validation.valid) {

    showBuilderMessage(
      validation.message,
      "error"
    );

    return;

  }


  const saveButton =
    publish
      ? document.getElementById(
          "publishExamBtn"
        )
      : document.getElementById(
          "saveDraftBtn"
        );


  saveButton.disabled =
    true;

  saveButton.textContent =
    publish
      ? "Publishing..."
      : "Saving...";


  try {

    const examData =
      getExamFormData(
        publish
      );


    /*
      Teacher ID
    */

    examData.created_by =
      currentUser.id;


    /*
      Insert exam
    */

    const {
      data: exam,
      error: examError
    } =
      await supabaseClient
        .from("exams")
        .insert(
          examData
        )
        .select()
        .single();


    if (examError) {

      throw examError;

    }


    /*
      Insert questions
    */

    const questionRows =
      questionBuilderItems.map(
        (
          question,
          index
        ) => {

          return {

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
                question.marks
              ) || 1,

            negative_marks:
              Number(
                question.negative_marks
              ) || 0,

            question_order:
              index + 1

          };

        }
      );


    const {
      error: questionError
    } =
      await supabaseClient
        .from("questions")
        .insert(
          questionRows
        );


    if (questionError) {

      /*
        If questions fail after exam creation,
        attempt to delete the exam so we don't
        leave an incomplete exam.
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


    showBuilderMessage(
      publish
        ? "Exam published successfully."
        : "Exam saved as draft successfully.",
      "success"
    );


    resetExamBuilder();


    await loadTeacherDashboard();


    setTimeout(
      function () {

        showPage(
          "teacherDashboard"
        );

      },
      800
    );

  }
  catch (error) {

    console.error(
      "Save exam error:",
      error
    );


    showBuilderMessage(
      getDatabaseErrorMessage(
        error
      ),
      "error"
    );

  }
  finally {

    saveButton.disabled =
      false;

    saveButton.textContent =
      publish
        ? "🚀 Publish Exam"
        : "💾 Save Draft";

  }

}


/* =========================================================
   SAVE / PUBLISH BUTTONS
========================================================= */

document
  .getElementById(
    "saveDraftBtn"
  )
  .addEventListener(
    "click",
    function () {

      saveExam(
        false
      );

    }
  );


document
  .getElementById(
    "publishExamBtn"
  )
  .addEventListener(
    "click",
    function () {

      saveExam(
        true
      );

    }
  );


/* =========================================================
   BUILDER MESSAGE
========================================================= */

function showBuilderMessage(
  message,
  type
) {

  const element =
    document.getElementById(
      "examBuilderMessage"
    );

  element.textContent =
    message;

  element.className =
    "builder-message " +
    (
      type === "success"
        ? "success"
        : "error"
    );

}


function clearBuilderMessage() {

  const element =
    document.getElementById(
      "examBuilderMessage"
    );

  element.textContent = "";

  element.className =
    "builder-message";

}


/* =========================================================
   RESET BUILDER
========================================================= */

function resetExamBuilder() {

  document
    .getElementById(
      "examTitleInput"
    )
    .value = "";

  document
    .getElementById(
      "examDescriptionInput"
    )
    .value = "";

  document
    .getElementById(
      "examSubject"
    )
    .value = "";

  document
    .getElementById(
      "examChapter"
    )
    .innerHTML =
      `<option value="">
        Select Chapter
      </option>`;

  document
    .getElementById(
      "examDuration"
    )
    .value = "30";

  document
    .getElementById(
      "examTotalMarks"
    )
    .value = "10";

  document
    .getElementById(
      "examPassingPercentage"
    )
    .value = "40";

  document
    .getElementById(
      "examNegativeMarking"
    )
    .value = "0";

  document
    .getElementById(
      "examMaxAttempts"
    )
    .value = "1";

  document
    .getElementById(
      "randomizeQuestions"
    )
    .checked = false;

  document
    .getElementById(
      "randomizeOptions"
    )
    .checked = false;

  document
    .getElementById(
      "showResultImmediately"
    )
    .checked = true;

  document
    .getElementById(
      "showExplanations"
    )
    .checked = false;


  questionBuilderItems =
    [];


  renderQuestionBuilder();

}


/* =========================================================
   CALCULATE TOTAL MARKS
========================================================= */

function calculateTotalMarks() {

  return questionBuilderItems.reduce(
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

}


/* =========================================================
   START EXAM PLACEHOLDER
========================================================= */

async function startExam(
  examId
) {

  /*
    Full exam engine is the next module.

    For now we verify that the exam and
    questions exist before activating it.
  */

  try {

    const {
      data: exam,
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
          negative_marking,
          passing_percentage,
          randomize_questions,
          randomize_options,
          show_result_immediately,
          show_explanations,
          questions(
            id,
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
          )
        `)
        .eq(
          "id",
          examId
        )
        .single();


    if (error) {
      throw error;
    }


    if (
      !exam.questions ||
      !exam.questions.length
    ) {

      alert(
        "This exam has no questions."
      );

      return;

    }


    currentExam =
      exam;


    /*
      At this stage the exam builder is complete.
      The full timer + attempt + answer + auto-submit
      engine will use this loaded data.
    */

    alert(
      "Exam loaded successfully. Full exam engine will be activated in the next module."
    );

  }
  catch (error) {

    console.error(
      "Start exam error:",
      error
    );

    alert(
      getDatabaseErrorMessage(
        error
      )
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
    async function () {

      await supabaseClient.auth.signOut();

      currentUser = null;

      currentProfile = null;

      currentExam = null;

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
  async function (
    event,
    session
  ) {

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

    console.error(
      error
    );

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
    )
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
   DATABASE ERROR
========================================================= */

function getDatabaseErrorMessage(
  error
) {

  if (!error) {

    return "Something went wrong.";

  }


  const message =
    String(
      error.message ||
      error.details ||
      error.hint ||
      ""
    );


  if (
    message
      .toLowerCase()
      .includes(
        "row-level security"
      )
  ) {

    return (
      "Supabase RLS policy is blocking this operation. " +
      "Please check the teacher INSERT/UPDATE policies."
    );

  }


  if (
    message
      .toLowerCase()
      .includes(
        "violates foreign key"
      )
  ) {

    return (
      "A selected Subject or Chapter is invalid."
    );

  }


  return message ||
    "Unable to save exam.";

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
   NULLABLE NUMBER
========================================================= */

function getNullableNumber(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return null;

  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;

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
