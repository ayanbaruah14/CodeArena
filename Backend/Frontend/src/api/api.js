import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5500/api",
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
      "http://localhost:5500/api/auth/refresh",
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