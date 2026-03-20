import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Pages/auth/Login";
import Register from "./Pages/auth/Register";

import AdminDashboard from "./Pages/admin/AdminDashboard";
import CreateProblem from "./Pages/admin/CreateProblem";
import CreateContest from "./Pages/admin/CreateContest";
import ManageContests from "./Pages/admin/ManageContests";

import StudentDashboard from "./Pages/student/StudentDashboard";
import Contests from "./Pages/student/Contests";
import ContestPage from "./Pages/student/ContestPage";
import ProblemPage from "./Pages/student/ProblemPage";
import Leaderboard from "./Pages/student/Leaderboard";
import Submissions from "./Pages/student/AllSubmissions";
import ProtectedRoute from "./components/ProtectedRoute";
import AllProblems from "./Pages/student/AllProblems";
import GlobalLeaderboard from "./Pages/student/GlobalLeaderboard";
import Room from "./Pages/Room";
import Rooms from "./Pages/Rooms";
function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/register" />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-problem"
          element={
            <ProtectedRoute>
              <CreateProblem />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-contest"
          element={
            <ProtectedRoute>
              <CreateContest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-contests"
          element={
            <ProtectedRoute>
              <ManageContests />
            </ProtectedRoute>
          }
        />

        {/* Student */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contests"
          element={
            <ProtectedRoute>
              <Contests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contest/:contestId"
          element={
            <ProtectedRoute>
              <ContestPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contest/:contestId/problem/:problemId"
          element={
            <ProtectedRoute>
              <ProblemPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/problem/:problemId"
          element={
            <ProtectedRoute>
              <ProblemPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contest/:contestId/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/allSubmissions"
          element={
            <ProtectedRoute>
              <Submissions/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/allProblems"
          element={
            <ProtectedRoute>
              <AllProblems/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/globalLeaderboard"
          element={
            <ProtectedRoute>
              <GlobalLeaderboard/>
            </ProtectedRoute>
          }
        />
      <Route path="/rooms" element={<Rooms />} />
<Route path="/room/:roomId" element={<Room />} />
      </Routes>

    </BrowserRouter>

  );

}

export default App;