import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5500";

const API = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true
});


API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

if (
  err.response?.status === 401 &&
  !originalRequest._retry &&
  !originalRequest.url.includes("/auth/login") &&
  !originalRequest.url.includes("/auth/me")
) {
  originalRequest._retry = true;

  try {
    await axios.post(
      `${API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );

    return API(originalRequest);
  } catch {
    window.location.href = "/login";
  }
}

    

    return Promise.reject(err);
  }
);
export default API;