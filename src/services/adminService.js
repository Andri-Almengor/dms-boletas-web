import { apiGet, apiPost } from './apiClient.js';

export async function getAdminBootstrap(sessionToken) {
  return apiGet('adminBootstrap', { sessionToken });
}

export async function listUsers(sessionToken) {
  return apiGet('listUsers', { sessionToken });
}

export async function createUser(sessionToken, values) {
  return apiPost('createUser', { sessionToken, ...values });
}

export async function updateUser(sessionToken, values) {
  return apiPost('updateUser', { sessionToken, ...values });
}

export async function listClients(sessionToken) {
  return apiGet('listClients', { sessionToken });
}

export async function saveClient(sessionToken, values) {
  return apiPost('saveClient', { sessionToken, ...values });
}

export async function listCategories(sessionToken) {
  return apiGet('listCategories', { sessionToken });
}

export async function saveCategory(sessionToken, values) {
  return apiPost('saveCategory', { sessionToken, ...values });
}

export async function getConfig(sessionToken) {
  return apiGet('getConfig', { sessionToken });
}

export async function saveConfig(sessionToken, values) {
  return apiPost('saveConfig', { sessionToken, ...values });
}
