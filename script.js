/* =========================================================
   EXAMHALL
   STEP 6A - AUTH + DASHBOARD + CREATE EXAM
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

loginTab.addEventListener("click", function () {

  loginTab.classList.add("active");
  signupTab.classList.remove("active");

  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");

  clearMessages();

});


signupTab.addEventListener("click", function () {

  signupTab.classList.add("active");
  loginTab.classList.remove("active");

  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");

  clearMessages();

});


/* =========================================================
   CLEAR MESSAGES
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
  .forEach(function (button) {

    button.addEventListener(
      "click",
      function () {

        showPage(
          button.dataset.page
        );

      }
    );

  });


function showPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach(function (page) {

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
    .forEach(function (button) {

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
    initializeCreateExam();
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

    showAvailableExams(exams);

    await loadStudentStats();

  }

  catch (error) {

    console.error(error);

    document.getElementById(
      "examList"
    ).innerHTML =
      `<p>
        Unable to load exams.
      </p>`;

  }

}


/* =========================================================
   SHOW AVAILABLE EXAMS
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


  exams.forEach(function (exam) {

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

      <div>

        <h4>
          ${escapeHTML(exam.title)}
        </h4>

        <p>
          ${escapeHTML(subject)}
          •
          ${escapeHTML(chapter)}
          •
          ${exam.duration_minutes}
          Minutes
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
        function () {

          alert(
            "Student Exam module next step mein activate hoga."
          );

        }
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
    attempts.map(function (item) {

      return Number(
        item.percentage
      );

    });

  const average =
    Math.round(
      percentages.reduce(
        function (total, value) {

          return total + value;

        },
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

  data.forEach(function (result) {

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
          result.score
        ).toFixed(2)}

        <br>

        ${Number(
          result.percentage
        )}%

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

  data.forEach(function (attempt) {

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
          attempt.percentage
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
        "student_id, percentage, status"
      );

  if (!attemptsError) {

    const completed =
      attempts.filter(function (attempt) {

        return [
          "submitted",
          "auto_submitted",
          "expired"
        ].includes(
          attempt.status
        );

      });

    document.getElementById(
      "teacherAttemptCount"
    ).textContent =
      completed.length;

    const students =
      new Set(
        completed.map(function (item) {

          return item.student_id;

        })
      );

    document.getElementById(
      "teacherStudentCount"
    ).textContent =
      students.size;

    if (completed.length) {

      const average =
        Math.round(
          completed.reduce(
            function (
              total,
              item
            ) {

              return total +
                Number(
                  item.percentage
                );

            },
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
          Create your first exam from the Create Exam section.
        </p>

      </div>`;

    return;

  }


  exams.forEach(function (exam) {

    const item =
      document.createElement(
        "div"
      );

    item.className =
      "exam-item";

    item.innerHTML = `

      <div>

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
        </p>

      </div>

      <strong class="${
        exam.is_published
          ? "published-status"
          : "draft-status"
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

  data.forEach(function (result) {

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
          result.score
        ).toFixed(2)}
      </td>

      <td>
        ${Number(
          result.percentage
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
   CREATE EXAM
========================================================= */

let createExamInitialized = false;


/* ---------------------------------------------------------
   INITIALIZE
--------------------------------------------------------- */

async function initializeCreateExam() {

  if (!currentUser) {
    return;
  }

  if (!createExamInitialized) {

    setupCreateExamEvents();

    createExamInitialized = true;

  }

  await loadSubjects();

}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects() {

  const subjectSelect =
    document.getElementById(
      "examSubject"
    );

  if (!subjectSelect) {
    return;
  }

  subjectSelect.innerHTML =
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
      "Subjects error:",
      error
    );

    subjectSelect.innerHTML =
      `<option value="">
        Unable to load subjects
      </option>`;

    return;

  }

  (data || []).forEach(function (subject) {

    const option =
      document.createElement(
        "option"
      );

    option.value =
      subject.id;

    option.textContent =
      subject.name;

    subjectSelect.appendChild(
      option
    );

  });

}


/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadChapters(subjectId) {

  const chapterSelect =
    document.getElementById(
      "examChapter"
    );

  chapterSelect.innerHTML =
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
      "Chapters error:",
      error
    );

    chapterSelect.innerHTML =
      `<option value="">
        Unable to load chapters
      </option>`;

    return;

  }

  (data || []).forEach(function (chapter) {

    const option =
      document.createElement(
        "option"
      );

    option.value =
      chapter.id;

    option.textContent =
      chapter.name;

    chapterSelect.appendChild(
      option
    );

  });

}


/* =========================================================
   CREATE EXAM EVENTS
========================================================= */

function setupCreateExamEvents() {

  const subjectSelect =
    document.getElementById(
      "examSubject"
    );

  const form =
    document.getElementById(
      "createExamForm"
    );

  const publishButton =
    document.getElementById(
      "publishExamBtn"
    );

  const resetButton =
    document.getElementById(
      "resetExamBtn"
    );


  subjectSelect.addEventListener(
    "change",
    function () {

      loadChapters(
        subjectSelect.value
      );

    }
  );


  form.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      await createExam(
        false
      );

    }
  );


  publishButton.addEventListener(
    "click",
    async function () {

      await createExam(
        true
      );

    }
  );


  resetButton.addEventListener(
    "click",
    function () {

      resetCreateExamForm();

    }
  );

}


/* =========================================================
   GET CREATE EXAM DATA
========================================================= */

