import { apiClient } from "./api-client";

export const CONTACTS_QUERY = {
  getContacts: async () => {
    const res = await apiClient.get("/contacts");
    if (res.status === 200) {
      return res.data;
    }
    throw new Error("Failed to fetch contacts");
  },
};

export const CALLS_QUERY = {
  createCall: async (data: { name: string; members: string[] }) => {
    const res = await apiClient.post("/calls/create", data);
    if (res.status === 200) {
      return res.data;
    }
    throw new Error("Failed to fetch calls");
  },
};

export const TEAMS_QUERY = {
  createTeam: async (data: { name: string; members: string[] }) => {
    const res = await apiClient.post("/teams/create", data);
    if (res.status === 200) {
      return res.data;
    }
    throw new Error("Failed to create team");
  },
};
