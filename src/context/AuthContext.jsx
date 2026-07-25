import { createContext, useEffect, useState, useRef } from "react";
import {
  login,
  getProfile,
  logout as logoutApi,
} from "../services/auth.service";
import { saveToken, getToken, removeToken } from "../utilities/tokenStorage";
import { toastWarning } from "../utilities/toast";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionExpiredShown = useRef(false);

  const initializeUser = async () => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await getProfile(token);
      setUser(response.data);
    } catch (error) {
      removeToken();
      setUser(null);

      if (error?.response?.status === 401 && !sessionExpiredShown.current) {
        sessionExpiredShown.current = true;

        toastWarning(
          "Session Expired",
          error?.response?.data?.message || "Please login again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeUser();
  }, []);

  const loginUser = async (credentials) => {
    setLoading(true);

    try {
      const response = await login(credentials);

      const token = response.data.token;

      saveToken(token);

      const profile = await getProfile(token);

      setUser(profile.data);

      sessionExpiredShown.current = false;

      return profile.data;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    const token = getToken();

    try {
      if (token) {
        await logoutApi(token);
      }
    } catch (error) {
      console.error(error);
    } finally {
      removeToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginUser,
        logoutUser,
        initializeUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