function getCreateExamData(
  isPublished
) {

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

  const subjectId =
    document.getElementById(
      "examSubject"
    ).value;

  const chapterId =
    document.getElementById(
      "examChapter"
    ).value;

  const duration =
    Number(
      document.getElementById(
        "durationMinutes"
      ).value
    );

  const totalMarks =
    Number(
      document.getElementById(
        "totalMarks"
      ).value
    );

  const passingPercentage =
    Number(
      document.getElementById(
        "passingPercentage"
      ).value
    );

  const negativeMarking =
    Number(
      document.getElementById(
        "negativeMarking"
      ).value || 0
    );

  const maxAttempts =
    Number(
      document.getElementById(
        "maxAttempts"
      ).value
    );

  const randomizeQuestions =
    document.getElementById(
      "randomizeQuestions"
    ).checked;

  const randomizeOptions =
    document.getElementById(
      "randomizeOptions"
    ).checked;

  const showResultImmediately =
    document.getElementById(
      "showResultImmediately"
    ).checked;

  const showExplanations =
    document.getElementById(
      "showExplanations"
    ).checked;

  const startValue =
    document.getElementById(
      "startAt"
    ).value;

  const endValue =
    document.getElementById(
      "endAt"
    ).value;


  if (!title) {
    throw new Error(
      "Please enter exam title."
    );
  }

  if (!duration || duration < 1) {
    throw new Error(
      "Duration must be at least 1 minute."
    );
  }

  if (!totalMarks || totalMarks <= 0) {
    throw new Error(
      "Total marks must be greater than 0."
    );
  }

  if (
    passingPercentage < 0 ||
    passingPercentage > 100
  ) {

    throw new Error(
      "Passing percentage must be between 0 and 100."
    );

  }

  if (
    negativeMarking < 0
  ) {

    throw new Error(
      "Negative marking cannot be negative."
    );

  }

  if (
    !maxAttempts ||
    maxAttempts < 1
  ) {

    throw new Error(
      "Maximum attempts must be at least 1."
    );

  }


  if (
    startValue &&
    endValue
  ) {

    const start =
      new Date(startValue);

    const end =
      new Date(endValue);

    if (end <= start) {

      throw new Error(
        "End date/time must be after start date/time."
      );

    }

  }


  return {

    title,

    description:
      description || null,

    subject_id:
      subjectId
        ? Number(subjectId)
        : null,

    chapter_id:
      chapterId
        ? Number(chapterId)
        : null,

    created_by:
      currentUser.id,

    duration_minutes:
      duration,

    total_marks:
      totalMarks,

    passing_percentage:
      passingPercentage,

    negative_marking:
      negativeMarking,

    max_attempts:
      maxAttempts,

    randomize_questions:
      randomizeQuestions,

    randomize_options:
      randomizeOptions,

    show_result_immediately:
      showResultImmediately,

    show_explanations:
      showExplanations,

    is_published:
      isPublished,

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

}


/* =========================================================
   CREATE EXAM DATABASE INSERT
========================================================= */

async function createExam(
  publish
) {

  const errorBox =
    document.getElementById(
      "createExamError"
    );

  const successBox =
    document.getElementById(
      "createExamSuccess"
    );

  const saveButton =
    document.getElementById(
      "saveDraftBtn"
    );

  const publishButton =
    document.getElementById(
      "publishExamBtn"
    );


  errorBox.textContent = "";
  successBox.textContent = "";


  try {

    const examData =
      getCreateExamData(
        publish
      );


    if (publish) {

      publishButton.disabled = true;
      publishButton.textContent =
        "Publishing...";

    }

    else {

      saveButton.disabled = true;
      saveButton.textContent =
        "Saving...";

    }


    const {
      data,
      error
    } =
      await supabaseClient
        .from("exams")
        .insert(
          examData
        )
        .select()
        .single();


    if (error) {

      throw error;

    }


    successBox.textContent =
      publish
        ? "✅ Exam created and published successfully!"
        : "✅ Exam saved as draft successfully!";


    document.getElementById(
      "createExamForm"
    ).reset();


    document.getElementById(
      "examChapter"
    ).innerHTML =
      `<option value="">
        Select Chapter
      </option>`;


    await loadTeacherDashboard();


    console.log(
      "Created Exam:",
      data
    );


  }

  catch (error) {

    console.error(
      "Create exam error:",
      error
    );

    errorBox.textContent =
      getFriendlyDatabaseError(
        error
      );

  }

  finally {

    saveButton.disabled = false;
    saveButton.textContent =
      "💾 Save Draft";

    publishButton.disabled = false;
    publishButton.textContent =
      "🚀 Create & Publish";

  }

}


/* =========================================================
   RESET EXAM FORM
========================================================= */

function resetCreateExamForm() {

  const form =
    document.getElementById(
      "createExamForm"
    );

  form.reset();

  document.getElementById(
    "examChapter"
  ).innerHTML =
    `<option value="">
      Select Chapter
    </option>`;

  document.getElementById(
    "createExamError"
  ).textContent = "";

  document.getElementById(
    "createExamSuccess"
  ).textContent = "";

}


/* =========================================================
   DATABASE ERROR
========================================================= */

function getFriendlyDatabaseError(
  error
) {

  const message =
    String(
      error?.message ||
      error ||
      ""
    );

  const lower =
    message.toLowerCase();


  if (
    lower.includes(
      "row-level security"
    )
  ) {

    return "Permission denied by Supabase RLS. Teacher exam INSERT policy needs to be enabled.";

  }


  if (
    lower.includes(
      "foreign key"
    )
  ) {

    return "Selected Subject or Chapter is invalid.";

  }


  if (
    lower.includes(
      "duplicate"
    )
  ) {

    return "This exam already exists.";

  }


  return message ||
    "Unable to create exam.";

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
