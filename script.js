/* =========================================================
   EXAMHALL - FINAL STEP 6
   Supabase Auth + Exam Builder + Question Builder
========================================================= */

const SUPABASE_URL = "https://imiuiizgusnydgongbqk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wIN-aHetkbk4c8hpZ9e_pQ_mEJmVx_v";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

let currentUser = null;
let currentProfile = null;
let currentExam = null;
let currentQuestion = 0;
let selectedAnswers = [];
let builderQuestions = [];

const $ = id => document.getElementById(id);

const loginPage = $("loginPage");
const app = $("app");
const loginForm = $("loginForm");
const signupForm = $("signupForm");
const loginTab = $("loginTab");
const signupTab = $("signupTab");
const loginError = $("loginError");
const signupError = $("signupError");
const signupSuccess = $("signupSuccess");

function clearMessages() {
  loginError.textContent = "";
  signupError.textContent = "";
  signupSuccess.textContent = "";
}

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

/* ================= LOGIN ================= */

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  clearMessages();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;
  const button = $("loginBtn");

  if (!email || !password) {
    loginError.textContent = "Email and password are required.";
    return;
  }

  button.disabled = true;
  button.textContent = "Logging in...";

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    currentUser = data.user;
    await loadUserProfile();
  } catch (error) {
    console.error(error);
    loginError.textContent = getFriendlyAuthError(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Login";
  }
});

/* ================= SIGNUP ================= */

signupForm.addEventListener("submit", async event => {
  event.preventDefault();
  clearMessages();

  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim().toLowerCase();
  const password = $("signupPassword").value;
  const confirmPassword = $("signupConfirmPassword").value;
  const button = $("signupBtn");

  if (!name) {
    signupError.textContent = "Please enter your full name.";
    return;
  }

  if (password.length < 6) {
    signupError.textContent = "Password must contain at least 6 characters.";
    return;
  }

  if (password !== confirmPassword) {
    signupError.textContent = "Passwords do not match.";
    return;
  }

  button.disabled = true;
  button.textContent = "Creating account...";

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });

    if (error) throw error;

    if (data.session) {
      currentUser = data.user;
      await loadUserProfile();
      return;
    }

    signupSuccess.textContent =
      "Account created successfully. Please confirm your email and then login.";
    signupForm.reset();
  } catch (error) {
    console.error(error);
    signupError.textContent = getFriendlyAuthError(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Create Student Account";
  }
});

/* ================= PROFILE ================= */

async function loadUserProfile() {
  if (!currentUser) return;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    console.error("Profile error:", error);
    setTimeout(loadUserProfile, 1000);
    return;
  }

  currentProfile = data;
  openDashboard();
}

function openDashboard() {
  loginPage.classList.add("hidden");
  app.classList.remove("hidden");
  updateUserUI();

  if (currentProfile.role === "teacher") {
    $("teacherMenu").classList.remove("hidden");
    $("studentMenu").classList.add("hidden");
    showPage("teacherDashboard");
  } else {
    $("studentMenu").classList.remove("hidden");
    $("teacherMenu").classList.add("hidden");
    showPage("studentDashboard");
  }
}

function updateUserUI() {
  const name = currentProfile?.full_name || currentUser?.email || "User";

  $("userName").textContent = name;
  $("userRole").textContent = currentProfile?.role || "student";
  $("userAvatar").textContent = name.charAt(0).toUpperCase();
  $("studentWelcome").textContent = name;
}

/* ================= NAVIGATION ================= */

document.querySelectorAll(".menu-btn").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));

  const page = $(pageId);
  if (!page) return;

  page.classList.remove("hidden");

  document.querySelectorAll(".menu-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  if (pageId === "studentDashboard") loadStudentDashboard();
  if (pageId === "studentResults") loadStudentResults();
  if (pageId === "studentHistory") loadStudentHistory();
  if (pageId === "teacherDashboard") loadTeacherDashboard();
  if (pageId === "createExam") initExamBuilder();
  if (pageId === "teacherScores") loadTeacherScores();
}

/* ================= STUDENT DASHBOARD ================= */

async function loadStudentDashboard() {
  if (!currentUser) return;

  $("examList").innerHTML = `<div class="loading">Loading exams...</div>`;

  try {
    const { data: exams, error } = await supabaseClient
      .from("exams")
      .select(`
        id,title,description,duration_minutes,total_marks,max_attempts,
        start_at,end_at,subjects(name),chapters(name)
      `)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const now = new Date();

    const visibleExams = (exams || []).filter(exam => {
      if (exam.start_at && new Date(exam.start_at) > now) return false;
      if (exam.end_at && new Date(exam.end_at) < now) return false;
      return true;
    });

    $("availableExams").textContent = visibleExams.length;
    showAvailableExams(visibleExams);
    await loadStudentStats();
  } catch (error) {
    console.error(error);
    $("examList").innerHTML =
      `<p class="error-inline">Unable to load exams.</p>`;
  }
}

