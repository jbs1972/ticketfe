import api from "./api";

export const login = async (credentials) => {
  const { data } = await api.post("/auth", credentials);
  return data;
};

export const getProfile = async (token) => {
  const { data } = await api.get("/users/me", {
    headers: {
      "x-auth-token": token,
    },
  });

  return data;
};

export const logout = async (token) => {
  const { data } = await api.post(
    "/auth/logout",
    {},
    {
      headers: {
        "x-auth-token": token,
      },
    },
  );

  return data;
};

export const sendOtp = async (email) => {
  const { data } = await api.post("/password-recovery/send-otp", {
    email,
  });

  return data;
};

export const verifyOtp = async ({ email, otp }) => {
  const { data } = await api.post("/password-recovery/verify-otp", {
    email,
    otp,
  });

  return data;
};

export const resetPassword = async ({ email, otp, newPassword }) => {
  const { data } = await api.post("/password-recovery/reset-password", {
    email,
    otp,
    newPassword,
  });

  return data;
};
