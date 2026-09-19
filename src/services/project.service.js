import api from "./api";
import { getToken } from "../utilities/tokenStorage";

const getHeaders = () => ({
  headers: {
    "x-auth-token": getToken(),
  },
});

export const getAllProjects = async (companyId) => {
  const { data } = await api.get("/projects", {
    headers: { "x-auth-token": getToken() },
    params: companyId ? { companyId } : {},
  });
  return data;
};

export const getProjectById = async (id) => {
  const { data } = await api.get(`/projects/${id}`, getHeaders());
  return data;
};

export const createProject = async (projectData) => {
  const { data } = await api.post("/projects", projectData, getHeaders());
  return data;
};

export const updateProject = async (id, projectData) => {
  const { data } = await api.patch(
    `/projects/${id}`,
    projectData,
    getHeaders(),
  );
  return data;
};

export const deleteProject = async (id) => {
  const { data } = await api.delete(`/projects/${id}`, getHeaders());
  return data;
};

export const updateProjectStatus = async (id, statusData) => {
  const { data } = await api.patch(
    `/projects/${id}/status`,
    statusData,
    getHeaders(),
  );
  return data;
};

export const getMyProjects = async () => {
  const { data } = await api.get("/projects/mine", getHeaders());
  return data;
};

export const assignUsersToProject = async (id, userIds) => {
  const { data } = await api.post(
    `/projects/${id}/users`,
    { users: userIds },
    getHeaders(),
  );
  return data;
};
