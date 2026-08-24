<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>ExamHall</title>

  <link rel="stylesheet" href="style.css">

</head>

<body>

<!-- =====================================================
     LOGIN / SIGNUP
===================================================== -->

<div id="loginPage" class="auth-page">

  <div class="auth-card">

    <div class="brand">

      <div class="brand-icon">
        E
      </div>

      <h1>ExamHall</h1>

      <p>Online Examination Portal</p>

    </div>


    <div class="auth-tabs">

      <button
        id="loginTab"
        class="auth-tab active"
        type="button"
      >
        Login
      </button>

      <button
        id="signupTab"
        class="auth-tab"
        type="button"
      >
        Student Signup
      </button>

    </div>


    <!-- LOGIN -->

    <form id="loginForm">

      <label>Email</label>

      <input
        type="email"
        id="loginEmail"
        placeholder="student@example.com"
        autocomplete="email"
        required
      >

      <label>Password</label>

      <input
        type="password"
        id="loginPassword"
        placeholder="Enter password"
        autocomplete="current-password"
        required
      >

      <p
        id="loginError"
        class="error-message"
      ></p>

      <button
        type="submit"
        id="loginBtn"
        class="primary-btn full-btn"
      >
        Login
      </button>

    </form>


    <!-- SIGNUP -->

    <form
      id="signupForm"
      class="hidden"
    >

      <label>Full Name</label>

      <input
        type="text"
        id="signupName"
        placeholder="Enter your full name"
        required
      >

      <label>Email</label>

      <input
        type="email"
        id="signupEmail"
        placeholder="student@example.com"
        required
      >

      <label>Password</label>

      <input
        type="password"
        id="signupPassword"
        placeholder="Minimum 6 characters"
        minlength="6"
        required
      >

      <label>Confirm Password</label>

      <input
        type="password"
        id="signupConfirmPassword"
        placeholder="Confirm password"
        minlength="6"
        required
      >

      <p
        id="signupError"
        class="error-message"
      ></p>

      <p
        id="signupSuccess"
        class="success-message"
      ></p>

      <button
        type="submit"
        id="signupBtn"
        class="primary-btn full-btn"
      >
        Create Student Account
      </button>

    </form>


    <div class="demo-note">

      <strong>ExamHall</strong>

      <span>
        Secure online examination system
      </span>

    </div>

  </div>

</div>


<!-- =====================================================
     APPLICATION
===================================================== -->

<div
  id="app"
  class="app hidden"
