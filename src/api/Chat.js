import api from "./axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export async function fetchChatThreads() {
  const response = await api.get(`${BACKEND_URL}/chat/threads/`);
  return response.data;
}

export async function createChatThread(payload) {
  const response = await api.post(`${BACKEND_URL}/chat/threads/`, payload);
  return response.data;
}

export async function fetchChatMessages(threadId) {
  const response = await api.get(`${BACKEND_URL}/chat/threads/${threadId}/messages/`);
  return response.data;
}

export async function sendChatMessage(threadId, body) {
  const response = await api.post(`${BACKEND_URL}/chat/threads/${threadId}/messages/`, { body });
  return response.data;
}
