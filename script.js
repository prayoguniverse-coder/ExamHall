/* =========================================================
   EXAMHALL
   SUPABASE + QUESTION BUILDER
========================================================= */


/* ================= SUPABASE ================= */

const SUPABASE_URL =
  "https://imiuiizgusnydgongbqk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_wIN-aHetkbk4c8hpZ9e_pQ_mEJmVx_v";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* ================= STATE ================= */

let currentUser = null;
let currentProfile = null;

let selectedExamId = null;
let editingQuestionId = null;


/* ================= ELEMENTS ================= */

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
   SIGNUP
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
    name.charAt(0).toUpperCase();

  document.getElementById(
    "studentWelcome"
  ).textContent =
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
        button.dataset.page ===
        pageId
      ) {

        button.classList.add("active");

      }

    });


  if (
    pageId === "studentDashboard"
  ) {

    loadStudentDashboard();

  }

  if (
    pageId === "studentResults"
  ) {

    loadStudentResults();

  }

  if (
    pageId === "studentHistory"
  ) {

    loadStudentHistory();

  }

  if (
    pageId === "teacherDashboard"
  ) {

    loadTeacherDashboard();

  }

  if (
    pageId === "createExam"
  ) {

    loadCreateExamPage();

  }

  if (
    pageId === "teacherScores"
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
        () => {

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
        Number(item.percentage)
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
          Completed exams will appear here.
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

        ${Number(result.score).toFixed(2)}

        <br>

        ${Number(result.percentage)}%

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
                item.percentage
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
          ${exam.duration_minutes}
          Minutes
        </p>

      </div>

      <div class="exam-status">

        <span
          class="status-badge ${
            exam.is_published
              ? "published"
              : "draft"
          }"
        >
          ${
            exam.is_published
              ? "Published"
              : "Draft"
          }
        </span>

      </div>

    `;

    list.appendChild(item);

  });

}


/* =========================================================
   CREATE EXAM PAGE
========================================================= */

async function loadCreateExamPage() {

  selectedExamId = null;
  editingQuestionId = null;

  document
    .getElementById(
      "questionBuilder"
    )
    .classList.add("hidden");

  document.getElementById(
    "examMessage"
  ).textContent = "";

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
   SUBJECT CHANGE
========================================================= */

document
  .getElementById(
    "examSubjectSelect"
  )
  .addEventListener(
    "change",
    async event => {

      const subjectId =
        event.target.value;

      await loadChapters(
        subjectId
      );

    }
  );


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
   CREATE EXAM
========================================================= */

document
  .getElementById(
    "createExamBtn"
  )
  .addEventListener(
    "click",
    createExam
  );


async function createExam() {

  const message =
    document.getElementById(
      "examMessage"
    );

  message.className =
    "form-message";

  message.textContent = "";


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
      "examSubjectSelect"
    ).value;

  const chapterValue =
    document.getElementById(
      "examChapterSelect"
    ).value;

  const duration =
    Number(
      document.getElementById(
        "examDurationInput"
      ).value
    );

  const passing =
    Number(
      document.getElementById(
        "examPassingInput"
      ).value
    );

  const maxAttempts =
    Number(
      document.getElementById(
        "examAttemptsInput"
      ).value
    );

  const negative =
    Number(
      document.getElementById(
        "examNegativeInput"
      ).value
    );


  if (!title) {

    showFormMessage(
      message,
      "Please enter exam title.",
      "error"
    );

    return;

  }

  if (!subjectId) {

    showFormMessage(
      message,
      "Please select a subject.",
      "error"
    );

    return;

  }

  if (
    !duration ||
    duration < 1
  ) {

    showFormMessage(
      message,
      "Duration must be at least 1 minute.",
      "error"
    );

    return;

  }


  const button =
    document.getElementById(
      "createExamBtn"
    );

  button.disabled = true;
  button.textContent = "Creating...";


  try {

    const payload = {

      title,

      description:
        description || null,

      subject_id:
        Number(subjectId),

      chapter_id:
        chapterValue
          ? Number(chapterValue)
          : null,

      created_by:
        currentUser.id,

      duration_minutes:
        duration,

      total_marks:
        0,

      passing_percentage:
        passing,

      negative_marking:
        negative,

      max_attempts:
        maxAttempts,

      randomize_questions:
        false,

      randomize_options:
        false,

      show_result_immediately:
        true,

      show_explanations:
        true,

      is_published:
        false

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


    selectedExamId =
      data.id;


    document.getElementById(
      "questionBuilder"
    ).classList.remove("hidden");


    document.getElementById(
      "selectedExamInfo"
    ).textContent =
      `Exam: ${data.title}`;


    document.getElementById(
      "examStatusBadge"
    ).textContent =
      "Draft";


    document.getElementById(
      "examStatusBadge"
    ).className =
      "status-badge draft";


    showFormMessage(
      message,
      "Exam created successfully. Now add questions.",
      "success"
    );


    await loadExamQuestions();


  }
  catch (error) {

    console.error(
      "Create exam error:",
      error
    );

    showFormMessage(
      message,
      error.message ||
      "Unable to create exam.",
      "error"
    );

  }
  finally {

    button.disabled = false;
    button.textContent = "Create Exam";

  }

}


/* =========================================================
   SAVE QUESTION
========================================================= */

document
  .getElementById(
    "saveQuestionBtn"
  )
  .addEventListener(
    "click",
    saveQuestion
  );


async function saveQuestion() {

  if (!selectedExamId) {

    alert(
      "Please create an exam first."
    );

    return;

  }


  const message =
    document.getElementById(
      "questionMessage"
    );

  message.className =
    "form-message";

  message.textContent = "";


  const questionText =
    document
      .getElementById(
        "questionTextInput"
      )
      .value
      .trim();

  const imageUrl =
    document
      .getElementById(
        "questionImageInput"
      )
      .value
      .trim();

  const optionA =
    document
      .getElementById(
        "optionAInput"
      )
      .value
      .trim();

  const optionB =
    document
      .getElementById(
        "optionBInput"
      )
      .value
      .trim();

  const optionC =
    document
      .getElementById(
        "optionCInput"
      )
      .value
      .trim();

  const optionD =
    document
      .getElementById(
        "optionDInput"
      )
      .value
      .trim();

  const correctAnswer =
    document.getElementById(
      "correctAnswerSelect"
    ).value;

  const marks =
    Number(
      document.getElementById(
        "questionMarksInput"
      ).value
    );

  const negativeMarks =
    Number(
      document.getElementById(
        "questionNegativeInput"
      ).value
    );

  const explanation =
    document
      .getElementById(
        "questionExplanationInput"
      )
      .value
      .trim();


  if (!questionText) {

    showFormMessage(
      message,
      "Please enter the question.",
      "error"
    );

    return;

  }

  if (!optionA || !optionB) {

    showFormMessage(
      message,
      "Option A and Option B are required.",
      "error"
    );

    return;

  }

  if (!correctAnswer) {

    showFormMessage(
      message,
      "Please select the correct answer.",
      "error"
    );

    return;

  }

  if (
    !marks ||
    marks <= 0
  ) {

    showFormMessage(
      message,
      "Marks must be greater than 0.",
      "error"
    );

    return;

  }


  const payload = {

    exam_id:
      selectedExamId,

    question_text:
      questionText,

    image_url:
      imageUrl || null,

    option_a:
      optionA,

    option_b:
      optionB,

    option_c:
      optionC || null,

    option_d:
      optionD || null,

    correct_answer:
      correctAnswer,

    explanation:
      explanation || null,

    marks:
      marks,

    negative_marks:
      negativeMarks,

    question_order:
      0

  };


  const button =
    document.getElementById(
      "saveQuestionBtn"
    );

  button.disabled = true;

  button.textContent =
    editingQuestionId
      ? "Updating..."
      : "Saving...";


  try {

    if (editingQuestionId) {

      const {
        error
      } =
        await supabaseClient
          .from("questions")
          .update(payload)
          .eq(
            "id",
            editingQuestionId
          );

      if (error) {
        throw error;
      }

      showFormMessage(
        message,
        "Question updated successfully.",
        "success"
      );

    }
    else {

      const {
        error
      } =
        await supabaseClient
          .from("questions")
          .insert(payload);

      if (error) {
        throw error;
      }

      showFormMessage(
        message,
        "Question added successfully.",
        "success"
      );

    }


    editingQuestionId = null;

    resetQuestionForm();

    document.getElementById(
      "saveQuestionBtn"
    ).textContent =
      "Add Question";

    document.getElementById(
      "cancelEditBtn"
    ).classList.add("hidden");


    await updateExamTotalMarks();

    await loadExamQuestions();

  }
  catch (error) {

    console.error(
      "Question save error:",
      error
    );

    showFormMessage(
      message,
      error.message ||
      "Unable to save question.",
      "error"
    );

  }
  finally {

    button.disabled = false;

    if (!editingQuestionId) {

      button.textContent =
        "Add Question";

    }

  }

}


/* =========================================================
   LOAD QUESTIONS
========================================================= */

async function loadExamQuestions() {

  if (!selectedExamId) {
    return;
  }

  const list =
    document.getElementById(
      "questionList"
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
        selectedExamId
      )
      .order(
        "question_order",
        {
          ascending: true
        }
      )
      .order(
        "id",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(error);

    list.innerHTML =
      `<p class="error-message">
        Unable to load questions.
      </p>`;

    return;

  }


  list.innerHTML = "";


  if (!data.length) {

    list.innerHTML =
      `<div class="empty-state small-empty">

        <div class="empty-icon">
          ❓
        </div>

        <h3>
          No questions added
        </h3>

        <p>
          Add your first question above.
        </p>

      </div>`;

    return;

  }


  data.forEach(
    (question, index) => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "question-item";


      item.innerHTML = `

        <div class="question-item-top">

          <div>

            <span class="question-number-badge">
              Q${index + 1}
            </span>

            <strong>
              ${escapeHTML(
                question.question_text
              )}
            </strong>

          </div>

          <div class="question-actions">

            <button
              class="small-btn edit-question"
              type="button"
            >
              Edit
            </button>

            <button
              class="small-btn delete delete-question"
              type="button"
            >
              Delete
            </button>

          </div>

        </div>


        <div class="question-preview">

          <div>
            <b>A:</b>
            ${escapeHTML(
              question.option_a
            )}
          </div>

          <div>
            <b>B:</b>
            ${escapeHTML(
              question.option_b
            )}
          </div>

          ${
            question.option_c
              ? `
                <div>
                  <b>C:</b>
                  ${escapeHTML(
                    question.option_c
                  )}
                </div>
              `
              : ""
          }

          ${
            question.option_d
              ? `
                <div>
                  <b>D:</b>
                  ${escapeHTML(
                    question.option_d
                  )}
                </div>
              `
              : ""
          }

        </div>


        <div class="question-meta">

          <span>
            Correct:
            ${escapeHTML(
              question.correct_answer
            )}
          </span>

          <span>
            Marks:
            ${Number(
              question.marks
            )}
          </span>

          <span>
            Negative:
            ${Number(
              question.negative_marks
            )}
          </span>

        </div>

      `;


      item
        .querySelector(
          ".edit-question"
        )
        .addEventListener(
          "click",
          () => {

            editQuestion(
              question
            );

          }
        );


      item
        .querySelector(
          ".delete-question"
        )
        .addEventListener(
          "click",
          () => {

            deleteQuestion(
              question.id
            );

          }
        );


      list.appendChild(item);

    }
  );

}


/* =========================================================
   EDIT QUESTION
========================================================= */

function editQuestion(
  question
) {

  editingQuestionId =
    question.id;


  document.getElementById(
    "questionTextInput"
  ).value =
    question.question_text || "";

  document.getElementById(
    "questionImageInput"
  ).value =
    question.image_url || "";

  document.getElementById(
    "optionAInput"
  ).value =
    question.option_a || "";

  document.getElementById(
    "optionBInput"
  ).value =
    question.option_b || "";

  document.getElementById(
    "optionCInput"
  ).value =
    question.option_c || "";

  document.getElementById(
    "optionDInput"
  ).value =
    question.option_d || "";

  document.getElementById(
    "correctAnswerSelect"
  ).value =
    question.correct_answer || "";

  document.getElementById(
    "questionMarksInput"
  ).value =
    question.marks ?? 1;

  document.getElementById(
    "questionNegativeInput"
  ).value =
    question.negative_marks ?? 0;

  document.getElementById(
    "questionExplanationInput"
  ).value =
    question.explanation || "";


  document.getElementById(
    "saveQuestionBtn"
  ).textContent =
    "Update Question";


  document.getElementById(
    "cancelEditBtn"
  ).classList.remove(
    "hidden"
  );


  document
    .getElementById(
      "questionTextInput"
    )
    .scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

}


/* =========================================================
   CANCEL EDIT
========================================================= */

document
  .getElementById(
    "cancelEditBtn"
  )
  .addEventListener(
    "click",
    () => {

      editingQuestionId =
        null;

      resetQuestionForm();

      document.getElementById(
        "saveQuestionBtn"
      ).textContent =
        "Add Question";

      document.getElementById(
        "cancelEditBtn"
      ).classList.add(
        "hidden"
      );

    }
  );


/* =========================================================
   DELETE QUESTION
========================================================= */

async function deleteQuestion(
  questionId
) {

  const confirmed =
    confirm(
      "Delete this question?"
    );

  if (!confirmed) {
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
        questionId
      );


  if (error) {

    console.error(error);

    alert(
      error.message ||
      "Unable to delete question."
    );

    return;

  }


  await updateExamTotalMarks();

  await loadExamQuestions();

}


/* =========================================================
   UPDATE TOTAL MARKS
========================================================= */

async function updateExamTotalMarks() {

  if (!selectedExamId) {
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("questions")
      .select(
        "marks"
      )
      .eq(
        "exam_id",
        selectedExamId
      );


  if (error) {

    console.error(error);

    return;

  }


  const total =
    (data || []).reduce(
      (sum, question) =>
        sum +
        Number(
          question.marks || 0
        ),
      0
    );


  const {
    error: updateError
  } =
    await supabaseClient
      .from("exams")
      .update({
        total_marks: total
      })
      .eq(
        "id",
        selectedExamId
      );


  if (updateError) {

    console.error(
      updateError
    );

  }

}


/* =========================================================
   PUBLISH EXAM
========================================================= */

document
  .getElementById(
    "publishExamBtn"
  )
  .addEventListener(
    "click",
    publishExam
  );


async function publishExam() {

  if (!selectedExamId) {

    alert(
      "Please create an exam first."
    );

    return;

  }


  const {
    data: questions,
    error
  } =
    await supabaseClient
      .from("questions")
      .select(
        "id"
      )
      .eq(
        "exam_id",
        selectedExamId
      );


  if (error) {

    alert(
      error.message
    );

    return;

  }


  if (!questions.length) {

    alert(
      "Please add at least one question before publishing."
    );

    return;

  }


  const confirmed =
    confirm(
      "Publish this exam? Students will be able to see it."
    );

  if (!confirmed) {
    return;
  }


  const {
    error: updateError
  } =
    await supabaseClient
      .from("exams")
      .update({
        is_published: true
      })
      .eq(
        "id",
        selectedExamId
      );


  if (updateError) {

    console.error(
      updateError
    );

    alert(
      updateError.message ||
      "Unable to publish exam."
    );

    return;

  }


  document.getElementById(
    "examStatusBadge"
  ).textContent =
    "Published";


  document.getElementById(
    "examStatusBadge"
  ).className =
    "status-badge published";


  alert(
    "Exam published successfully."
  );


  await loadTeacherDashboard();

}


/* =========================================================
   RESET QUESTION FORM
========================================================= */

function resetQuestionForm() {

  document.getElementById(
    "questionTextInput"
  ).value = "";

  document.getElementById(
    "questionImageInput"
  ).value = "";

  document.getElementById(
    "optionAInput"
  ).value = "";

  document.getElementById(
    "optionBInput"
  ).value = "";

  document.getElementById(
    "optionCInput"
  ).value = "";

  document.getElementById(
    "optionDInput"
  ).value = "";

  document.getElementById(
    "correctAnswerSelect"
  ).value = "";

  document.getElementById(
    "questionMarksInput"
  ).value = "1";

  document.getElementById(
    "questionNegativeInput"
  ).value = "0";

  document.getElementById(
    "questionExplanationInput"
  ).value = "";

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
   LOGOUT
========================================================= */

document
  .getElementById(
    "logoutBtn"
  )
  .addEventListener(
    "click",
    async () => {

      await supabaseClient.auth.signOut();

      currentUser = null;
      currentProfile = null;
      selectedExamId = null;
      editingQuestionId = null;

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
   HELPERS
========================================================= */

function showFormMessage(
  element,
  message,
  type
) {

  element.textContent =
    message;

  element.className =
    `form-message ${type}`;

}


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
