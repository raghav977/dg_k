import api from "./axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export async function fetchCustomerProfile() {
  const response = await api.get(`${BACKEND_URL}/accounts/customer/profile/`);
  return response.data;
}

export async function updateCustomerProfile(payload) {
  const config = payload instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
  const response = await api.patch(`${BACKEND_URL}/accounts/customer/profile/`, payload, config);
  return response.data;
}

export async function changeCustomerPassword(payload) {
  const response = await api.post(`${BACKEND_URL}/accounts/customer/change-password/`, payload);
  return response.data;
}