function showAvailableExams(exams) {
  const list = $("examList");
  list.innerHTML = "";

  if (!exams.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>No exams available</h3>
        <p>Your teacher has not published any active exams yet.</p>
      </div>`;
    return;
  }

  exams.forEach(exam => {
    const item = document.createElement("div");
    item.className = "exam-item";

    item.innerHTML = `
      <div>
        <h4>${escapeHTML(exam.title)}</h4>
        <p>
          ${escapeHTML(exam.subjects?.name || "General")}
          • ${escapeHTML(exam.chapters?.name || "All Chapters")}
          • ${exam.duration_minutes} Minutes
          • ${Number(exam.total_marks || 0)} Marks
        </p>
      </div>
      <button class="primary-btn" type="button">Start Exam</button>
    `;

    item.querySelector("button").addEventListener("click", () => {
  startExam(exam);
});

    list.appendChild(item);
  });
}

async function loadStudentStats() {
  const { data, error } = await supabaseClient
    .from("exam_attempts")
    .select("percentage,status")
    .eq("student_id", currentUser.id)
    .in("status", ["submitted", "auto_submitted", "expired"]);

  if (error) {
    console.error(error);
    return;
  }

  const attempts = data || [];
  $("attemptCount").textContent = attempts.length;

  if (!attempts.length) {
    $("averageScore").textContent = "0%";
    $("bestScore").textContent = "0%";
    return;
  }

  const percentages = attempts.map(x => Number(x.percentage) || 0);
  const average = Math.round(
    percentages.reduce((a, b) => a + b, 0) / percentages.length
  );
  const best = Math.max(...percentages);

  $("averageScore").textContent = `${average}%`;
  $("bestScore").textContent = `${best}%`;
}

/* ================= RESULTS ================= */

async function loadStudentResults() {
  const container = $("myResults");
  container.innerHTML = `<div class="loading">Loading results...</div>`;

  const { data, error } = await supabaseClient
    .from("exam_attempts")
    .select(`
      id,score,percentage,correct_answers,wrong_answers,unanswered,
      submitted_at,status,exams(title)
    `)
    .eq("student_id", currentUser.id)
    .in("status", ["submitted", "auto_submitted", "expired"])
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Unable to load results.</p>";
    return;
  }

  container.innerHTML = "";

  if (!data?.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <h3>No results yet</h3>
        <p>Your completed exams will appear here.</p>
      </div>`;
    return;
  }

  data.forEach(result => {
    const item = document.createElement("div");
    item.className = "result-item";
    item.innerHTML = `
      <div>
        <strong>${escapeHTML(result.exams?.title || "Exam")}</strong>
        <p>${formatDate(result.submitted_at)}</p>
      </div>
      <div class="score">
        ${Number(result.score || 0).toFixed(2)}
        <br>${Number(result.percentage || 0)}%
      </div>`;
    container.appendChild(item);
  });
}

async function loadStudentHistory() {
  const container = $("historyList");
  container.innerHTML = `<div class="loading">Loading history...</div>`;

  const { data, error } = await supabaseClient
    .from("exam_attempts")
    .select(`
      id,attempt_number,score,percentage,status,submitted_at,created_at,
      exams(title)
    `)
    .eq("student_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Unable to load history.</p>";
    return;
  }

  container.innerHTML = "";

  if (!data?.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🕘</div>
        <h3>No attempts yet</h3>
        <p>Your exam attempts will appear here.</p>
      </div>`;
    return;
  }

  data.forEach(attempt => {
    const item = document.createElement("div");
    item.className = "result-item";
    item.innerHTML = `
      <div>
        <strong>${escapeHTML(attempt.exams?.title || "Exam")}</strong>
        <p>Attempt #${attempt.attempt_number} • ${escapeHTML(attempt.status)}</p>
      </div>
      <div class="score">${Number(attempt.percentage || 0)}%</div>`;
    container.appendChild(item);
  });
}
/* =========================================================
   TEACHER DASHBOARD
========================================================= */

async function loadTeacherDashboard() {
  if (!currentUser) return;

  try {
    /* ---------- Exams ---------- */

    const { data: exams, error: examError } = await supabaseClient
      .from("exams")
      .select(`
        id,
        title,
        description,
        is_published,
        duration_minutes,
        total_marks,
        passing_percentage,
        max_attempts,
        randomize_questions,
        randomize_options,
        start_at,
        end_at,
        created_at,
        subjects(name),
        chapters(name)
      `)
      .eq("created_by", currentUser.id)
      .order("created_at", { ascending: false });

    if (examError) throw examError;

    const examList = exams || [];

    $("teacherExamCount").textContent = examList.length;

    /* ---------- Attempts ---------- */

    const { data: attempts, error: attemptError } =
      await supabaseClient
        .from("exam_attempts")
        .select(`
          id,
          student_id,
          exam_id,
          score,
          percentage,
          status,
          submitted_at
        `);

    if (attemptError) {
      console.error("Attempts error:", attemptError);
    }

    const completedAttempts = (attempts || []).filter(attempt =>
      ["submitted", "auto_submitted", "expired"].includes(attempt.status)
    );

    $("teacherAttemptCount").textContent =
      completedAttempts.length;

    const uniqueStudents = new Set(
      completedAttempts.map(attempt => attempt.student_id)
    );

    $("teacherStudentCount").textContent =
      uniqueStudents.size;

    if (completedAttempts.length) {

      const percentages = completedAttempts.map(
        attempt => Number(attempt.percentage || 0)
      );

      const average =
        percentages.reduce((sum, value) => sum + value, 0) /
        percentages.length;

      $("teacherAverage").textContent =
        `${Math.round(average)}%`;

      const highest = Math.max(...percentages);

      if ($("teacherHighestScore")) {
        $("teacherHighestScore").textContent =
          `${Math.round(highest)}%`;
      }

    } else {

      $("teacherAverage").textContent = "0%";

      if ($("teacherHighestScore")) {
        $("teacherHighestScore").textContent = "0%";
      }
    }

    /* ---------- Active Exams ---------- */

    const now = new Date();

    const activeExams = examList.filter(exam => {

      if (!exam.is_published) return false;

      if (exam.start_at &&
          new Date(exam.start_at) > now) {
        return false;
      }

      if (exam.end_at &&
          new Date(exam.end_at) < now) {
        return false;
      }

      return true;
    });

    if ($("activeExamCount")) {
      $("activeExamCount").textContent =
        activeExams.length;
    }

    /* ---------- Recent Exams ---------- */

    const list = $("teacherExamList");

    if (!list) return;

    list.innerHTML = "";

    if (!examList.length) {

      list.innerHTML = `
        <div class="empty-state">

          <div class="empty-icon">📝</div>

          <h3>No exams created</h3>

          <p>
            Create your first exam using
            the Exam Builder.
          </p>

        </div>
      `;

      return;
    }

    examList.slice(0, 10).forEach(exam => {

      const item = document.createElement("div");

      item.className = "exam-item";

      item.innerHTML = `

        <div class="exam-item-info">

          <h4>
            ${escapeHTML(exam.title)}
          </h4>

          <p>

            ${escapeHTML(
              exam.subjects?.name || "General"
            )}

            •

            ${escapeHTML(
              exam.chapters?.name || "All Chapters"
            )}

            •

            ${exam.duration_minutes} Minutes

            •

            ${Number(exam.total_marks || 0)} Marks

          </p>

          <small>
            Created:
            ${formatDate(exam.created_at)}
          </small>

        </div>

        <div class="exam-item-actions">

          <span class="status-badge
            ${exam.is_published
              ? "published"
              : "draft"}">

            ${exam.is_published
              ? "🟢 Published"
              : "🔴 Draft"}

          </span>

          <button
            type="button"
            class="secondary-btn exam-toggle-btn">

            ${exam.is_published
              ? "Deactivate"
              : "Publish"}

          </button>

          <button
            type="button"
            class="danger-btn exam-delete-btn">

            Delete

          </button>

        </div>
      `;

      /* ---------- Publish / Deactivate ---------- */

      item
        .querySelector(".exam-toggle-btn")
        .addEventListener("click", async () => {

          await toggleExamStatus(
            exam.id,
            !exam.is_published
          );

        });

      /* ---------- Delete ---------- */

      item
        .querySelector(".exam-delete-btn")
        .addEventListener("click", async () => {

          await deleteExam(exam.id);

        });

      list.appendChild(item);

    });

  } catch (error) {

    console.error(
      "Teacher dashboard error:",
      error
    );

  }
}


/* =========================================================
   ACTIVATE / DEACTIVATE EXAM
========================================================= */

async function toggleExamStatus(
  examId,
  publish
) {

  const message = publish
    ? "Publish this exam?"
    : "Deactivate this exam?";

  if (!confirm(message)) return;

  const { error } = await supabaseClient
    .from("exams")
    .update({
      is_published: publish
    })
    .eq("id", examId)
    .eq("created_by", currentUser.id);

  if (error) {

    console.error(error);

    alert(
      getFriendlyDatabaseError(error)
    );

    return;
  }

  await loadTeacherDashboard();
}


/* =========================================================
   DELETE EXAM
========================================================= */

async function deleteExam(examId) {

  const confirmed = confirm(
    "Delete this exam and all its questions?\n\nThis action cannot be undone."
  );

  if (!confirmed) return;

  try {

    /*
      Questions are deleted first.
      Then the exam is deleted.
    */

    const { error: questionError } =
      await supabaseClient
        .from("questions")
        .delete()
        .eq("exam_id", examId);

    if (questionError) {
      throw questionError;
    }

    const { error: examError } =
      await supabaseClient
        .from("exams")
        .delete()
        .eq("id", examId)
        .eq("created_by", currentUser.id);

    if (examError) {
      throw examError;
    }

    alert("Exam deleted successfully.");

    await loadTeacherDashboard();

  } catch (error) {

    console.error(
      "Delete exam error:",
      error
    );

    alert(
      getFriendlyDatabaseError(error)
    );
  }
}


/* =========================================================
   TEACHER SCORES
========================================================= */

async function loadTeacherScores() {

  const table = $("scoreTable");

  if (!table) return;

  table.innerHTML = `
    <tr>
      <td colspan="5">
        Loading results...
      </td>
    </tr>
  `;

  try {

    const { data, error } =
      await supabaseClient
        .from("exam_attempts")
        .select(`
          id,
          score,
          percentage,
          submitted_at,
          status,
          profiles!exam_attempts_student_id_fkey(
            full_name
          ),
          exams(
            title
          )
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
          { ascending: false }
        );

    if (error) throw error;

    table.innerHTML = "";

    if (!data?.length) {

      table.innerHTML = `
        <tr>
          <td colspan="5">
            No student results available.
          </td>
        </tr>
      `;

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

  } catch (error) {

    console.error(
      "Teacher scores error:",
      error
    );

    table.innerHTML = `
      <tr>
        <td colspan="5">
          Unable to load results.
        </td>
      </tr>
    `;
  }
}