>


  <!-- ===================================================
       SIDEBAR
  ==================================================== -->

  <aside class="sidebar">

    <div class="sidebar-brand">

      <div class="brand-icon small">
        E
      </div>

      <div>

        <strong>
          ExamHall
        </strong>

        <small>
          Online Examination
        </small>

      </div>

    </div>


    <!-- USER -->

    <div class="user-card">

      <div
        id="userAvatar"
        class="avatar"
      >
        U
      </div>

      <div class="user-details">

        <strong id="userName">
          User
        </strong>

        <span id="userRole">
          Student
        </span>

      </div>

    </div>


    <!-- STUDENT MENU -->

    <nav
      id="studentMenu"
      class="sidebar-menu"
    >

      <button
        class="menu-btn active"
        data-page="studentDashboard"
      >
        <span>📊</span>
        Dashboard
      </button>

      <button
        class="menu-btn"
        data-page="studentResults"
      >
        <span>📄</span>
        My Results
      </button>

      <button
        class="menu-btn"
        data-page="studentHistory"
      >
        <span>🕘</span>
        Attempt History
      </button>

      <button
        class="menu-btn"
        data-page="studentLeaderboard"
      >
        <span>🏆</span>
        Leaderboard
      </button>

      <button
        class="menu-btn"
        data-page="studentProfile"
      >
        <span>👨‍🎓</span>
        My Profile
      </button>

    </nav>


    <!-- TEACHER MENU -->

    <nav
      id="teacherMenu"
      class="sidebar-menu hidden"
    >

      <button
        class="menu-btn active"
        data-page="teacherDashboard"
      >
        <span>📊</span>
        Dashboard
      </button>

      <button
        class="menu-btn"
        data-page="createExam"
      >
        <span>➕</span>
        Create Exam
      </button>

      <button
        class="menu-btn"
        data-page="teacherScores"
      >
        <span>📈</span>
        Student Scores
      </button>

      <button
        class="menu-btn"
        data-page="teacherAnalytics"
      >
        <span>📊</span>
        Analytics
      </button>

    </nav>


    <button
      id="logoutBtn"
      class="logout-btn"
    >
      🚪 Logout
    </button>

  </aside>


  <!-- ===================================================
       MAIN
  ==================================================== -->

  <main class="main-content">


    <!-- =================================================
         STUDENT DASHBOARD
    ================================================== -->

    <section
      id="studentDashboard"
      class="page"
    >

      <div class="page-header">

        <p class="eyebrow">
          STUDENT
        </p>

        <h2>
          Welcome,
          <span id="studentWelcome">
            Student
          </span>
        </h2>

        <p>
          Ready to continue your learning journey?
        </p>

      </div>


      <div class="stats-grid">

        <div class="stat-card">

          <span>
            Available Exams
          </span>

          <strong id="availableExams">
            0
          </strong>

        </div>


        <div class="stat-card">

          <span>
            Total Attempts
          </span>

          <strong id="attemptCount">
            0
          </strong>

        </div>


        <div class="stat-card">

          <span>
            Average Score
          </span>

          <strong id="averageScore">
            0%
          </strong>

        </div>


        <div class="stat-card">

          <span>
            Best Score
          </span>

          <strong id="bestScore">
            0%
          </strong>

        </div>

      </div>


      <div class="content-card">

        <div class="card-header">

          <div>

            <h3>
              Available Exams
            </h3>

            <p>
              Exams published by your teachers
            </p>

          </div>

        </div>

        <div id="examList">

          <div class="loading">
            Loading exams...
          </div>

        </div>

      </div>

    </section>


    <!-- =================================================
         STUDENT RESULTS
    ================================================== -->

    <section
      id="studentResults"
      class="page hidden"
    >

      <div class="page-header">

        <p class="eyebrow">
          STUDENT
        </p>

        <h2>
          My Results
        </h2>

        <p>
          View your examination performance.
        </p>

      </div>

      <div
        id="myResults"
        class="results-list"
      ></div>

    </section>


    <!-- =================================================
         STUDENT HISTORY
    ================================================== -->

    <section
      id="studentHistory"
      class="page hidden"
    >

      <div class="page-header">

        <p class="eyebrow">
          STUDENT
        </p>

        <h2>
          Attempt History
        </h2>

        <p>
          Your previous examination attempts.
        </p>

      </div>

      <div
        id="historyList"
        class="results-list"
      ></div>

    </section>


    <!-- =================================================
         LEADERBOARD
    ================================================== -->

    <section
      id="studentLeaderboard"
      class="page hidden"
    >

      <div class="page-header">

        <p class="eyebrow">
          PERFORMANCE
        </p>

        <h2>
          🏆 Leaderboard
        </h2>

        <p>
          Top student performance.
        </p>

      </div>

      <div class="content-card">

        <div class="table-wrapper">

          <table>

            <thead>

              <tr>

                <th>
                  Rank
                </th>

                <th>
                  Student
                </th>

                <th>
                  Best Score
                </th>

                <th>
                  Percentage
                </th>

              </tr>

            </thead>

            <tbody id="leaderboardTable">

            </tbody>

          </table>

        </div>

      </div>

    </section>


    <!-- =================================================
         STUDENT PROFILE
    ================================================== -->

    <section
      id="studentProfile"
      class="page hidden"
    >

      <div class="page-header">

        <p class="eyebrow">
          STUDENT
        </p>

        <h2>
          👨‍🎓 My Profile
        </h2>

      </div>

      <div class="content-card profile-card">

        <div class="profile-avatar">
          <span id="profileAvatar">
            U
          </span>
        </div>

        <div>

          <h3 id="profileName">
            Student
          </h3>

          <p id="profileEmail">
            -
          </p>

          <p>
            Role:
            <strong id="profileRole">
              Student
            </strong>
          </p>

        </div>

      </div>

    </section>


    <!-- =================================================
         TEACHER DASHBOARD
    ================================================== -->

    <section
      id="teacherDashboard"
      class="page hidden"
    >

      <div class="page-header">

        <p class="eyebrow">
          TEACHER
        </p>

        <h2>
          Teacher Dashboard
        </h2>

        <p>
          Manage exams and monitor student performance.
        </p>

      </div>


      <div class="stats-grid">

        <div class="stat-card">

          <span>
            Total Exams
          </span>

          <strong id="teacherExamCount">
            0
          </strong>

        </div>


        <div class="stat-card">

          <span>
            Total Attempts
          </span>

          <strong id="teacherAttemptCount">
            0
          </strong>

        </div>


        <div class="stat-card">

          <span>
            Students
          </span>

          <strong id="teacherStudentCount">
            0
          </strong>

        </div>


        <div class="stat-card">

          <span>
            Average Score
          </span>

          <strong id="teacherAverage">
            0%
          </strong>

        </div>

      </div>


      <div class="content-card">

        <div class="card-header">

          <h3>
            Created Exams
          </h3>

          <p>
            Your examination list
          </p>

        </div>

        <div id="teacherExamList"></div>

      </div>

    </section>


    <!-- =================================================
         CREATE EXAM
    ================================================== -->

    <section
      id="createExam"
      class="page hidden"
    >

      <div class="page-header">

        <p class="eyebrow">
          TEACHER
        </p>

        <h2>
          Create New Exam
        </h2>

        <p>
          Exam builder.
        </p>

      </div>


      <div class="content-card">

        <div class="empty-state">

          <div class="empty-icon">
            📝
          </div>

          <h3>
            Exam Builder
          </h3>

          <p>
            Exam builder will be connected with
            Subjects, Chapters, Questions, Timer,
            Negative Marking and Retake Rules.
          </p>

          <p class="small-note">
            Database structure is ready.
            Builder module will be added separately.
          </p>

        </div>

      </div>

    </section>


    <!-- =================================================
         TEACHER SCORES
    ================================================== -->

    <section
      id="teacherScores"
      class="page hidden"
    >

      <div class="page-header">

        <p class="eyebrow">
          TEACHER
        </p>

        <h2>
          Student Scores
        </h2>

        <p>
          Search, filter and export student results.
        </p>

      </div>


      <div class="content-card">

        <div class="filter-row">

          <input
            type="text"
            id="studentSearch"
            placeholder="🔍 Search student or exam..."
          >

          <button
            id="exportResultsBtn"
            class="secondary-btn"
            type="button"
          >
            📥 Export CSV
          </button>

        </div>

      </div>


      <div class="content-card table-wrapper">

        <table>

          <thead>

            <tr>

              <th>
                Student
              </th>

              <th>
                Exam
              </th>

              <th>
                Score
              </th>

              <th>
                Percentage
              </th>

              <th>
                Result
              </th>

              <th>
                Date
              </th>

            </tr>

          </thead>

          <tbody id="scoreTable">

          </tbody>

        </table>

      </div>

    </section>


    <!-- =================================================
         TEACHER ANALYTICS
    ================================================== -->

    <section
      id="teacherAnalytics"
      class="page hidden"
    >

      <div class="page-header">

        <p class="eyebrow">
          TEACHER
        </p>

        <h2>
          📈 Teacher Analytics
        </h2>

        <p>
          Overall student performance.
        </p>

      </div>


      <div class="stats-grid">

        <div class="stat-card">

          <span>
            Passed
          </span>

          <strong id="analyticsPassed">
            0
          </strong>

        </div>

        <div class="stat-card">

          <span>
            Failed
          </span>

          <strong id="analyticsFailed">
            0
          </strong>

        </div>

        <div class="stat-card">

          <span>
            Highest %
          </span>

          <strong id="analyticsHighest">
            0%
          </strong>

        </div>

        <div class="stat-card">

          <span>
            Lowest %
          </span>

          <strong id="analyticsLowest">
            0%
          </strong>

        </div>

      </div>


      <div class="content-card">

        <h3>
          Performance Distribution
        </h3>

        <div
          id="analyticsBars"
          class="analytics-bars"
        ></div>

      </div>

    </section>


    <!-- =================================================
         EXAM PAGE
    ================================================== -->

    <section
      id="examPage"
      class="page hidden"
    >

      <div class="exam-topbar">

        <div>

          <p class="eyebrow">
            EXAM
          </p>

          <h2 id="examTitle">
            Exam
          </h2>

          <p id="questionNumber">
            Question 1
          </p>

        </div>


        <div class="timer-box">

          <span>
            ⏱️ Time Left
          </span>

          <strong id="examTimer">
            00:00
          </strong>

        </div>

      </div>


      <div class="exam-progress">

        <div
          id="examProgressBar"
          class="exam-progress-bar"
        ></div>

      </div>


      <div class="content-card">

        <div class="question-meta">

          <span id="questionMarks">
            Marks: 0
          </span>

          <span id="questionNegative">
            Negative: 0
          </span>

        </div>


        <h3 id="questionText">
          Question
        </h3>


        <div
          id="questionImage"
          class="question-image"
        ></div>


        <div id="options"></div>

      </div>


      <div class="exam-actions">

        <button
          id="previousBtn"
          class="secondary-btn"
          type="button"
        >
          Previous
        </button>

        <button
          id="nextBtn"
          class="primary-btn"
          type="button"
        >
          Next
        </button>

        <button
          id="submitBtn"
          class="danger-btn hidden"
          type="button"
        >
          Submit Exam
        </button>

      </div>


      <div
        id="questionNavigation"
        class="question-navigation"
      ></div>

    </section>


    <!-- =================================================
         RESULT PAGE
    ================================================== -->

    <section
      id="examResultPage"
      class="page hidden"
    >

      <div class="page-header">

        <p class="eyebrow">
          RESULT
        </p>

        <h2>
          Examination Result
        </h2>

      </div>


      <div class="result-summary-card">

        <div class="result-big-score">

          <span>
            Percentage
          </span>

          <strong id="finalPercentage">
            0%
          </strong>

        </div>


        <div class="result-stat">

          <span>
            Score
          </span>

          <strong id="finalScore">
            0
          </strong>

        </div>


        <div class="result-stat">

          <span>
            Correct
          </span>

          <strong id="finalCorrect">
            0
          </strong>

        </div>


        <div class="result-stat">

          <span>
            Wrong
          </span>

          <strong id="finalWrong">
            0
          </strong>

        </div>


        <div class="result-stat">

          <span>
            Unanswered
          </span>

          <strong id="finalUnanswered">
            0
          </strong>

        </div>

      </div>


      <div
        id="finalResultMessage"
        class="result-message"
      ></div>


      <div class="content-card">

        <h3>
          Subject / Chapter
        </h3>

        <p id="finalExamInfo">
          -
        </p>

      </div>


      <div class="result-actions">

        <button
          id="backDashboardBtn"
          class="primary-btn"
          type="button"
        >
          Back to Dashboard
        </button>

      </div>

    </section>

  </main>

</div>


<!-- =====================================================
     SUPABASE
===================================================== -->

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<script src="script.js"></script>

</body>
</html>
