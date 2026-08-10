import axios from "axios";
import socket from "./socket";
import { getToken, removeToken } from "../utilities/tokenStorage";
import { toastWarning } from "../utilities/toast";

const api = axios.create({
  baseURL: "http://localhost:3001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (socket.id) {
    config.headers["x-socket-id"] = socket.id;
  }

  return config;
});

let sessionExpiredHandled = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401 &&
      getToken() &&
      !sessionExpiredHandled
    ) {
      sessionExpiredHandled = true;

      removeToken();

      toastWarning(
        "Session Expired",
        error?.response?.data?.message || "Please login again.",
      );

      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
