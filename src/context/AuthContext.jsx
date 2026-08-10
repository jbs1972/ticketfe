import { createContext, useEffect, useState } from "react";
import {
  login,
  getProfile,
  logout as logoutApi,
} from "../services/auth.service";
import { saveToken, getToken, removeToken } from "../utilities/tokenStorage";
import { toastWarning } from "../utilities/toast";
import socket from "../services/socket";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inactiveAccount, setInactiveAccount] = useState(false);

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
      setUser(null);
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

  const clearInactiveAccount = () => {
    setInactiveAccount(false);
  };

  useEffect(() => {
    const handleForceLogout = () => {
      logoutUser();
      setInactiveAccount(true);
    };

    const handleRoleChanged = () => {
      logoutUser();

      toastWarning(
        "Role Updated",
        "Your role has been updated. Please log in again.",
      );
    };

    socket.on("account:deactivated", handleForceLogout);
    socket.on("account:roleChanged", handleRoleChanged);

    return () => {
      socket.off("account:deactivated", handleForceLogout);
      socket.off("account:roleChanged", handleRoleChanged);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginUser,
        logoutUser,
        initializeUser,
        isAuthenticated: !!user,
        inactiveAccount,
        clearInactiveAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
