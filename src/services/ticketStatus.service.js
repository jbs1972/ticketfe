import api from "./api";
import { getToken } from "../utilities/tokenStorage";

const getHeaders = () => ({ headers: { "x-auth-token": getToken() } });

export const getTicketStatuses = async (companyId) => {
  const { data } = await api.get("/ticket-statuses", {
    ...getHeaders(),
    params: companyId ? { companyId } : {},
  });
  return data;
};

export const createTicketStatus = async (statusData) => {
  const { data } = await api.post("/ticket-statuses", statusData, getHeaders());
  return data;
};

export const editTicketStatus = async (id, statusData) => {
  const { data } = await api.put(
    `/ticket-statuses/${id}`,
    statusData,
    getHeaders(),
  );
  return data;
};

export const deleteTicketStatus = async (id) => {
  const { data } = await api.delete(`/ticket-statuses/${id}`, getHeaders());
  return data;
};

export const reorderTicketStatuses = async (companyId, orderedIds) => {
  const { data } = await api.put(
    "/ticket-statuses/reorder",
    { companyId, orderedIds },
    getHeaders(),
  );
  return data;
};
