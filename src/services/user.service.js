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
