/* =========================================================
   EXAMHALL
   STEP 1 - TEACHER EXAM BUILDER
========================================================= */


/* ================= SUPABASE CONFIG ================= */

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

const createExamForm =
  document.getElementById("createExamForm");

const saveDraftBtn =
  document.getElementById("saveDraftBtn");

const publishExamBtn =
  document.getElementById("publishExamBtn");

const examFormError =
  document.getElementById("examFormError");

const examFormSuccess =
  document.getElementById("examFormSuccess");


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


function clearMessages() {

  loginError.textContent = "";
  signupError.textContent = "";
  signupSuccess.textContent = "";

}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener("submit", async function (event) {

  event.preventDefault();

  clearMessages();

  const email =
    document.getElementById("loginEmail")
      .value
      .trim()
      .toLowerCase();

  const password =
    document.getElementById("loginPassword").value;

  const button =
    document.getElementById("loginBtn");

  if (!email || !password) {

    loginError.textContent =
      "Email and password are required.";

    return;

  }

  button.disabled = true;
  button.textContent = "Logging in...";

  try {

    const { data, error } =
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
   STUDENT SIGNUP
========================================================= */

signupForm.addEventListener("submit", async function (event) {

  event.preventDefault();

  clearMessages();

  const name =
    document.getElementById("signupName")
      .value
      .trim();

  const email =
    document.getElementById("signupEmail")
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

    const { data, error } =
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

});


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadUserProfile() {

  if (!currentUser) {
    return;
  }

  const { data, error } =
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
    currentProfile.full_name ||
    currentUser.email;

  document.getElementById("userName").textContent =
    name;

  document.getElementById("userRole").textContent =
    currentProfile.role;

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

    button.addEventListener("click", function () {

      showPage(button.dataset.page);

    });

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

      if (button.dataset.page === pageId) {

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
    loadCreateExamData();
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

    const { data: exams, error } =
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
        .order("created_at", {
          ascending: false
        });

    if (error) {
      throw error;
    }

    document.getElementById("availableExams").textContent =
      exams.length;

    showAvailableExams(exams);

    await loadStudentStats();

  }

  catch (error) {

    console.error(error);

    list.innerHTML =
      `<p>Unable to load exams.</p>`;

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
      .addEventListener("click", function () {

        alert(
          "Exam taking module Step 2 mein activate hoga."
        );

      });


    list.appendChild(item);

  });

}


/* =========================================================
   STUDENT STATS
========================================================= */

async function loadStudentStats() {

  const { data, error } =
    await supabaseClient
      .from("exam_attempts")
      .select("percentage, status")
      .eq("student_id", currentUser.id)
      .in("status", [
        "submitted",
        "auto_submitted",
        "expired"
      ]);

  if (error) {

    console.error(error);
    return;

  }

  const attempts = data || [];

  document.getElementById("attemptCount").textContent =
    attempts.length;

  if (!attempts.length) {

    document.getElementById("averageScore").textContent =
      "0%";

    document.getElementById("bestScore").textContent =
      "0%";

    return;

  }

  const percentages =
    attempts.map(item =>
      Number(item.percentage || 0)
    );

  const average =
    Math.round(
      percentages.reduce(
        (total, value) =>
          total + value,
        0
      ) / percentages.length
    );

  const best =
    Math.max(...percentages);

  document.getElementById("averageScore").textContent =
    average + "%";

  document.getElementById("bestScore").textContent =
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

  const { data, error } =
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
      .eq("student_id", currentUser.id)
      .in("status", [
        "submitted",
        "auto_submitted",
        "expired"
      ])
      .order("submitted_at", {
        ascending: false
      });

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

  const { data, error } =
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
      .eq("student_id", currentUser.id)
      .order("created_at", {
        ascending: false
      });

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
        ${Number(attempt.percentage || 0)}%
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

  const { data: exams, error } =
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
      .eq("created_by", currentUser.id)
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.error("Teacher exams:", error);
    return;

  }

  document.getElementById("teacherExamCount").textContent =
    exams.length;


  const { data: attempts, error: attemptsError } =
    await supabaseClient
      .from("exam_attempts")
      .select("student_id, percentage, status");

  if (!attemptsError) {

    const completed =
      attempts.filter(attempt =>
        [
          "submitted",
          "auto_submitted",
          "expired"
        ].includes(attempt.status)
      );

    document.getElementById("teacherAttemptCount").textContent =
      completed.length;

    const students =
      new Set(
        completed.map(
          item => item.student_id
        )
      );

    document.getElementById("teacherStudentCount").textContent =
      students.size;

    if (completed.length) {

      const average =
        Math.round(
          completed.reduce(
            (total, item) =>
              total +
              Number(item.percentage || 0),
            0
          ) / completed.length
        );

      document.getElementById("teacherAverage").textContent =
        average + "%";

    }

  }


  const list =
    document.getElementById("teacherExamList");

  list.innerHTML = "";

  if (!exams.length) {

    list.innerHTML =
      `<div class="empty-state">

        <div class="empty-icon">📝</div>

        <h3>No exams created</h3>

        <p>
          Create your first exam from the Create Exam section.
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
   LOAD SUBJECTS + CHAPTERS
========================================================= */

async function loadCreateExamData() {

  clearExamFormMessages();

  const subjectSelect =
    document.getElementById("examSubject");

  const chapterSelect =
    document.getElementById("examChapter");

  subjectSelect.innerHTML =
    `<option value="">
      Select Subject
    </option>`;

  chapterSelect.innerHTML =
    `<option value="">
      Select Chapter
    </option>`;


  const { data: subjects, error } =
    await supabaseClient
      .from("subjects")
      .select("id, name")
      .order("name");

  if (error) {

    console.error("Subjects:", error);

    examFormError.textContent =
      "Unable to load subjects.";

    return;

  }


  (subjects || []).forEach(subject => {

    const option =
      document.createElement("option");

    option.value =
      subject.id;

    option.textContent =
      subject.name;

    subjectSelect.appendChild(option);

  });

}


document
  .getElementById("examSubject")
  .addEventListener("change", loadChapters);


async function loadChapters() {

  const subjectId =
    document.getElementById("examSubject").value;

  const chapterSelect =
    document.getElementById("examChapter");

  chapterSelect.innerHTML =
    `<option value="">
      Select Chapter
    </option>`;

  if (!subjectId) {
    return;
  }


  const { data, error } =
    await supabaseClient
      .from("chapters")
      .select("id, name")
      .eq("subject_id", subjectId)
      .order("name");

  if (error) {

    console.error("Chapters:", error);

    examFormError.textContent =
      "Unable to load chapters.";

    return;

  }


  (data || []).forEach(chapter => {

    const option =
      document.createElement("option");

    option.value =
      chapter.id;

    option.textContent =
      chapter.name;

    chapterSelect.appendChild(option);

  });

}


/* =========================================================
   CREATE EXAM FORM
========================================================= */

createExamForm.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();

    await saveExam(true);

  }
);


/* =========================================================
   SAVE DRAFT
========================================================= */

saveDraftBtn.addEventListener(
  "click",
  async function () {

    await saveExam(false);

  }
);


/* =========================================================
   SAVE EXAM
========================================================= */

async function saveExam(publish) {

  clearExamFormMessages();

  if (!currentUser) {

    examFormError.textContent =
      "Please login again.";

    return;

  }


  const title =
    document
      .getElementById("examTitleInput")
      .value
      .trim();

  const description =
    document
      .getElementById("examDescriptionInput")
      .value
      .trim();

  const subjectValue =
    document.getElementById("examSubject").value;

  const chapterValue =
    document.getElementById("examChapter").value;

  const duration =
    Number(
      document.getElementById("examDuration").value
    );

  const totalMarks =
    Number(
      document.getElementById("examTotalMarks").value
    );

  const passingPercentage =
    Number(
      document.getElementById(
        "examPassingPercentage"
      ).value
    );

  const negativeMarking =
    Number(
      document.getElementById(
        "examNegativeMarking"
      ).value
    );

  const maxAttempts =
    Number(
      document.getElementById(
        "examMaxAttempts"
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
      "examStartAt"
    ).value;

  const endValue =
    document.getElementById(
      "examEndAt"
    ).value;


  /* VALIDATION */

  if (!title) {

    examFormError.textContent =
      "Exam title is required.";

    return;

  }

  if (!duration || duration < 1) {

    examFormError.textContent =
      "Duration must be at least 1 minute.";

    return;

  }

  if (!totalMarks || totalMarks <= 0) {

    examFormError.textContent =
      "Total marks must be greater than 0.";

    return;

  }

  if (
    passingPercentage < 0 ||
    passingPercentage > 100
  ) {

    examFormError.textContent =
      "Passing percentage must be between 0 and 100.";

    return;

  }

  if (negativeMarking < 0) {

    examFormError.textContent =
      "Negative marking cannot be negative.";

    return;

  }

  if (!maxAttempts || maxAttempts < 1) {

    examFormError.textContent =
      "Maximum attempts must be at least 1.";

    return;

  }


  if (startValue && endValue) {

    const startDate =
      new Date(startValue);

    const endDate =
      new Date(endValue);

    if (endDate <= startDate) {

      examFormError.textContent =
        "End date/time must be after start date/time.";

      return;

    }

  }


  const button =
    publish
      ? publishExamBtn
      : saveDraftBtn;


  button.disabled = true;

  button.textContent =
    publish
      ? "Publishing..."
      : "Saving...";


  try {

    const examData = {

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
        publish,

      start_at:
        startValue
          ? new Date(startValue).toISOString()
          : null,

      end_at:
        endValue
          ? new Date(endValue).toISOString()
          : null

    };


    const { data, error } =
      await supabaseClient
        .from("exams")
        .insert(examData)
        .select()
        .single();


    if (error) {
      throw error;
    }


    examFormSuccess.textContent =
      publish
        ? "Exam published successfully!"
        : "Exam saved as draft successfully!";


    createExamForm.reset();

    document.getElementById(
      "examDuration"
    ).value = 30;

    document.getElementById(
      "examTotalMarks"
    ).value = 10;

    document.getElementById(
      "examPassingPercentage"
    ).value = 40;

    document.getElementById(
      "examNegativeMarking"
    ).value = 0;

    document.getElementById(
      "examMaxAttempts"
    ).value = 1;

    document.getElementById(
      "showResultImmediately"
    ).checked = true;


    document.getElementById(
      "examChapter"
    ).innerHTML =
      `<option value="">
        Select Chapter
      </option>`;


    await loadTeacherDashboard();


    setTimeout(function () {

      showPage("teacherDashboard");

    }, 700);

  }

  catch (error) {

    console.error(
      "Create exam error:",
      error
    );

    examFormError.textContent =
      getFriendlyDatabaseError(error);

  }

  finally {

    button.disabled = false;

    button.textContent =
      publish
        ? "📢 Publish Exam"
        : "💾 Save Draft";

  }

}


/* =========================================================
   CLEAR EXAM MESSAGES
========================================================= */

function clearExamFormMessages() {

  if (examFormError) {
    examFormError.textContent = "";
  }

  if (examFormSuccess) {
    examFormSuccess.textContent = "";
  }

}


/* =========================================================
   TEACHER SCORES
========================================================= */

async function loadTeacherScores() {

  const table =
    document.getElementById("scoreTable");

  table.innerHTML =
    `<tr>
      <td colspan="5">
        Loading...
      </td>
    </tr>`;


  const { data, error } =
    await supabaseClient
      .from("exam_attempts")
      .select(`
        score,
        percentage,
        submitted_at,
        profiles!exam_attempts_student_id_fkey(full_name),
        exams(title)
      `)
      .in("status", [
        "submitted",
        "auto_submitted",
        "expired"
      ])
      .order("submitted_at", {
        ascending: false
      });


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
        ${Number(result.score || 0).toFixed(2)}
      </td>

      <td>
        ${Number(result.percentage || 0)}%
      </td>

      <td>
        ${formatDate(result.submitted_at)}
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
  .addEventListener("click", async function () {

    await supabaseClient.auth.signOut();

    currentUser = null;
    currentProfile = null;

    app.classList.add("hidden");
    loginPage.classList.remove("hidden");

    loginForm.reset();
    signupForm.reset();

    clearMessages();

    loginTab.click();

  });


/* =========================================================
   AUTH STATE
========================================================= */

supabaseClient.auth.onAuthStateChange(
  async function (event, session) {

    console.log(
      "Auth event:",
      event
    );

    if (session && session.user) {

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

  const { data, error } =
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

function getFriendlyAuthError(message) {

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
   DATABASE ERROR
========================================================= */

function getFriendlyDatabaseError(error) {

  const message =
    String(
      error?.message ||
      error ||
      ""
    );

  const text =
    message.toLowerCase();


  if (
    text.includes("row-level security")
  ) {

    return "Permission denied by Supabase RLS. Teacher exam INSERT policy needs to be enabled.";

  }


  if (
    text.includes("permission denied")
  ) {

    return "Permission denied. Please check the Supabase RLS policy for exams.";

  }


  if (
    text.includes("foreign key")
  ) {

    return "Selected Subject or Chapter is invalid.";

  }


  return message ||
    "Unable to save exam.";

}


/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   DATE
========================================================= */

function formatDate(value) {

  if (!value) {
    return "-";
  }

  return new Date(value)
    .toLocaleString("en-IN");

}
