import { apiPost } from './apiClient.js';

export async function loginRequest(username, password) {
  return apiPost('login', { username, password });
}

export async function changePasswordRequest(sessionToken, currentPassword, newPassword) {
  return apiPost('changePassword', {
    sessionToken,
    currentPassword,
    newPassword,
  });
}

export async function logoutRequest(sessionToken) {
  try {
    return await apiPost('logout', { sessionToken });
  } catch {
    return { ok: true };
  }
}