/* =========================================================
   EXAM BUILDER
========================================================= */

let builderInitialized = false;



/* =========================================================
   INITIALIZE EXAM BUILDER
========================================================= */

async function initExamBuilder() {

  if (!builderInitialized) {

    builderInitialized = true;

    bindExamBuilderEvents();

    builderQuestions = [];

    addQuestion();

  }

  await loadBuilderSubjects();
}


/* =========================================================
   BIND EXAM BUILDER EVENTS
========================================================= */

function bindExamBuilderEvents() {

  const addButton =
    $("addQuestionBtn");

  if (addButton) {

    addButton.addEventListener(
      "click",
      () => addQuestion()
    );

  }


  const resetButton =
    $("resetExamBuilderBtn");

  if (resetButton) {

    resetButton.addEventListener(
      "click",
      () => {

        if (
          !confirm(
            "Clear complete exam form?"
          )
        ) return;

        resetExamBuilder();

      }
    );

  }


  const subject =
    $("examSubjectInput");

  if (subject) {

    subject.addEventListener(
      "change",
      async () => {

        await loadBuilderChapters(
          subject.value
        );

      }
    );

  }


  const form =
    $("examBuilderForm");

  if (form) {

    form.addEventListener(
      "submit",
      saveExam
    );

  }

}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadBuilderSubjects() {

  const select =
    $("examSubjectInput");

  if (!select) return;

  const currentValue =
    select.value;

  select.innerHTML = `
    <option value="">
      Select Subject
    </option>
  `;

  const { data, error } =
    await supabaseClient
      .from("subjects")
      .select(`
        id,
        name
      `)
      .order("name");

  if (error) {

    console.error(
      "Subject loading error:",
      error
    );

    select.innerHTML = `
      <option value="">
        Unable to load subjects
      </option>
    `;

    return;
  }

  (data || []).forEach(
    subject => {

      const option =
        document.createElement("option");

      option.value =
        subject.id;

      option.textContent =
        subject.name;

      select.appendChild(option);

    }
  );

  if (
    currentValue &&
    [...select.options].some(
      option =>
        option.value === currentValue
    )
  ) {

    select.value =
      currentValue;

  }

  await loadBuilderChapters(
    select.value
  );
}


