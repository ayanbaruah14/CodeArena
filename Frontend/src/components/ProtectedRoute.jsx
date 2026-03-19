import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../api/api";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await API.get("/auth/me"); // cookie auto sent
        setIsAuth(true);
      } catch (err) {
        console.log(err);
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ⏳ While checking auth
  if (loading) return <div>Loading...</div>;

  // ❌ Not authenticated
  if (!isAuth) return <Navigate to="/login" />;

  // ✅ Authenticated
  return children;
}

export default ProtectedRoute;