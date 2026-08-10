import api from "./api";

export const createUser = async (userData, token) => {
  const { data } = await api.post("/users", userData, {
    headers: {
      "x-auth-token": token,
    },
  });

  return data;
};

export const getUsers = async (token) => {
  const { data } = await api.get("/users", {
    headers: {
      "x-auth-token": token,
    },
  });

  return data;
};

export const updateUserStatus = async (userId, isActive, token) => {
  const { data } = await api.patch(
    `/users/${userId}/status`,
    { isActive },
    {
      headers: {
        "x-auth-token": token,
      },
    },
  );

  return data;
};

export const updateUserRole = async (userId, role, token) => {
  const { data } = await api.patch(
    `/users/${userId}/role`,
    { role },
    {
      headers: {
        "x-auth-token": token,
      },
    },
  );

  return data;
};

export const updateUserName = async (userId, name, token) => {
  const { data } = await api.patch(
    `/users/${userId}/name`,
    { name },
    {
      headers: {
        "x-auth-token": token,
      },
    },
  );

  return data;
};

export const deleteUser = async (userId, token) => {
  const { data } = await api.delete(`/users/${userId}`, {
    headers: {
      "x-auth-token": token,
    },
  });

  return data;
};