/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadBuilderChapters(
  subjectId
) {

  const select =
    $("examChapterInput");

  if (!select) return;

  select.innerHTML = `
    <option value="">
      All Chapters / Optional
    </option>
  `;

  if (!subjectId) return;

  const { data, error } =
    await supabaseClient
      .from("chapters")
      .select(`
        id,
        name
      `)
      .eq(
        "subject_id",
        subjectId
      )
      .order("name");

  if (error) {

    console.error(
      "Chapter loading error:",
      error
    );

    return;
  }

  (data || []).forEach(
    chapter => {

      const option =
        document.createElement("option");

      option.value =
        chapter.id;

      option.textContent =
        chapter.name;

      select.appendChild(option);

    }
  );
}


/* =========================================================
   ADD QUESTION
========================================================= */

function addQuestion(
  question = null
) {

  builderQuestions.push({

    question_text:
      question?.question_text || "",

    image_url:
      question?.image_url || "",

    option_a:
      question?.option_a || "",

    option_b:
      question?.option_b || "",

    option_c:
      question?.option_c || "",

    option_d:
      question?.option_d || "",

    correct_answer:
      question?.correct_answer || "A",

    explanation:
      question?.explanation || "",

    marks:
      question?.marks ?? 1,

    negative_marks:
      question?.negative_marks ?? 0

  });

  renderQuestionBuilder();
}


/* =========================================================
   REMOVE QUESTION
========================================================= */

function removeQuestion(index) {

  if (builderQuestions.length <= 1) {

    showBuilderMessage(
      "At least one question is required.",
      "error"
    );

    return;
  }

  builderQuestions.splice(
    index,
    1
  );

  renderQuestionBuilder();
}


/* =========================================================
   UPDATE QUESTION
========================================================= */

function updateBuilderQuestion(
  index,
  field,
  value
) {

  if (!builderQuestions[index]) {
    return;
  }

  builderQuestions[index][field] =
    value;

  updateBuilderSummary();
}


/* =========================================================
   RENDER QUESTION BUILDER
========================================================= */

function renderQuestionBuilder() {

  const container =
    $("questionBuilderList");

  if (!container) return;

  container.innerHTML = "";

  builderQuestions.forEach(
    (question, index) => {

      const card =
        document.createElement("div");

      card.className =
        "question-builder-card";

      card.innerHTML = `

        <div class="question-builder-top">

          <div>

            <strong>
              Question ${index + 1}
            </strong>

            <span class="question-mini-mark">
              ${Number(
                question.marks || 0
              )} Mark
            </span>

          </div>

          <button
            type="button"
            class="remove-question-btn">

            🗑️ Remove

          </button>

        </div>


        <div class="field full">

          <label>
            Question *
          </label>

          <textarea
            class="q-text"
            rows="3"
            placeholder="Enter question here..."
          >${escapeHTML(
            question.question_text
          )}</textarea>

        </div>


        <div class="field full">

          <label>
            Question Image URL
            (Optional)
          </label>

          <input
            class="q-image"
            type="url"
            placeholder="https://example.com/image.jpg"
            value="${escapeAttribute(
              question.image_url
            )}"
          >

        </div>


        <div class="option-grid">

          <div class="field">

            <label>
              Option A *
            </label>

            <input
              class="q-a"
              type="text"
              placeholder="Option A"
              value="${escapeAttribute(
                question.option_a
              )}"
            >

          </div>


          <div class="field">

            <label>
              Option B *
            </label>

            <input
              class="q-b"
              type="text"
              placeholder="Option B"
              value="${escapeAttribute(
                question.option_b
              )}"
            >

          </div>


          <div class="field">

            <label>
              Option C
            </label>

            <input
              class="q-c"
              type="text"
              placeholder="Option C"
              value="${escapeAttribute(
                question.option_c
              )}"
            >

          </div>


          <div class="field">

            <label>
              Option D
            </label>

            <input
              class="q-d"
              type="text"
              placeholder="Option D"
              value="${escapeAttribute(
                question.option_d
              )}"
            >

          </div>

        </div>


        <div class="form-grid compact-grid">

          <div class="field">

            <label>
              Correct Answer *
            </label>

            <select class="q-correct">

              <option
                value="A"
                ${question.correct_answer === "A"
                  ? "selected"
                  : ""}>
                A
              </option>

              <option
                value="B"
                ${question.correct_answer === "B"
                  ? "selected"
                  : ""}>
                B
              </option>

              <option
                value="C"
                ${question.correct_answer === "C"
                  ? "selected"
                  : ""}>
                C
              </option>

              <option
                value="D"
                ${question.correct_answer === "D"
                  ? "selected"
                  : ""}>
                D
              </option>

            </select>

          </div>


          <div class="field">

            <label>
              Marks *
            </label>

            <input
              class="q-marks"
              type="number"
              min="0.01"
              step="0.01"
              value="${escapeAttribute(
                question.marks
              )}"
            >

          </div>


          <div class="field">

            <label>
              Negative Marks
            </label>

            <input
              class="q-negative"
              type="number"
              min="0"
              step="0.01"
              value="${escapeAttribute(
                question.negative_marks
              )}"
            >

          </div>

        </div>


        <div class="field full">

          <label>
            Explanation
          </label>

          <textarea
            class="q-explanation"
            rows="2"
            placeholder="Explain the correct answer..."
          >${escapeHTML(
            question.explanation
          )}</textarea>

        </div>

      `;


      /* ---------- Remove ---------- */

      card
        .querySelector(
          ".remove-question-btn"
        )
        .addEventListener(
          "click",
          () => removeQuestion(index)
        );


      /* ---------- Question ---------- */

      card
        .querySelector(".q-text")
        .addEventListener(
          "input",
          event =>
            updateBuilderQuestion(
              index,
              "question_text",
              event.target.value
            )
        );


      /* ---------- Image ---------- */

      card
        .querySelector(".q-image")
        .addEventListener(
          "input",
          event =>
            updateBuilderQuestion(
              index,
              "image_url",
              event.target.value.trim()
            )
        );


      /* ---------- Option A ---------- */

      card
        .querySelector(".q-a")
        .addEventListener(
          "input",
          event =>
            updateBuilderQuestion(
              index,
              "option_a",
              event.target.value
            )
        );


      /* ---------- Option B ---------- */

      card
        .querySelector(".q-b")
        .addEventListener(
          "input",
          event =>
            updateBuilderQuestion(
              index,
              "option_b",
              event.target.value
            )
        );


      /* ---------- Option C ---------- */

      card
        .querySelector(".q-c")
        .addEventListener(
          "input",
          event =>
            updateBuilderQuestion(
              index,
              "option_c",
              event.target.value
            )
        );


      /* ---------- Option D ---------- */

      card
        .querySelector(".q-d")
        .addEventListener(
          "input",
          event =>
            updateBuilderQuestion(
              index,
              "option_d",
              event.target.value
            )
        );


      /* ---------- Correct ---------- */

      card
        .querySelector(".q-correct")
        .addEventListener(
          "change",
          event =>
            updateBuilderQuestion(
              index,
              "correct_answer",
              event.target.value
            )
        );


      /* ---------- Marks ---------- */

      card
        .querySelector(".q-marks")
        .addEventListener(
          "input",
          event =>
            updateBuilderQuestion(
              index,
              "marks",
              event.target.value
            )
        );


      /* ---------- Negative ---------- */

      card
        .querySelector(".q-negative")
        .addEventListener(
          "input",
          event =>
            updateBuilderQuestion(
              index,
              "negative_marks",
              event.target.value
            )
        );


      /* ---------- Explanation ---------- */

      card
        .querySelector(".q-explanation")
        .addEventListener(
          "input",
          event =>
            updateBuilderQuestion(
              index,
              "explanation",
              event.target.value
            )
        );


      container.appendChild(card);

    }
  );

  updateBuilderSummary();
}


