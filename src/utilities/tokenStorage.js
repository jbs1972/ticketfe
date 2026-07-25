const TOKEN_KEY = "taskflow_token";
const REMEMBER_EMAIL_KEY = "remembered_email";

export const saveToken = (token) => {
  sessionStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return sessionStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  sessionStorage.removeItem(TOKEN_KEY);
};

export const hasToken = () => {
  return !!getToken();
};

export const saveRememberedEmail = (email) => {
  localStorage.setItem(REMEMBER_EMAIL_KEY, email);
};

export const getRememberedEmail = () => {
  return localStorage.getItem(REMEMBER_EMAIL_KEY) || "";
};

export const removeRememberedEmail = () => {
  localStorage.removeItem(REMEMBER_EMAIL_KEY);
};
