const KEY = 'dms_boletas_session_v2';

export function saveSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function loadSession() {
  try {
    const value = localStorage.getItem(KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
