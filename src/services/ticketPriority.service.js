import api from "./api";
import { getToken } from "../utilities/tokenStorage";

const getHeaders = () => ({ headers: { "x-auth-token": getToken() } });

export const getTicketPriorities = async (companyId) => {
  const { data } = await api.get("/ticket-priorities", {
    ...getHeaders(),
    params: companyId ? { companyId } : {},
  });
  return data;
};

export const createTicketPriority = async (priorityData) => {
  const { data } = await api.post(
    "/ticket-priorities",
    priorityData,
    getHeaders(),
  );
  return data;
};

export const editTicketPriority = async (id, priorityData) => {
  const { data } = await api.put(
    `/ticket-priorities/${id}`,
    priorityData,
    getHeaders(),
  );
  return data;
};

export const deleteTicketPriority = async (id) => {
  const { data } = await api.delete(`/ticket-priorities/${id}`, getHeaders());
  return data;
};