/* =========================================================
   BUILDER SUMMARY
========================================================= */

function updateBuilderSummary() {

  const totalMarks =
    builderQuestions.reduce(
      (sum, question) =>
        sum +
        (Number(
          question.marks
        ) || 0),
      0
    );

  if ($("questionCountBadge")) {

    $("questionCountBadge")
      .textContent =
      `${builderQuestions.length}
       Question${builderQuestions.length === 1 ? "" : "s"}`;

  }

  if ($("marksBadge")) {

    $("marksBadge")
      .textContent =
      `${totalMarks
        .toFixed(2)
        .replace(/\.00$/, "")} Marks`;

  }
}


/* =========================================================
   VALIDATE EXAM BUILDER
========================================================= */

function validateBuilder() {

  const title =
    $("examTitleInput")?.value.trim();

  if (!title) {
    return "Exam title is required.";
  }


  const subject =
    $("examSubjectInput")?.value;

  if (!subject) {
    return "Please select a subject.";
  }


  const duration =
    Number(
      $("examDurationInput")?.value
    );

  if (!duration || duration < 1) {

    return (
      "Exam duration must be at least 1 minute."
    );

  }


  if (!builderQuestions.length) {

    return (
      "Please add at least one question."
    );

  }


  for (
    let i = 0;
    i < builderQuestions.length;
    i++
  ) {

    const question =
      builderQuestions[i];


    if (
      !question.question_text.trim()
    ) {

      return `
        Question ${i + 1}:
        question text is required.
      `;

    }


    if (!question.option_a.trim()) {

      return `
        Question ${i + 1}:
        Option A is required.
      `;

    }


    if (!question.option_b.trim()) {

      return `
        Question ${i + 1}:
        Option B is required.
      `;

    }


    if (
      question.correct_answer === "C" &&
      !question.option_c.trim()
    ) {

      return `
        Question ${i + 1}:
        Option C is required.
      `;

    }


    if (
      question.correct_answer === "D" &&
      !question.option_d.trim()
    ) {

      return `
        Question ${i + 1}:
        Option D is required.
      `;

    }


    if (
      !["A", "B", "C", "D"]
        .includes(
          question.correct_answer
        )
    ) {

      return `
        Question ${i + 1}:
        Select correct answer.
      `;

    }


    if (
      Number(question.marks) <= 0
    ) {

      return `
        Question ${i + 1}:
        Marks must be greater than 0.
      `;

    }


    if (
      Number(question.negative_marks || 0) < 0
    ) {

      return `
        Question ${i + 1}:
        Negative marks cannot be negative.
      `;

    }

  }

  return "";
}


/* =========================================================
   SAVE EXAM
========================================================= */

