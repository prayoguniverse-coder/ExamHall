/* =========================================================
   EXAMHALL
   FINAL SCRIPT.JS
   AUTH + DASHBOARD + EXAM BUILDER + STUDENT EXAM
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

let currentQuestion = 0;

let selectedAnswers = [];

let builderQuestions = [];

let activeAttempt = null;

let examQuestions = [];

let examTimerInterval = null;

let examRemainingSeconds = 0;

let examSubmitting = false;

let examDisplayOptions = [];


/* =========================================================
   SHORT DOM HELPER
========================================================= */

const $ = id =>
  document.getElementById(id);


/* =========================================================
   AUTH ELEMENTS
========================================================= */

const loginPage =
  $("loginPage");

const app =
  $("app");

const loginForm =
  $("loginForm");

const signupForm =
  $("signupForm");

const loginTab =
  $("loginTab");

const signupTab =
  $("signupTab");

const loginError =
  $("loginError");

const signupError =
  $("signupError");

const signupSuccess =
  $("signupSuccess");


/* =========================================================
   CLEAR AUTH MESSAGES
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
   AUTH TABS
========================================================= */

loginTab.addEventListener(
  "click",
  function () {

    loginTab.classList.add(
      "active"
    );

    signupTab.classList.remove(
      "active"
    );

    loginForm.classList.remove(
      "hidden"
    );

    signupForm.classList.add(
      "hidden"
    );

    clearMessages();

  }
);


signupTab.addEventListener(
  "click",
  function () {

    signupTab.classList.add(
      "active"
    );

    loginTab.classList.remove(
      "active"
    );

    signupForm.classList.remove(
      "hidden"
    );

    loginForm.classList.add(
      "hidden"
    );

    clearMessages();

  }
);


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();

    clearMessages();


    const email =
      $("loginEmail")
        .value
        .trim()
        .toLowerCase();


    const password =
      $("loginPassword")
        .value;


    const button =
      $("loginBtn");


    if (
      !email ||
      !password
    ) {

      loginError.textContent =
        "Email and password are required.";

      return;

    }


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

      console.error(
        "Login error:",
        error
      );


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
      $("signupName")
        .value
        .trim();


    const email =
      $("signupEmail")
        .value
        .trim()
        .toLowerCase();


    const password =
      $("signupPassword")
        .value;


    const confirmPassword =
      $("signupConfirmPassword")
        .value;


    const button =
      $("signupBtn");


    if (!name) {

      signupError.textContent =
        "Please enter your full name.";

      return;

    }


    if (
      password.length < 6
    ) {

      signupError.textContent =
        "Password must contain at least 6 characters.";

      return;

    }


    if (
      password !==
      confirmPassword
    ) {

      signupError.textContent =
        "Passwords do not match.";

      return;

    }


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

              full_name:
                name

            }

          }

        });


      if (error) {

        throw error;

      }


      if (
        data.session
      ) {

        currentUser =
          data.user;


        await loadUserProfile();

        return;

      }


      signupSuccess.textContent =
        "Account created successfully. Please confirm your email and then login.";

      signupForm.reset();

    }

    catch (error) {

      console.error(
        "Signup error:",
        error
      );


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
   LOAD USER PROFILE
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


  currentProfile =
    data;


  openDashboard();

}


/* =========================================================
   OPEN DASHBOARD
========================================================= */

function openDashboard() {

  loginPage.classList.add(
    "hidden"
  );

  app.classList.remove(
    "hidden"
  );


  updateUserUI();


  if (
    currentProfile.role ===
    "teacher"
  ) {

    $("teacherMenu")
      .classList.remove(
        "hidden"
      );

    $("studentMenu")
      .classList.add(
        "hidden"
      );


    showPage(
      "teacherDashboard"
    );

  }

  else {

    $("studentMenu")
      .classList.remove(
        "hidden"
      );

    $("teacherMenu")
      .classList.add(
        "hidden"
      );


    showPage(
      "studentDashboard"
    );

  }

}


/* =========================================================
   UPDATE USER UI
========================================================= */

function updateUserUI() {

  const name =
    currentProfile?.full_name ||
    currentUser?.email ||
    "User";


  $("userName")
    .textContent =
    name;


  $("userRole")
    .textContent =
    currentProfile?.role ||
    "student";


  $("userAvatar")
    .textContent =
    name
      .charAt(0)
      .toUpperCase();


  if (
    $("studentWelcome")
  ) {

    $("studentWelcome")
      .textContent =
      name;

  }

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

document
  .querySelectorAll(
    ".menu-btn"
  )
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


function showPage(
  pageId
) {

  /*
    Student exam ke time
    page change block karenge.
  */

  if (
    currentExam &&
    pageId !== "examPage" &&
    pageId !== "examResultPage"
  ) {

    alert(
      "Exam is in progress. Please finish or submit the exam before leaving."
    );

    return;

  }


  document
    .querySelectorAll(
      ".page"
    )
    .forEach(
      page => {

        page.classList.add(
          "hidden"
        );

      }
    );


  const page =
    $(pageId);


  if (!page) {

    return;

  }


  page.classList.remove(
    "hidden"
  );


  document
    .querySelectorAll(
      ".menu-btn"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.page ===
            pageId
        );

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

    initExamBuilder();

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


  $("examList").innerHTML =
    `
      <div class="loading">
        Loading exams...
      </div>
    `;


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


    const visibleExams =
      (exams || [])
        .filter(
          exam => {

            if (
              exam.start_at &&
              new Date(
                exam.start_at
              ) > now
            ) {

              return false;

            }


            if (
              exam.end_at &&
              new Date(
                exam.end_at
              ) < now
            ) {

              return false;

            }


            return true;

          }
        );


    $("availableExams")
      .textContent =
      visibleExams.length;


    showAvailableExams(
      visibleExams
    );


    await loadStudentStats();

  }

  catch (error) {

    console.error(
      error
    );


    $("examList").innerHTML =
      `
        <p class="error-inline">
          Unable to load exams.
        </p>
      `;

  }

}


/* =========================================================
   SHOW AVAILABLE EXAMS
========================================================= */

function showAvailableExams(
  exams
) {

  const list =
    $("examList");


  list.innerHTML = "";


  if (
    !exams.length
  ) {

    list.innerHTML =
      `
        <div class="empty-state">

          <div class="empty-icon">
            📚
          </div>

          <h3>
            No exams available
          </h3>

          <p>
            Your teacher has not published any active exams yet.
          </p>

        </div>
      `;

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


      item.innerHTML =
        `
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
              
              ${escapeHTML(
                exam.chapters?.name ||
                "All Chapters"
              )}

              •

              ${exam.duration_minutes}
              Minutes

              •

              ${Number(
                exam.total_marks ||
                0
              )}
              Marks
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
        .querySelector(
          "button"
        )
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

    console.error(
      error
    );

    return;

  }


  const attempts =
    data || [];


  $("attemptCount")
    .textContent =
    attempts.length;


  if (
    !attempts.length
  ) {

    $("averageScore")
      .textContent =
      "0%";


    $("bestScore")
      .textContent =
      "0%";


    return;

  }


  const percentages =
    attempts.map(
      item =>
        Number(
          item.percentage
        ) || 0
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


  $("averageScore")
    .textContent =
    `${average}%`;


  $("bestScore")
    .textContent =
    `${best}%`;

}
