import axios from 'axios';

export const API_BASE_URL =
  'https://script.google.com/macros/s/AKfycbyv2BEy4txUhfpb8jYSjPfhoDdZpEaBlwCTh3jsRkb-HyxPiKMtRTbjwqyA-g3_SflXBA/exec';

function toFormPayload(payload) {
  const body = new URLSearchParams();
  body.append('payload', JSON.stringify(payload));
  return body;
}

export async function apiGet(action, params = {}) {
  const response = await axios.get(API_BASE_URL, {
    params: { action, ...params },
  });
  return normalizeResponse(response.data);
}

export async function apiPost(action, data = {}) {
  const payload = { action, data };
  const response = await axios.post(API_BASE_URL, toFormPayload(payload), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
  });
  return normalizeResponse(response.data);
}

function normalizeResponse(data) {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return { ok: false, error: data };
    }
  }

  if (!data) return { ok: false, error: 'Respuesta vacía del servidor.' };
  if (data.ok === false) return data;

  return data;
}
