import api from "./api";
import { getToken } from "../utilities/tokenStorage";

const getHeaders = () => ({
  headers: {
    "x-auth-token": getToken(),
  },
});

export const getAllCompanies = async () => {
  const { data } = await api.get("/companies", getHeaders());
  return data;
};

export const getCompanyById = async (id) => {
  const { data } = await api.get(`/companies/${id}`, getHeaders());
  return data;
};

export const createCompany = async (companyData) => {
  const { data } = await api.post("/companies", companyData, getHeaders());
  return data;
};

export const updateCompanyName = async (id, companyData) => {
  const { data } = await api.patch(
    `/companies/${id}`,
    companyData,
    getHeaders(),
  );
  return data;
};

export const updateCompanyStatus = async (id, statusData) => {
  const { data } = await api.patch(
    `/companies/${id}/status`,
    statusData,
    getHeaders(),
  );
  return data;
};
