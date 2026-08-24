/* =========================================================
   EXAMHALL
   SUPABASE + AUTH + DASHBOARD + EXAM ENGINE
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
let currentQuestions = [];
let currentAttempt = null;

let currentQuestionIndex = 0;

let selectedAnswers = {};

let examTimerInterval = null;
let examSecondsLeft = 0;

let teacherScoresCache = [];


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
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();

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

  if (!data) {

    console.error(
      "Profile not found."
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

  const role =
    currentProfile?.role ||
    "student";

  document.getElementById(
    "userName"
  ).textContent = name;

  document.getElementById(
    "userRole"
  ).textContent = role;

  document.getElementById(
    "userAvatar"
  ).textContent =
    name
      .charAt(0)
      .toUpperCase();

  document.getElementById(
    "studentWelcome"
  ).textContent = name;

  document.getElementById(
    "profileName"
  ).textContent = name;

  document.getElementById(
    "profileEmail"
  ).textContent =
    currentProfile?.email ||
    currentUser?.email ||
    "-";

  document.getElementById(
    "profileRole"
  ).textContent = role;

  document.getElementById(
    "profileAvatar"
  ).textContent =
    name
      .charAt(0)
      .toUpperCase();

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
    "studentLeaderboard"
  ) {

    loadLeaderboard();

  }

  if (
    pageId ===
    "studentProfile"
  ) {

    updateUserUI();

  }

  if (
    pageId ===
    "teacherDashboard"
  ) {

    loadTeacherDashboard();

  }

  if (
    pageId ===
    "teacherScores"
  ) {

    loadTeacherScores();

  }

  if (
    pageId ===
    "teacherAnalytics"
  ) {

    loadTeacherAnalytics();

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
          negative_marking,
          passing_percentage,
          randomize_questions,
          randomize_options,
          show_result_immediately,
          show_explanations,
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

    document.getElementById(
      "availableExams"
    ).textContent =
      exams?.length || 0;

    showAvailableExams(
      exams || []
    );

    await loadStudentStats();

  }

  catch (error) {

    console.error(error);

    list.innerHTML =
      `<div class="error-box">
        Unable to load exams.
        <br>
        ${escapeHTML(error.message)}
      </div>`;

  }

}


/* =========================================================
   AVAILABLE EXAMS
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


    const now =
      new Date();

    const starts =
      exam.start_at
        ? new Date(exam.start_at)
        : null;

    const ends =
      exam.end_at
        ? new Date(exam.end_at)
        : null;


    let availabilityText =
      "Available";

    let canStart = true;


    if (
      starts &&
      now < starts
    ) {

      availabilityText =
        "Not Started";

      canStart = false;

    }


    if (
      ends &&
      now > ends
    ) {

      availabilityText =
        "Exam Closed";

      canStart = false;

    }


    item.innerHTML = `

      <div class="exam-info">

        <h4>
          ${escapeHTML(exam.title)}
        </h4>

        <p>
          ${escapeHTML(subject)}
          •
          ${escapeHTML(chapter)}
        </p>

        <div class="exam-tags">

          <span>
            ⏱️ ${exam.duration_minutes} min
          </span>

          <span>
            📝 ${exam.total_marks} marks
          </span>

          <span>
            🔄 ${exam.max_attempts} attempts
          </span>

          <span>
            ➖ ${exam.negative_marking || 0} negative
          </span>

        </div>

      </div>


      <div class="exam-start">

        <span class="status-badge">
          ${availabilityText}
        </span>

        <button
          class="primary-btn"
          type="button"
          ${canStart ? "" : "disabled"}
        >
          Start Exam
        </button>

      </div>

    `;


    item
      .querySelector("button")
      .addEventListener(
        "click",
        () => {

          startExam(
            exam.id
          );

        }
      );


    list.appendChild(
      item
    );

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
      .select(`
        percentage,
        status
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
   CHECK ATTEMPT COUNT
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


/* =========================================================
   START EXAM
========================================================= */

