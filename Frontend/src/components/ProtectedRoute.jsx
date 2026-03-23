import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../api/api";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await API.get("/auth/me"); 
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

  if (loading) return <div>Loading...</div>;

  if (!isAuth) return <Navigate to="/login" />;

  return children;
}

export default ProtectedRoute;