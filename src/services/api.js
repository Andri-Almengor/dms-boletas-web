const DEFAULT_API = 'https://script.google.com/macros/s/AKfycbyv2BEy4txUhfpb8jYSjPfhoDdZpEaBlwCTh3jsRkb-HyxPiKMtRTbjwqyA-g3_SflXBA/exec';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API;

async function request(action, payload = {}, options = {}) {
  const method = options.method || 'POST';
  const token = localStorage.getItem('dms_token');

  if (method === 'GET') {
    const params = new URLSearchParams({ action, ...payload });
    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    return parseResponse(response);
  }

  // El backend de Apps Script espera los datos dentro de la propiedad "data".
  const body = JSON.stringify({ action, token, data: payload });

  // Apps Script Web Apps funcionan mejor con text/plain para evitar preflight CORS.
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body,
  });

  return parseResponse(response);
}

async function parseResponse(response) {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error('El backend no respondió JSON válido. Revisa la implementación de Apps Script.');
  }

  if (!response.ok || data.ok === false) {
    throw new Error(data.message || data.error || 'Error en la solicitud.');
  }

  return data;
}

export const api = {
  ping: () => request('health'),
  login: (username, password) => request('login', { username, password }),
  logout: () => request('logout'),
  me: () => request('me'),
  changePassword: (oldPassword, newPassword) => request('changePassword', { oldPassword, newPassword }),
  getDashboard: () => request('bootstrap'),
  listBoletas: (filters = {}) => request('searchTickets', { filters }),
  listClientes: () => request('list', { table: 'CLIENTES', onlyActive: true }),
  getCatalogs: () => request('bootstrap'),
};
