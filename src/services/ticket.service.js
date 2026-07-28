import api from "./api";
import { getToken } from "../utilities/tokenStorage";

const getHeaders = () => ({
  headers: {
    "x-auth-token": getToken(),
  },
});

export const getTickets = async () => {
  const { data } = await api.get("/tickets", getHeaders());
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
