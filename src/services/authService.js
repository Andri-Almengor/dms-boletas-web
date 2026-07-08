import { apiPost } from './apiClient.js';

export async function loginRequest(username, password) {
  return apiPost('login', { username, password, usuario: username, clave: password });
}

export async function changePasswordRequest(sessionToken, currentPassword, newPassword) {
  return apiPost('changePassword', {
    sessionToken,
    token: sessionToken,
    currentPassword,
    oldPassword: currentPassword,
    passwordActual: currentPassword,
    newPassword,
    passwordNuevo: newPassword,
  });
}

export async function logoutRequest(sessionToken) {
  try {
    return await apiPost('logout', { sessionToken, token: sessionToken });
  } catch {
    return { ok: true };
  }
}