async function startExam(
  examId
) {

  try {

    const {
      data: exam,
      error: examError
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


    if (examError) {
      throw examError;
    }


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
        "This exam is closed."
      );

      return;

    }


    const attemptCount =
      await getAttemptCount(
        examId
      );


    if (
      attemptCount >=
      Number(
        exam.max_attempts || 1
      )
    ) {

      alert(
        "You have reached the maximum number of attempts for this exam."
      );

      return;

    }


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
          marks,
          negative_marks,
          question_order,
          explanation
        `)
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


    if (!questions?.length) {

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


    if (
      exam.randomize_options
    ) {

      currentQuestions =
        currentQuestions.map(
          question => {

            const options =
              getQuestionOptions(
                question
              );

            shuffleArray(
              options
            );

            return {
              ...question,
              shuffledOptions:
                options
            };

          }
        );

    }


    selectedAnswers = {};

    currentQuestionIndex = 0;


    const nextAttemptNumber =
      attemptCount + 1;


    const {
      data: attempt,
      error: attemptError
    } =
      await supabaseClient
        .from("exam_attempts")
        .insert({

          exam_id:
            examId,

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


    currentAttempt =
      attempt;


    startExamTimer(
      Number(
        exam.duration_minutes || 30
      )
    );


    showPage(
      "examPage"
    );


    renderQuestion();

  }

  catch (error) {

    console.error(error);

    alert(
      "Unable to start exam:\n" +
      error.message
    );

  }

}


/* =========================================================
   QUESTION OPTIONS
========================================================= */

function getQuestionOptions(
  question
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

  return options;

}


/* =========================================================
   RENDER QUESTION
========================================================= */

function renderQuestion() {

  const question =
    currentQuestions[
      currentQuestionIndex
    ];


  if (!question) {
    return;
  }


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


  document.getElementById(
    "questionMarks"
  ).textContent =
    `Marks: ${
      Number(
        question.marks || 0
      )
    }`;


  document.getElementById(
    "questionNegative"
  ).textContent =
    `Negative: ${
      Number(
        question.negative_marks ||
        currentExam.negative_marking ||
        0
      )
    }`;


  const imageBox =
    document.getElementById(
      "questionImage"
    );


  imageBox.innerHTML = "";


  if (
    question.image_url
  ) {

    const img =
      document.createElement(
        "img"
      );

    img.src =
      question.image_url;

    img.alt =
      "Question image";

    img.loading =
      "lazy";

    imageBox.appendChild(
      img
    );

  }


  renderOptions(
    question
  );


  renderQuestionNavigation();


  updateExamProgress();


  document.getElementById(
    "previousBtn"
  ).disabled =
    currentQuestionIndex === 0;


  const isLast =
    currentQuestionIndex ===
    currentQuestions.length - 1;


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

}


/* =========================================================
   OPTIONS
========================================================= */

function renderOptions(
  question
) {

  const container =
    document.getElementById(
      "options"
    );

  container.innerHTML = "";


  let options =
    question.shuffledOptions;


  if (!options) {

    options =
      getQuestionOptions(
        question
      );

  }


  options.forEach(
    option => {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "option";


      if (
        selectedAnswers[
          question.id
        ] ===
        option.key
      ) {

        div.classList.add(
          "selected"
        );

      }


      div.innerHTML = `
        <strong>
          ${escapeHTML(option.key)}.
        </strong>
        ${escapeHTML(option.text)}
      `;


      div.addEventListener(
        "click",
        () => {

          selectedAnswers[
            question.id
          ] =
            option.key;

          renderOptions(
            question
          );

        }
      );


      container.appendChild(
        div
      );

    }
  );

}


/* =========================================================
   QUESTION NAVIGATION
========================================================= */

function renderQuestionNavigation() {

  const nav =
    document.getElementById(
      "questionNavigation"
    );

  nav.innerHTML = "";


  currentQuestions.forEach(
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
        selectedAnswers[
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

          renderQuestion();

        }
      );


      nav.appendChild(
        button
      );

    }
  );

}


/* =========================================================
   PROGRESS
========================================================= */

function updateExamProgress() {

  const percentage =
    (
      (
        currentQuestionIndex + 1
      ) /
      currentQuestions.length
    ) * 100;


  document.getElementById(
    "examProgressBar"
  ).style.width =
    percentage + "%";

}


/* =========================================================
   NEXT
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

        renderQuestion();

      }

    }
  );


/* =========================================================
   PREVIOUS
========================================================= */

document
  .getElementById("previousBtn")
  .addEventListener(
    "click",
    () => {

      if (
        currentQuestionIndex >
        0
      ) {

        currentQuestionIndex--;

        renderQuestion();

      }

    }
  );


/* =========================================================
   SUBMIT
========================================================= */

document
  .getElementById("submitBtn")
  .addEventListener(
    "click",
    () => {

      submitCurrentExam(
        false
      );

    }
  );


/* =========================================================
   TIMER
========================================================= */

function startExamTimer(
  minutes
) {

  clearInterval(
    examTimerInterval
  );


  examSecondsLeft =
    Math.max(
      1,
      minutes * 60
    );


  updateTimerDisplay();


  examTimerInterval =
    setInterval(
      () => {

        examSecondsLeft--;

        updateTimerDisplay();


        if (
          examSecondsLeft <= 0
        ) {

          clearInterval(
            examTimerInterval
          );

          submitCurrentExam(
            true
          );

        }

      },
      1000
    );

}


/* =========================================================
   TIMER DISPLAY
========================================================= */

function updateTimerDisplay() {

  const minutes =
    Math.floor(
      examSecondsLeft / 60
    );

  const seconds =
    examSecondsLeft %
    60;


  const timer =
    document.getElementById(
      "examTimer"
    );


  timer.textContent =
    String(minutes)
      .padStart(2, "0") +
    ":" +
    String(seconds)
      .padStart(2, "0");


  if (
    examSecondsLeft <=
    60
  ) {

    timer.classList.add(
      "timer-danger"
    );

  }

  else {

    timer.classList.remove(
      "timer-danger"
    );

  }

}


/* =========================================================
   SUBMIT EXAM
========================================================= */

async function submitCurrentExam(
  autoSubmitted
) {

  if (!currentAttempt) {
    return;
  }


  clearInterval(
    examTimerInterval
  );


  const submitButton =
    document.getElementById(
      "submitBtn"
    );

  submitButton.disabled =
    true;


  try {

    let score = 0;

    let correct = 0;

    let wrong = 0;

    let unanswered = 0;


    for (
      const question
      of currentQuestions
    ) {

      const selected =
        selectedAnswers[
          question.id
        ] || null;


      let isCorrect =
        false;

      let marksObtained =
        0;


      const maxMarks =
        Number(
          question.marks || 0
        );


      const negativeMarks =
        Number(
          question.negative_marks ??
          currentExam.negative_marking ??
          0
        );


      if (!selected) {

        unanswered++;

      }

      else {

        isCorrect =
          selected.toUpperCase() ===
          String(
            question.correct_answer
          ).toUpperCase();


        if (isCorrect) {

          correct++;

          marksObtained =
            maxMarks;

          score +=
            maxMarks;

        }

        else {

          wrong++;

          marksObtained =
            -negativeMarks;

          score -=
            negativeMarks;

        }

      }


      const {
        error
      } =
        await supabaseClient
          .from("student_answers")
          .insert({

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


      if (error) {

        console.error(
          "Answer save error:",
          error
        );

      }

    }


    score =
      Math.max(
        0,
        score
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
          ) * 100
        : 0;


    const passed =
      percentage >=
      Number(
        currentExam.passing_percentage || 0
      );


    const finalStatus =
      autoSubmitted
        ? "auto_submitted"
        : "submitted";


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
            finalStatus,

          score:
            Number(
              score.toFixed(2)
            ),

          correct_answers:
            correct,

          wrong_answers:
            wrong,

          unanswered:
            unanswered,

          percentage:
            Number(
              percentage.toFixed(2)
            ),

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


    showExamResult(
      updatedAttempt,
      autoSubmitted
    );

  }

  catch (error) {

    console.error(error);

    alert(
      "Exam submission error:\n" +
      error.message
    );

    submitButton.disabled =
      false;

  }

}


/* =========================================================
   RESULT
========================================================= */

function showExamResult(
  attempt,
  autoSubmitted
) {

  document.getElementById(
    "finalPercentage"
  ).textContent =
    Number(
      attempt.percentage || 0
    ) + "%";


  document.getElementById(
    "finalScore"
  ).textContent =
    Number(
      attempt.score || 0
    ).toFixed(2);


  document.getElementById(
    "finalCorrect"
  ).textContent =
    attempt.correct_answers || 0;


  document.getElementById(
    "finalWrong"
  ).textContent =
    attempt.wrong_answers || 0;


  document.getElementById(
    "finalUnanswered"
  ).textContent =
    attempt.unanswered || 0;


  const message =
    document.getElementById(
      "finalResultMessage"
    );


  if (
    attempt.passed
  ) {

    message.className =
      "result-message passed";

    message.textContent =
      autoSubmitted
        ? "⏱️ Time finished. Exam auto-submitted. 🎉 You passed!"
        : "🎉 Congratulations! You passed the exam.";

  }

  else {

    message.className =
      "result-message failed";

    message.textContent =
      autoSubmitted
        ? "⏱️ Time finished. Exam auto-submitted."
        : "Exam completed. Keep practicing and try again.";

  }


  const subject =
    currentExam?.subjects?.name ||
    "General";

  const chapter =
    currentExam?.chapters?.name ||
    "All Chapters";


  document.getElementById(
    "finalExamInfo"
  ).textContent =
    `${currentExam?.title || "Exam"} • ${subject} • ${chapter}`;


  showPage(
    "examResultPage"
  );


  currentAttempt =
    null;

}


/* =========================================================
   BACK DASHBOARD
========================================================= */

document
  .getElementById(
    "backDashboardBtn"
  )
  .addEventListener(
    "click",
    () => {

      showPage(
        "studentDashboard"
      );

    }
  );


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
        passed,
        attempt_number,
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
            Attempt #${result.attempt_number}
            •
            ${formatDate(
              result.submitted_at
            )}
          </p>

          <div class="mini-stats">

            <span>
              Correct: ${result.correct_answers}
            </span>

            <span>
              Wrong: ${result.wrong_answers}
            </span>

            <span>
              Unanswered: ${result.unanswered}
            </span>

          </div>

        </div>


        <div class="score">

          ${Number(
            result.score || 0
          ).toFixed(2)}

          <br>

          ${Number(
            result.percentage || 0
          )}%

          <br>

          <small class="${
            result.passed
              ? "pass-text"
              : "fail-text"
          }">

            ${
              result.passed
                ? "PASS"
                : "FAIL"
            }

          </small>

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
      `<div class="error-box">
        Unable to load history.
      </div>`;

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

          ${
            attempt.submitted_at
              ? Number(
                  attempt.percentage ||
                  0
                ) + "%"
              : "In Progress"
          }

        </div>

      `;


      container.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   LEADERBOARD
========================================================= */

async function loadLeaderboard() {

  const table =
    document.getElementById(
      "leaderboardTable"
    );


  table.innerHTML =
    `<tr>
      <td colspan="4">
        Loading leaderboard...
      </td>
    </tr>`;


  const {
    data: attempts,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(`
        student_id,
        percentage,
        profiles(full_name)
      `)
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

    table.innerHTML =
      `<tr>
        <td colspan="4">
          Unable to load leaderboard.
        </td>
      </tr>`;

    return;

  }


  const map =
    new Map();


  (attempts || []).forEach(
    attempt => {

      const existing =
        map.get(
          attempt.student_id
        );


      const percentage =
        Number(
          attempt.percentage || 0
        );


      if (
        !existing ||
        percentage >
        existing.percentage
      ) {

        map.set(
          attempt.student_id,
          {
            name:
              attempt.profiles?.full_name ||
              "Student",
            percentage
          }
        );

      }

    }
  );


  const leaderboard =
    Array.from(
      map.values()
    )
    .sort(
      (
        a,
        b
      ) =>
        b.percentage -
        a.percentage
    )
    .slice(
      0,
      20
    );


  table.innerHTML = "";


  leaderboard.forEach(
    (student, index) => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          ${index + 1}
        </td>

        <td>
          ${escapeHTML(
            student.name
          )}
        </td>

        <td>
          ${student.percentage}%
        </td>

        <td>
          <strong>
            ${student.percentage}%
          </strong>
        </td>

      `;


      table.appendChild(
        row
      );

    }
  );


  if (!leaderboard.length) {

    table.innerHTML =
      `<tr>
        <td colspan="4">
          No completed attempts yet.
        </td>
      </tr>`;

  }

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
    exams?.length || 0;


  const {
    data: attempts,
    error: attemptsError
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(
        "student_id, percentage, status"
      );


  if (
    !attemptsError
  ) {

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
          item =>
            item.student_id
        )
      );


    document.getElementById(
      "teacherStudentCount"
    ).textContent =
      students.size;


    if (
      completed.length
    ) {

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


  exams.forEach(
    exam => {

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

        <span class="status-badge">

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
        id,
        student_id,
        score,
        percentage,
        submitted_at,
        passed,
        status,
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
        <td colspan="6">
          Unable to load scores.
        </td>
      </tr>`;

    return;

  }


  teacherScoresCache =
    data || [];


  renderTeacherScores(
    teacherScoresCache
  );

}


/* =========================================================
   RENDER TEACHER SCORES
========================================================= */

function renderTeacherScores(
  results
) {

  const table =
    document.getElementById(
      "scoreTable"
    );


  table.innerHTML = "";


  if (!results.length) {

    table.innerHTML =
      `<tr>
        <td colspan="6">
          No student attempts yet.
        </td>
      </tr>`;

    return;

  }


  results.forEach(
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

          <span class="${
            result.passed
              ? "pass-text"
              : "fail-text"
          }">

            ${
              result.passed
                ? "PASS"
                : "FAIL"
            }

          </span>

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
   SEARCH STUDENTS
========================================================= */

document
  .getElementById(
    "studentSearch"
  )
  .addEventListener(
    "input",
    event => {

      const search =
        event.target.value
          .trim()
          .toLowerCase();


      if (!search) {

        renderTeacherScores(
          teacherScoresCache
        );

        return;

      }


      const filtered =
        teacherScoresCache.filter(
          result => {

            const student =
              (
                result.profiles?.full_name ||
                ""
              ).toLowerCase();

            const exam =
              (
                result.exams?.title ||
                ""
              ).toLowerCase();

            return (
              student.includes(search) ||
              exam.includes(search)
            );

          }
        );


      renderTeacherScores(
        filtered
      );

    }
  );


/* =========================================================
   CSV EXPORT
========================================================= */

document
  .getElementById(
    "exportResultsBtn"
  )
  .addEventListener(
    "click",
    () => {

      if (
        !teacherScoresCache.length
      ) {

        alert(
          "No results available for export."
        );

        return;

      }


      const rows = [

        [
          "Student",
          "Exam",
          "Score",
          "Percentage",
          "Result",
          "Date"
        ]

      ];


      teacherScoresCache.forEach(
        result => {

          rows.push([

            result.profiles?.full_name ||
              "Student",

            result.exams?.title ||
              "Exam",

            Number(
              result.score || 0
            ).toFixed(2),

            Number(
              result.percentage || 0
            ) + "%",

            result.passed
              ? "PASS"
              : "FAIL",

            formatDate(
              result.submitted_at
            )

          ]);

        }
      );


      const csv =
        rows
          .map(
            row =>
              row
                .map(
                  value =>
                    `"${String(value)
                      .replace(
                        /"/g,
                        '""'
                      )}"`
                )
                .join(",")
          )
          .join("\n");


      const blob =
        new Blob(
          [csv],
          {
            type:
              "text/csv;charset=utf-8;"
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =
        "ExamHall-Results.csv";

      link.click();


      URL.revokeObjectURL(
        url
      );

    }
  );


/* =========================================================
   TEACHER ANALYTICS
========================================================= */

async function loadTeacherAnalytics() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("exam_attempts")
      .select(
        "percentage, passed, status"
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


  const passed =
    attempts.filter(
      item =>
        item.passed
    ).length;


  const failed =
    attempts.length -
    passed;


  const percentages =
    attempts.map(
      item =>
        Number(
          item.percentage || 0
        )
    );


  document.getElementById(
    "analyticsPassed"
  ).textContent =
    passed;


  document.getElementById(
    "analyticsFailed"
  ).textContent =
    failed;


  document.getElementById(
    "analyticsHighest"
  ).textContent =
    percentages.length
      ? Math.max(
          ...percentages
        ) + "%"
      : "0%";


  document.getElementById(
    "analyticsLowest"
  ).textContent =
    percentages.length
      ? Math.min(
          ...percentages
        ) + "%"
      : "0%";


  renderAnalyticsBars(
    percentages
  );

}


/* =========================================================
   ANALYTICS BARS
========================================================= */

function renderAnalyticsBars(
  percentages
) {

  const container =
    document.getElementById(
      "analyticsBars"
    );


  container.innerHTML = "";


  const ranges = [

    {
      name: "0-39%",
      min: 0,
      max: 39
    },

    {
      name: "40-59%",
      min: 40,
      max: 59
    },

    {
      name: "60-74%",
      min: 60,
      max: 74
    },

    {
      name: "75-89%",
      min: 75,
      max: 89
    },

    {
      name: "90-100%",
      min: 90,
      max: 100
    }

  ];


  ranges.forEach(
    range => {

      const count =
        percentages.filter(
          percentage =>
            percentage >=
              range.min &&
            percentage <=
              range.max
        ).length;


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "analytics-row";


      const width =
        percentages.length
          ? (
              count /
              percentages.length
            ) * 100
          : 0;


      row.innerHTML = `

        <div class="analytics-label">
          ${range.name}
        </div>

        <div class="analytics-track">

          <div
            class="analytics-fill"
            style="width:${width}%"
          ></div>

        </div>

        <strong>
          ${count}
        </strong>

      `;


      container.appendChild(
        row
      );

    }
  );

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

      clearInterval(
        examTimerInterval
      );

      await supabaseClient.auth.signOut();


      currentUser = null;
      currentProfile = null;
      currentExam = null;
      currentAttempt = null;
      currentQuestions = [];
      selectedAnswers = {};


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


  return (
    message ||
    "Something went wrong. Please try again."
  );

}


/* =========================================================
   SHUFFLE
========================================================= */

function shuffleArray(
  array
) {

  for (
    let i =
      array.length - 1;
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
