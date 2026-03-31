import api from "./axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export async function fetchShopkeeperNotifications(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.append("limit", params.limit);
  const response = await api.get(`${BACKEND_URL}/accounts/shopkeeper/notifications/?${query.toString()}`);
  return response.data;
}

export async function markNotificationsRead(payload = {}) {
  const response = await api.post(`${BACKEND_URL}/accounts/shopkeeper/notifications/mark-read/`, payload);
  return response.data;
}
