import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true // 🔥 VERY IMPORTANT
});

//intercept and provide access token when it expires
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axios.post(
          "http://localhost:5000/api/auth/refresh",
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