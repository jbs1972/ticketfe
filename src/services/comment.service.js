import api from "./api";
import { getToken } from "../utilities/tokenStorage";

export const getComments = async (ticketCode) => {
  const { data } = await api.get(`/tickets/${ticketCode}/comments`, {
    headers: { "x-auth-token": getToken() },
  });

  return data;
};

export const addComment = async (ticketCode, message, files = []) => {
  const formData = new FormData();
  formData.append("message", message);

  Array.from(files).forEach((file) => formData.append("attachments", file));

  const { data } = await api.post(`/tickets/${ticketCode}/comments`, formData, {
    headers: {
      "x-auth-token": getToken(),
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};

export const downloadCommentAttachment = async (
  ticketCode,
  commentId,
  fileName,
) => {
  return await api.get(
    `/tickets/${ticketCode}/comments/${commentId}/attachments/${encodeURIComponent(fileName)}`,
    {
      headers: { "x-auth-token": getToken() },
      responseType: "blob",
    },
  );
};
