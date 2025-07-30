import axios from "axios";

export const apiClient = axios.create({
  baseURL: `${process.env.BACKEND_URL}/api`,
  headers: {},
  withCredentials: true,
});