async function saveExam(event) {

  event.preventDefault();

  const validationError =
    validateBuilder();

  if (validationError) {

    showBuilderMessage(
      validationError,
      "error"
    );

    return;
  }


  const button =
    $("saveExamBtn");

  if (button) {

    button.disabled = true;
    button.textContent = "Saving...";

  }


  showBuilderMessage(
    "Saving exam and questions...",
    "info"
  );


  try {

    /* ---------- Total Marks ---------- */

    const totalMarks =
      builderQuestions.reduce(
        (sum, question) =>
          sum +
          Number(
            question.marks || 0
          ),
        0
      );


    /* ---------- Date / Time ---------- */

    const startValue =
      $("startAtInput")?.value;

    const endValue =
      $("endAtInput")?.value;


    let startAt = null;
    let endAt = null;


    if (startValue) {

      startAt =
        new Date(
          startValue
        ).toISOString();

    }


    if (endValue) {

      endAt =
        new Date(
          endValue
        ).toISOString();

    }


    if (
      startAt &&
      endAt &&
      new Date(endAt) <=
      new Date(startAt)
    ) {

      throw new Error(
        "End date/time must be later than start date/time."
      );

    }


    /* ---------- Exam Payload ---------- */

    const examPayload = {

      title:
        $("examTitleInput")
          .value.trim(),

      description:
        $("examDescriptionInput")
          ?.value.trim() || null,

      subject_id:
        Number(
          $("examSubjectInput")
            .value
        ),

      chapter_id:
        $("examChapterInput")
          ?.value
          ? Number(
              $("examChapterInput")
                .value
            )
          : null,

      created_by:
        currentUser.id,

      duration_minutes:
        Number(
          $("examDurationInput")
            .value
        ),

      total_marks:
        totalMarks,

      passing_percentage:
        Number(
          $("examPassingInput")
            ?.value || 35
        ),

      negative_marking:
        Number(
          $("examNegativeInput")
            ?.value || 0
        ),

      max_attempts:
        Number(
          $("examMaxAttemptsInput")
            ?.value || 1
        ),

      randomize_questions:
        Boolean(
          $("randomQuestionsInput")
            ?.checked
        ),

      randomize_options:
        Boolean(
          $("randomOptionsInput")
            ?.checked
        ),

      show_result_immediately:
        $("showResultInput")
          ? $("showResultInput").checked
          : true,

      show_explanations:
        $("showExplanationInput")
          ? $("showExplanationInput").checked
          : true,

      is_published:
        $("publishInput")
          ? $("publishInput").checked
          : false,

      start_at:
        startAt,

      end_at:
        endAt

    };


    /* ---------- Insert Exam ---------- */

    const {
      data: exam,
      error: examError
    } = await supabaseClient
      .from("exams")
      .insert(examPayload)
      .select("id")
      .single();


    if (examError) {
      throw examError;
    }


    /* ---------- Question Rows ---------- */

    const questionRows =
      builderQuestions.map(
        (question, index) => ({

          exam_id:
            exam.id,

          question_text:
            question.question_text
              .trim(),

          image_url:
            question.image_url
              ?.trim() || null,

          option_a:
            question.option_a
              .trim(),

          option_b:
            question.option_b
              .trim(),

          option_c:
            question.option_c
              ?.trim() || null,

          option_d:
            question.option_d
              ?.trim() || null,

          correct_answer:
            question.correct_answer,

          explanation:
            question.explanation
              ?.trim() || null,

          marks:
            Number(
              question.marks
            ),

          negative_marks:
            Number(
              question.negative_marks || 0
            ),

          question_order:
            index + 1

        })
      );


    /* ---------- Insert Questions ---------- */

    const {
      error: questionError
    } = await supabaseClient
      .from("questions")
      .insert(questionRows);


    if (questionError) {

      /*
        If question insertion fails,
        remove the exam that was just created.
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


    /* ---------- Success ---------- */

    showBuilderMessage(
      examPayload.is_published
        ? "✅ Exam published successfully!"
        : "✅ Exam saved as draft successfully!",
      "success"
    );


    resetExamBuilder(false);

    await loadTeacherDashboard();


  } catch (error) {

    console.error(
      "Save exam error:",
      error
    );

    showBuilderMessage(
      getFriendlyDatabaseError(
        error
      ),
      "error"
    );

  } finally {

    if (button) {

      button.disabled = false;
      button.textContent = "Save Exam";

    }

  }

}


/* =========================================================
   BUILDER MESSAGE
========================================================= */

function showBuilderMessage(
  message,
  type = "info"
) {

  const box =
    $("builderMessage");

  if (!box) return;

  box.textContent =
    message;

  box.className =
    `builder-message ${type}`;

}


/* =========================================================
   RESET EXAM BUILDER
========================================================= */

function resetExamBuilder(
  showMessage = true
) {

  const form =
    $("examBuilderForm");

  if (form) {
    form.reset();
  }


  if ($("examDurationInput")) {
    $("examDurationInput").value = 30;
  }


  if ($("examPassingInput")) {
    $("examPassingInput").value = 35;
  }


  if ($("examNegativeInput")) {
    $("examNegativeInput").value = 0;
  }


  if ($("examMaxAttemptsInput")) {
    $("examMaxAttemptsInput").value = 1;
  }


  if ($("showResultInput")) {
    $("showResultInput").checked = true;
  }


  if ($("showExplanationInput")) {
    $("showExplanationInput").checked = true;
  }


  if ($("publishInput")) {
    $("publishInput").checked = false;
  }


  builderQuestions = [];

  addQuestion();


  if (showMessage) {

    showBuilderMessage(
      "Exam form cleared.",
      "info"
    );

  }

}
/* =========================================================
   PART 3
   STUDENT EXAM ENGINE
========================================================= */

let runningExam = null;
let currentAttempt = null;
let runningQuestions = [];
let runningAnswers = {};
let currentQuestionIndex = 0;
let examTimeRemaining = 0;
let examTimerInterval = null;
let examSubmitting = false;


/* =========================================================
   START EXAM
========================================================= */

async function startExam(exam) {

  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  if (!exam) {
    alert("Exam information is missing.");
    return;
  }

  try {

    /* -----------------------------------------
       CHECK PREVIOUS ATTEMPTS
    ----------------------------------------- */

    const {
      data: attempts,
      error: attemptError
    } = await supabaseClient
      .from("exam_attempts")
      .select(`
        id,
        attempt_number,
        status
      `)
      .eq("exam_id", exam.id)
      .eq("student_id", currentUser.id)
      .order("attempt_number", {
        ascending: false
      });

    if (attemptError) {
      throw attemptError;
    }


    const completedAttempts =
      (attempts || []).filter(attempt =>
        [
          "submitted",
          "auto_submitted",
          "expired"
        ].includes(attempt.status)
      );


    const maxAttempts =
      Number(exam.max_attempts || 1);


    if (
      completedAttempts.length >=
      maxAttempts
    ) {

      alert(
        `You have already used all ${maxAttempts} attempt(s) for this exam.`
      );

      return;
    }


    /* -----------------------------------------
       LOAD QUESTIONS
    ----------------------------------------- */

    const {
      data: questions,
      error: questionError
    } = await supabaseClient
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
      .eq("exam_id", exam.id)
      .order("question_order", {
        ascending: true
      });


    if (questionError) {
      throw questionError;
    }


    if (!questions || !questions.length) {

      alert(
        "This exam does not contain any questions yet."
      );

      return;
    }


    /* -----------------------------------------
       CREATE ATTEMPT
    ----------------------------------------- */

    const nextAttemptNumber =
      completedAttempts.length + 1;


    const {
      data: attempt,
      error: createAttemptError
    } = await supabaseClient
      .from("exam_attempts")
      .insert({

        exam_id: exam.id,

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


    /* -----------------------------------------
       SET EXAM STATE
    ----------------------------------------- */

    runningExam = exam;

    currentAttempt = attempt;

    runningAnswers = {};

    currentQuestionIndex = 0;

    examSubmitting = false;


    /* -----------------------------------------
       PREPARE QUESTIONS
    ----------------------------------------- */

    runningQuestions =
      questions.map(question => {

        return {

          ...question,

          displayOptions:
            buildExamOptions(
              question,
              exam.randomize_options
            )

        };

      });


    /* -----------------------------------------
       RANDOMIZE QUESTIONS
    ----------------------------------------- */

    if (exam.randomize_questions) {

      runningQuestions =
        shuffle(
          runningQuestions
        );

    }


    /* -----------------------------------------
       SET TIMER
    ----------------------------------------- */

    examTimeRemaining =
      Number(
        exam.duration_minutes || 30
      ) * 60;


    /* -----------------------------------------
       OPEN EXAM PAGE
    ----------------------------------------- */

    showPage("examPage");


    renderRunningQuestion();

    startExamTimer();


  } catch (error) {

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
   BUILD OPTIONS
========================================================= */

function buildExamOptions(
  question,
  randomize
) {

  const options = [];


  if (question.option_a) {

    options.push({
      key: "A",
      text: question.option_a
    });

  }


  if (question.option_b) {

    options.push({
      key: "B",
      text: question.option_b
    });

  }


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


  return randomize
    ? shuffle(options)
    : options;

}


/* =========================================================
   RENDER CURRENT QUESTION
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


  const title =
    document.getElementById(
      "runningExamTitle"
    );

  const number =
    document.getElementById(
      "questionNumber"
    );

  const questionText =
    document.getElementById(
      "runningQuestionText"
    );

  const image =
    document.getElementById(
      "runningQuestionImage"
    );

  const options =
    document.getElementById(
      "options"
    );


  /* -----------------------------------------
     TITLE
  ----------------------------------------- */

  if (title) {

    title.textContent =
      runningExam.title;

  }


  /* -----------------------------------------
     QUESTION NUMBER
  ----------------------------------------- */

  if (number) {

    number.textContent =
      `Question ${
        currentQuestionIndex + 1
      } of ${
        runningQuestions.length
      }`;

  }


  /* -----------------------------------------
     QUESTION TEXT
  ----------------------------------------- */

  if (questionText) {

    questionText.textContent =
      question.question_text;

  }


  /* -----------------------------------------
     IMAGE
  ----------------------------------------- */

  if (image) {

    if (question.image_url) {

      image.src =
        question.image_url;

      image.classList.remove(
        "hidden"
      );

    } else {

      image.src = "";

      image.classList.add(
        "hidden"
      );

    }

  }


  /* -----------------------------------------
     OPTIONS
  ----------------------------------------- */

  if (!options) {
    return;
  }


  options.innerHTML = "";


  const selected =
    runningAnswers[
      question.id
    ] || null;


  question.displayOptions.forEach(
    option => {

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

          selectExamAnswer(
            question.id,
            option.key
          );

        }
      );


      options.appendChild(
        button
      );

    }
  );


  /* -----------------------------------------
     PREVIOUS
  ----------------------------------------- */

  const previous =
    document.getElementById(
      "previousBtn"
    );


  if (previous) {

    previous.disabled =
      currentQuestionIndex === 0;

  }


  /* -----------------------------------------
     NEXT / SUBMIT
  ----------------------------------------- */

  const next =
    document.getElementById(
      "nextBtn"
    );

  const submit =
    document.getElementById(
      "submitBtn"
    );


  const isLast =
    currentQuestionIndex ===
    runningQuestions.length - 1;


  if (next) {

    next.classList.toggle(
      "hidden",
      isLast
    );

  }


  if (submit) {

    submit.classList.toggle(
      "hidden",
      !isLast
    );

  }


  /* -----------------------------------------
     PROGRESS
  ----------------------------------------- */

  const progress =
    document.getElementById(
      "progressBar"
    );


  if (progress) {

    progress.style.width =
      (
        (
          currentQuestionIndex + 1
        ) /
        runningQuestions.length
      ) * 100 + "%";

  }


  renderQuestionNavigation();

}


/* =========================================================
   SELECT ANSWER
========================================================= */

function selectExamAnswer(
  questionId,
  answer
) {

  if (examSubmitting) {
    return;
  }


  runningAnswers[
    questionId
  ] = answer;


  renderRunningQuestion();

}


/* =========================================================
   QUESTION PALETTE
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


      button.className =
        "question-nav-btn";


      /* Current */

      if (
        index ===
        currentQuestionIndex
      ) {

        button.classList.add(
          "active"
        );

      }


      /* Answered */

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
   PREVIOUS BUTTON
========================================================= */

document
  .getElementById(
    "previousBtn"
  )
  ?.addEventListener(
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
   NEXT BUTTON
========================================================= */

document
  .getElementById(
    "nextBtn"
  )
  ?.addEventListener(
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
  ?.addEventListener(
    "click",
    () => {

      if (
        !confirm(
          "Are you sure you want to submit the exam?"
        )
      ) {
        return;
      }


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


  updateExamTimer();


  examTimerInterval =
    setInterval(
      () => {

        examTimeRemaining--;


        updateExamTimer();


        if (
          examTimeRemaining <= 0
        ) {

          stopExamTimer();


          alert(
            "⏰ Time is over. Your exam will be submitted automatically."
          );


          submitRunningExam(
            "auto_submitted"
          );

        }

      },
      1000
    );

}


/* =========================================================
   STOP TIMER
========================================================= */

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


/* =========================================================
   UPDATE TIMER
========================================================= */

function updateExamTimer() {

  const timer =
    document.getElementById(
      "examTimer"
    );


  if (!timer) {
    return;
  }


  const minutes =
    Math.floor(
      examTimeRemaining / 60
    );


  const seconds =
    examTimeRemaining % 60;


  timer.textContent =
    `${String(
      minutes
    ).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;


  if (
    examTimeRemaining <= 60
  ) {

    timer.classList.add(
      "timer-danger"
    );

  } else {

    timer.classList.remove(
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
    examSubmitting ||
    !currentAttempt ||
    !runningExam
  ) {

    return;

  }


  examSubmitting = true;


  stopExamTimer();


  const submitButton =
    document.getElementById(
      "submitBtn"
    );


  if (submitButton) {

    submitButton.disabled =
      true;

    submitButton.textContent =
      "Submitting...";

  }


  try {

    let score = 0;

    let correct = 0;

    let wrong = 0;

    let unanswered = 0;


    const answerRows = [];


    /* -----------------------------------------
       CALCULATE
    ----------------------------------------- */

    runningQuestions.forEach(
      question => {

        const selected =
          runningAnswers[
            question.id
          ] || null;


        let isCorrect =
          false;


        let marksObtained =
          0;


        /* Unanswered */

        if (!selected) {

          unanswered++;

        }


        /* Correct */

        else if (
          selected ===
          question.correct_answer
        ) {

          isCorrect =
            true;

          correct++;


          marksObtained =
            Number(
              question.marks || 0
            );


          score +=
            marksObtained;

        }


        /* Wrong */

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


        answerRows.push({

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


    /* -----------------------------------------
       PERCENTAGE
    ----------------------------------------- */

    const totalMarks =
      Number(
        runningExam.total_marks || 0
      );


    let percentage =
      totalMarks > 0
        ? (
            score /
            totalMarks
          ) * 100
        : 0;


    percentage =
      Math.max(
        0,
        Math.min(
          100,
          percentage
        )
      );


    /* -----------------------------------------
       PASS / FAIL
    ----------------------------------------- */

    const passingPercentage =
      Number(
        runningExam.passing_percentage ||
        0
      );


    const passed =
      percentage >=
      passingPercentage;


    /* -----------------------------------------
       SAVE ANSWERS
    ----------------------------------------- */

    if (answerRows.length) {

      const {
        error: answerError
      } =
        await supabaseClient
          .from("student_answers")
          .insert(
            answerRows
          );


      if (answerError) {

        throw answerError;

      }

    }


    /* -----------------------------------------
       UPDATE ATTEMPT
    ----------------------------------------- */

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


    /* -----------------------------------------
       RESULT
    ----------------------------------------- */

    showExamResult(
      score,
      percentage,
      correct,
      wrong,
      unanswered,
      passed
    );


  } catch (error) {

    console.error(
      "Submit exam error:",
      error
    );


    alert(
      error.message ||
      "Unable to submit exam."
    );


    examSubmitting =
      false;


    if (submitButton) {

      submitButton.disabled =
        false;

      submitButton.textContent =
        "Submit Exam";

    }

  }

}


/* =========================================================
   SHOW RESULT
========================================================= */

async function showExamResult(
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


  const examName =
    document.getElementById(
      "resultExamName"
    );


  const scoreElement =
    document.getElementById(
      "resultScore"
    );


  const percentageElement =
    document.getElementById(
      "resultPercentage"
    );


  const correctElement =
    document.getElementById(
      "resultCorrect"
    );


  const passedElement =
    document.getElementById(
      "resultPassed"
    );


  const details =
    document.getElementById(
      "resultDetails"
    );


  if (examName) {

    examName.textContent =
      runningExam.title;

  }


  if (scoreElement) {

    scoreElement.textContent =
      Number(score).toFixed(2);

  }


  if (percentageElement) {

    percentageElement.textContent =
      Number(
        percentage
      ).toFixed(2) + "%";

  }


  if (correctElement) {

    correctElement.textContent =
      correct;

  }


  if (passedElement) {

    passedElement.textContent =
      passed
        ? "PASSED"
        : "FAILED";


    passedElement.className =
      passed
        ? "pass-text"
        : "fail-text";

  }


  if (details) {

    details.innerHTML = `

      <div class="result-detail-grid">

        <div>
          <span>Correct Answers</span>
          <strong>
            ${correct}
          </strong>
        </div>

        <div>
          <span>Wrong Answers</span>
          <strong>
            ${wrong}
          </strong>
        </div>

        <div>
          <span>Unanswered</span>
          <strong>
            ${unanswered}
          </strong>
        </div>

        <div>
          <span>Passing Percentage</span>
          <strong>
            ${Number(
              runningExam.passing_percentage ||
              0
            )}%
          </strong>
        </div>

      </div>

    `;


    await loadExamAnswerReview(
      details
    );

  }

}


/* =========================================================
   DETAILED ANSWER REVIEW
========================================================= */

async function loadExamAnswerReview(
  container
) {

  if (
    !currentAttempt ||
    !container
  ) {

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

    console.error(
      "Result review error:",
      error
    );

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


  review.innerHTML = `
    <h3>
      Question-wise Analysis
    </h3>
  `;


  data.forEach(
    (answer, index) => {

      const question =
        answer.questions;


      if (!question) {
        return;
      }


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "review-item";


      const yourAnswer =
        answer.selected_answer
          ? getExamOptionText(
              question,
              answer.selected_answer
            )
          : "Not Answered";


      const correctAnswer =
        getExamOptionText(
          question,
          question.correct_answer
        );


      item.innerHTML = `

        <div class="review-question">

          <strong>
            Q${index + 1}.
            ${escapeHTML(
              question.question_text
            )}
          </strong>

        </div>

        <p>
          Your Answer:
          <strong>
            ${escapeHTML(
              yourAnswer
            )}
          </strong>
        </p>

        <p>
          Correct Answer:
          <strong>
            ${escapeHTML(
              correctAnswer
            )}
          </strong>
        </p>

        ${
          question.explanation
            ? `
              <div class="explanation">

                <strong>
                  Explanation:
                </strong>

                ${escapeHTML(
                  question.explanation
                )}

              </div>
            `
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
   OPTION TEXT
========================================================= */

function getExamOptionText(
  question,
  key
) {

  switch (key) {

    case "A":
      return question.option_a || "";

    case "B":
      return question.option_b || "";

    case "C":
      return question.option_c || "";

    case "D":
      return question.option_d || "";

    default:
      return "";

  }

}


/* =========================================================
   CLEAN EXAM STATE
========================================================= */

function clearExamState() {

  stopExamTimer();


  runningExam =
    null;


  currentAttempt =
    null;


  runningQuestions =
    [];


  runningAnswers =
    {};


  currentQuestionIndex =
    0;


  examTimeRemaining =
    0;


  examSubmitting =
    false;

}


/* =========================================================
   PREVENT ACCIDENTAL REFRESH DURING EXAM
========================================================= */

window.addEventListener(
  "beforeunload",
  event => {

    if (
      currentAttempt &&
      runningExam &&
      !examSubmitting
    ) {

      event.preventDefault();

      event.returnValue =
        "";

    }

  }
);
