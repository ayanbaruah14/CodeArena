import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import API from "../api/api";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const location = useLocation(); // ✅ ADD THIS

  useEffect(() => {
    // ✅ DO NOT RUN ON LOGIN / REGISTER
    if (location.pathname === "/login" || location.pathname === "/register") {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        await API.get("/auth/me");
        setIsAuth(true);
      } catch (err) {
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]); // ✅ IMPORTANT

  if (loading) return <div>Loading...</div>;

  // ✅ PREVENT REDIRECT LOOP
  if (!isAuth && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;