import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Pages/auth/Login";
import Register from "./Pages/auth/Register";

import AdminDashboard from "./Pages/admin/AdminDashboard";
import StudentDashboard from "./Pages/student/StudentDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/register" />} />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Student dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>

  );

}

export default App;