import { emitToast } from "../components/common/Toast";

export const toastSuccess = (title, message) => {
  emitToast({
    type: "success",
    title,
    message,
  });
};

export const toastError = (title, message) => {
  emitToast({
    type: "error",
    title,
    message,
  });
};

export const toastInfo = (title, message) => {
  emitToast({
    type: "info",
    title,
    message,
  });
};

export const toastWarning = (title, message) => {
  emitToast({
    type: "warning",
    title,
    message,
  });
};
