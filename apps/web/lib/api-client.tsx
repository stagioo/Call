import axios from "axios";

export const apiClient = axios.create({
  baseURL: `http://${process.env.NEXT_PUBLIC_BACKEND_URL}/api`,
  headers: {},
  withCredentials: true,
});
