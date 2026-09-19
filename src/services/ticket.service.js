import api from "./api";
import { getToken } from "../utilities/tokenStorage";

const getHeaders = () => ({
  headers: {
    "x-auth-token": getToken(),
  },
});

export const getTickets = async (params) => {
  const { data } = await api.get("/tickets", {
    headers: { "x-auth-token": getToken() },
    params: params || {},
  });
  return data;
};

export const getTicketById = async (ticketId) => {
  const { data } = await api.get(`/tickets/${ticketId}`, getHeaders());

  return data;
};

export const createTicket = async (ticketData) => {
  const { data } = await api.post("/tickets", ticketData, getHeaders());

  return data;
};

export const updateTicket = async (ticketId, ticketData) => {
  const { data } = await api.put(
    `/tickets/${ticketId}`,
    ticketData,
    getHeaders(),
  );

  return data;
};

export const patchTicket = async (ticketId, patchData) => {
  const { data } = await api.patch(
    `/tickets/${ticketId}`,
    patchData,
    getHeaders(),
  );

  return data;
};

export const deleteTicket = async (ticketId) => {
  const { data } = await api.delete(`/tickets/${ticketId}`, getHeaders());

  return data;
};

export const uploadAttachments = async (ticketId, files) => {
  const formData = new FormData();

  Array.from(files).forEach((file) => {
    formData.append("attachments", file);
  });

  const { data } = await api.post(
    `/tickets/${ticketId}/attachments`,
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

export const downloadAttachment = async (ticketId, fileName) => {
  return await api.get(
    `/tickets/${ticketId}/attachments/${encodeURIComponent(fileName)}`,
    {
      headers: {
        "x-auth-token": getToken(),
      },
      responseType: "blob",
    },
  );
};

export const deleteAttachment = async (ticketId, fileName) => {
  const { data } = await api.delete(
    `/tickets/${ticketId}/attachments/${encodeURIComponent(fileName)}`,
    getHeaders(),
  );

  return data;
};

export const setTicketStatus = async (ticketCode, status) => {
  const { data } = await api.patch(
    `/tickets/${ticketCode}/status`,
    { status },
    getHeaders(),
  );

  return data;
};

export const searchTickets = async (params) => {
  const { data } = await api.get("/tickets/search", {
    headers: { "x-auth-token": getToken() },
    params,
  });

  return data;
};

export const allocateTicket = async (ticketCode, users) => {
  const { data } = await api.put(
    `/tickets/${ticketCode}/allocate`,
    { users },
    getHeaders(),
  );
  return data;
};
