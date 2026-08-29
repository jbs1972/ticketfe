import api from "./api";
import { getToken } from "../utilities/tokenStorage";

export const getComments = async (ticketCode) => {
  const { data } = await api.get(`/tickets/${ticketCode}/comments`, {
    headers: { "x-auth-token": getToken() },
  });

  return data;
};

export const addComment = async (
  ticketCode,
  message,
  files = [],
  mentionedUserIds = [],
) => {
  const formData = new FormData();
  formData.append("message", message);
  formData.append("mentions", JSON.stringify(mentionedUserIds));

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

export const editComment = async (
  ticketCode,
  commentId,
  message,
  files = [],
  mentionedUserIds = [],
) => {
  const formData = new FormData();
  formData.append("message", message);
  formData.append("mentions", JSON.stringify(mentionedUserIds));

  Array.from(files).forEach((file) => formData.append("attachments", file));

  const { data } = await api.put(
    `/tickets/${ticketCode}/comments/${commentId}`,
    formData,
    {
      headers: {
        "x-auth-token": getToken(),
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data;
};

export const deleteComment = async (ticketCode, commentId) => {
  const { data } = await api.delete(
    `/tickets/${ticketCode}/comments/${commentId}`,
    { headers: { "x-auth-token": getToken() } },
  );

  return data;
};

export const deleteCommentAttachment = async (
  ticketCode,
  commentId,
  fileName,
) => {
  const { data } = await api.delete(
    `/tickets/${ticketCode}/comments/${commentId}/attachments/${encodeURIComponent(fileName)}`,
    { headers: { "x-auth-token": getToken() } },
  );

  return data;
};

export const searchComments = async (ticketCode, params) => {
  const { data } = await api.get(`/tickets/${ticketCode}/comments/search`, {
    headers: { "x-auth-token": getToken() },
    params,
  });

  return data;
};

export const getMyMentions = async () => {
  const { data } = await api.get(`/tickets/mentions/mine`, {
    headers: { "x-auth-token": getToken() },
  });

  return data;
};
